import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  // This Vercel project still has its Output Directory set to `dist`
  // from the static storybook. Next writes the build there so the preview matches.
  distDir: "dist",
};

export default nextConfig;
