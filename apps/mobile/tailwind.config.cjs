module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: { colors: { gold: "#c9b8a0", obsidian: "#0a0a0a" } } },
  plugins: [],
};
