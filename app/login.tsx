import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";

import { loginUser, toggleShowPassword } from "../redux/slices/authSlice";
import { AppDispatch, RootState } from "../redux/store";

const ssLogo = require("../assets/images/ss_logo.png");
const hiddenIcon = require("../assets/images/hidden.png");
const viewIcon = require("../assets/images/view.png");

export default function Login() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const {
    isLoggedIn,
    loading,
    error,
    showSignupPassword,
    userInfo,
    isNewUser,
  } = useSelector((state: RootState) => state.auth);

  // make a clearer local name used in this screen
  const showPassword = showSignupPassword;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /**
   * 🔀 Post-login redirection logic
   */
  useEffect(() => {
    console.log(
      "Login state changed. isLoggedIn:",
      isLoggedIn,
      "userInfo:",
      userInfo,
    );
    if (!isLoggedIn || !userInfo) return;
    console.log("User info:", userInfo);

    // 1️⃣ New user → Select role
    // if (isNewUser || !userInfo.role) {
    router.replace("/select-role");
    return;
    // }

    // // 2️⃣ No active plan → Upgrade plan
    // console.log("User has active plan:", userInfo.hasActivePlan);
    // if (!userInfo.hasActivePlan) {
    //   console.log("User has no active plan, redirecting to upgrade page");
    //   router.replace("/upgrade-plan");
    //   return;
    // }

    // // 3️⃣ Fully onboarded → Main app
    // router.replace("/chat-bot");
  }, [isLoggedIn, userInfo, isNewUser, router]);

  /**
   * ⬅️ Android back button handling
   */
  useEffect(() => {
    const backAction = () => {
      Alert.alert("Hold on!", "Do you want to exit?", [
        { text: "Cancel", style: "cancel" },
        { text: "YES", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const onLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter username and password");
      return;
    }

    dispatch(loginUser({ username: email, password }));
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollViewContent}>
      {/* Logo + Heading */}
      <View style={styles.topSection}>
        <Image style={styles.headerLogo} source={ssLogo} />
        <Text style={styles.heading}>Login</Text>
      </View>

      {/* Form */}
      <View style={styles.formSection}>
        <View style={styles.formControl}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            value={email}
            placeholder="Username/Email"
            onChangeText={setEmail}
            style={styles.input}
            autoCapitalize="none"
            placeholderTextColor="#aaa"
          />
        </View>

        <View style={styles.formControl}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              value={password}
              placeholder="Password"
              secureTextEntry={!showPassword}
              onChangeText={setPassword}
              style={styles.passwordInput}
              accessibilityLabel="password-input"
              placeholderTextColor="#aaa"
            />
            <TouchableOpacity
              onPress={() => dispatch(toggleShowPassword())}
              style={styles.iconButton}
              accessibilityRole="button"
              accessibilityLabel={
                showPassword ? "Hide password" : "Show password"
              }
            >
              <Image
                source={showPassword ? hiddenIcon : viewIcon}
                style={styles.showIcon}
              />
            </TouchableOpacity>
          </View>
        </View>

        {!!error && (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
          onPress={onLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Logging in..." : "Login"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign up + Legal links */}
      <View style={styles.footerContainer}>
        <View style={styles.signupRow}>
          <Text style={styles.signupText}>Not registered yet? </Text>
          <TouchableOpacity onPress={() => router.push("/ios-signup-screen")}>
            <Text style={styles.signupLink}>Sign Up here.</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomView}>
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/webview?uri=${encodeURIComponent("https://salesscripter.com/terms-of-services/")}`,
              )
            }
          >
            <Text style={styles.bottomText}>Terms and Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/webview?uri=${encodeURIComponent("https://salesscripter.com/privacy-policy/")}`,
              )
            }
          >
            <Text style={styles.privacyText}>Privacy Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              router.push(
                `/webview?uri=${encodeURIComponent("https://salesscripter.com/end-user-license/")}`,
              )
            }
          >
            <Text style={styles.bottomText}>
              End User License Agreement (EULA)
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollViewContent: { flexGrow: 1, backgroundColor: "#EBEBEB" },
  topSection: { alignItems: "center", paddingTop: 40, paddingBottom: 8 },
  headerLogo: { height: 60, width: 180, marginBottom: 12 },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    color: "#1a1a1a",
    marginTop: 16,
    marginBottom: 24,
  },
  formSection: { paddingHorizontal: 20 },
  formControl: { marginBottom: 16 },
  label: { marginBottom: 6, color: "#333", fontSize: 14, fontWeight: "500" },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#D3D3D3",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
    fontSize: 15,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 48,
    borderWidth: 1,
    borderColor: "#D3D3D3",
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 15,
    backgroundColor: "transparent",
  },
  iconButton: { padding: 10 },
  showIcon: { height: 22, width: 22 },
  loginBtn: {
    height: 52,
    backgroundColor: "#CC0000",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600" },
  loginBtnDisabled: { opacity: 0.6 },
  center: { alignItems: "center" },
  errorText: { color: "#cc0000", fontSize: 12 },
  footerContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 28,
    alignItems: "center",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 4,
  },
  signupText: { color: "#333", fontSize: 15 },
  signupLink: {
    color: "#2194f3",
    textDecorationLine: "underline",
    fontSize: 15,
  },
  bottomView: { marginTop: 28, alignItems: "center" },
  bottomText: { color: "#DF0000", marginBottom: 10, fontSize: 14 },
  privacyText: { color: "#333", marginBottom: 10, fontSize: 14 },
});
