import type { NextConfig } from "next";

const nextConfig = {
  outputFileTracingIncludes: {
    "app/api/export-pdf/route": ["./node_modules/@sparticuz/chromium/bin/**"],
  },
} as unknown as NextConfig;

export default nextConfig;