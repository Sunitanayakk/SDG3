import "../global.css";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useReducedMotion } from "react-native-reanimated";
import { SetuProvider, useSetu } from "../services/context";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <SetuProvider>
        <StatusBar style="dark" />
        <Navigator />
      </SetuProvider>
    </SafeAreaProvider>
  );
}
function Navigator() {
  const { prefs } = useSetu();
  const systemReduced = useReducedMotion();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f7fbf9" },
        animation: prefs.reduced_motion || systemReduced ? "none" : "fade",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="emergency" />
      <Stack.Screen name="preferences" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="access" />
    </Stack>
  );
}
