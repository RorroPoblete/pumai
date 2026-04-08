"use client";

import { useState } from "react";

const smsPlans = [
  {
    name: "SMS Starter",
    price: "A$299",
    period: "/month",
    target: "Businesses that need universal reach",
    setup: "A$500 setup fee",
    features: [
      "300 SMS conversations/month",
      "1 AI agent",
      "1 funnel",
      "Basic dashboard",
      "Email support",
      "Extra: A$0.60/conv",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "SMS Growth",
    price: "A$649",
    period: "/month",
    target: "Growing SMEs",
    setup: "A$900 setup fee",
    features: [
      "1,000 SMS conversations/month",
      "3 AI agents",
      "3 funnels",
      "CRM integrations",
      "Advanced analytics",
      "Priority support",
      "Extra: A$0.55/conv",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "SMS Enterprise",
    price: "A$1,499+",
    period: "/month",
    target: "Retail, healthcare, automotive",
    setup: "Custom setup",
    features: [
      "4,000 conversations/month",
      "Unlimited AI agents",
      "Unlimited funnels",
      "Dedicated API",
      "Guaranteed SLA",
      "Account manager",
      "Extra: A$0.45/conv",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const waPlans = [
  {
    name: "WA Starter",
    price: "A$199",
    period: "/month",
    target: "Businesses with young/digital audience",
    setup: "A$500 setup fee",
    features: [
      "500 WhatsApp conversations/month",
      "1 AI agent",
      "1 funnel",
      "Rich media (images, buttons, links)",
      "Basic dashboard",
      "Extra: A$0.25/conv",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "WA Growth",
    price: "A$449",
    period: "/month",
    target: "E-commerce, hospitality, services",
    setup: "A$900 setup fee",
    features: [
      "2,000 WhatsApp conversations/month",
      "3 AI agents",
      "3 funnels",
      "Product catalogues",
      "CRM integrations",
      "Advanced analytics",
      "Priority support",
      "Extra: A$0.20/conv",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "WA Enterprise",
    price: "A$999+",
    period: "/month",
    target: "Retail, e-commerce, multi-location",
    setup: "Custom setup",
    features: [
      "Unlimited conversations",
      "Unlimited AI agents",
      "Unlimited funnels",
      "Dedicated API",
      "Guaranteed SLA",
      "Account manager",
      "WA marketing outbound",
      "Extra: A$0.15/conv",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  const [channel, setChannel] = useState<"sms" | "wa">("sms");
  const plans = channel === "sms" ? smsPlans : waPlans;
  const accent = channel === "sms" ? "#22c55e" : "#3b82f6";
  const accentBg = channel === "sms" ? "rgba(34,197,94," : "rgba(59,130,246,";

  return (
    <section id="pricing" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-[#8B5CF6] tracking-widest uppercase">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Two channels,{" "}
            <span className="gradient-text-violet">one platform</span>
          </h2>
          <p className="mt-4 text-lg text-[#A1A1AA] max-w-xl mx-auto">
            Choose SMS for universal reach, WhatsApp for rich conversations, or
            go Omnichannel for both.
          </p>
        </div>

        {/* Channel toggle */}
        <div className="flex items-center justify-center gap-2 mb-12">
          <button
            onClick={() => setChannel("sms")}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              channel === "sms"
                ? "bg-[rgba(34,197,94,0.15)] text-[#22c55e] border-2 border-[#22c55e] shadow-[0_0_20px_rgba(34,197,94,0.15)]"
                : "border-2 border-[rgba(255,255,255,0.1)] text-[#71717A] hover:border-[rgba(255,255,255,0.2)]"
            }`}
          >
            <svg className="w-4 h-4 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            SMS Plans
          </button>
          <button
            onClick={() => setChannel("wa")}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
              channel === "wa"
                ? "bg-[rgba(59,130,246,0.15)] text-[#3b82f6] border-2 border-[#3b82f6] shadow-[0_0_20px_rgba(59,130,246,0.15)]"
                : "border-2 border-[rgba(255,255,255,0.1)] text-[#71717A] hover:border-[rgba(255,255,255,0.2)]"
            }`}
          >
            <svg className="w-4 h-4 mr-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            WhatsApp Plans
          </button>
        </div>

        {/* Channel subtitle */}
        <p className="text-center text-sm font-medium mb-8" style={{ color: accent }}>
          {channel === "sms"
            ? "Universal reach — 98% open rate, every Australian mobile"
            : "Rich conversations — buttons, images, catalogues, payment links"}
        </p>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((p, i) => (
            <div
              key={`${channel}-${i}`}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                p.popular
                  ? `border-2 shadow-[0_0_40px_${accentBg}0.2)]`
                  : "card-gradient border border-[rgba(139,92,246,0.15)] hover:border-[rgba(139,92,246,0.4)]"
              }`}
              style={
                p.popular
                  ? {
                      background: `${accentBg}0.08)`,
                      borderColor: accent,
                    }
                  : undefined
              }
            >
              {p.popular && (
                <div
                  className="absolute -top-3 right-6 text-xs font-bold px-3 py-1 rounded-md"
                  style={{
                    background: accent,
                    color: channel === "sms" ? "#000" : "#fff",
                  }}
                >
                  MOST POPULAR
                </div>
              )}

              <div className="text-sm font-semibold text-[#A1A1AA] mb-1">
                {p.name}
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-black text-white">
                  {p.price}
                </span>
                <span className="text-[#71717A] text-sm">{p.period}</span>
              </div>
              <div className="text-xs text-[#71717A] mb-2">{p.target}</div>
              <div className="text-xs font-medium mb-6" style={{ color: accent }}>
                {p.setup}
              </div>

              <ul className="space-y-3 mb-8">
                {p.features.map((f, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-3 text-sm text-[#A1A1AA]"
                  >
                    <svg
                      className="w-4 h-4 mt-0.5 flex-shrink-0"
                      style={{ color: accent }}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
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
            Want both channels?
          </div>
          <div className="text-lg font-extrabold text-white mb-2">
            Upgrade to Omnichannel for{" "}
            <span className="gradient-text-violet">+A$200/month</span>
          </div>
          <p className="text-sm text-[#A1A1AA] max-w-lg mx-auto">
            Add SMS + WhatsApp access on top of any plan. One AI platform, two
            channels, full coverage.
          </p>
        </div>

        {/* Extras */}
        <div className="mt-8 text-center text-sm text-[#71717A] space-y-1.5">
          <p>Prepaid SMS packs: 500 conversations for A$275 &middot; Prepaid WA packs: 1,000 conversations for A$180</p>
          <p>Dedicated virtual SMS number: A$15/month &middot; WhatsApp Business API setup included in implementation</p>
          <p>One-time implementation: A$500&ndash;A$900 (includes setup + agent training)</p>
        </div>
      </div>
    </section>
  );
}
