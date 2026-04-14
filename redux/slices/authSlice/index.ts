import {
  clearCredentials,
  getCredentials,
  saveCredentials,
} from "@/utils/authStorage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CookieManager from "@react-native-cookies/cookies";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import * as SecureStore from "expo-secure-store";
import { formatDate, getExpiryDate } from "../../../app/helper/utils";

/* ============================
   API CONSTANTS
============================ */
const BASE_URL = "https://salesscripter.com/pro/";

/* ============================
   TYPES
============================ */
interface AuthState {
  userInfo: any | null;
  isLoggedIn: boolean;
  loading: boolean;
  error: string;
  deletingAccount: boolean;

  // UI / form state
  firstName: string;
  lastName: string;
  email: string;
  signupPassword: string;
  showSignupPassword: boolean;

  loaderTitle: string;
  isNewUser: boolean;
}

/* ============================
   THUNKS
============================ */

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (
    { username, password }: { username: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const loginRes = await fetch(`${BASE_URL}sales-simulator/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const loginData = await loginRes.json();
      if (!loginData?.status) {
        return rejectWithValue(loginData?.msg || "Invalid credentials");
      }

      const userRes = await fetch(`${BASE_URL}sales-simulator/user-details`);
      const userData = await userRes.json();

      if (!userData?.status) {
        return rejectWithValue("Failed to fetch user details");
      }

      await saveCredentials(username, password);

      console.log("Login successful, user data:", userData);
      return userData;
    } catch {
      return rejectWithValue("Network error");
    }
  },
);

/**
 * addNewUser - migration of old saga flow into a thunk.
 * Behavior: perform basic signup validation client-side, then attempt
 * to log the user in (re-uses `loginUser` thunk). On success the
 * userInfo returned by `loginUser` is used to navigate the app.
 *
 * NOTE: The legacy saga relied on several server-side helper calls
 * (`validateAddUserInfo`, `updateUserAccess`, `validateUserInfo`).
 * Server endpoints and payloads weren't available in this repo, so
 * this thunk implements a safe, minimal replacement that validates
 * input and defers to `loginUser` to confirm credentials. If you
 * want the old server-side behavior restored, provide the API
 * endpoints and payload expectations and I will implement them.
 */
const AMEMBER_KEY = "gm1K4O7lVDzlo8IMQdA5";

async function handleAmemberError(data: { message: string }) {
  try {
    const { message } = data;
    const refreshToken = process.env.REFRESH_TOKEN || "";
    const supportEmail = "mhalper@salesscripter.com";

    const params = new URLSearchParams({
      refreshToken,
      to: supportEmail,
      subject: "Error Encountered While Adding User!",
      html: message,
    }).toString();

    const res = await fetch("https://salesscripter.com/node/sendEmail", {
      method: "POST",
      headers: { referer: "https://salesscripter.com" },
      body: params,
    });

    return res.json();
  } catch (e) {
    return null;
  }
}

export const addNewUser = createAsyncThunk(
  "auth/addNewUser",
  async (
    { signup, login, navigation }: { signup: any; login: any; navigation: any },
    { rejectWithValue },
  ) => {
    console.log("addNewUser payload", { signup, login });
    // validate payload
    if (
      !signup ||
      !signup.email ||
      !signup.firstName ||
      !signup.lastName ||
      !signup.password
    ) {
      return rejectWithValue("Invalid signup information");
    }

    try {
      // 1) create user via aMember API
      const createParams = new URLSearchParams({
        name_f: signup.firstName,
        name_l: signup.lastName,
        email: signup.email,
        login: signup.userName || signup.email,
        pass: signup.password,
        _key: AMEMBER_KEY,
      }).toString();

      const createRes = await fetch(
        "https://salesscripter.com/members/api/users",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: createParams,
        },
      );

      const createJson = await createRes.json();

      if (!createJson || !createJson[0] || !createJson[0].user_id) {
        await handleAmemberError({
          message: JSON.stringify(createJson || "create user failed"),
        });
        navigation?.replace?.("/login");
        return rejectWithValue("Failed to create user");
      }

      await AsyncStorage.setItem("user_id", createJson[0].user_id.toString());

      // 2) update access
      const userDataRes = await fetch(
        `${BASE_URL}sales-simulator/user-details`,
      );
      const userinfo = await userDataRes.json();

      const product_id = (await SecureStore.getItemAsync("product_id")) || "";
      const user_id =
        (await AsyncStorage.getItem("user_id")) ||
        userinfo?.userInfo?.user_id?.toString() ||
        "";
      const expire_days =
        (await SecureStore.getItemAsync("expire_days")) || "7";

      const accessParams = new URLSearchParams({
        product_id: product_id,
        user_id: user_id,
        begin_date: formatDate(new Date()),
        expire_date: getExpiryDate(expire_days),
        _key: AMEMBER_KEY,
      }).toString();

      const accessRes = await fetch(
        "https://salesscripter.com/members/api/access",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: accessParams,
        },
      );

      const accessJson = await accessRes.json();
      if (!accessJson) {
        await handleAmemberError({
          message: JSON.stringify(accessJson || "update access failed"),
        });
        navigation?.replace?.("/login");
        return rejectWithValue("Failed to update access");
      }

      // 3) validate/login user (same as validateUserInfo)
      const loginParams = new URLSearchParams({
        username: login.username,
        password: login.password,
      }).toString();
      const loginRes = await fetch(`${BASE_URL}sales-simulator/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: loginParams,
      });

      const loginJson = await loginRes.json();
      if (!loginJson || !loginJson.status) {
        navigation?.replace?.("/login");
        return rejectWithValue(loginJson?.msg || "Invalid credentials");
      }

      // store credentials and cookie using secure storage helper
      const cookie = await CookieManager.get("https://salesscripter.com");
      await saveCredentials(
        login.username,
        login.password,
        JSON.stringify(cookie),
      );

      const userRes = await fetch(`${BASE_URL}sales-simulator/user-details`);
      const userData = await userRes.json();

      if (!userData?.status) {
        navigation?.replace?.("/login");
        return rejectWithValue("Failed to fetch user details");
      }

      // navigation decisions mirror legacy saga
      if (userData.subscription) {
        navigation?.replace?.("/select-role");
      } else {
        navigation?.replace?.("/login");
      }

      return userData;
    } catch (err: any) {
      await handleAmemberError({ message: String(err) });
      navigation?.replace?.("/login");
      return rejectWithValue(err?.message || "Signup failed");
    }
  },
);

export const restoreSession = createAsyncThunk(
  "auth/restoreSession",
  async (_, { rejectWithValue }) => {
    try {
      const creds = await getCredentials();
      if (!creds) throw new Error("No credentials");

      const formData = new URLSearchParams();
      formData.append("username", creds.username);
      formData.append("password", creds.password);

      const loginRes = await fetch(`${BASE_URL}sales-simulator/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const loginData = await loginRes.json();
      if (!loginData?.status) throw new Error("Invalid session");

      const userRes = await fetch(`${BASE_URL}sales-simulator/user-details`);
      const userData = await userRes.json();

      if (!userData?.status) throw new Error("Session expired");

      return userData;
    } catch {
      return rejectWithValue("Session expired");
    }
  },
);

export const renewSubscription = createAsyncThunk(
  "auth/renewSubscription",
  async (_, { rejectWithValue }) => {
    try {
      // Try the renew endpoint first
      try {
        const res = await fetch(
          "https://salesscripter.com/pro/api/renew-subscription",
          { method: "POST" },
        );
        await res.json();
      } catch {
        // Renew endpoint may not exist; continue to refresh user details
      }

      // Always re-fetch user details to get updated subscription status
      const userRes = await fetch(`${BASE_URL}sales-simulator/user-details`);
      const userData = await userRes.json();
      if (!userData?.status) throw new Error("Failed to refresh user details");
      return userData;
    } catch {
      return rejectWithValue("Subscription renewal failed");
    }
  },
);

export const deleteAccount = createAsyncThunk(
  "auth/deleteAccount",
  async (_, { getState, rejectWithValue }) => {
    try {
      // 1️⃣ Fetch latest user details (same as saga)
      const userRes = await fetch(`${BASE_URL}sales-simulator/user-details`);
      const userData = await userRes.json();

      if (!userData?.status) {
        throw new Error("Failed to fetch user info");
      }

      const userId = userData.userInfo.user_id;

      // 2️⃣ Prepare form data (same payload as old saga)
      const aMemberKey = "gm1K4O7lVDzlo8IMQdA5";
      const formData = new URLSearchParams();
      formData.append("_key", aMemberKey);
      formData.append("_method", "DELETE");

      // 3️⃣ Delete user
      const deleteRes = await fetch(
        `https://salesscripter.com/members/api/users/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData.toString(),
        },
      );

      const deleteData = await deleteRes.json();

      if (!deleteData) {
        throw new Error("Delete failed");
      }

      // 4️⃣ Clear local session (same as saga)
      await clearCredentials();
      await AsyncStorage.clear();
      await CookieManager.clearAll();

      return true;
    } catch (error) {
      return rejectWithValue("Failed to delete account");
    }
  },
);

/* ============================
   SLICE
============================ */

const initialState: AuthState = {
  userInfo: null,
  isLoggedIn: false,
  loading: true,
  error: "",

  firstName: "",
  lastName: "",
  email: "",
  signupPassword: "",
  showSignupPassword: false,

  loaderTitle: "Welcome to Sales Simulator",
  isNewUser: true,
  deletingAccount: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser(state) {
      clearCredentials();
      state.isLoggedIn = false;
      state.userInfo = null;
    },

    toggleShowPassword(state) {
      state.showSignupPassword = !state.showSignupPassword;
    },

    setIsNewUser(state, action: PayloadAction<boolean>) {
      state.isNewUser = action.payload;
    },

    inputChange(
      state,
      action: PayloadAction<{ field: keyof AuthState; value: string }>,
    ) {
      const { field, value } = action.payload;
      // @ts-ignore – controlled fields only
      state[field] = value;
    },

    clearAuthError(state) {
      state.error = "";
    },
  },

  extraReducers: (builder) => {
    builder
      /* LOGIN */
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.userInfo = action.payload.userInfo;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      /* RESTORE SESSION */
      .addCase(restoreSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.userInfo = action.payload.userInfo;
      })
      .addCase(restoreSession.rejected, (state) => {
        state.loading = false;
        state.isLoggedIn = false;
      })

      /* SUBSCRIPTION */
      .addCase(renewSubscription.fulfilled, (state, action) => {
        state.userInfo = action.payload.userInfo ?? {
          ...state.userInfo,
          subscription: true,
        };
      })

      /* ADD NEW USER (signup migration) */
      .addCase(addNewUser.pending, (state) => {
        state.loading = true;
        state.error = "";
      })
      .addCase(addNewUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isLoggedIn = true;
        state.userInfo = action.payload ?? null;
      })
      .addCase(addNewUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          (action.error && action.error.message) ||
          "Signup failed";
      })

      /* DELETE ACCOUNT */
      .addCase(deleteAccount.pending, (state) => {
        state.loading = true;
        state.deletingAccount = true;
        state.loaderTitle = "Deleting Account";
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.loading = false;
        state.deletingAccount = false;
        state.isLoggedIn = false;
        state.userInfo = null;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.loading = false;
        state.deletingAccount = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  logoutUser,
  toggleShowPassword,
  setIsNewUser,
  inputChange,
  clearAuthError,
} = authSlice.actions;

export default authSlice.reducer;
