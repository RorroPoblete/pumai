export const homeFaqs: { q: string; a: string }[] = [
  {
    q: "Which channels does PumAI support?",
    a: "PumAI supports Webchat, WhatsApp, Instagram DMs and Facebook Messenger from a single AI platform — with the same AI chatbot powering every channel.",
  },
  {
    q: "How much does an AI chatbot cost in Australia?",
    a: "Plans start at A$99/month for Webchat Starter and scale up to A$899/month for WhatsApp Scale. Enterprise pricing is available for volumes above 10,000 conversations/month. All prices include GST.",
  },
  {
    q: "Do I need technical knowledge to set up PumAI?",
    a: "No. You can configure your AI chatbot — personality, knowledge base and conversation flows — entirely from the dashboard. Most customers go live within minutes.",
  },
  {
    q: "Is PumAI compliant with Australian privacy laws?",
    a: "Yes. PumAI is built for Australian businesses and operates under the Privacy Act 1988 (Cth), the Australian Privacy Principles and the Spam Act 2003.",
  },
  {
    q: "Can the AI chatbot hand off to a human?",
    a: "Yes. The platform detects escalation signals and routes conversations to a human team member when required, with full conversation history preserved.",
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="relative py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-[#8B5CF6] tracking-widest uppercase">
            FAQ
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
            AI chatbot Australia —{" "}
            <span className="gradient-text-violet">common questions</span>
          </h2>
        </div>

        <div className="space-y-4">
          {homeFaqs.map((f) => (
            <details
              key={f.q}
              className="group card-gradient border border-[rgba(139,92,246,0.15)] rounded-xl p-5 hover:border-[rgba(139,92,246,0.4)] transition-colors"
            >
              <summary className="cursor-pointer font-semibold text-[var(--text-primary)] flex items-center justify-between gap-4">
                <span>{f.q}</span>
                <span
                  aria-hidden="true"
                  className="text-[#8B5CF6] flex-shrink-0 group-open:rotate-45 transition-transform text-xl leading-none"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
