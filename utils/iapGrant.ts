import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { formatDate, getExpiryDate } from "../app/helper/utils";
import { getCredentials } from "./authStorage";

const AMEMBER_KEY = "gm1K4O7lVDzlo8IMQdA5";

// Durable record that a StoreKit purchase succeeded but the aMember access
// grant has not. It is written the moment purchase processing starts and
// cleared only after the grant succeeds, so it survives app restarts and
// StoreKit transaction state — it is the source of truth for "we owe this
// user delivery".
const PENDING_GRANT_KEY = "pending_iap_grant";

export interface PendingGrant {
  productId: string;
  transactionId?: string;
  userId?: string;
  createdAt: string;
}

const SKU_TO_AMEMBER: Record<string, { title: string; days: number }> = {
  "com.salesscriptor.onemonthsubscription": {
    title: "Sales Simulator",
    days: 30,
  },
  "com.salesscriptor.annualsubscription": {
    title: "Sales Simulator Annual",
    days: 365,
  },
  "com.salesscriptor.oneweekfreetrial": {
    title: "Sales Simulator Free Trial",
    days: 7,
  },
};

export async function savePendingGrant(grant: {
  productId: string;
  transactionId?: string;
}) {
  await AsyncStorage.setItem(
    PENDING_GRANT_KEY,
    JSON.stringify({ ...grant, createdAt: new Date().toISOString() }),
  );
}

export async function getPendingGrant(): Promise<PendingGrant | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_GRANT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearPendingGrant() {
  await AsyncStorage.removeItem(PENDING_GRANT_KEY);
}

// Records who paid, once the purchase flow has resolved the account. The
// startup retry prefers this over whatever user_id happens to be in device
// storage at that time — a different account signing up on the same device
// must not receive the grant.
export async function attachUserIdToPendingGrant(userId: string) {
  const pending = await getPendingGrant();
  if (pending) {
    await AsyncStorage.setItem(
      PENDING_GRANT_KEY,
      JSON.stringify({ ...pending, userId }),
    );
  }
}

async function getProductList() {
  const res = await fetch(
    "https://salesscripter.com/pro/api/getProductDetails",
  );
  return res.json();
}

// Idempotency guard: a retry can race the paywall's own self-heal path, and
// granting twice stacks duplicate access rows in aMember. Skip the grant if
// an access record already covers the expiry we would set.
async function hasAccessThrough(
  amemberProductId: string,
  targetExpire: string,
): Promise<boolean> {
  try {
    const creds = await getCredentials();
    if (!creds?.username) {
      return false;
    }
    const params = new URLSearchParams({
      login: creds.username,
      _key: AMEMBER_KEY,
    }).toString();
    const res = await fetch(
      `https://salesscripter.com/members/api/check-access/by-login?${params}`,
    );
    const data = await res.json().catch(() => null);
    const expire = data?.ok ? data?.subscriptions?.[amemberProductId] : null;
    // expire dates are YYYY-MM-DD, so string compare is date compare
    const covered = !!expire && expire >= targetExpire;
    return covered;
  } catch {
    // fail open: an extra grant is recoverable, a lost one is not
    return false;
  }
}

export async function grantAmemberAccess({
  sku,
  userId,
}: {
  sku: string;
  userId: string;
}): Promise<{
  amemberProductId: string;
  days: number;
  skipped: boolean;
  expireDate: string;
}> {
  const mapping = SKU_TO_AMEMBER[sku];
  if (!mapping) {
    throw new Error(`Unknown product: ${sku}`);
  }

  const productList = await getProductList();
  const amemberProductId = Object.keys(productList).find(
    (key) => productList[key] === mapping.title,
  );
  if (!amemberProductId) {
    throw new Error(
      `Product mapping failed: no aMember product titled "${mapping.title}"`,
    );
  }

  const expireDate = getExpiryDate(mapping.days.toString());

  if (await hasAccessThrough(amemberProductId, expireDate)) {
    return { amemberProductId, days: mapping.days, skipped: true, expireDate };
  }

  const accessPayload = {
    product_id: amemberProductId,
    user_id: userId,
    begin_date: formatDate(new Date()),
    expire_date: expireDate,
    _key: AMEMBER_KEY,
  };

  const accessRes = await fetch(
    "https://salesscripter.com/members/api/access",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(accessPayload).toString(),
    },
  );

  const accessJson = await accessRes.json().catch(() => null);

  // aMember signals failure with an `error` array/object or a falsy `ok`,
  // NOT by returning null — so inspect the body, not just its presence.
  const granted =
    accessRes.ok &&
    accessJson &&
    !accessJson.error &&
    accessJson.ok !== 0 &&
    accessJson.ok !== false;

  if (!granted) {
    throw new Error(
      `aMember access grant failed: ${JSON.stringify(accessJson)}`,
    );
  }

  return { amemberProductId, days: mapping.days, skipped: false, expireDate };
}

// Called on app start: if a previous purchase was paid for but never granted,
// retry the grant here so recovery doesn't depend on the user landing back on
// the paywall screen. Returns true if access was granted (or already covered).
export async function retryPendingGrant(): Promise<boolean> {
  const pending = await getPendingGrant();
  if (!pending) {
    return false;
  }

  const userId =
    pending.userId ||
    (await SecureStore.getItemAsync("user_id")) ||
    (await AsyncStorage.getItem("user_id")) ||
    "";
  if (!userId) {
    // Can't grant without an account; keep the record for a later attempt.
    return false;
  }

  try {
    await grantAmemberAccess({
      sku: pending.productId,
      userId,
    });
    await clearPendingGrant();
    return true;
  } catch {
    return false;
  }
}
