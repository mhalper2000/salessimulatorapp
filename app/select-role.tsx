import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  BackHandler,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Dropdown from "./components/Dropdown";

import {
  fetchFields,
  fetchUserDetails,
  saveUserFields,
  selectSelectRole,
} from "../redux/slices/selectRoleSlice";

const playIcon = require("../assets/images/play.png");
const downArrow = require("../assets/images/down.png");

export default function SelectRoleScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const state = useSelector(selectSelectRole);

  const [valueScenario, setValueScenario] = useState("outbound-phone-call-b2b");
  const [valueLevel, setValueLevel] = useState("friendly");
  const [language, setLanguage] = useState("English");

  // New state for optional fields
  const [productSold, setProductSold] = useState("");
  const [prospectTitle, setProspectTitle] = useState("");
  const [productDetails, setProductDetails] = useState("");
  const [additionalDetails, setAdditionalDetails] = useState("");

  // State for suggestion dropdowns
  const [suggestionsProductSold, setSuggestionsProductSold] = useState(false);
  const [suggestionsProspectTitle, setSuggestionsProspectTitle] =
    useState(false);
  const [suggestionsProductDetails, setSuggestionsProductDetails] =
    useState(false);
  const [suggestionsAdditionalDetails, setSuggestionsAdditionalDetails] =
    useState(false);

  // Suggestion arrays from state
  const productSoldArr = state.productSold || [];
  const prospectTitleArr = state.prospectTitle || [];
  const productObjectionsArr = state.productObjections || [];
  const additionalDetailsArr = state.additionalDetails || [];

  useEffect(() => {
    (dispatch as any)(fetchUserDetails())
      .unwrap()
      .then((res: any) => {
        console.log("User Details:", res);
        (dispatch as any)(fetchFields(res.username))
          .unwrap()
          .then((fieldsData: any) => {
            console.log("Fetched Fields Data:", fieldsData);
            // Auto-populate fields with last used values
            if (fieldsData.productSold && fieldsData.productSold.length > 0) {
              setProductSold(
                fieldsData.productSold[fieldsData.productSold.length - 1],
              );
            }
            if (
              fieldsData.prospectTitle &&
              fieldsData.prospectTitle.length > 0
            ) {
              setProspectTitle(
                fieldsData.prospectTitle[fieldsData.prospectTitle.length - 1],
              );
            }
            if (
              fieldsData.productObjections &&
              fieldsData.productObjections.length > 0
            ) {
              setProductDetails(
                fieldsData.productObjections[
                  fieldsData.productObjections.length - 1
                ],
              );
            }
            if (
              fieldsData.additionalDetails &&
              fieldsData.additionalDetails.length > 0
            ) {
              setAdditionalDetails(
                fieldsData.additionalDetails[
                  fieldsData.additionalDetails.length - 1
                ],
              );
            }
          });

        if (!res.subscription) {
          router.replace(
            (Platform.OS === "ios"
              ? "/ios-subscription"
              : "/upgrade-plan") as any,
          );
        }
      });

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        Alert.alert("Hold on!", "Do you want to exit?", [
          { text: "Cancel", style: "cancel" },
          { text: "YES", onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      },
    );

    return () => backHandler.remove();
  }, [dispatch, router]);

  const handleTouchOutside = () => {
    setSuggestionsProductSold(false);
    setSuggestionsProspectTitle(false);
    setSuggestionsProductDetails(false);
    setSuggestionsAdditionalDetails(false);
  };

  const onStart = async () => {
    console.log("Starting with values:", {
      scenario: valueScenario,
      difficultyLevel: valueLevel,
      language,
      productSold,
      prospectTitle,
      productDetails,
      additionalDetails,
    });
    const BASE_URL = "https://salesscripter.com/pro/";
    let userData = await fetch(`${BASE_URL}sales-simulator/user-details`);
    console.log("User Data Response: ", userData);
    const userinfo = await userData.json();
    console.log("User Info  2112: ", userinfo);
    await (dispatch as any)(
      saveUserFields({
        scenario: valueScenario,
        difficultyLevel: valueLevel,
        language,
        productSold,
        prospectTitle,
        productObjections: productDetails,
        additionalDetails,
      }),
    );

    router.push({
      pathname: "/chat-bot",
      params: {
        currentUserName: userinfo.userInfo.login,
        level: valueLevel,
        scenario: valueScenario,
        language: language,
        productSold: productSold,
        prospectTitle: prospectTitle,
        productDetails: productDetails,
        additionalDetails: additionalDetails,
      },
    } as any);
  };

  return (
    <ScrollView keyboardShouldPersistTaps="always" style={styles.container}>
      <View>
        <Text style={styles.label}>Scenario</Text>
        <Dropdown
          value={valueScenario}
          items={state.scenarios?.length ? state.scenarios : []}
          onChangeValue={(v: any) => setValueScenario(v)}
          style={{ marginBottom: 12 }}
        />

        <Text style={styles.labelSecond}>Level of Difficulty</Text>
        <Dropdown
          value={valueLevel}
          items={state.levels}
          onChangeValue={(v: any) => setValueLevel(v)}
          style={{ marginBottom: 12 }}
        />

        <Text style={styles.languageLabel}>Language</Text>
        <Dropdown
          value={language}
          items={state.languages?.length ? state.languages : []}
          onChangeValue={(v: any) => setLanguage(v)}
          style={{ marginBottom: 12 }}
        />

        {/* Product Being Sold */}
        <Text style={styles.labelSecond}>Product Being Sold</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor="#aaa"
            onChangeText={setProductSold}
            value={productSold}
          />
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              setSuggestionsProductSold(!suggestionsProductSold);
              setSuggestionsProspectTitle(false);
              setSuggestionsProductDetails(false);
              setSuggestionsAdditionalDetails(false);
            }}
          >
            <Image source={downArrow} style={styles.playIcon} />
          </TouchableOpacity>
        </View>
        {suggestionsProductSold && productSoldArr.length > 0 && (
          <View style={styles.suggestionList}>
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionScrollView}
            >
              {productSoldArr
                .filter((item: string) => item !== "")
                .map((item: string, index: number) => (
                  <TouchableOpacity
                    key={`product-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setProductSold(item);
                      setSuggestionsProductSold(false);
                    }}
                  >
                    <Text style={styles.sugeestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Prospect Title or Description */}
        <Text style={styles.label}>Prospect Title or Description</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor="#aaa"
            onChangeText={setProspectTitle}
            value={prospectTitle}
          />
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              setSuggestionsProductSold(false);
              setSuggestionsProspectTitle(!suggestionsProspectTitle);
              setSuggestionsProductDetails(false);
              setSuggestionsAdditionalDetails(false);
            }}
          >
            <Image source={downArrow} style={styles.playIcon} />
          </TouchableOpacity>
        </View>
        {suggestionsProspectTitle && prospectTitleArr.length > 0 && (
          <View style={styles.suggestionList}>
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionScrollView}
            >
              {prospectTitleArr
                .filter((item: string) => item !== "")
                .map((item: string, index: number) => (
                  <TouchableOpacity
                    key={`prospect-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setProspectTitle(item);
                      setSuggestionsProspectTitle(false);
                    }}
                  >
                    <Text style={styles.sugeestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Product Specific Objections */}
        <Text style={styles.label}>Product Specific Objections</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor="#aaa"
            onChangeText={setProductDetails}
            value={productDetails}
          />
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => {
              setSuggestionsProductSold(false);
              setSuggestionsProspectTitle(false);
              setSuggestionsProductDetails(!suggestionsProductDetails);
              setSuggestionsAdditionalDetails(false);
            }}
          >
            <Image source={downArrow} style={styles.playIcon} />
          </TouchableOpacity>
        </View>
        {suggestionsProductDetails && productObjectionsArr.length > 0 && (
          <View style={styles.suggestionList}>
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionScrollView}
            >
              {productObjectionsArr
                .filter((item: string) => item !== "")
                .map((item: string, index: number) => (
                  <TouchableOpacity
                    key={`objection-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setProductDetails(item);
                      setSuggestionsProductDetails(false);
                    }}
                  >
                    <Text style={styles.sugeestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Additional Details */}
        <Text style={styles.label}>Additional Details</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Optional"
            placeholderTextColor="#aaa"
            multiline
            onChangeText={setAdditionalDetails}
            value={additionalDetails}
          />
          <TouchableOpacity
            style={styles.dropdownDetailButton}
            onPress={() => {
              setSuggestionsProductSold(false);
              setSuggestionsProspectTitle(false);
              setSuggestionsProductDetails(false);
              setSuggestionsAdditionalDetails(!suggestionsAdditionalDetails);
            }}
          >
            <Image source={downArrow} style={styles.playIcon} />
          </TouchableOpacity>
        </View>
        {suggestionsAdditionalDetails && additionalDetailsArr.length > 0 && (
          <View style={styles.suggestionList}>
            <ScrollView
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              style={styles.suggestionScrollView}
            >
              {additionalDetailsArr
                .filter((item: string) => item !== "")
                .map((item: string, index: number) => (
                  <TouchableOpacity
                    key={`additional-${index}`}
                    style={styles.suggestionItem}
                    onPress={() => {
                      setAdditionalDetails(item);
                      setSuggestionsAdditionalDetails(false);
                    }}
                  >
                    <Text style={styles.sugeestionText}>{item}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.btnContainer}>
          <TouchableOpacity style={styles.startBtn} onPress={onStart}>
            <Image source={playIcon} style={styles.playIcon} />
            <Text style={styles.startBtnText}>START</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  suggestionList: {
    backgroundColor: "white",
    borderColor: "black",
    borderWidth: 0.8,
    borderRadius: 4,
    marginTop: -5,
    maxHeight: 120,
  },
  suggestionScrollView: {
    maxHeight: 120,
  },
  suggestionItem: { padding: 5 },
  sugeestionText: { backgroundColor: "transparent", padding: 5, fontSize: 16 },
  container: { padding: 16, flex: 1 },
  label: { marginBottom: 5, fontSize: 16, fontWeight: "bold", zIndex: 1 },
  languageLabel: {
    marginBottom: 5,
    marginTop: 8,
    fontSize: 16,
    fontWeight: "bold",
    zIndex: 1,
  },
  labelSecond: {
    marginTop: 10,
    marginBottom: 5,
    fontSize: 16,
    fontWeight: "bold",
    zIndex: 1,
  },
  inputContainer1: {
    marginBottom: 26,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    zIndex: 999,
  },
  inputContainer: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 13,
    backgroundColor: "white",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    height: 47,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    color: "black",
    paddingRight: 35,
  },
  inputDetails: {
    height: 70,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 10,
    paddingHorizontal: 8,
    textAlignVertical: "top",
    backgroundColor: "white",
    color: "black",
    flex: 1,
    paddingTop: 16,
    paddingRight: 35,
  },
  btnContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 15,
  },
  startBtn: {
    backgroundColor: "#F9F9F9",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 5,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#4C75AA",
    width: "40%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  startBtnText: {
    color: "#4C75AA",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginLeft: 3,
  },
  playIcon: { width: 15, height: 18 },
  dropdown: { borderColor: "#ccc", borderWidth: 1 },
  dropdownButton: {
    position: "absolute",
    right: 0,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
  dropdownButtonText: { color: "black", fontSize: 16 },
  dropdownDetailButton: {
    position: "absolute",
    right: 0,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
  },
});
