import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    'bcrypt',
    '@google-cloud/vertexai',
    'firebase-admin',
  ],
};

export default nextConfig;
