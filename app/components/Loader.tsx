import React from "react";
import { ActivityIndicator, Text, View } from "react-native";
import styles from "../stylesheet/AppStyle";

const Loader = ({ message }: { message?: string }) => {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <View style={[{ marginBottom: 50 }]}>
        <Text allowFontScaling={false} style={styles.headerText}>
          {message || "Sales Simulator"}
        </Text>
      </View>
      <ActivityIndicator size={40} color="#DF0000" />
    </View>
  );
};

export default Loader;
