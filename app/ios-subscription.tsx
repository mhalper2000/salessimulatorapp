import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import AsyncStorage from "@react-native-async-storage/async-storage";
import Loader from "./components/Loader";
import { constants, contentContainerStyle } from "./helper";

// Updated imports for react-native-iap v14+
import { ErrorCode, getPendingTransactionsIOS, useIAP } from "react-native-iap";

import { renewSubscription } from "@/redux/slices/authSlice";
import { AppDispatch, RootState } from "@/redux/store";
import {
  attachUserIdToPendingGrant,
  clearPendingGrant,
  getPendingGrant,
  grantAmemberAccess,
  savePendingGrant,
} from "@/utils/iapGrant";

// The aMember grant is a separate system from the app's subscription flag —
// after granting, the backend needs a moment to reflect it. Poll the real
// flag a few times rather than trusting any local copy of it.
const SUBSCRIPTION_POLL_ATTEMPTS = 5;
const SUBSCRIPTION_POLL_DELAY_MS = 1500;

export default function IosSubscription() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const userInfo = useSelector((state: RootState) => state.auth.userInfo);

  const [loading, setLoading] = useState(false);

  // Payment went through but the backend grant failed — drives the
  // "retry activation" UI instead of letting the user think the purchase
  // itself failed (and possibly contact support or dispute the charge).
  const [activationFailed, setActivationFailed] = useState(false);
  const failedPurchaseRef = useRef<any>(null);

  // Guards against processing the same entitlement twice. `onPurchaseSuccess`
  // and the available-purchases fallback can both fire for one subscription,
  // and sandbox auto-renewals deliver repeatedly — we only want one grant.
  const processingRef = useRef(false);
  const drainedRef = useRef(false);

  // StoreKit replays old unfinished transactions (e.g. expired sandbox
  // renewals) and the library dedups them, so they never reach our listener
  // to be finished — and while they sit in the queue a fresh purchase can't
  // start. Finish stale ones once, on first connect, to unjam it — but a
  // transaction we still owe delivery for (a pending-grant record exists)
  // gets a delivery attempt instead, and stays in the queue if that fails.
  const drainPendingTransactions = async () => {
    if (drainedRef.current) return;
    drainedRef.current = true;
    try {
      const pending = await getPendingTransactionsIOS();
      if (!pending?.length) return;

      const pendingGrant = await getPendingGrant();
      for (const purchase of pending) {
        if (pendingGrant && pendingGrant.productId === purchase.productId) {
          await processPurchase(purchase);
        } else {
          try {
            await finishTransaction({ purchase, isConsumable: false });
          } catch {}
        }
      }
    } catch {}
  };

  const processPurchase = async (purchase: any) => {
    if (processingRef.current) {
      return;
    }
    processingRef.current = true;
    setActivationFailed(false);
    try {
      // Durable "we owe this user delivery" record: written before the grant
      // is attempted, cleared only after it succeeds. It survives restarts,
      // protects the transaction from the drain above, and lets app startup
      // retry the grant (see retryPendingGrant in utils/iapGrant).
      await savePendingGrant({
        productId: purchase?.productId,
        transactionId: purchase?.transactionId ?? purchase?.id,
      });
      await handleAmemberProduct(purchase);
    } catch {
      setLoading(false);
      processingRef.current = false; // allow a retry on next attempt
      failedPurchaseRef.current = purchase;
      setActivationFailed(true);
    }
  };

  const retryActivation = () => {
    if (!failedPurchaseRef.current) return;
    setLoading(true);
    processPurchase(failedPurchaseRef.current);
  };

  /* -------------------- IAP SETUP WITH useIAP HOOK -------------------- */
  const {
    connected,
    subscriptions,
    availablePurchases,
    getAvailablePurchases,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: (purchase) => {
      processPurchase(purchase);
    },
    onPurchaseError: (error) => {
      setLoading(false);
      if (error.code !== ErrorCode.UserCancelled) {
        Alert.alert("Purchase error", error.message || "Please try again");
      }
    },
  });

  /* -------------------- FETCH SUBSCRIPTIONS -------------------- */
  useEffect(() => {
    if (connected) {
      fetchSubscriptions();
      // Clear any stuck transactions first (old replays that dedup before
      // reaching our listener), then pull any entitlement the account
      // already owns so an active sub gets processed.
      drainPendingTransactions().then(() => {
        getAvailablePurchases(constants.subscriptionSkus).catch(() => {});
      });
    }
  }, [connected]);

  /* -------------------- PROCESS EXISTING ENTITLEMENTS -------------------- */
  useEffect(() => {
    if (!availablePurchases?.length) return;
    const owned = availablePurchases.find((p) =>
      constants.subscriptionSkus.includes(p.productId),
    );
    if (owned) {
      processPurchase(owned);
    }
  }, [availablePurchases]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      await fetchProducts({
        skus: constants.subscriptionSkus,
        type: "subs",
      });
    } catch {
      Alert.alert("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- AMEMBER -------------------- */
  const handleAmemberProduct = async (purchase: any) => {
    // user_id isn't persisted to AsyncStorage on the login/restore-session
    // paths (only on signup), so prefer the value already in Redux and fall
    // back to either store before giving up.
    const userId =
      userInfo?.user_id?.toString() ||
      (await SecureStore.getItemAsync("user_id")) ||
      (await AsyncStorage.getItem("user_id")) ||
      "";

    if (!userId) {
      Alert.alert("Could not identify your account. Please log in again.");
      throw new Error("Missing user_id when granting aMember access");
    }

    // Persist it so any later flow that reads AsyncStorage finds it too, and
    // pin it to the pending-grant record so the startup retry grants to the
    // account that actually paid.
    await AsyncStorage.setItem("user_id", userId);
    await attachUserIdToPendingGrant(userId);

    // Idempotent: skips the aMember POST if an access record already covers
    // this purchase, throws if the grant fails (transaction stays unfinished
    // and the pending-grant record stays for retry).
    const { amemberProductId, days } = await grantAmemberAccess({
      sku: purchase.productId,
      userId,
    });

    await SecureStore.setItemAsync("expire_days", days.toString());
    await SecureStore.setItemAsync("product_id", amemberProductId);

    // Delivery is complete — drop the retry record before finishing the
    // transaction so a crash in between can't trigger a duplicate grant
    // (the grant itself is idempotent anyway).
    await clearPendingGrant();

    // Finish the transaction after successful backend processing. Access is
    // already granted at this point — if finishing fails (e.g. a racing path
    // finished it first), don't surface it as an activation failure; the
    // drain finishes any leftover on the next visit since the record is gone.
    try {
      await finishTransaction({
        purchase: purchase,
        isConsumable: false, // Subscriptions are not consumable
      });
    } catch {}

    // Wait for the backend subscription flag to flip true before navigating,
    // otherwise /select-role re-reads `subscription: false` and bounces back
    // here. Poll a few times since the flag can lag the grant by a moment.
    let subscribed = false;
    for (let attempt = 1; attempt <= SUBSCRIPTION_POLL_ATTEMPTS; attempt++) {
      const renew: any = await dispatch(renewSubscription());
      subscribed = !!(
        renew?.payload?.userInfo?.subscription ?? renew?.payload?.subscription
      );
      if (subscribed) break;
      await new Promise((resolve) =>
        setTimeout(resolve, SUBSCRIPTION_POLL_DELAY_MS),
      );
    }

    setLoading(false);
    router.replace("/select-role");
  };

  /* -------------------- BUY -------------------- */
  const buySubscription = async (productId: string) => {
    if (loading) {
      return;
    }

    setLoading(true);
    try {
      await requestPurchase({
        request: {
          apple: {
            sku: productId,
          },
          google: {
            skus: [productId],
          },
        },
        type: "subs",
      });

      // If the account already owns this subscription, StoreKit re-delivers
      // the existing transaction and the library dedups it, so
      // `onPurchaseSuccess` never fires. Re-query entitlements so the
      // available-purchases effect can process it (and the loader clears).
      await getAvailablePurchases(constants.subscriptionSkus);

      // Fallback: nothing got processed (no fresh purchase, no entitlement).
      // Don't leave the spinner hanging forever.
      if (!processingRef.current) {
        setLoading(false);
      }
    } catch {
      setLoading(false);
      Alert.alert("Could not complete purchase");
    }
  };

  /* -------------------- UI -------------------- */
  if (loading || !connected) {
    return (
      <View style={styles.loaderContainer}>
        <Loader />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={contentContainerStyle}>
      <View style={styles.container}>
        <Text style={styles.subHeaderText}>
          Your free trial has expired. Please select a plan to continue.
        </Text>

        {activationFailed && (
          <View style={styles.activationFailedBox}>
            <Text style={styles.activationFailedText}>
              Your payment was received, but we couldn&apos;t activate your
              subscription. Tap retry — you will not be charged again.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={retryActivation}>
              <Text style={styles.retryBtnText}>RETRY ACTIVATION</Text>
            </TouchableOpacity>
          </View>
        )}

        {subscriptions.map((subscription) => (
          <TouchableOpacity
            key={subscription.id}
            style={styles.roleContainer}
            onPress={() => buySubscription(subscription.id)}
          >
            <View style={styles.textContainer}>
              <View style={styles.roleTextHeader}>
                <Text style={styles.roleText}>
                  {subscription.id.includes("annual") ? "ANNUAL" : "MONTHLY"}
                </Text>
                <Text style={styles.roleText}>{subscription.displayPrice}</Text>
              </View>

              <Text style={styles.priceText}>
                {subscription.id.includes("annual")
                  ? "Annual Subscription (Save 20%)"
                  : "Monthly Subscription"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.bottomText}>
        Access to Sales Simulator on a monthly or yearly basis. Subscription
        renews automatically until cancelled.
      </Text>
    </ScrollView>
  );
}

/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  activationFailedBox: {
    width: "90%",
    padding: 16,
    borderRadius: 8,
    marginVertical: 10,
    backgroundColor: "#FDECEA",
    borderWidth: 1,
    borderColor: "#DF0000",
    alignItems: "center",
  },
  activationFailedText: {
    color: "#7A1F1F",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 12,
  },
  retryBtn: {
    backgroundColor: "#DF0000",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 6,
  },
  retryBtnText: {
    color: "#fff",
    fontWeight: "700",
  },
  roleTextHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  roleText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },
  priceText: {
    marginTop: 6,
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  textContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
    borderRadius: 8,
  },
  roleContainer: {
    width: "90%",
    padding: 20,
    borderRadius: 8,
    marginVertical: 10,
    backgroundColor: "#A5A5A5",
  },
  container: {
    alignItems: "center",
    marginTop: 100,
  },
  loaderContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  subHeaderText: {
    fontSize: 16,
    fontWeight: "500",
    margin: 20,
    textAlign: "center",
  },
  bottomText: {
    margin: 35,
    color: "black",
    textAlign: "center",
  },
});
