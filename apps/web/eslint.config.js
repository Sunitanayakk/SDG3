import ts from "typescript-eslint";
import globals from "globals";
export default ts.config({ ignores: ["dist"] }, ...ts.configs.recommended, {
  files: ["src/**/*.{ts,tsx}"],
  languageOptions: { globals: { ...globals.browser } },
  rules: {
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
  },
});
