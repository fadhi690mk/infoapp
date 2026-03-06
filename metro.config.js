const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Use compiled build of react-native-reanimated to avoid resolving TS source (jestUtils)
const reanimatedPath = path.resolve(__dirname, "node_modules/react-native-reanimated");
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-reanimated") {
    return {
      filePath: path.join(reanimatedPath, "lib", "module", "index.js"),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
