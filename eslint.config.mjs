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
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Utility scripts (not production code)
      "05-Scripts/**",
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
