import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "unicorn", "oxc", "import", "promise", "jsdoc", "vitest"],
  // `jsdoc` is oxlint's native port (tag hygiene); the JS plugin adds only `require-jsdoc`.
  jsPlugins: [{ name: "jsdoc-js", specifier: "eslint-plugin-jsdoc" }],
  categories: {
    correctness: "error",
    suspicious: "error",
    perf: "error",
  },
  options: { typeAware: true },
  rules: {
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",
    "typescript/await-thenable": "error",
    "typescript/switch-exhaustiveness-check": "error",
    "typescript/no-unnecessary-type-assertion": "error",
    "typescript/consistent-type-imports": "error",
    "import/no-cycle": "error",

    // Code documentation: TSDoc on every export, well-formed tags everywhere.
    "jsdoc-js/require-jsdoc": [
      "error",
      {
        publicOnly: true,
        require: { FunctionDeclaration: true, ArrowFunctionExpression: true },
        contexts: [
          "TSInterfaceDeclaration",
          "TSTypeAliasDeclaration",
          "ExportNamedDeclaration > VariableDeclaration",
        ],
      },
    ],
    "jsdoc/check-tag-names": "error",
    "jsdoc/empty-tags": "error",
    "jsdoc/no-defaults": "error",
    "jsdoc/require-param-description": "error",
    "jsdoc/require-param-name": "error",
    "jsdoc/require-returns-description": "error",

    // Tests: every expect runs on every path.
    "vitest/no-conditional-expect": "error",
  },
});
