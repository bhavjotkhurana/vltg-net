import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bundle the OG banner's font files with the serverless function on Vercel;
  // the route reads them from disk at render time.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/app/_og/*.ttf"],
  },
};

export default nextConfig;
