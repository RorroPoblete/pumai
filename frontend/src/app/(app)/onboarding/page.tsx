"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { completeOnboarding } from "@/backend/actions";

const industries = [
  "Healthcare",
  "Automotive",
  "Real Estate",
  "E-commerce & Retail",
  "Trades & Services",
  "Hospitality",
  "Education",
  "Other",
];

const TOTAL_STEPS = 3;

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    businessName: "",
    industry: "",
    website: "",
    agentName: "",
    agentTone: "professional",
    phone: "",
  });

  function update(field: string, value: string) {
    setData((prev) => ({ ...prev, [field]: value }));
  }

  function next() {
    if (step < TOTAL_STEPS) setStep(step + 1);
  }

  function back() {
    if (step > 1) setStep(step - 1);
  }

  const [pending, startTransition] = useTransition();
  const { update: refreshSession } = useSession();

  function finish() {
    startTransition(async () => {
      const { destination } = await completeOnboarding(data);
      await refreshSession();
      window.location.href = destination;
    });
  }

  return (
    <div className="min-h-screen gradient-hero flex flex-col">
      {/* Header */}
      <div className="px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="PumAI" width={32} height={32} className="rounded-lg" />
          <span className="text-lg font-bold text-[var(--text-primary)]">
            Pum<span className="text-[#8B5CF6]">AI</span>
          </span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          Step {step} of {TOTAL_STEPS}
        </span>
      </div>

      {/* Progress bar */}
      <div className="px-6">
        <div className="h-1 rounded-full bg-[var(--bg-hover)] overflow-hidden">
          <div
            className="h-full gradient-btn rounded-full transition-all duration-500 ease-out"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Step 1: Business Info */}
          {step === 1 && (
            <div className="animate-fade-in-up">
              <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">
                Tell us about your business
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-8">
                This helps us configure your AI agent for your industry.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Business name
                  </label>
                  <input
                    type="text"
                    value={data.businessName}
                    onChange={(e) => update("businessName", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
                    placeholder="Acme Pty Ltd"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Website (optional)
                  </label>
                  <input
                    type="url"
                    value={data.website}
                    onChange={(e) => update("website", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
                    placeholder="https://yoursite.com.au"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Industry */}
          {step === 2 && (
            <div className="animate-fade-in-up">
              <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">
                What industry are you in?
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-8">
                We&apos;ll pre-configure conversation templates for your vertical.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {industries.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => update("industry", ind)}
                    className={`p-4 rounded-xl border text-sm font-medium text-left transition-all duration-200 ${
                      data.industry === ind
                        ? "border-[#8B5CF6] bg-[rgba(139,92,246,0.12)] text-[var(--text-primary)]"
                        : "border-[var(--border-input)] bg-[var(--bg-input)] text-[var(--text-secondary)] hover:border-[rgba(139,92,246,0.3)] hover:bg-[rgba(139,92,246,0.05)]"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Agent Config */}
          {step === 3 && (
            <div className="animate-fade-in-up">
              <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">
                Configure your first AI agent
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-8">
                Give your agent a name and personality. You can change this later.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                    Agent name
                  </label>
                  <input
                    type="text"
                    value={data.agentName}
                    onChange={(e) => update("agentName", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
                    placeholder="e.g. Sam, Reception Bot, Support"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-3">
                    Conversation tone
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "professional", label: "Professional", desc: "Formal & polished" },
                      { value: "friendly", label: "Friendly", desc: "Warm & approachable" },
                      { value: "casual", label: "Casual", desc: "Relaxed & laid-back" },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => update("agentTone", t.value)}
                        className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                          data.agentTone === t.value
                            ? "border-[#8B5CF6] bg-[rgba(139,92,246,0.12)]"
                            : "border-[var(--border-input)] bg-[var(--bg-input)] hover:border-[rgba(139,92,246,0.3)]"
                        }`}
                      >
                        <div className="text-sm font-semibold text-[var(--text-primary)]">{t.label}</div>
                        <div className="text-xs text-[var(--text-muted)] mt-1">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            {step > 1 ? (
              <button
                onClick={back}
                className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                &larr; Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                onClick={next}
                className="gradient-btn !text-white font-semibold px-8 py-3 rounded-xl glow-sm hover:glow-md transition-all duration-300"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={finish}
                disabled={pending}
                className="gradient-btn !text-white font-semibold px-8 py-3 rounded-xl glow-sm hover:glow-md transition-all duration-300 disabled:opacity-50"
              >
                {pending ? "Setting up..." : "Launch Dashboard \u2192"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
