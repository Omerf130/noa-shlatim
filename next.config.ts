import type { NextConfig } from "next";
import { serverActionBodySizeLimitBytes } from "./config/serverUploadLimits";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: serverActionBodySizeLimitBytes(),
    },
  },
};

export default nextConfig;
