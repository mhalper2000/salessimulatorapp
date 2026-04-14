import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useCallback, useEffect } from "react";
import {
  Alert,
  BackHandler,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";

const ssLogo = require("../assets/images/ss_logo.png");

export default function UpgradePlan() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { userInfo } = useSelector((state: RootState) => state.auth);

  const openSignUp = useCallback(async () => {
    console.log("User Info:", userInfo);
    if (!userInfo?.user_id) return;

    if (Platform.OS === "ios") {
      await SecureStore.setItemAsync("user_id", userInfo.user_id.toString());

      router.replace("/ios-subscription");
    } else {
      console.log("Opening signup webview for iOS");
      router.replace({
        pathname: "/webview",
        params: {
          uri: "https://salesscripter.com/members/signup/bOrTfvOs",
        },
      });
    }
  }, [router, userInfo]);

  useEffect(() => {
    openSignUp();
  }, [openSignUp]);

  useEffect(() => {
    const backAction = () => {
      Alert.alert("Hold on!", "Do you want to exit?", [
        { text: "Cancel", style: "cancel" },
        { text: "YES", onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Image style={styles.headerLogo} source={ssLogo} />

      <View style={styles.centerContent}>
        <Text style={styles.subHeaderText}>
          Your subscription has expired. Click the button below to sign up for a
          subscription.
        </Text>

        <View style={styles.stackContainer}>
          <TouchableOpacity onPress={openSignUp} style={styles.loginBtn}>
            <Text style={styles.loginBtnText}>SIGN UP</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    alignItems: "center",
  },
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    marginBottom: 30,
  },
  subHeaderText: {
    fontSize: 16,
    fontWeight: "500",
    margin: 20,
    textAlign: "center",
  },
  headerLogo: {
    height: 60,
    width: 180,
    marginBottom: 20,
  },
  loginBtn: {
    height: 45,
    backgroundColor: "#DF0000",
  },
  loginBtnText: {
    color: "#fff",
    textAlign: "center",
    lineHeight: 45,
    fontWeight: "600",
  },
  stackContainer: {
    width: "80%",
    maxWidth: 300,
    alignItems: "center",
  },
});
