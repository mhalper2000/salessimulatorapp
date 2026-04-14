import AsyncStorage from "@react-native-async-storage/async-storage";
import CryptoJS from "crypto-js";

const USER_KEY = "username";
const PASS_KEY = "password";
const COOKIE_KEY = "cookie1";
// NOTE: In the original app this secret was bundled in the app; for better
// security you should store this in native secure storage or derive it.
const AES_SECRET = "salescripter_aes_secret_v1";

export async function saveEncryptedCredentials(
  username: string,
  password: string,
) {
  try {
    const encUser = CryptoJS.AES.encrypt(username, AES_SECRET).toString();
    const encPass = CryptoJS.AES.encrypt(password, AES_SECRET).toString();
    await AsyncStorage.setItem(USER_KEY, encUser);
    await AsyncStorage.setItem(PASS_KEY, encPass);
  } catch (e) {
    // ignore storage errors
  }
}

export async function getDecryptedCredentials(): Promise<{
  username: string;
  password: string;
} | null> {
  try {
    const encUser = await AsyncStorage.getItem(USER_KEY);
    const encPass = await AsyncStorage.getItem(PASS_KEY);
    if (!encUser || !encPass) return null;

    const username = CryptoJS.AES.decrypt(encUser, AES_SECRET).toString(
      CryptoJS.enc.Utf8,
    );
    const password = CryptoJS.AES.decrypt(encPass, AES_SECRET).toString(
      CryptoJS.enc.Utf8,
    );

    if (!username || !password) return null;
    return { username, password };
  } catch (e) {
    return null;
  }
}

export async function isUserLoggedInAsync(): Promise<boolean> {
  try {
    const encUser = await AsyncStorage.getItem(USER_KEY);
    return !!encUser;
  } catch {
    return false;
  }
}

export async function saveCookieSnapshot(snapshot: any) {
  try {
    await AsyncStorage.setItem(COOKIE_KEY, JSON.stringify(snapshot || {}));
  } catch (e) {
    // ignore
  }
}

export async function getCookieSnapshot(): Promise<any | null> {
  try {
    const s = await AsyncStorage.getItem(COOKIE_KEY);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export async function clearStoredCredentials() {
  try {
    await AsyncStorage.multiRemove([USER_KEY, PASS_KEY, COOKIE_KEY]);
  } catch {
    // ignore
  }
}

export default {
  saveEncryptedCredentials,
  getDecryptedCredentials,
  isUserLoggedInAsync,
  saveCookieSnapshot,
  getCookieSnapshot,
  clearStoredCredentials,
};
