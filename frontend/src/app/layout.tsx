import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ThemeProvider from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PumAI — Conversational AI Agents via SMS for Australian Business",
  description:
    "AI-powered SMS agents that automate sales, support, and marketing for Australian businesses. 24/7 conversational AI via SMS — no app required.",
  keywords: [
    "SMS AI",
    "chatbot Australia",
    "AI agents",
    "business SMS",
    "conversational AI",
    "Australian SME",
    "customer support automation",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
