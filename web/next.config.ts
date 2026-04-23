import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

// Content-Security-Policy: kept loose enough for Next.js + Stripe Checkout/Elements + Google fonts
// Reverse-proxied widget embeds (Webchat) load from same origin
const csp = [
  "default-src 'self'",
  // 'unsafe-inline' required by Next.js inline runtime + Stripe.js
  `script-src 'self' 'unsafe-inline' ${isProd ? "" : "'unsafe-eval'"} https://js.stripe.com https://accounts.google.com`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://api.stripe.com https://*.openai.com https://accounts.google.com",
  "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
  "frame-ancestors 'none'",
  "form-action 'self' https://checkout.stripe.com",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  output: "standalone",
  async headers() {
    return [
      {
        // Don't apply CSP/X-Frame to the widget script — it's loaded cross-origin by design
        source: "/((?!widget\\.js|api/webchat).*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
