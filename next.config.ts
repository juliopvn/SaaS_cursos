import type { NextConfig } from "next";
import { securityHeaders } from "./lib/security-headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  serverExternalPackages: ["mongodb", "nodemailer"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders({
          s3Endpoint: process.env.S3_ENDPOINT,
          appUrl: process.env.APP_URL,
          isDev: process.env.NODE_ENV !== "production",
        }),
      },
    ];
  },
};

export default nextConfig;
