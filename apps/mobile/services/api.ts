import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import {
  createDemoApi,
  createRealApi,
  type Storage,
} from "@setu/api-contracts";
export const tokenStorage: Storage = {
  getItem: (key) =>
    Platform.OS === "web"
      ? Promise.resolve(sessionStorage.getItem(key))
      : SecureStore.getItemAsync(key),
  setItem: (key, value) =>
    Platform.OS === "web"
      ? sessionStorage.setItem(key, value)
      : SecureStore.setItemAsync(key, value),
  removeItem: (key) =>
    Platform.OS === "web"
      ? sessionStorage.removeItem(key)
      : SecureStore.deleteItemAsync(key),
};
export const api =
  process.env.EXPO_PUBLIC_DEMO_MODE !== "false"
    ? createDemoApi(AsyncStorage)
    : createRealApi({
        baseUrl:
          process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000",
        tokenStorage,
        supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
        supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      });
