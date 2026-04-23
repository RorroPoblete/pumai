import type { NextConfig } from "next";

// Static security headers. CSP is applied dynamically in middleware (per-request nonce).
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  async headers() {
    return [
      {
        // Skip the widget — it is cross-origin by design.
        source: "/((?!widget\\.js|api/webchat).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
