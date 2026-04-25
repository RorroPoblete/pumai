import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import ToastProvider from "@/components/Toast";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import "./globals.css";

// Force dynamic rendering globally so the per-request CSP nonce from proxy.ts
// is injected into Next runtime scripts. Static pages bypass the proxy and
// would emit non-nonced inline scripts that 'strict-dynamic' CSP rejects.
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pumai.com.au";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PumAI — Omnichannel AI Agents for Australian Business",
    template: "%s · PumAI",
  },
  description:
    "AI agents automating sales, support and marketing across WhatsApp, Webchat, Instagram DMs and Messenger. Built for Australian SMEs.",
  applicationName: "PumAI",
  generator: "Next.js",
  authors: [{ name: "PumAI", url: SITE_URL }],
  creator: "PumAI",
  publisher: "PumAI",
  category: "technology",
  referrer: "origin-when-cross-origin",
  formatDetection: { telephone: false, email: false, address: false },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: "/logo.png",
  },
  openGraph: {
    title: "PumAI — Omnichannel AI Agents for Australian Business",
    description:
      "AI-powered agents for WhatsApp, Webchat, Instagram DMs, and Messenger. One platform, every conversation.",
    url: "/",
    siteName: "PumAI",
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PumAI — Omnichannel AI Agents",
    description:
      "AI-powered agents for WhatsApp, Webchat, Instagram DMs, and Messenger.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  colorScheme: "dark light",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <SmoothScrollProvider>
            <ToastProvider>{children}</ToastProvider>
          </SmoothScrollProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
