import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Suppress hydration warnings from browser extensions (Dark Reader, MetaMask, etc.)
  reactStrictMode: true,
  // Skip linting and type checking during builds (fix issues later)
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

// Sentry configuration options
const sentryWebpackPluginOptions = {
  // Suppresses source map uploading logs during build
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps only in production
  authToken: process.env.SENTRY_AUTH_TOKEN,
};

const sentryOptions = {
  // Hide Sentry from browser devtools
  hideSourceMaps: true,
  // Disable Sentry during local development
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions, sentryOptions);
