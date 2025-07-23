const tseslint = require("typescript-eslint");
const eslint = require("@eslint/js");

module.exports = tseslint.config(
  {
    ignores: ["dist/", "out/", "node_modules/"]
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  }
);