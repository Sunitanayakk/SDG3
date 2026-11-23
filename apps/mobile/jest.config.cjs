module.exports = {
  preset: "jest-expo",
  testMatch: ["**/__tests__/**/*.test.tsx"],
  setupFilesAfterEnv: ["<rootDir>/test-setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native|expo|@expo|react-navigation|@react-navigation|nativewind|react-native-css-interop|react-native-reanimated|react-native-worklets|@setu))",
  ],
};
