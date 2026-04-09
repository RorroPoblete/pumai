"use client";

import React, { useState } from "react";

type Channel = "sms" | "wa" | "webchat" | "social";

const channelConfig: Record<Channel, { label: string; color: string; bg: string; subtitle: string }> = {
  sms: { label: "SMS", color: "#22c55e", bg: "rgba(34,197,94,", subtitle: "Universal reach — 98% open rate, every Australian mobile" },
  wa: { label: "WhatsApp", color: "#3b82f6", bg: "rgba(59,130,246,", subtitle: "Rich conversations — buttons, images, catalogues, payment links" },
  webchat: { label: "Webchat", color: "#8B5CF6", bg: "rgba(139,92,246,", subtitle: "Embed AI chat on your website — instant support for every visitor" },
  social: { label: "Instagram & Messenger", color: "#e844a0", bg: "rgba(232,68,160,", subtitle: "Engage customers on Instagram DMs and Facebook Messenger automatically" },
};

const plans: Record<Channel, { name: string; price: string; period: string; target: string; setup: string; features: string[]; cta: string; popular: boolean }[]> = {
  sms: [
    {
      name: "SMS Starter", price: "A$299", period: "/month", target: "Businesses that need universal reach", setup: "A$500 setup fee",
      features: ["300 SMS conversations/month", "1 AI agent", "1 funnel", "Basic dashboard", "Email support", "Extra: A$0.60/conv"],
      cta: "Get Started", popular: false,
    },
    {
      name: "SMS Growth", price: "A$649", period: "/month", target: "Growing SMEs", setup: "A$900 setup fee",
      features: ["1,000 SMS conversations/month", "3 AI agents", "3 funnels", "CRM integrations", "Advanced analytics", "Priority support", "Extra: A$0.55/conv"],
      cta: "Get Started", popular: true,
    },
    {
      name: "SMS Enterprise", price: "A$1,499+", period: "/month", target: "Retail, healthcare, automotive", setup: "Custom setup",
      features: ["4,000 conversations/month", "Unlimited AI agents", "Unlimited funnels", "Dedicated API", "Guaranteed SLA", "Account manager", "Extra: A$0.45/conv"],
      cta: "Contact Sales", popular: false,
    },
  ],
  wa: [
    {
      name: "WA Starter", price: "A$199", period: "/month", target: "Businesses with young/digital audience", setup: "A$500 setup fee",
      features: ["500 WhatsApp conversations/month", "1 AI agent", "1 funnel", "Rich media (images, buttons, links)", "Basic dashboard", "Extra: A$0.25/conv"],
      cta: "Get Started", popular: false,
    },
    {
      name: "WA Growth", price: "A$449", period: "/month", target: "E-commerce, hospitality, services", setup: "A$900 setup fee",
      features: ["2,000 WhatsApp conversations/month", "3 AI agents", "3 funnels", "Product catalogues", "CRM integrations", "Advanced analytics", "Priority support", "Extra: A$0.20/conv"],
      cta: "Get Started", popular: true,
    },
    {
      name: "WA Enterprise", price: "A$999+", period: "/month", target: "Retail, e-commerce, multi-location", setup: "Custom setup",
      features: ["Unlimited conversations", "Unlimited AI agents", "Unlimited funnels", "Dedicated API", "Guaranteed SLA", "Account manager", "WA marketing outbound", "Extra: A$0.15/conv"],
      cta: "Contact Sales", popular: false,
    },
  ],
  webchat: [
    {
      name: "Webchat Starter", price: "A$99", period: "/month", target: "Small business websites", setup: "Free setup",
      features: ["500 chat sessions/month", "1 AI agent", "Embeddable widget", "Custom branding (colours, logo)", "Basic analytics", "Email support", "Extra: A$0.10/session"],
      cta: "Get Started", popular: false,
    },
    {
      name: "Webchat Growth", price: "A$249", period: "/month", target: "E-commerce & lead generation", setup: "A$300 setup fee",
      features: ["2,000 chat sessions/month", "3 AI agents", "Lead capture forms", "CRM integrations", "File & image sharing", "Advanced analytics", "Priority support", "Extra: A$0.08/session"],
      cta: "Get Started", popular: true,
    },
    {
      name: "Webchat Enterprise", price: "A$599+", period: "/month", target: "High-traffic sites & SaaS", setup: "Custom setup",
      features: ["Unlimited chat sessions", "Unlimited AI agents", "Co-browsing support", "Custom CSS & JS hooks", "Dedicated API", "Guaranteed SLA", "Account manager", "Extra: A$0.05/session"],
      cta: "Contact Sales", popular: false,
    },
  ],
  social: [
    {
      name: "Social Starter", price: "A$149", period: "/month", target: "Brands on Instagram & Facebook", setup: "A$400 setup fee",
      features: ["500 DM conversations/month", "1 AI agent", "Instagram DMs + Messenger", "Auto-reply to comments", "Basic dashboard", "Email support", "Extra: A$0.20/conv"],
      cta: "Get Started", popular: false,
    },
    {
      name: "Social Growth", price: "A$399", period: "/month", target: "E-commerce & retail brands", setup: "A$700 setup fee",
      features: ["2,000 DM conversations/month", "3 AI agents", "Instagram DMs + Messenger", "Story mention replies", "Product tag integration", "CRM integrations", "Advanced analytics", "Priority support", "Extra: A$0.15/conv"],
      cta: "Get Started", popular: true,
    },
    {
      name: "Social Enterprise", price: "A$899+", period: "/month", target: "Multi-brand, high-volume", setup: "Custom setup",
      features: ["Unlimited conversations", "Unlimited AI agents", "Instagram + Messenger + comments", "Meta Ads integration", "Dedicated API", "Guaranteed SLA", "Account manager", "Extra: A$0.10/conv"],
      cta: "Contact Sales", popular: false,
    },
  ],
};

const channelIcons: Record<Channel, React.ReactNode> = {
  sms: (
    <svg className="w-4 h-4 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  wa: (
    <svg className="w-4 h-4 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  webchat: (
    <svg className="w-4 h-4 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  social: (
    <svg className="w-4 h-4 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
};

export default function Pricing() {
  const [channel, setChannel] = useState<Channel>("sms");
  const cfg = channelConfig[channel];
  const currentPlans = plans[channel];

  return (
    <section id="pricing" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-[#8B5CF6] tracking-widest uppercase">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Five channels,{" "}
            <span className="gradient-text-violet">one platform</span>
          </h2>
          <p className="mt-4 text-lg text-[#A1A1AA] max-w-xl mx-auto">
            Choose the channels your customers use. Mix and match, or go Omnichannel for full coverage.
          </p>
        </div>

        {/* Channel toggle */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {(Object.keys(channelConfig) as Channel[]).map((ch) => {
            const c = channelConfig[ch];
            const active = channel === ch;
            return (
              <button
                key={ch}
                onClick={() => setChannel(ch)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  active
                    ? `border-2 shadow-[0_0_20px_${c.bg}0.15)]`
                    : "border-2 border-[rgba(255,255,255,0.1)] text-[#71717A] hover:border-[rgba(255,255,255,0.2)]"
                }`}
                style={
                  active
                    ? { backgroundColor: `${c.bg}0.15)`, color: c.color, borderColor: c.color }
                    : undefined
                }
              >
                {channelIcons[ch]}
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Channel subtitle */}
        <p className="text-center text-sm font-medium mb-8" style={{ color: cfg.color }}>
          {cfg.subtitle}
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {currentPlans.map((p, i) => (
            <div
              key={`${channel}-${i}`}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                p.popular
                  ? "border-2"
                  : "card-gradient border border-[rgba(139,92,246,0.15)] hover:border-[rgba(139,92,246,0.4)]"
              }`}
              style={
                p.popular
                  ? {
                      background: `${cfg.bg}0.08)`,
                      borderColor: cfg.color,
                      boxShadow: `0 0 40px ${cfg.bg}0.2)`,
                    }
                  : undefined
              }
            >
              {p.popular && (
                <div
                  className="absolute -top-3 right-6 text-xs font-bold px-3 py-1 rounded-md text-white"
                  style={{ background: cfg.color }}
                >
                  MOST POPULAR
                </div>
              )}

              <div className="text-sm font-semibold text-[#A1A1AA] mb-1">{p.name}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-white">{p.price}</span>
                <span className="text-[#71717A] text-sm">{p.period}</span>
              </div>
              <div className="text-xs text-[#71717A] mb-2">{p.target}</div>
              <div className="text-xs font-medium mb-6" style={{ color: cfg.color }}>{p.setup}</div>

              <ul className="space-y-3 mb-8">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-[#A1A1AA]">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: cfg.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href="#"
                className={`block text-center font-semibold py-3 rounded-xl transition-all duration-300 ${
                  p.popular
                    ? "gradient-btn text-white glow-sm hover:glow-md"
                    : "border-2 border-[rgba(139,92,246,0.4)] text-white hover:bg-[rgba(139,92,246,0.08)] hover:border-[#8B5CF6]"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Omnichannel upsell */}
        <div className="mt-10 p-6 rounded-2xl border border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.05)] text-center">
          <div className="text-sm font-bold text-[#A78BFA] mb-1">
            Want all channels?
          </div>
          <div className="text-lg font-extrabold text-white mb-2">
            Upgrade to Omnichannel for{" "}
            <span className="gradient-text-violet">+A$350/month</span>
          </div>
          <p className="text-sm text-[#A1A1AA] max-w-lg mx-auto">
            Add SMS + WhatsApp + Webchat + Instagram + Messenger on top of any plan.
            One AI platform, five channels, total coverage.
          </p>
        </div>

        {/* Extras */}
        <div className="mt-8 text-center text-sm text-[#71717A] space-y-1.5">
          <p>Prepaid SMS packs: 500 conversations for A$275 &middot; Prepaid WA packs: 1,000 conversations for A$180</p>
          <p>Dedicated virtual SMS number: A$15/month &middot; WhatsApp Business API setup included</p>
          <p>Webchat widget free to embed &middot; Meta Business verification included for Social plans</p>
          <p>One-time implementation: A$300&ndash;A$900 (includes setup + agent training)</p>
        </div>
      </div>
    </section>
  );
}
