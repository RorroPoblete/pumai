import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex gradient-hero">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12">
        {/* Ambient glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[rgba(139,92,246,0.1)] blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/logo.png"
              alt="PumAI"
              width={44}
              height={44}
              className="rounded-xl"
            />
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              Pum<span className="text-[#8B5CF6]">AI</span>
            </span>
          </div>

          <h2 className="text-3xl font-extrabold text-[var(--text-primary)] leading-tight mb-4">
            Your AI sales & support team,{" "}
            <span className="gradient-text-violet">via SMS</span>
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            AI-powered conversational agents that handle sales, support, and
            marketing for Australian businesses — 24/7 over SMS.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-6">
            {[
              { value: "98%", label: "Open Rate" },
              { value: "24/7", label: "Availability" },
              { value: "60%", label: "Cost Reduction" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-xl font-black gradient-text-violet">{s.value}</div>
                <div className="text-xs text-[var(--text-muted)] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
