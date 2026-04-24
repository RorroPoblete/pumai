import type { Metadata } from "next";
import Navbar from "@/components/landing/Navbar";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import JsonLd from "@/components/JsonLd";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://pumai.com.au";

export const metadata: Metadata = {
  title: "Pricing — WhatsApp, Instagram & Webchat AI Plans",
  description:
    "Transparent AI agent pricing for Australian SMEs. WhatsApp from A$199, Webchat from A$99, Instagram from A$129. GST included.",
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: "PumAI Pricing — AI Agents for WhatsApp, Instagram & Webchat",
    description:
      "Transparent AI agent pricing for Australian SMEs. All plans include setup and GST.",
    url: "/pricing",
    type: "website",
  },
};

export default function PricingPage() {
  const products = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "PumAI Webchat",
      description: "Embeddable AI chat widget for your website.",
      brand: { "@type": "Brand", name: "PumAI" },
      url: `${SITE_URL}/pricing`,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "AUD",
        lowPrice: "99",
        highPrice: "599",
        offerCount: "3",
        availability: "https://schema.org/OnlineOnly",
        url: `${SITE_URL}/pricing`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "PumAI WhatsApp",
      description: "AI agent for WhatsApp Business API — rich conversations, product catalogues, payments.",
      brand: { "@type": "Brand", name: "PumAI" },
      url: `${SITE_URL}/whatsapp-ai`,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "AUD",
        lowPrice: "199",
        highPrice: "899",
        offerCount: "3",
        availability: "https://schema.org/OnlineOnly",
        url: `${SITE_URL}/pricing`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "PumAI Instagram DM",
      description: "AI agent for Instagram DMs, story mentions, and comment replies.",
      brand: { "@type": "Brand", name: "PumAI" },
      url: `${SITE_URL}/instagram-dm-automation`,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "AUD",
        lowPrice: "129",
        highPrice: "699",
        offerCount: "3",
        availability: "https://schema.org/OnlineOnly",
        url: `${SITE_URL}/pricing`,
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: "PumAI Messenger",
      description: "AI agent for Facebook Messenger and Page conversations.",
      brand: { "@type": "Brand", name: "PumAI" },
      url: `${SITE_URL}/messenger-ai`,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "AUD",
        lowPrice: "129",
        highPrice: "699",
        offerCount: "3",
        availability: "https://schema.org/OnlineOnly",
        url: `${SITE_URL}/pricing`,
      },
    },
  ];

  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Pricing", item: `${SITE_URL}/pricing` },
    ],
  };

  return (
    <>
      <JsonLd data={[...products, breadcrumbs]} />
      <Navbar />
      <main className="pt-24">
        <section className="px-6 pt-12 pb-4 max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--text-primary)]">
            AI agent pricing for <span className="gradient-text-violet">Australian businesses</span>
          </h1>
          <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Pick the channels your customers actually use. WhatsApp, Webchat, Instagram DMs and Messenger — each with
            Starter, Growth and Scale tiers. All prices in AUD and include GST.
          </p>
        </section>
        <Pricing />
        <Footer />
      </main>
    </>
  );
}
