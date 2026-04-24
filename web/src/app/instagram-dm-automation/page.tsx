import type { Metadata } from "next";
import ChannelLanding from "@/components/landing/ChannelLanding";

export const metadata: Metadata = {
  title: "Instagram DM Automation with AI",
  description:
    "Auto-reply Instagram DMs, story mentions and comments with an AI agent. Capture leads, answer product questions, tag Shopify items. From A$129/month.",
  alternates: { canonical: "/instagram-dm-automation" },
  openGraph: {
    title: "Instagram DM Automation — PumAI",
    description:
      "AI agent that replies to Instagram DMs, story mentions and comments 24/7. Built for Australian DTC and creator brands.",
    url: "/instagram-dm-automation",
    type: "website",
  },
};

export default function InstagramDMPage() {
  return (
    <ChannelLanding
      slug="instagram-dm-automation"
      eyebrow="Instagram DMs"
      h1="Instagram DM Automation with AI"
      heroSubtitle="Reply to every Instagram DM, story mention and comment instantly — capture leads, answer product questions and drive sales while you focus on content."
      productName="PumAI Instagram"
      productDescription="AI agent for Instagram DMs, story mentions, and comment replies with product tag integration."
      priceFrom="129"
      keywordIntro="Instagram is where Australian customers discover products, and DMs are where they decide. If your brand grows on Instagram, missed messages are missed revenue. PumAI deploys an AI agent directly inside your Instagram DMs that replies instantly, handles product questions with Shopify product tags, continues the conversation from story replies and mentions, and captures the lead into your CRM — all without leaving the app your customers already live in."
      benefits={[
        {
          title: "Never miss a DM again",
          description:
            "Instant replies at 3am, on weekends and during peak launches. The AI handles FAQs, sizing, stock and shipping questions while you sleep.",
        },
        {
          title: "Story mentions → conversations",
          description:
            "When a customer mentions you in a story, the AI opens a conversation with contextual follow-up — turning UGC into sales opportunities.",
        },
        {
          title: "Comment-to-DM automation",
          description:
            "Trigger a DM when users comment specific keywords on your posts or Reels. Route them into qualification or checkout flows.",
        },
        {
          title: "Shopify product tags",
          description:
            "The AI recognises product tags in customer messages and replies with prices, variants, stock levels and a direct checkout link.",
        },
        {
          title: "Australian DTC-ready",
          description:
            "Built for how Australian DTC brands actually sell on Instagram. GST-inclusive pricing, AU-hours support, hosted in AU.",
        },
        {
          title: "Works with your team",
          description:
            "AI handles volume, humans handle nuance. Your team can take over any conversation with one click and the AI keeps the history.",
        },
      ]}
      howItWorks={[
        {
          step: "1",
          title: "Connect your Instagram Business account",
          description:
            "One-click Meta Business Login. No tokens to copy or webhooks to wire — PumAI handles the Meta app setup for you.",
        },
        {
          step: "2",
          title: "Teach the AI your brand voice",
          description:
            "Upload product data, FAQs and brand guidelines. Set the tone — on-brand copy, emoji usage and the kind of replies you'd send yourself.",
        },
        {
          step: "3",
          title: "Set trigger rules",
          description:
            "Decide which comments, story mentions and DM keywords trigger what. Build quick funnels for launches, restocks or giveaways.",
        },
        {
          step: "4",
          title: "Go live and measure",
          description:
            "See every conversation, lead captured and sale assisted in a single dashboard. Export to your CRM or Shopify customer records.",
        },
      ]}
      useCases={[
        {
          title: "Product launches & restocks",
          description:
            "The day your restock goes live, hundreds of DMs hit at once. The AI answers every one with real-time stock and checkout links.",
        },
        {
          title: "Creator & influencer sales",
          description:
            "Turn story views into sales: the AI answers product questions from story replies and drops a discount code and checkout link automatically.",
        },
        {
          title: "Booking-based businesses",
          description:
            "Salons, studios and clinics: the AI books appointments from DMs, handles deposits and sends reminders.",
        },
        {
          title: "Lead capture for services",
          description:
            "Qualify service enquiries, capture contact details and route hot leads straight to a sales inbox.",
        },
      ]}
      faqs={[
        {
          q: "Does this work with personal Instagram accounts?",
          a: "No. Meta's API requires an Instagram Business or Creator account linked to a Facebook Page. If you're not set up yet, we'll walk you through the switch — it's free and takes five minutes.",
        },
        {
          q: "Will Instagram penalise me for using automation?",
          a: "No. PumAI uses Meta's official Instagram Messaging API, which Meta explicitly supports for business automation. We follow all platform policies including AI disclosure.",
        },
        {
          q: "Can the AI reply to comments on posts and Reels?",
          a: "Yes. Comment-to-DM rules trigger when users comment specific keywords. The AI DMs them to continue the conversation privately — standard practice for Instagram sales.",
        },
        {
          q: "How does pricing work for Australian brands?",
          a: "Starter is A$129/month for 500 DM conversations, Growth is A$349 for 2,000, Scale is A$699 for unlimited. All prices in AUD and include GST.",
        },
        {
          q: "Can the AI hand off to a human?",
          a: "Yes. You can jump into any conversation from the dashboard. The AI pauses automatically and the full message history is preserved.",
        },
        {
          q: "What about the 24-hour messaging window?",
          a: "Meta's messaging window applies. PumAI tracks the window per contact and flags when you can re-engage via story reply triggers or the customer messaging you first.",
        },
      ]}
    />
  );
}
