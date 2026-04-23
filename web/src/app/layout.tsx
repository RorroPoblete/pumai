import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import ToastProvider from "@/components/Toast";
import "./globals.css";

export const dynamic = "force-dynamic";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PumAI — Omnichannel AI Agents for Australian Business",
  description:
    "AI-powered agents that automate sales, support, and marketing via WhatsApp, Webchat, Instagram DMs, and Messenger. One platform, every conversation.",
  keywords: [
    "AI agents Australia",
    
    "WhatsApp business",
    "omnichannel AI",
    "conversational AI",
    "Australian SME automation",
    "customer support AI",
  ],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "PumAI — Omnichannel AI Agents for Australian Business",
    description: "AI-powered agents for WhatsApp, Webchat, Instagram DMs, and Messenger. One platform, every conversation.",
    url: "https://pumai.com.au",
    siteName: "PumAI",
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PumAI — Omnichannel AI Agents",
    description: "AI-powered agents for WhatsApp, Webchat, Instagram DMs, and Messenger.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <ThemeProvider>
          <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
