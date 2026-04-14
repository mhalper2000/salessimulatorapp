import * as SecureStore from "expo-secure-store";

const USERNAME_KEY = "username";
const PASSWORD_KEY = "password";
const COOKIE_KEY = "cookie1";

export const saveCredentials = async (
  username: string,
  password: string,
  cookies?: string,
) => {
  await SecureStore.setItemAsync(USERNAME_KEY, username);
  await SecureStore.setItemAsync(PASSWORD_KEY, password);
  if (cookies) {
    await SecureStore.setItemAsync(COOKIE_KEY, cookies);
  }
};

export const getCredentials = async () => {
  const username = await SecureStore.getItemAsync(USERNAME_KEY);
  const password = await SecureStore.getItemAsync(PASSWORD_KEY);

  if (!username || !password) return null;
  return { username, password };
};

export const clearCredentials = async () => {
  await SecureStore.deleteItemAsync(USERNAME_KEY);
  await SecureStore.deleteItemAsync(PASSWORD_KEY);
  await SecureStore.deleteItemAsync(COOKIE_KEY);
};
