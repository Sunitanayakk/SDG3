const ts = require("typescript-eslint");
module.exports = ts.config(
  { ignores: ["dist", ".expo"] },
  ...ts.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
);
