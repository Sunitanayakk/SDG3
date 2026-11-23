const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const path = require("node:path");
const config = getDefaultConfig(__dirname);
const workspace = path.resolve(__dirname, "../..");
// Direct Gradle builds use the mobile server root; shared packages stay visible.
config.watchFolders = [
  ...new Set([
    ...config.watchFolders,
    path.join(workspace, "packages"),
    path.join(workspace, "node_modules"),
  ]),
];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "@setu/api-contracts": path.join(workspace, "packages/api-contracts"),
  "@setu/design-tokens": path.join(workspace, "packages/design-tokens"),
};
module.exports = withNativeWind(config, {
  input: "./global.css",
});
