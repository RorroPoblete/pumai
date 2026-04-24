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
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    optimizePackageImports: ["gsap", "@gsap/react"],
  },
  async headers() {
    return [
      {
        // Keep a minimum set on widget.js (cross-origin by design — no HSTS/CSP).
        source: "/widget.js",
        headers: [{ key: "X-Content-Type-Options", value: "nosniff" }],
      },
      {
        // All other routes (including /api/webchat/* JSON endpoints) get the full set.
        source: "/((?!widget\\.js).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
