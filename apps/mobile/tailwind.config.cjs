module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: { colors: { gold: "#087f6b", obsidian: "#f7fbf9" } } },
  plugins: [],
};
