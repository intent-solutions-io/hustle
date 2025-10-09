import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Suppress hydration warnings from browser extensions (Dark Reader, MetaMask, etc.)
  reactStrictMode: true,
};

export default nextConfig;
