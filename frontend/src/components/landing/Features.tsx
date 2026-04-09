const features = [
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
    title: "Conversational AI, Not Rigid Bots",
    description:
      "Powered by GPT-4o Mini, your agent understands context, handles nuance, and responds naturally in English — like a real team member.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
    title: "5 Channels, One Platform",
    description:
      "SMS, WhatsApp, Webchat, Instagram DMs, and Facebook Messenger — all managed from a single dashboard. Meet your customers wherever they are.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Setup in Minutes, No Code",
    description:
      "Connect your business, configure your agent's personality and knowledge base, and go live — all from a simple dashboard.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Real-Time Analytics",
    description:
      "Track conversations, conversion rates, response times, and customer sentiment from your dashboard. Know what's working.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    title: "CRM & Tool Integrations",
    description:
      "Native integrations with HubSpot, Shopify, Xero, Stripe, and Calendly. Sync conversations and data automatically.",
  },
  {
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "24/7 Availability",
    description:
      "Your AI agent never sleeps, never takes a sick day, and handles multiple conversations simultaneously — around the clock.",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-[#8B5CF6] tracking-widest uppercase">
            Features
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Everything you need to automate
            <br className="hidden sm:block" />
            <span className="gradient-text-violet"> customer conversations</span>
          </h2>
          <p className="mt-4 text-lg text-[#A1A1AA] max-w-2xl mx-auto">
            Replace expensive call centres and rigid chatbots with intelligent omnichannel AI agents
            that truly understand your customers.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={i}
              className="card-gradient border border-[rgba(139,92,246,0.15)] rounded-2xl p-8 hover:-translate-y-2 hover:border-[rgba(139,92,246,0.5)] hover:shadow-[0_20px_60px_rgba(139,92,246,0.15)] transition-all duration-400 group"
            >
              <div className="w-14 h-14 rounded-xl bg-[rgba(139,92,246,0.12)] flex items-center justify-center text-[#A78BFA] mb-6 group-hover:bg-[rgba(139,92,246,0.2)] transition-colors">
                {f.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-3">{f.title}</h3>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
