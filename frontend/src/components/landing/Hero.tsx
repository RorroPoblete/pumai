import Particles from "./Particles";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden gradient-hero">
      {/* Particles */}
      <Particles />
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[rgba(139,92,246,0.08)] blur-[120px] pointer-events-none" />

      <div className="relative z-10 text-center max-w-4xl mx-auto px-6 pt-32 pb-20">
        {/* Badge */}
        <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.08)] mb-8">
          <span className="text-xs font-semibold text-[#8B5CF6] tracking-wide uppercase">
            Built for Australian Business
          </span>
        </div>

        {/* Headline */}
        <h1 className="animate-fade-in-up-delay-1 text-5xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] leading-[1.1] mb-6">
          <span className="gradient-text">Your AI Sales &</span>
          <br />
          <span className="gradient-text">Support Team,</span>
          <br />
          <span className="text-[#8B5CF6]">on Every Channel</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up-delay-2 text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-10 leading-relaxed">
          AI-powered agents that handle sales, support, and marketing 24/7 — via WhatsApp, Webchat, Instagram DMs, and Facebook Messenger. One platform, every conversation.
        </p>

        {/* CTAs */}
        <div className="animate-fade-in-up-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/register"
            className="gradient-btn !text-white font-semibold text-lg px-8 py-4 rounded-xl glow-sm hover:glow-md hover:-translate-y-0.5 transition-all duration-300"
          >
            Get Started
          </a>
          <a
            href="#how-it-works"
            className="text-[var(--text-primary)] font-semibold text-lg px-8 py-4 rounded-xl border-2 border-[rgba(139,92,246,0.4)] hover:border-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)] transition-all duration-300"
          >
            See How It Works
          </a>
        </div>

        {/* Stats row */}
        <div className="animate-fade-in-up-delay-3 mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto">
          {[
            { value: "24/7", label: "Always On" },
            { value: "2.5M+", label: "SMEs in Australia" },
            { value: "4", label: "Channels, One Platform" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-black gradient-text-violet">
                {s.value}
              </div>
              <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
