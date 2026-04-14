import Voice from "@react-native-community/voice";
import { Router, useLocalSearchParams, useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useRef, useState } from "react";
import {
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const playIcon = require("../assets/images/play.png");

interface ChatMessage {
  from: string;
  message: string;
  sendAt: string;
}

interface ChatAIMessage {
  role: string;
  content: string;
  from?: string;
}

interface SystemPromptParams {
  username: string | string[];
  soldProduct: string | string[];
  prospectTitle: string | string[];
  prospectObjections: string | string[];
  additionalDetails: string | string[];
  scenario: string | string[];
  defficultyLevel: string | string[];
  language: string | string[];
}

const BASE_URL = "https://salesscripter.com/pro/";

const getUserDetails = async (router: Router) => {
  console.log("getUserDetails called");
  try {
    const userData = await fetch(`${BASE_URL}sales-simulator/user-details`);
    const userinfo = await userData.json();
    console.log("userinfo subscription", userinfo);
    if (userinfo.subscription) {
      console.log("user subscribed");
    } else {
      console.log("user not subscribed");
      if (Platform.OS === "ios") {
        router.replace("/ios-subscription");
      } else {
        router.replace("/upgrade-plan");
      }
    }
  } catch (err) {
    console.error("getUserDetails error", err);
  }
};

export default function CharBox() {
  const inputParams = useLocalSearchParams();
  const [state, setState] = React.useState({ value: 10 });
  const [firstVisit, setFirstVisit] = useState(true);
  const results = useRef<string>("");
  const scrollViewRef = useRef<ScrollView>(null);
  const shouldListen = useRef(true);
  const NOTACTIVE_MS = 8000; //15000;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [partialResults, setPartialResults] = useState<string[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [chatsAI, setChatsAI] = useState<ChatAIMessage[]>([]);
  const [listening, setListening] = useState(false);
  const [, setService] = React.useState<string | string[] | null>(null);
  const router = useRouter();

  useEffect(() => {
    setService(inputParams.role);
    // Reset so TTS onDone resumes listening after restart
    shouldListen.current = true;

    // Setup Voice
    const onSpeechStart = () => {
      setListening(true);
    };

    const onSpeechEnd = () => {
      results.current = "";
      setPartialResults([]);
    };

    let timeout: number | null = null;
    const onSpeechResults = (e: any) => {
      let speechResult = e.value.length ? e.value[0] : "";
      results.current = speechResult;

      if (Platform.OS === "ios") {
        if (timeout) {
          clearTimeout(timeout);
        }
        timeout = setTimeout(() => {
          Voice.cancel();
          handleSpeechResponse(results.current);
        }, 1000);
      }

      if (Platform.OS === "android" && speechResult) {
        handleSpeechResponse(speechResult);
      }
    };

    const onSpeechPartialResults = (e: any) => {
      setPartialResults(e.value);
    };

    const onSpeechError = (e: any) => {
      setListening(false);
    };

    const onSpeechRecognized = (e: any) => {
      if (Platform.OS === "ios" && e.isFinal) {
        handleSpeechResponse(results.current);
      }
    };

    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;
    Voice.onSpeechRecognized = onSpeechRecognized;

    return () => {
      // Prevent TTS onDone from restarting voice recognition after unmount
      shouldListen.current = false;

      // Stop TTS immediately
      try {
        Speech.stop();
      } catch (err) {
        console.warn("Speech.stop error on cleanup:", err);
      }

      // Stop and destroy Voice (STT)
      (async () => {
        try {
          await Voice.cancel();
        } catch (err) {
          console.warn("Voice.cancel error on cleanup:", err);
        }
        try {
          await Voice.destroy();
        } catch (err) {
          console.error("Error destroying Voice:", err);
        }
        Voice.removeAllListeners();
      })();

      // Clear any pending iOS speech timeout
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const saveChatHistory = async (role: string, text: string) => {
    try {
      const chatData = new URLSearchParams();
      chatData.append("username", String(inputParams.currentUserName ?? ""));
      chatData.append("role", role);
      chatData.append("response", text);

      await fetch(`${BASE_URL}simulator/save-chat`, {
        method: "POST",
        body: chatData.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
    } catch (error) {
      console.error("Error while saving chat history:", error);
    }
  };

  const handleGeneratePrompt = async (welcomeMessage: string) => {
    console.log("systemPrompt>>>>>>>>>> Handle Generate Prompt called");
    console.log(inputParams, "INPUT PARAMS");
    const params = {
      username: inputParams.currentUserName,
      soldProduct: inputParams.productSold,
      prospectTitle: inputParams.prospectTitle,
      prospectObjections: inputParams.productDetails,
      additionalDetails: inputParams.additionalDetails,
      scenario: inputParams.scenario,
      defficultyLevel: inputParams.level,
      language: inputParams.language,
    };

    // dummy data for testing
    // params.username = "plombar";
    // params.soldProduct = "CRM Software";
    // params.prospectTitle = "Sales Manager";
    // params.prospectObjections =
    //   "We don't have the budget for new software right now.";
    // params.additionalDetails =
    //   "The prospect is looking to improve their sales process efficiency.";
    // params.scenario = "outbound-phone-call-b2b";
    // params.defficultyLevel = "intermediate";
    // params.language = "English";

    // console.log('systemPrompt>>>>>>>>>> Parameters before calling:', params);

    try {
      const response = await systemPromptRequest(params);
      console.log("systemPrompt>>>>>>>>>>", response.prompt);
      if (response && response.prompt) {
        let tempAI = chatsAI;
        tempAI.push({
          role: "system",
          content: response.prompt,
        });
        tempAI.push({
          role: "assistant",
          content: welcomeMessage,
        });

        // Update the state
        setChatsAI([...tempAI]);
      } else {
        console.error("Invalid response or missing prompt");
      }
    } catch (error) {
      console.error("Error: 12312", error);
    }
  };

  useEffect(() => {
    // console.log('......2');
    // resetRole();
    // if (!service) return;
    // let welcomeMessage = roles[service].welcomeNote || 'Hello this is Mark.';

    let welcomeMessage = "";
    console.log(inputParams.scenario, "SCENARIOASASASASA");
    if (inputParams.scenario !== null) {
      if (inputParams.scenario === "outbound-phone-call-b2b") {
        welcomeMessage = "Hello this is Alex.";
      } else if (inputParams.scenario === "outbound-phone-call-b2c") {
        welcomeMessage = "Hello";
      } else {
        welcomeMessage = "Ring Ring";
      }
    }

    // let temp = chats;

    // temp.push({
    //   from: 'bot',
    //   message: welcomeMessage,
    //   sendAt: new Date().toISOString(),
    // });

    // let tempAI = chatsAI;
    // tempAI.push({
    //   role: 'assistant',
    //   content: welcomeMessage,
    // });
    // // setChats([...temp]);

    // setChatsAI([...tempAI]);
    handleGeneratePrompt(welcomeMessage);
    readText(welcomeMessage);
    saveChatHistory("agent", welcomeMessage);
    return () => {
      setChats([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  useEffect(() => {
    const interval = setInterval(() => {
      console.log("Periodic subscription check");
      getUserDetails(router);
    }, 30000);

    return () => clearInterval(interval); // This represents the unmount function, in which you need to clear your interval to prevent memory leaks.
  }, [state, router]);

  useEffect(() => {
    if (!listening) {
      const blankInterval = setInterval(() => {
        setFirstVisit(false);
      }, NOTACTIVE_MS);
      return () => clearInterval(blankInterval);
    } else {
      setFirstVisit(true);
    }
  }, [state, listening]);

  useEffect(() => {}, [chats]);

  const restartData = () => {
    setFirstVisit(true);
    setChats([]);
    setChatsAI([]);

    setState((prev) => {
      return { ...prev };
    });
  };

  // Using expo-speech per-speak callbacks; no global TTS finish callback needed

  const handleSpeechResponse = (speechResult: string) => {
    if (speechResult.length) {
      let temp = chats;
      let tempAI = chatsAI;
      temp.push({
        from: "user",
        message: speechResult,
        sendAt: new Date().toISOString(),
      });

      tempAI.push({
        role: "user",
        content: speechResult,
      });

      saveChatHistory("user", speechResult);
      setChats([...temp]);
      setChatsAI([...tempAI]);
      // getIntent(speechResult);
      initChatgptAPI();
    }
  };

  const startRecognizing = async () => {
    setPartialResults([]);
    try {
      await Voice.start("en-US");
    } catch {
      console.log("There's some error...");
    }
  };

  const readText = async (text: string) => {
    setListening(false);
    setPartialResults([]);
    try {
      try {
        Speech.stop(); // fire-and-forget — no await avoids speak delay
      } catch {}

      Speech.speak(text ?? "", {
        language: "en-US",
        rate: 0.9,
        pitch: 1.25,
        onDone: () => {
          if (shouldListen.current) startRecognizing();
        },
        onError: (err) => console.error("Speech.speak error", err),
      });
    } catch (err) {
      console.warn("Speech readText error:", err);
    }
  };

  const getIntentFallBack = async (data: any) => {
    if (data.intent.displayName === "Default Fallback Intent") {
      const formData = new FormData();
      formData.append("query", data.query);
      try {
        await fetch(
          "https://salesscripter.com/pro/api/saveFallbackIntentQuestion",
          {
            method: "POST",
            body: formData,
          },
        );
      } catch (err) {
        console.log("get intent fallback error", err);
      }
    }
  };

  const systemPromptRequest = async ({
    username,
    soldProduct,
    prospectTitle,
    prospectObjections,
    additionalDetails,
    scenario,
    defficultyLevel,
    language,
  }: SystemPromptParams) => {
    const url =
      "https://salesscripter.com/vshserver/trashpage/simulator/system-prompt";

    // Create a FormData object
    const formData = new FormData();
    formData.append("username", String(username));
    formData.append("soldProduct", String(soldProduct));
    formData.append("prospectTitle", String(prospectTitle));
    formData.append("prospectObjections", String(prospectObjections));
    formData.append("additionalDetails", String(additionalDetails));
    formData.append("scenario", String(scenario));
    formData.append("defficultyLevel", String(defficultyLevel));
    formData.append("language", String(language));

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData, // Use FormData as the body
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data, "Prompt DATA");
      return data;
    } catch (error) {
      console.error("Error making POST request:", error);
      return null;
    }
  };
  const initChatgptAPI = async () => {
    const apiKey = process.env.OPENAI_API_KEY;
    const apiUrl = "https://api.openai.com/v1/chat/completions";
    // const tempAI = chatsAI;
    const data = {
      messages: chatsAI,
      model: "gpt-4o-mini", // Adjust model as needed
      max_tokens: 1000,
    };
    // console.log(data, 'WE PASSING THIS');
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Organization": "org-CCLjMqKvxy6jxGrGwp047Bew",
          "OpenAI-Project": "proj_TEab95MBA18m2yKdqUGjXg8i",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const responseData = await response.json();
        const content = responseData.choices[0].message.content;
        // console.log(content.replace(/\n/g, '<br />'), 'WE GOT THIS');
        let tempAI = chatsAI;
        tempAI.push({
          role: "assistant",
          content: content,
        });
        setChatsAI([...tempAI]);
        await readText(content);
        await saveChatHistory("agent", content);
        // return content.replace(/\n/g, '<br />');
      } else {
        console.error("API request failed with status:", response.status);
      }
    } catch (error) {
      console.error("Error while making API request:", error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _getIntent = async (data: string) => {
    try {
      const fetchResponse = await fetch(
        "https://salesscripter.com/node/detectIntent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            referer: "https://salesscripter.com",
          },
          body: `message=${data}`,
        },
      );
      const intentData = await fetchResponse.json();
      getIntentFallBack(intentData);
      const temp = chats;
      temp.push({
        from: "bot",
        message: intentData.response,
        sendAt: new Date().toISOString(),
      });

      // console.log(chats, 'ALL CHATS');
      setChats([...temp]);
      await readText(intentData.response);
      // initChatgptAPI(chatsAI);
    } catch (err) {
      console.log("get intent error", err);
    }
  };

  return (
    <SafeAreaView style={styles.flexCenter}>
      <View style={styles.container}>
        <ScrollView
          style={styles.chatContainer}
          ref={scrollViewRef}
          onContentSizeChange={() =>
            scrollViewRef.current?.scrollToEnd({ animated: true })
          }
        >
          {chatsAI.map((chat, index) => {
            // let printDate = getFormattedDate(chat.sendAt);
            if (chat.from === "bot" || chat.role === "assistant") {
              return (
                <View key={index} style={[styles.chatBox, styles.botChat]}>
                  <Text style={styles.botChatText}>{chat.content}</Text>
                  {/* <Text style={styles.botChatTimeStamp}>{printDate}</Text> */}
                </View>
              );
            }
            if (chat.from === "user" || chat.role === "user") {
              return (
                <View key={index} style={[styles.chatBox, styles.userChat]}>
                  <Text style={styles.userChatText}>
                    {chat.content.replace(/./, (c) => c.toUpperCase())}
                  </Text>
                  {/* <Text style={styles.userChatTimeStamp}>{printDate}</Text> */}
                </View>
              );
            }
          })}
        </ScrollView>
        <View></View>
      </View>
      {listening ? (
        <Text style={styles.textAboveBtn}>Listening</Text>
      ) : !firstVisit ? (
        <Text style={styles.textAboveBtn}>Not Active</Text>
      ) : null}

      {/* ─────────────────────────────────────────────────────────────────────── */}

      <TouchableOpacity onPress={() => restartData()}>
        <View style={styles.btnStartRolePlay}>
          <Image source={playIcon} style={styles.playIcon} />
          <Text style={styles.startBtnText}>RESTART</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
  // }
}

const styles = StyleSheet.create({
  micButton: {
    height: 30,
    width: 30,
  },
  input: {
    borderColor: "#a6a4a4",
  },
  headerLogo: { height: 60, width: 180, marginBottom: 20 },
  loginBtn: { height: 45, backgroundColor: "#DF0000" },
  errorText: { color: "red" },
  showIcon: { height: 20, width: 20, marginRight: 5 },

  flexCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
  },
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    width: "100%",
  },
  buttonRestart: {
    alignItems: "center",
    backgroundColor: "#F5FCFF",
    width: "90%",
  },
  chatBox: {
    margin: 4,
    marginBottom: 28,
    padding: 10,
    borderRadius: 8,
    maxWidth: "93%",
    minWidth: "20%",
    borderColor: "#dad8d8", // if you need
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#dad8d8",
    shadowRadius: 100,
    shadowOpacity: 1,
  },
  botChat: {
    backgroundColor: "#e9f4ff",
    alignSelf: "flex-start",
  },
  userChat: {
    backgroundColor: "#dfede5",
    alignSelf: "flex-end",
  },
  chatContainer: { marginBottom: 10, width: "90%", padding: 5, marginTop: 20 },
  welcome: {
    fontSize: 20,
    textAlign: "center",
    margin: 10,
    borderTopColor: "#ddd",
  },
  userChatText: { maxWidth: "93%", textAlign: "right" },
  botChatText: {
    maxWidth: "93%",
    textAlign: "left",
  },
  action: {
    width: "100%",
    textAlign: "center",
    color: "white",
    paddingVertical: 8,
    marginVertical: 5,
    fontWeight: "bold",
  },
  instructions: {
    textAlign: "center",
    color: "#333333",
    // marginBottom: 0,
    minHeight: 50,
  },
  partialResultsText: {
    textAlign: "center",
    color: "#B0171F",
    marginBottom: 1,
    fontWeight: "700",
  },
  textAboveBtn: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
  },
  btnStartRolePlay: {
    backgroundColor: "#F9F9F9",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 5,
    elevation: 3, // Shadow on Android
    shadowColor: "#000", // Shadow on iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#4C75AA",
    width: "40%", // Button width
    flexDirection: "row", // Arrange icon and text horizontally
    alignItems: "center", // Center icon and text vertically
    justifyContent: "center",
    // display: 'flex',
    // flexDirection: 'column',
    // alignItems: 'center',
    // justifyContent: 'space-around',
    // backgroundColor: '#757575',
    // padding: 8,
    // borderColor: '#dad8d8',
    // borderWidth: 1,
    // borderRadius: 8,
    marginBottom: 30,
  },
  startBtnText: {
    color: "#4C75AA",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center", // Centers the text within the button
    marginLeft: 3, // Space between icon and text
  },
  playIcon: {
    width: 20,
    height: 20,
    // Add tintColor or other styling as needed
  },
  btnStopRolePlay: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#DF0000",
    padding: 8,
    height: 40,
    borderRadius: 50,
  },
  // userChatTimeStamp: {color: '#fff', textAlign: 'right', fontSize: 8},
  // botChatTimeStamp: {fontSize: 8},
  backButtonContainer: {
    display: "flex",
    alignItems: "center",
    flexDirection: "row",
    alignSelf: "flex-start",
    margin: 4,
  },
  backButton: {
    height: 25,
    width: 20,
  },
  textContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    height: 20,
    borderRadius: 8,
  },
  roleContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    width: "100%",
    height: 30,
    padding: 4,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "#DF0000",
    color: "#FFFFFF",
  },
});
