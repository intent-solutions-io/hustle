import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Packages that use Node.js built-ins (fs, child_process, net, tls, http2)
  // must only run server-side. Turbopack/webpack will not attempt to bundle them.
  serverExternalPackages: [
    'bcrypt',
    '@google-cloud/vertexai',
    'firebase-admin',
  ],
};

export default nextConfig;
