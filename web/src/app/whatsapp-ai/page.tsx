import type { Metadata } from "next";
import ChannelLanding from "@/components/landing/ChannelLanding";

export const metadata: Metadata = {
  title: "WhatsApp AI Agent for Australian Business",
  description:
    "Automate WhatsApp sales and support with an AI agent on the official WhatsApp Business API. Rich media, product catalogues, payments. From A$199/month.",
  alternates: { canonical: "/whatsapp-ai" },
  openGraph: {
    title: "WhatsApp AI Agent — PumAI",
    description:
      "AI-powered WhatsApp agent for Australian SMEs. Automate sales, support and marketing on the official Business API.",
    url: "/whatsapp-ai",
    type: "website",
  },
};

export default function WhatsAppAIPage() {
  return (
    <ChannelLanding
      slug="whatsapp-ai"
      eyebrow="WhatsApp"
      h1="WhatsApp AI Agent for Australian Business"
      heroSubtitle="Sell, support and re-engage customers on the number-one messaging channel in Australia — 24/7, in natural conversation, via the official WhatsApp Business API."
      productName="PumAI WhatsApp"
      productDescription="AI agent for WhatsApp Business API with rich media, catalogues and payment links."
      priceFrom="199"
      keywordIntro="WhatsApp is how modern Australian customers actually want to talk. PumAI deploys a conversational AI agent directly on your WhatsApp Business number that handles enquiries, qualifies leads, books appointments, answers product questions and hands off to a human when required — all while you sleep. We run on the official WhatsApp Business API with Meta Business Verification included, so your brand ships with the green tick from day one."
      benefits={[
        {
          title: "Always on, 98% open rate",
          description:
            "WhatsApp messages average a 98% open rate in minutes. Your AI agent answers instantly in the channel your customers check most — no missed leads overnight or on weekends.",
        },
        {
          title: "Rich conversational replies",
          description:
            "Send images, PDFs, quick-reply buttons, list menus, product catalogues and payment links — everything the WhatsApp Business API supports, orchestrated by AI.",
        },
        {
          title: "Qualified lead hand-off",
          description:
            "The agent captures name, phone, suburb and intent, then routes warm leads to your CRM or sales inbox in real time.",
        },
        {
          title: "24-hour window compliance",
          description:
            "We respect Meta's 24-hour messaging window by design. Outbound follow-ups use approved templates; your account stays in good standing.",
        },
        {
          title: "Australian-built & supported",
          description:
            "Built for the Privacy Act 1988 and Spam Act 2003. AU-based hosting, AU-hours support, no offshore data handling you didn't sign up for.",
        },
        {
          title: "Go live in an hour",
          description:
            "No-code setup: connect your WhatsApp Business account, import your knowledge base, and your agent is live. Most customers launch same-day.",
        },
      ]}
      howItWorks={[
        {
          step: "1",
          title: "Connect your WhatsApp Business number",
          description:
            "We handle the Meta Business Verification and the WhatsApp Business API registration. Bring your existing number or get a new one.",
        },
        {
          step: "2",
          title: "Train your AI agent",
          description:
            "Upload product info, FAQs, pricing, policies or a website URL. Set the tone (friendly, formal, cheeky) and guardrails from the dashboard — no prompt engineering required.",
        },
        {
          step: "3",
          title: "Build qualification and booking flows",
          description:
            "Define funnels: capture details, qualify intent, book meetings, send quotes or payment links. The AI handles free-form conversation inside each step.",
        },
        {
          step: "4",
          title: "Launch and monitor",
          description:
            "Flip the switch. Watch conversations, sentiment and lead quality in real time from the dashboard. Take over any conversation with a single click.",
        },
      ]}
      useCases={[
        {
          title: "E-commerce product support",
          description:
            "Answer sizing, stock, shipping and returns questions with catalogue links and payment buttons. Recover abandoned carts with a single opt-in follow-up.",
        },
        {
          title: "Real estate lead qualification",
          description:
            "Capture enquiries from property portals, qualify budget and suburb, and book inspections directly into your calendar.",
        },
        {
          title: "Hospitality bookings",
          description:
            "Handle table reservations, private dining enquiries and event bookings. The agent confirms availability and sends deposits via payment links.",
        },
        {
          title: "Professional services intake",
          description:
            "Clinics, law firms and trades: triage enquiries, send intake forms, and book consults — without a receptionist on the phone.",
        },
      ]}
      faqs={[
        {
          q: "Do I need a WhatsApp Business account already?",
          a: "No. PumAI sets up a new WhatsApp Business API account for you, including Meta Business Verification. If you already use the free WhatsApp Business app, we'll migrate your number to the API.",
        },
        {
          q: "Will customers know they're talking to an AI?",
          a: "Yes. PumAI discloses AI involvement in the first message and again on request — this complies with Meta's policies and is the ethical default. You can customise the wording.",
        },
        {
          q: "How much does WhatsApp AI cost in Australia?",
          a: "Plans start at A$199/month for 500 conversations, A$499 for 2,000 conversations and A$899 for unlimited. All prices include GST. See the full pricing page for setup fees and overage rates.",
        },
        {
          q: "Is this compliant with Australian privacy law?",
          a: "Yes. PumAI operates under the Privacy Act 1988 (Cth), the Australian Privacy Principles and the Spam Act 2003. Customer data is hosted in Australian regions with encryption at rest.",
        },
        {
          q: "Can a human take over a conversation?",
          a: "Yes. Your team can jump into any WhatsApp conversation from the dashboard. The AI pauses automatically, and the full history is preserved for context.",
        },
        {
          q: "How fast can we launch?",
          a: "Most customers are live within an hour once Meta Business Verification is in place. Verification itself can take 1–5 business days depending on Meta's review queue.",
        },
      ]}
    />
  );
}
