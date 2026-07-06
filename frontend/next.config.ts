import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    // Linting is run separately in CI; keep builds deterministic.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
