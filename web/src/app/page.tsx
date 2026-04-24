import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Script from "next/script";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import LogoCarousel from "@/components/landing/LogoCarousel";
import ScrollReveal from "@/components/landing/ScrollReveal";
import JsonLd from "@/components/JsonLd";
import { homeFaqs } from "@/components/landing/FAQ";

const Features = dynamic(() => import("@/components/landing/Features"));
const HowItWorks = dynamic(() => import("@/components/landing/HowItWorks"));
const Pricing = dynamic(() => import("@/components/landing/Pricing"));
const Industries = dynamic(() => import("@/components/landing/Industries"));
const CTA = dynamic(() => import("@/components/landing/CTA"));
const FAQ = dynamic(() => import("@/components/landing/FAQ"));
const Footer = dynamic(() => import("@/components/landing/Footer"));

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pumai.com.au";

export const metadata: Metadata = {
  title: {
    absolute: "AI Chatbot Australia — WhatsApp & Instagram AI Agents | PumAI",
  },
  description:
    "Australian AI chatbot platform for WhatsApp, Instagram, Messenger and Webchat. Deploy 24/7 AI agents for sales and customer service. Live in minutes. From A$99/mo inc GST.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "AI Chatbot Australia — WhatsApp & Instagram AI Agents | PumAI",
    description:
      "Australian AI chatbot platform for WhatsApp, Instagram, Messenger and Webchat. Live in minutes. From A$99/mo.",
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
        areaServed: { "@type": "Country", name: "Australia" },
      },
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@pumai.com.au",
        availableLanguage: ["English"],
        areaServed: { "@type": "Country", name: "Australia" },
      },
    ],
  };

  const softwareApp = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${SITE_URL}/#software`,
    name: "PumAI",
    operatingSystem: "Web",
    applicationCategory: "BusinessApplication",
    description:
      "Omnichannel AI chatbot platform for WhatsApp, Webchat, Instagram DMs and Messenger. Automate sales, support and marketing.",
    url: SITE_URL,
    publisher: { "@id": `${SITE_URL}/#organization` },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "AUD",
      lowPrice: "99",
      highPrice: "899",
      offerCount: "12",
      availability: "https://schema.org/InStock",
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
    "@id": `${SITE_URL}/#faq`,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: homeFaqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
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
        <FAQ />
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
