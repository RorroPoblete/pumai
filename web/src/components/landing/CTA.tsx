export default function CTA() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        {/* Glow background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[500px] h-[300px] rounded-full bg-[rgba(139,92,246,0.1)] blur-[100px]" />
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] mb-6">
            Ready to put your business
            <br />
            <span className="gradient-text-violet">on autopilot?</span>
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-10">
            Join Australian businesses already using AI-powered Webchat, WhatsApp &amp; social agents
            to close more deals, support more customers, and work less.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/register"
              className="gradient-btn !text-white font-semibold text-lg px-8 py-4 rounded-xl glow-sm hover:glow-md hover:-translate-y-0.5 transition-all duration-300"
            >
              Get Started Today
            </a>
            <a
              href="#"
              className="text-[var(--text-secondary)] font-semibold text-lg hover:text-[var(--text-primary)] transition-colors duration-300"
            >
              Book a Demo &rarr;
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
