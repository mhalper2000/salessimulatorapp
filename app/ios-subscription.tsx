import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch } from "react-redux";

import AsyncStorage from "@react-native-async-storage/async-storage";
import Loader from "./components/Loader";
import { constants, contentContainerStyle } from "./helper";
import { formatDate, getExpiryDate } from "./helper/utils";

// Updated imports for react-native-iap v14+
import { ErrorCode, useIAP } from "react-native-iap";

import { renewSubscription } from "@/redux/slices/authSlice";
import { AppDispatch } from "@/redux/store";

export default function IosSubscription() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const [loading, setLoading] = useState(false);
  const [latestPurchase, setLatestPurchase] = useState<any>(null);

  /* -------------------- IAP SETUP WITH useIAP HOOK -------------------- */
  const {
    connected,
    subscriptions,
    fetchProducts,
    requestPurchase,
    finishTransaction,
  } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      console.log("Purchase successful:", purchase);
      setLatestPurchase(purchase);
      try {
        await handleAmemberProduct(purchase);
      } catch (error) {
        console.error("Error handling purchase:", error);
        setLoading(false);
        Alert.alert("Purchase processing failed");
      }
    },
    onPurchaseError: (error) => {
      console.error("Purchase error:", error);
      setLoading(false);
      if (error.code !== ErrorCode.UserCancelled) {
        Alert.alert("Purchase error", error.message || "Please try again");
      }
    },
  });
  console.log("subscriptions connected:", subscriptions);

  /* -------------------- FETCH SUBSCRIPTIONS -------------------- */
  useEffect(() => {
    console.log("IAP connection status:", connected);
    if (connected) {
      console.log("IAP connected");
      fetchSubscriptions();
      console.log("Fectched sub connected");
    }
  }, [connected]);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const subs = await fetchProducts({
        skus: constants.subscriptionSkus,
        type: "subs",
      });
      console.log("Fetched subscriptions:", subs);
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
      Alert.alert("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- AMEMBER -------------------- */
  const getProductList = async () => {
    const res = await fetch(
      "https://salesscripter.com/pro/api/getProductDetails",
    );
    return res.json();
  };

  const handleAmemberProduct = async (purchase: any) => {
    const productList = await getProductList();

    let selectedProduct = "";
    let days = 0;

    switch (purchase.productId) {
      case "com.salesscriptor.onemonthsubscription":
        selectedProduct = "Sales Simulator";
        days = 30;
        break;

      case "com.salesscriptor.annualsubscription":
        selectedProduct = "Sales Simulator Annual";
        days = 365;
        break;

      case "com.salesscriptor.oneweekfreetrial":
        selectedProduct = "Sales Simulator Free Trial";
        days = 7;
        break;

      default:
        Alert.alert("Unknown product");
        throw new Error("Unknown product");
    }

    const productIdFromApi = Object.keys(productList).find(
      (key) => productList[key] === selectedProduct,
    );

    if (!productIdFromApi) {
      Alert.alert("Product mapping failed");
      throw new Error("Product mapping failed");
    }

    await SecureStore.setItemAsync("expire_days", days.toString());
    await SecureStore.setItemAsync("product_id", productIdFromApi);

    // Grant access in aMember
    const AMEMBER_KEY = "gm1K4O7lVDzlo8IMQdA5";
    const userId = (await AsyncStorage.getItem("user_id")) || "";

    if (userId && productIdFromApi) {
      const accessParams = new URLSearchParams({
        product_id: productIdFromApi,
        user_id: userId,
        begin_date: formatDate(new Date()),
        expire_date: getExpiryDate(days.toString()),
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
        console.error("Failed to update aMember access", accessJson);
      }
    }

    // Finish the transaction after successful backend processing
    await finishTransaction({
      purchase: purchase,
      isConsumable: false, // Subscriptions are not consumable
    });

    dispatch(renewSubscription());
    setLoading(false);
    router.replace("/select-role");
  };

  /* -------------------- BUY -------------------- */
  const buySubscription = async (productId: string) => {
    if (loading) return;

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
    } catch (error) {
      console.error("Purchase request failed:", error);
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
