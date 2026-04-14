import RightHeader from "@/components/header-right";
import { Ionicons } from "@expo/vector-icons";
import * as KeepAwake from "expo-keep-awake";
import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { TouchableOpacity } from "react-native";
import { Provider, useDispatch, useSelector } from "react-redux";
import {
  deleteAccount,
  logoutUser,
  restoreSession,
} from "../redux/slices/authSlice";
import type { AppDispatch, RootState } from "../redux/store";
import { store } from "../redux/store";

function Startup() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { userInfo, deletingAccount } = useSelector(
    (state: RootState) => state.auth,
  );
  console.log("User Info on Startup:", userInfo);
  useEffect(() => {
    dispatch(restoreSession());
  }, []);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: "#DF0000" },
        headerTintColor: "#fff",
        headerTitleAlign: "center",
        title: "Sales Simulator",
        headerBlurEffect: undefined,
        headerTransparent: false,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: "minimal",
        headerRight: userInfo
          ? (props) => {
              return (
                <RightHeader
                  handleLogout={async () => {
                    await dispatch(logoutUser());
                    router.replace("/login");
                  }}
                  handleDelete={async () => {
                    await dispatch(deleteAccount());
                    router.replace("/login");
                  }}
                />
              );
            }
          : undefined,
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen
        name="chat-bot"
        options={{
          headerBackVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 8,
                height: 40,
              }}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    KeepAwake.activateKeepAwakeAsync();
  }, []);

  return (
    <Provider store={store}>
      <Startup />
    </Provider>
  );
}
