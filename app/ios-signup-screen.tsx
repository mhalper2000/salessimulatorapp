import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
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

export default function IOSSignupScreen() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  /* ---------------- Redux state ---------------- */
  const { firstName, lastName, email, signupPassword, showSignupPassword } =
    useSelector((state: RootState) => state.auth);

  /* ---------------- Local state ---------------- */
  const [loading, setLoading] = useState(false);

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

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
      <KeyboardAvoidingView style={styles.container} behavior="padding">
        <Image source={ssLogo} style={styles.logo} />

        <Text style={styles.heading}>Sign Up</Text>

        <Input
          placeholder="First Name"
          value={firstName}
          onChangeText={(v) =>
            dispatch(inputChange({ field: "firstName", value: v }))
          }
        />

        <Input
          placeholder="Last Name"
          value={lastName}
          onChangeText={(v) =>
            dispatch(inputChange({ field: "lastName", value: v }))
          }
        />

        <Input
          placeholder="Email"
          value={email}
          onChangeText={(v) =>
            dispatch(inputChange({ field: "email", value: v }))
          }
        />

        <View style={styles.passwordRow}>
          <TextInput
            placeholder="Password"
            secureTextEntry={!showSignupPassword}
            value={signupPassword}
            onChangeText={(v) =>
              dispatch(inputChange({ field: "signupPassword", value: v }))
            }
            style={[styles.input, { flex: 1 }]}
          />
          <TouchableOpacity onPress={() => dispatch(toggleShowPassword())}>
            <Image
              source={showSignupPassword ? hiddenIcon : viewIcon}
              style={styles.eye}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={signup}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

/* ---------------- Input ---------------- */

const Input = (props: any) => (
  <View style={styles.inputWrapper}>
    <TextInput {...props} style={styles.input} />
  </View>
);

/* ---------------- Styles ---------------- */

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", padding: 20 },
  logo: { width: 180, height: 60, marginVertical: 40 },
  heading: { fontSize: 22, fontWeight: "600", marginBottom: 20 },

  inputWrapper: { width: "100%", marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: "#aaa",
    borderRadius: 6,
    padding: 10,
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
  buttonText: { color: "#fff", fontSize: 16 },

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
});
