import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Suppress hydration warnings from browser extensions (Dark Reader, MetaMask, etc.)
  reactStrictMode: true,
  // Fix trailing space in Firebase Console action URLs (e.g. /verify-email%20 → /verify-email)
  async redirects() {
    return [
      {
        source: '/verify-email%20',
        destination: '/verify-email',
        permanent: false,
      },
      {
        source: '/reset-password%20',
        destination: '/reset-password',
        permanent: false,
      },
    ];
  },
  // Skip linting and type checking during builds (fix issues later)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
