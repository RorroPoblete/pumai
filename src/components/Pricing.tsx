const plans = [
  {
    name: "Starter",
    price: "A$299",
    period: "/month",
    target: "Small local businesses",
    setup: "A$500 setup fee",
    features: [
      "500 SMS conversations/month",
      "1 AI agent",
      "1 funnel",
      "Basic dashboard",
      "Email support",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Growth",
    price: "A$649",
    period: "/month",
    target: "Growing SMEs",
    setup: "A$900 setup fee",
    features: [
      "1,500 conversations/month",
      "3 custom AI agents",
      "3 funnels",
      "CRM integrations",
      "Advanced analytics",
      "Priority support",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "A$1,499+",
    period: "/month",
    target: "Retail, healthcare, automotive",
    setup: "Custom setup",
    features: [
      "Unlimited conversations",
      "Unlimited AI agents",
      "Unlimited funnels",
      "Dedicated API",
      "Guaranteed SLA",
      "Account manager",
      "Custom integrations",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-[#8B5CF6] tracking-widest uppercase">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Simple, transparent{" "}
            <span className="gradient-text-violet">pricing</span>
          </h2>
          <p className="mt-4 text-lg text-[#A1A1AA] max-w-xl mx-auto">
            Scale as you grow. No hidden fees. Cancel anytime.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((p, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-2 ${
                p.popular
                  ? "bg-[rgba(139,92,246,0.08)] border-2 border-[#8B5CF6] shadow-[0_0_40px_rgba(139,92,246,0.2)]"
                  : "card-gradient border border-[rgba(139,92,246,0.15)] hover:border-[rgba(139,92,246,0.4)]"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 right-6 bg-[#8B5CF6] text-black text-xs font-bold px-3 py-1 rounded-md">
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
              <div className="text-xs text-[#A78BFA] font-medium mb-6">{p.setup}</div>

              <ul className="space-y-3 mb-8">
                {p.features.map((f, j) => (
                  <li
                    key={j}
                    className="flex items-start gap-3 text-sm text-[#A1A1AA]"
                  >
                    <svg
                      className="w-4 h-4 mt-0.5 text-[#8B5CF6] flex-shrink-0"
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

        {/* Extras */}
        <div className="mt-12 text-center text-sm text-[#71717A]">
          <p>
            Extra conversations: A$0.60/conversation (~6 SMS) &middot; AI tokens included per conversation &middot; Dedicated virtual number: A$15/month
          </p>
        </div>
      </div>
    </section>
  );
}
