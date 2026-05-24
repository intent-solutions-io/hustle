import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "bcrypt",
  ],
  // Phase 4.5g: prevent Next/Turbopack from traversing the vendored nwsl/
  // sub-project at the repo root — it contains broken-by-design symlinks
  // (venv-videos/bin/python pointing outside the filesystem root) that
  // crash the file tracer. mobile/ is excluded for the same reason
  // (Expo/RN sub-project with its own tsconfig).
  outputFileTracingExcludes: {
    "*": [
      path.join(__dirname, "nwsl/**"),
      path.join(__dirname, "mobile/**"),
    ],
  },
};

export default nextConfig;
