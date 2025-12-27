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
    rules: {
      // Disable strict any check - too many existing uses
      "@typescript-eslint/no-explicit-any": "off",
      // Disable unescaped entities - too many existing apostrophes
      "react/no-unescaped-entities": "off",
      // Warn instead of error for optional chain assertions
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Utility scripts (not production code)
      "05-Scripts/**",
      "scripts/**",
      // Archived legacy code
      "99-Archive/**",
      // Cloud Functions (separate TypeScript project)
      "functions/**",
      // Mobile app (separate Expo project)
      "mobile/**",
      // Test utility scripts
      "03-Tests/scripts/**/*.js",
    ],
  },
];

export default eslintConfig;
