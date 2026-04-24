"use client";

import React, { useState } from "react";

type Channel = "webchat" | "wa" | "instagram" | "messenger";

const channelConfig: Record<Channel, { label: string; color: string; bg: string; subtitle: string }> = {
  webchat: { label: "Webchat", color: "#8B5CF6", bg: "rgba(139,92,246,", subtitle: "Embed AI chat on your website — instant support for every visitor" },
  wa: { label: "WhatsApp", color: "#3b82f6", bg: "rgba(59,130,246,", subtitle: "Rich conversations — buttons, images, catalogues, payment links" },
  instagram: { label: "Instagram", color: "#E1306C", bg: "rgba(225,48,108,", subtitle: "Auto-reply Instagram DMs, story mentions, and comment interactions" },
  messenger: { label: "Messenger", color: "#4285F4", bg: "rgba(66,133,244,", subtitle: "Convert Facebook Page conversations into qualified leads 24/7" },
};

const plans: Record<Channel, { name: string; price: string; period: string; target: string; setup: string; features: string[]; cta: string; popular: boolean }[]> = {
  webchat: [
    {
      name: "Webchat Starter", price: "A$99", period: "/month inc GST", target: "Small business websites", setup: "Free setup",
      features: ["500 chat sessions/month", "1 AI agent", "Embeddable widget", "Custom branding (colours, logo)", "Basic analytics", "Email support", "Extra: A$0.10/session"],
      cta: "Get Started", popular: false,
    },
    {
      name: "Webchat Growth", price: "A$299", period: "/month inc GST", target: "E-commerce & lead generation", setup: "A$300 setup fee",
      features: ["2,000 chat sessions/month", "3 AI agents", "Lead capture forms", "CRM integrations", "File & image sharing", "Advanced analytics", "Priority support", "Extra: A$0.08/session"],
      cta: "Get Started", popular: true,
    },
    {
      name: "Webchat Scale", price: "A$599", period: "/month inc GST", target: "High-traffic sites & SaaS", setup: "Custom setup",
      features: ["Unlimited chat sessions", "Unlimited AI agents", "Co-browsing support", "Custom CSS & JS hooks", "Dedicated API", "Guaranteed SLA", "Account manager", "Extra: A$0.05/session"],
      cta: "Contact Sales", popular: false,
    },
  ],
  wa: [
    {
      name: "WA Starter", price: "A$199", period: "/month inc GST", target: "Businesses with young/digital audience", setup: "A$500 setup fee",
      features: ["500 WhatsApp conversations/month", "1 AI agent", "1 funnel", "Rich media (images, buttons, links)", "Basic dashboard", "Extra: A$0.25/conv"],
      cta: "Get Started", popular: false,
    },
    {
      name: "WA Growth", price: "A$499", period: "/month inc GST", target: "E-commerce, hospitality, services", setup: "A$900 setup fee",
      features: ["2,000 WhatsApp conversations/month", "3 AI agents", "3 funnels", "Product catalogues", "CRM integrations", "Advanced analytics", "Priority support", "Extra: A$0.20/conv"],
      cta: "Get Started", popular: true,
    },
    {
      name: "WA Scale", price: "A$899", period: "/month inc GST", target: "Retail, e-commerce, multi-location", setup: "Custom setup",
      features: ["Unlimited conversations", "Unlimited AI agents", "Unlimited funnels", "Dedicated API", "Guaranteed SLA", "Account manager", "WA marketing outbound", "Extra: A$0.15/conv"],
      cta: "Contact Sales", popular: false,
    },
  ],
  instagram: [
    {
      name: "Instagram Starter", price: "A$129", period: "/month inc GST", target: "Brands growing on Instagram", setup: "A$300 setup fee",
      features: ["500 DM conversations/month", "1 AI agent", "Auto-reply to DMs", "Story mention replies", "Basic dashboard", "Email support", "Extra: A$0.20/conv"],
      cta: "Get Started", popular: false,
    },
    {
      name: "Instagram Growth", price: "A$349", period: "/month inc GST", target: "E-commerce & creator brands", setup: "A$600 setup fee",
      features: ["2,000 DM conversations/month", "3 AI agents", "Product tag integration", "Story + comment replies", "CRM integrations", "Advanced analytics", "Priority support", "Extra: A$0.15/conv"],
      cta: "Get Started", popular: true,
    },
    {
      name: "Instagram Scale", price: "A$699", period: "/month inc GST", target: "High-volume DTC brands", setup: "Custom setup",
      features: ["Unlimited conversations", "Unlimited AI agents", "Shopping tag automations", "Meta Ads integration", "Dedicated API", "Guaranteed SLA", "Account manager", "Extra: A$0.10/conv"],
      cta: "Contact Sales", popular: false,
    },
  ],
  messenger: [
    {
      name: "Messenger Starter", price: "A$129", period: "/month inc GST", target: "Small businesses on Facebook", setup: "A$300 setup fee",
      features: ["500 DM conversations/month", "1 AI agent", "Auto-reply Page messages", "Basic dashboard", "Email support", "Extra: A$0.20/conv"],
      cta: "Get Started", popular: false,
    },
    {
      name: "Messenger Growth", price: "A$349", period: "/month inc GST", target: "Local services & multi-location", setup: "A$600 setup fee",
      features: ["2,000 DM conversations/month", "3 AI agents", "Comment-to-DM replies", "Persistent menu templates", "CRM integrations", "Advanced analytics", "Priority support", "Extra: A$0.15/conv"],
      cta: "Get Started", popular: true,
    },
    {
      name: "Messenger Scale", price: "A$699", period: "/month inc GST", target: "National brands with high volume", setup: "Custom setup",
      features: ["Unlimited conversations", "Unlimited AI agents", "Sponsored message campaigns", "Meta Ads integration", "Dedicated API", "Guaranteed SLA", "Account manager", "Extra: A$0.10/conv"],
      cta: "Contact Sales", popular: false,
    },
  ],
};

const channelIcons: Record<Channel, React.ReactNode> = {
  webchat: (
    <svg className="w-4 h-4 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  wa: (
    <svg className="w-4 h-4 mr-1.5 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  instagram: (
    <svg className="w-4 h-4 mr-1.5 inline-block" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  ),
  messenger: (
    <svg className="w-4 h-4 mr-1.5 inline-block" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.2.16.15.26.36.27.59l.05 1.83c.02.57.6.94 1.12.7l2.04-.9c.17-.07.37-.09.55-.05.94.26 1.94.4 2.82.4 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm5.89 7.56l-2.89 4.59c-.46.73-1.44.91-2.12.39l-2.3-1.72a.58.58 0 00-.7 0l-3.1 2.35c-.41.31-.95-.18-.67-.62l2.89-4.59c.46-.73 1.44-.91 2.12-.39l2.3 1.72a.58.58 0 00.7 0l3.1-2.35c.41-.31.95.18.67.62z" />
    </svg>
  ),
};

export default function Pricing() {
  const [channel, setChannel] = useState<Channel>("webchat");
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
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Four channels,{" "}
            <span className="gradient-text-violet">one platform</span>
          </h2>
          <p className="mt-4 text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
            Choose the channels your customers use. Mix and match, or go Omnichannel for full coverage.
          </p>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            All prices in Australian dollars, GST included. Setup fees shown are one-time. Omnichannel bundle setup is a flat A$350 when you subscribe to two or more channels in a single checkout.
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
                    : "border-2 border-[var(--border-input)] text-[var(--text-muted)] hover:border-[var(--border-input)]"
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
                  className="absolute -top-3 right-6 text-xs font-bold px-3 py-1 rounded-md text-[var(--text-primary)]"
                  style={{ background: cfg.color }}
                >
                  MOST POPULAR
                </div>
              )}

              <div className="text-sm font-semibold text-[var(--text-secondary)] mb-1">{p.name}</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-[var(--text-primary)]">{p.price}</span>
                <span className="text-[var(--text-muted)] text-sm">{p.period}</span>
              </div>
              <div className="text-xs text-[var(--text-muted)] mb-2">{p.target}</div>
              <div className="text-xs font-medium mb-6" style={{ color: cfg.color }}>{p.setup}</div>

              <ul className="space-y-3 mb-8">
                {p.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-3 text-sm text-[var(--text-secondary)]">
                    <svg className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: cfg.color }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <a
                href={p.cta === "Contact Sales" ? "/contact" : "/register"}
                className={`block text-center font-semibold py-3 rounded-xl transition-all duration-300 ${
                  p.popular
                    ? "gradient-btn !text-white glow-sm hover:glow-md"
                    : "border-2 border-[rgba(139,92,246,0.4)] text-[var(--text-primary)] hover:bg-[rgba(139,92,246,0.08)] hover:border-[#8B5CF6]"
                }`}
              >
                {p.cta}
              </a>
            </div>
          ))}
        </div>

        {/* Omnichannel upsell */}
        <div className="mt-10 p-6 rounded-2xl border border-[rgba(139,92,246,0.25)] bg-[rgba(139,92,246,0.05)] text-center">
          <div className="text-sm font-bold text-[#8B5CF6] mb-1">
            Want all channels?
          </div>
          <div className="text-lg font-extrabold text-[var(--text-primary)] mb-2">
            Upgrade to Omnichannel for{" "}
            <span className="gradient-text-violet">+A$300/month</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] max-w-lg mx-auto">
            Add Webchat + WhatsApp + Instagram + Messenger on top of any plan.
            One AI platform, four channels, total coverage.
          </p>
        </div>

        {/* Enterprise contact-only tier */}
        <div className="mt-6 p-6 rounded-2xl border border-[rgba(139,92,246,0.2)] bg-transparent flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="text-left">
            <div className="text-sm font-bold text-[var(--text-primary)]">Enterprise</div>
            <p className="mt-1 text-sm text-[var(--text-secondary)] max-w-2xl">
              Above 10,000 conversations/month, multi-brand portfolios, custom SLAs with dedicated
              account manager, custom integrations, SOC 2 / ISO 27001 / data-residency
              requirements. Priced per engagement.
            </p>
          </div>
          <a
            href="/contact"
            className="border-2 border-[rgba(139,92,246,0.5)] text-[var(--text-primary)] font-semibold px-6 py-3 rounded-xl whitespace-nowrap hover:bg-[rgba(139,92,246,0.08)] hover:border-[#8B5CF6] transition-all"
          >
            Contact Sales
          </a>
        </div>

        {/* Extras */}
        <div className="mt-8 text-center text-sm text-[var(--text-muted)] space-y-1.5">
          <p>Prepaid WA packs: 1,000 conversations for A$180</p>
          <p>WhatsApp Business API setup included &middot; Webchat widget free to embed</p>
          <p>Meta Business verification included for Instagram &amp; Messenger plans</p>
          <p>One-time implementation: A$300&ndash;A$900 (includes setup + agent training)</p>
        </div>
      </div>
    </section>
  );
}
