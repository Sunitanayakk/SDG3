import mockStorage from "@react-native-async-storage/async-storage/jest/async-storage-mock";
jest.mock("@react-native-async-storage/async-storage", () => mockStorage);
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    setParams: jest.fn(),
  },
  useFocusEffect: (cb: () => void) => require("react").useEffect(cb, []),
  useLocalSearchParams: () => ({}),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Icon" }));
jest.mock("expo-speech", () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock("expo-clipboard", () => ({
  setStringAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("expo-linking", () => ({
  canOpenURL: jest.fn().mockResolvedValue(true),
  openURL: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("react-native-safe-area-context", () => {
  const React = require("react");
  return {
    SafeAreaView: ({ children }: { children: unknown }) =>
      React.createElement("View", null, children),
  };
});
