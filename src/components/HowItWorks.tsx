const steps = [
  {
    step: "01",
    title: "Connect Your Business",
    description:
      "Sign up and connect your existing tools — CRM, calendar, e-commerce. We assign you a dedicated Australian virtual number.",
  },
  {
    step: "02",
    title: "Configure Your AI Agent",
    description:
      "Set your agent's personality, knowledge base, and conversation flows. Train it on your FAQs, products, and policies.",
  },
  {
    step: "03",
    title: "Go Live in Minutes",
    description:
      "Your AI agent starts handling inbound and outbound SMS conversations — qualifying leads, booking appointments, answering questions.",
  },
  {
    step: "04",
    title: "Monitor & Optimise",
    description:
      "Track performance in real time. Review conversations, refine responses, and watch your conversion rates climb.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 px-6"
      style={{
        background:
          "linear-gradient(180deg, transparent 0%, rgba(139,92,246,0.03) 50%, transparent 100%)",
      }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-xs font-semibold text-[#8B5CF6] tracking-widest uppercase">
            How It Works
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            Live in <span className="gradient-text-violet">four simple steps</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[#8B5CF6] via-[rgba(139,92,246,0.3)] to-transparent hidden md:block" />

          <div className="space-y-12">
            {steps.map((s, i) => (
              <div key={i} className="flex gap-6 md:gap-10 items-start">
                {/* Step number */}
                <div className="relative flex-shrink-0 w-12 h-12 rounded-full bg-[rgba(139,92,246,0.15)] border border-[rgba(139,92,246,0.4)] flex items-center justify-center">
                  <span className="text-sm font-bold text-[#A78BFA]">
                    {s.step}
                  </span>
                </div>

                {/* Content */}
                <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-2xl p-6 sm:p-8 flex-1 hover:border-[rgba(139,92,246,0.3)] transition-colors duration-300">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-[#A1A1AA] leading-relaxed">
                    {s.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
