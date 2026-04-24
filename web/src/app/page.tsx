import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import Pricing from "@/components/landing/Pricing";
import Industries from "@/components/landing/Industries";
import LogoCarousel from "@/components/landing/LogoCarousel";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import ScrollReveal from "@/components/landing/ScrollReveal";
import JsonLd from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pumai.com.au";

export const metadata: Metadata = {
  title: {
    absolute: "PumAI — Omnichannel AI Agents for WhatsApp, Webchat, Instagram & Messenger",
  },
  description:
    "PumAI deploys AI agents that handle sales, support and marketing 24/7 across WhatsApp, Webchat, Instagram DMs and Facebook Messenger. One platform, every conversation — built for Australian SMEs.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "PumAI — Omnichannel AI Agents for Australian Business",
    description:
      "AI-powered agents for WhatsApp, Webchat, Instagram DMs, and Messenger. One platform, every conversation.",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "PumAI",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "AI-powered omnichannel agents for Australian businesses across WhatsApp, Webchat, Instagram DMs and Messenger.",
    areaServed: { "@type": "Country", name: "Australia" },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: "sales@pumai.com.au",
        availableLanguage: ["English"],
        areaServed: "AU",
      },
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@pumai.com.au",
        availableLanguage: ["English"],
        areaServed: "AU",
      },
    ],
  };

  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PumAI",
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    description:
      "Omnichannel AI agent platform for WhatsApp, Webchat, Instagram DMs and Messenger. Automate sales, support and marketing.",
    url: SITE_URL,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "AUD",
      lowPrice: "99",
      highPrice: "899",
      offerCount: "12",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "32",
    },
    featureList: [
      "Conversational AI across 4 channels",
      "WhatsApp Business API",
      "Instagram DM automation",
      "Facebook Messenger automation",
      "Embeddable webchat widget",
      "CRM integrations",
      "Real-time analytics",
      "No-code setup",
    ],
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "PumAI",
    url: SITE_URL,
    inLanguage: "en-AU",
    publisher: { "@type": "Organization", name: "PumAI" },
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Which channels does PumAI support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "PumAI supports Webchat, WhatsApp, Instagram DMs and Facebook Messenger from a single AI platform — with the same agent powering every channel.",
        },
      },
      {
        "@type": "Question",
        name: "How much does PumAI cost?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Plans start at A$99/month for Webchat Starter and scale up to A$899/month for WhatsApp Scale. Enterprise pricing is available for volumes above 10,000 conversations/month. All prices include GST.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need technical knowledge to set up PumAI?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. You can configure your AI agent — personality, knowledge base and conversation flows — entirely from the dashboard. Most customers go live within minutes.",
        },
      },
      {
        "@type": "Question",
        name: "Is PumAI compliant with Australian privacy laws?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. PumAI is built for Australian businesses and operates under the Privacy Act 1988 (Cth), the Australian Privacy Principles and the Spam Act 2003.",
        },
      },
      {
        "@type": "Question",
        name: "Can the AI agent hand off to a human?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The platform detects escalation signals and routes conversations to a human team member when required, with full conversation history preserved.",
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={[organization, website, softwareApp, faq]} />
      <Navbar />
      <Hero />
      <ScrollReveal>
        <LogoCarousel />
      </ScrollReveal>
      <ScrollReveal>
        <Features />
      </ScrollReveal>
      <ScrollReveal>
        <HowItWorks />
      </ScrollReveal>
      <ScrollReveal>
        <Pricing />
      </ScrollReveal>
      <ScrollReveal>
        <Industries />
      </ScrollReveal>
      <ScrollReveal>
        <CTA />
      </ScrollReveal>
      <Footer />
      <Script
        src="/widget.js"
        data-widget-key="wk_pumai_landing"
        strategy="afterInteractive"
      />
    </>
  );
}
