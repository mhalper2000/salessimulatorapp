import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback } from "react";
import { LogBox, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";

LogBox.ignoreLogs([
  "Non-serializable values were found in the navigation state",
]);

export default function WebViewScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    uri?: string;
    injectedJavaScript?: string;
  }>();

  /**
   * Messages sent from WebView
   */
  const onMessageFromWebView = useCallback(
    (message: string) => {
      if (message === "logout") {
        // 🔥 NEW ARCH: do logout here
        // 1. Clear auth state (redux / secure-store / async-storage)
        // 2. Navigate to login

        router.replace("/login");
      }
    },
    [router],
  );

  /**
   * Detect protected routes loaded inside WebView
   * (preserving old behavior)
   */
  const onLoadEnd = useCallback(
    (event: any) => {
      const url: string = event?.nativeEvent?.url ?? "";

      // Only redirect to login on explicit logout/session-expired pages,
      // not on any /pro URL (which includes payment pages)
      const isLogoutPage =
        url.includes("/logout") || url.includes("/session-expired");

      if (isLogoutPage) {
        router.replace("/login");
      }
    },
    [router],
  );

  if (!params?.uri) {
    return null;
  }

  return (
    <WebView
      style={styles.webviewStyle}
      source={{ uri: params.uri }}
      javaScriptEnabled
      injectedJavaScript={params.injectedJavaScript}
      onMessage={(event) => onMessageFromWebView(event.nativeEvent.data)}
      onLoadEnd={onLoadEnd}
    />
  );
}

const styles = StyleSheet.create({
  webviewStyle: {
    flex: 1,
  },
});
