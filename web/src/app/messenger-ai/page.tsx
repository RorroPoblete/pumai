import type { Metadata } from "next";
import ChannelLanding from "@/components/landing/ChannelLanding";

export const metadata: Metadata = {
  title: "Facebook Messenger AI Agent",
  description:
    "Convert Facebook Page conversations into qualified leads 24/7 with an AI agent. Auto-reply to Page messages and comments. From A$129/month.",
  alternates: { canonical: "/messenger-ai" },
  openGraph: {
    title: "Facebook Messenger AI Agent — PumAI",
    description:
      "AI agent for Facebook Page conversations. Auto-reply, qualify leads and book appointments 24/7.",
    url: "/messenger-ai",
    type: "website",
  },
};

export default function MessengerAIPage() {
  return (
    <ChannelLanding
      slug="messenger-ai"
      eyebrow="Facebook Messenger"
      h1="Facebook Messenger AI Agent"
      heroSubtitle="Turn every Facebook Page message into a qualified lead. Auto-reply, capture details and book appointments 24/7 without growing your team."
      productName="PumAI Messenger"
      productDescription="AI agent for Facebook Messenger and Page conversations with comment-to-DM automation."
      priceFrom="129"
      keywordIntro="Facebook Pages still drive a massive share of local-business enquiries in Australia — and most of those enquiries arrive as Messenger DMs outside business hours. PumAI deploys an AI agent directly on your Facebook Page that replies instantly, answers questions about services, pricing and availability, books appointments, and routes complex conversations to your team during work hours. The result: no more missed leads because someone messaged you at 9pm."
      benefits={[
        {
          title: "Reply in seconds, 24/7",
          description:
            "Your Page's response time shows publicly on your profile. The AI keeps you at 'Typically replies instantly' without anyone sitting at a keyboard.",
        },
        {
          title: "Local business–friendly",
          description:
            "Tradies, clinics, salons, restaurants, real estate. The AI answers 'do you service Parramatta?', 'are you open Saturday?' and 'how much for a small job?' with your real data.",
        },
        {
          title: "Appointment booking built in",
          description:
            "Connect your calendar and the AI offers real time slots inside Messenger. Customers book without leaving the chat.",
        },
        {
          title: "Comment-to-DM for Page ads",
          description:
            "Running Facebook ads? Trigger a Messenger DM when users comment a keyword — the AI qualifies and hands off warm leads to your inbox.",
        },
        {
          title: "CRM-ready",
          description:
            "Every qualified conversation pushes to HubSpot, Pipedrive, Salesforce or a Google Sheet. Call lists are ready when your team starts the day.",
        },
        {
          title: "Works with Instagram too",
          description:
            "Same AI, same inbox. Add PumAI Instagram on top and you get one conversation view across both Meta properties.",
        },
      ]}
      howItWorks={[
        {
          step: "1",
          title: "Connect your Facebook Page",
          description:
            "One-click Meta Business Login. No access-token plumbing — we handle the Facebook app setup and webhook subscriptions.",
        },
        {
          step: "2",
          title: "Point it at your business knowledge",
          description:
            "Upload hours, services, pricing, FAQs, locations or a website URL. The AI keeps answers grounded in your real data.",
        },
        {
          step: "3",
          title: "Add booking and lead flows",
          description:
            "Connect your calendar for booking, or build a qualification flow (name, phone, suburb, intent) that drops hot leads into your CRM.",
        },
        {
          step: "4",
          title: "Launch and track",
          description:
            "Go live in one click. Monitor reply quality, sentiment and lead volume from the dashboard. Take over any chat manually when needed.",
        },
      ]}
      useCases={[
        {
          title: "Trades & home services",
          description:
            "Plumbers, electricians, builders: qualify the job type, suburb and urgency, then route emergency jobs to an on-call technician instantly.",
        },
        {
          title: "Restaurants & hospitality",
          description:
            "Handle booking enquiries, take menu questions and answer 'are you open tonight?' without interrupting service.",
        },
        {
          title: "Clinics & allied health",
          description:
            "Triage new patient enquiries, confirm accepted providers and book initial consults directly into your practice management system.",
        },
        {
          title: "Real estate agencies",
          description:
            "Answer Facebook enquiries from listings, qualify buyer intent and book inspection slots — even from ads running overnight.",
        },
      ]}
      faqs={[
        {
          q: "Do I need a Facebook Page or a Facebook Business account?",
          a: "A Facebook Page connected to a Meta Business Manager is required. If you don't have Business Manager yet, we'll walk you through the free setup in a few minutes.",
        },
        {
          q: "Will Meta allow this?",
          a: "Yes. PumAI uses the official Messenger Platform API, which Meta supports for business automation. We comply with all policies including AI disclosure on first contact.",
        },
        {
          q: "What happens to the 24-hour messaging window?",
          a: "Outside the 24-hour window you need an approved message template for outbound replies. PumAI tracks the window per contact and surfaces which templates are valid at any time.",
        },
        {
          q: "How much does Messenger automation cost in Australia?",
          a: "Starter is A$129/month for 500 conversations, Growth is A$349 for 2,000, Scale is A$699 for unlimited. AUD, GST-inclusive.",
        },
        {
          q: "Can I use this with Instagram as well?",
          a: "Yes. Add the Instagram plan and the same AI handles both channels. You get a unified inbox and a single source of truth per customer.",
        },
        {
          q: "Can a human take over?",
          a: "Yes. Jump into any conversation from the dashboard. The AI pauses and your team picks up with full context.",
        },
      ]}
    />
  );
}
