import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import LogoCarousel from "@/components/landing/LogoCarousel";
import ScrollReveal from "@/components/landing/ScrollReveal";
import JsonLd from "@/components/JsonLd";

const Features = dynamic(() => import("@/components/landing/Features"));
const HowItWorks = dynamic(() => import("@/components/landing/HowItWorks"));
const Pricing = dynamic(() => import("@/components/landing/Pricing"));
const Industries = dynamic(() => import("@/components/landing/Industries"));
const CTA = dynamic(() => import("@/components/landing/CTA"));
const Footer = dynamic(() => import("@/components/landing/Footer"));

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pumai.com.au";

export const metadata: Metadata = {
  title: {
    absolute: "PumAI — AI Agents for WhatsApp, Instagram & Messenger",
  },
  description:
    "Deploy AI agents 24/7 on WhatsApp, Webchat, Instagram DMs and Messenger. One platform, every conversation — built for Australian SMEs.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "PumAI — AI Agents for WhatsApp, Instagram & Messenger",
    description:
      "Deploy AI agents 24/7 on WhatsApp, Webchat, Instagram DMs and Messenger. Built for Australian SMEs.",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "PumAI",
    legalName: "PumAI Pty Ltd",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description:
      "AI-powered omnichannel agents for Australian businesses across WhatsApp, Webchat, Instagram DMs and Messenger.",
    areaServed: { "@type": "Country", name: "Australia" },
    address: {
      "@type": "PostalAddress",
      addressCountry: "AU",
    },
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
      availability: "https://schema.org/OnlineOnly",
      url: `${SITE_URL}/pricing`,
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
    "@id": `${SITE_URL}/#website`,
    name: "PumAI",
    url: SITE_URL,
    inLanguage: "en-AU",
    publisher: { "@id": `${SITE_URL}/#organization` },
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
      <Features />
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
        strategy="lazyOnload"
      />
    </>
  );
}
