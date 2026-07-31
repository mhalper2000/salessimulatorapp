import { useHeaderHeight } from "@react-navigation/elements";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import Loader from "./components/Loader";
import { checker_key } from "./helper/utils";

import {
  addNewUser,
  inputChange,
  toggleShowPassword,
} from "@/redux/slices/authSlice";
import { AppDispatch, RootState } from "@/redux/store";

const ssLogo = require("../assets/images/ss_logo.png");
const hiddenIcon = require("../assets/images/hidden.png");
const viewIcon = require("../assets/images/view.png");

const PRODUCT_SKU = "com.salesscriptor.oneweekfreetrial";

// iOS' default placeholder colour renders almost invisibly on this background,
// so every field sets it explicitly.
const PLACEHOLDER_COLOR = "#8A8A8E";

export default function IOSSignupScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const headerHeight = useHeaderHeight();

  /* ---------------- Redux state ---------------- */
  const { firstName, lastName, email, signupPassword, showSignupPassword } =
    useSelector((state: RootState) => state.auth);

  /* ---------------- Local state ---------------- */
  const [loading, setLoading] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  /* ---------------- Keyboard ---------------- */
  // The logo and the spacing around the fields are dropped while the keyboard
  // is up, which is what keeps the Sign Up button on screen.
  useEffect(() => {
    const isIOS = Platform.OS === "ios";
    const showSub = Keyboard.addListener(
      isIOS ? "keyboardWillShow" : "keyboardDidShow",
      () => setKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(
      isIOS ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /* ---------------- Back handler ---------------- */
  useEffect(() => {
    const backAction = () => {
      Alert.alert("Hold on!", "Do you want to exit?", [
        { text: "Cancel", style: "cancel" },
        { text: "YES", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const handler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => handler.remove();
  }, []);

  /* ---------------- Helpers ---------------- */

  const getProductList = async () => {
    const res = await fetch(
      "https://salesscripter.com/pro/api/getProductDetails",
    );
    return res.json();
  };

  const checkUserExists = async (email: string) => {
    const params = new URLSearchParams({
      email,
      _key: "gm1K4O7lVDzlo8IMQdA5",
    }).toString();

    const res = await fetch(
      `https://salesscripter.com/members/api/check-access/by-email?${params}`,
    );
    const data = await res.json();

    return data.ok
      ? { status: false, msg: "User already registered with this Email" }
      : { status: true, msg: "" };
  };

  const checkUserEmail = async (email: string) => {
    const res = await fetch(
      `https://api.thechecker.co/v2/verify?email=${email}&api_key=${checker_key}`,
    );
    const data = await res.json();

    return data.result === "undeliverable"
      ? { status: false, msg: "Please enter a valid email." }
      : { status: true, msg: "Email is valid" };
  };

  const handleAmemberProduct = useCallback(async () => {
    const productList = await getProductList();
    let selectedProductId: string | undefined;

    Object.keys(productList).forEach((key) => {
      if (productList[key] === "Sales Simulator Free Trial") {
        selectedProductId = key;
      }
    });

    if (!selectedProductId) {
      Alert.alert("Product mapping failed");
      return;
    }

    await SecureStore.setItemAsync("expire_days", "7");
    await SecureStore.setItemAsync("product_id", selectedProductId);

    // Dispatch migrated signup flow which will attempt to validate/login
    // and perform navigation based on returned userInfo. This replaces
    // the legacy saga-driven `addNewUser` behaviour.
    try {
      const result = await dispatch(
        // @ts-ignore - thunk typing
        addNewUser({
          signup: {
            email,
            userName: email,
            firstName,
            lastName,
            password: signupPassword,
          },
          login: { username: email, password: signupPassword },
          navigation: router,
        }),
      );

      // show error if thunk rejected
      if ((result as any).type && (result as any).type.endsWith("/rejected")) {
        const msg =
          (result as any).payload ||
          (result as any).error?.message ||
          "Signup failed";
        Alert.alert(msg);
      } else {
        router.replace("/login");
      }
    } catch (e) {
      Alert.alert("Signup failed");
    }
  }, [router, email, firstName, lastName, signupPassword, dispatch]);

  /* ---------------- Signup ---------------- */

  const signup = async () => {
    if (email.includes(" ") || signupPassword.includes(" ")) {
      Alert.alert("Email or password cannot contain spaces");
      return;
    }

    if (!email || !firstName || !lastName || !signupPassword) {
      Alert.alert("Please enter valid info");
      return;
    }

    setLoading(true);

    try {
      const [emailCheck, existsCheck] = await Promise.all([
        checkUserEmail(email),
        checkUserExists(email),
      ]);

      if (!emailCheck.status) {
        Alert.alert(emailCheck.msg);
      } else if (!existsCheck.status) {
        Alert.alert(existsCheck.msg);
      } else {
        await handleAmemberProduct();
      }
    } catch {
      Alert.alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- Render ---------------- */

  if (loading) {
    return (
      <View style={styles.loader}>
        <Loader />
      </View>
    );
  }

  const form = (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[
        styles.container,
        keyboardVisible && styles.containerCompact,
      ]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      // iOS insets the scroll view by the real keyboard height itself, which
      // is reliable in a way the manual KeyboardAvoidingView offset was not.
      automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
    >
      {!keyboardVisible && <Image source={ssLogo} style={styles.logo} />}

      <Text style={[styles.heading, keyboardVisible && styles.headingCompact]}>
        Sign Up
      </Text>

      <Input
        label="First Name"
        placeholder="First Name"
        value={firstName}
        compact={keyboardVisible}
        autoCapitalize="words"
        autoCorrect={false}
        textContentType="givenName"
        onChangeText={(v: string) =>
          dispatch(inputChange({ field: "firstName", value: v }))
        }
      />

      <Input
        label="Last Name"
        placeholder="Last Name"
        value={lastName}
        compact={keyboardVisible}
        autoCapitalize="words"
        autoCorrect={false}
        textContentType="familyName"
        onChangeText={(v: string) =>
          dispatch(inputChange({ field: "lastName", value: v }))
        }
      />

      <Input
        label="Email"
        placeholder="Email"
        value={email}
        compact={keyboardVisible}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
        onChangeText={(v: string) =>
          dispatch(inputChange({ field: "email", value: v }))
        }
      />

      <View
        style={[
          styles.inputWrapper,
          keyboardVisible && styles.inputWrapperCompact,
        ]}
      >
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            placeholder="Password"
            placeholderTextColor={PLACEHOLDER_COLOR}
            secureTextEntry={!showSignupPassword}
            value={signupPassword}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            onChangeText={(v) =>
              dispatch(inputChange({ field: "signupPassword", value: v }))
            }
            style={[styles.input, styles.flex]}
          />
          <TouchableOpacity onPress={() => dispatch(toggleShowPassword())}>
            <Image
              source={showSignupPassword ? hiddenIcon : viewIcon}
              style={styles.eye}
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.button, keyboardVisible && styles.buttonCompact]}
        onPress={signup}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  // Android has no equivalent of the iOS keyboard inset, so it still needs the
  // avoiding view.
  if (Platform.OS === "ios") return form;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior="height"
      keyboardVerticalOffset={headerHeight}
    >
      {form}
    </KeyboardAvoidingView>
  );
}

/* ---------------- Input ---------------- */

const Input = ({ label, compact, ...props }: any) => (
  <View style={[styles.inputWrapper, compact && styles.inputWrapperCompact]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...props}
      placeholderTextColor={PLACEHOLDER_COLOR}
      style={styles.input}
    />
  </View>
);

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    // Extra space so the form can always be scrolled clear of the keyboard.
    paddingBottom: 320,
  },
  containerCompact: { paddingTop: 4 },
  logo: { width: 180, height: 60, marginTop: 16, marginBottom: 24 },
  heading: { fontSize: 22, fontWeight: "600", marginBottom: 20 },
  headingCompact: { marginBottom: 10 },

  inputWrapper: { width: "100%", marginBottom: 15 },
  inputWrapperCompact: { marginBottom: 8 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    padding: 10,
    color: "#000",
    backgroundColor: "#fff",
  },

  passwordRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  eye: { width: 20, height: 20, marginLeft: 10 },

  button: {
    marginTop: 30,
    backgroundColor: "#DF0000",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 6,
  },
  buttonCompact: { marginTop: 16 },
  buttonText: { color: "#fff", fontSize: 16 },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
