import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["node_modules/", ".next/", "out/", "build/", "**/*.js"],
  },
  {
    rules: {
      // TypeScript best practices - style prop is used for dynamic theming with CSS custom properties
      
      // TypeScript best practices
      "@typescript-eslint/no-unused-vars": ["warn", { 
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_"
      }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-non-null-assertion": "warn",
      
      // React best practices (vercel recommended)
      "react/self-closing-comp": ["warn", { "component": true, "html": true }],
      "react/no-array-index-key": "warn",
      "react/jsx-no-target-blank": "error",
      "react/jsx-boolean-value": ["warn", "never"],
      "react/jsx-curly-brace-presence": ["warn", { "props": "never", "children": "never" }],
      
      // React Hooks best practices
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/rules-of-hooks": "error",
      
      // Accessibility (a11y) best practices
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-is-valid": "warn",
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/role-has-required-aria-props": "error",
      
      // Next.js best practices
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",
      
      // General JS best practices
      "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
      "prefer-const": "warn",
      "no-var": "error",
      "eqeqeq": ["error", "always", { "null": "ignore" }],
      "no-nested-ternary": "warn",
    },
  },
];

export default eslintConfig;
