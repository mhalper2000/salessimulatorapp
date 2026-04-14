import { Platform } from "react-native";

const subscriptionSkus = Platform.select({
  ios: [
    "com.salesscriptor.oneweekfreetrial",
    "com.salesscriptor.annualsubscription",
    "com.salesscriptor.onemonthsubscription",
  ],
  default: [],
});

const productSkus = Platform.select({
  ios: [
    "com.salesscriptor.oneweekfreetrial",
    "com.salesscriptor.onemonthsubscription",
    "com.salesscriptor.annualsubscription",
  ],
  default: [],
});

export const constants = {
  productSkus,
  subscriptionSkus,
};
