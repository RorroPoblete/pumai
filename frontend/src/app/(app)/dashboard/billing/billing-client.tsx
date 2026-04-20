"use client";

import { useState, useTransition } from "react";
import { createCheckoutSession, createBillingPortal } from "@/backend/billing-actions";
import type { PlanKey } from "@/lib/stripe";
import { PLANS } from "@/lib/stripe";

interface BillingClientProps {
  plan: PlanKey;
  planName: string;
  price: number;
  conversationsLimit: number | null;
  conversationsUsed: number;
  usagePercent: number;
  stripeCustomerId: string | null;
  stripeStatus: string | null;
  success?: boolean;
}

const PLAN_FEATURES: Record<PlanKey, string[]> = {
  STARTER: ["500 conversations/month", "1 AI agent", "All 4 channels", "Email support"],
  GROWTH: ["2,000 conversations/month", "5 AI agents", "All 4 channels", "Priority support", "Analytics"],
  ENTERPRISE: ["Unlimited conversations", "Unlimited agents", "All 4 channels", "Dedicated support", "Analytics", "Custom integrations"],
};

export default function BillingClient({
  plan,
  planName,
  price,
  conversationsLimit,
  conversationsUsed,
  usagePercent,
  stripeCustomerId,
  stripeStatus,
  success,
}: BillingClientProps) {
  const [, startTransition] = useTransition();
  const [loadingPlan, setLoadingPlan] = useState<PlanKey | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  function upgrade(targetPlan: PlanKey) {
    setLoadingPlan(targetPlan);
    startTransition(async () => {
      try {
        const { url } = await createCheckoutSession(targetPlan);
        window.location.href = url;
      } catch {
        setLoadingPlan(null);
      }
    });
  }

  function managePortal() {
    setPortalLoading(true);
    startTransition(async () => {
      try {
        const { url } = await createBillingPortal();
        window.location.href = url;
      } catch {
        setPortalLoading(false);
      }
    });
  }

  const isSubscribed = !!stripeCustomerId && stripeStatus === "active";

  return (
    <div className="space-y-8">
      {success && (
        <div className="card-gradient border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-emerald-400">Subscription activated successfully!</p>
        </div>
      )}

      {/* Current plan */}
      <section className="card-gradient border border-[var(--border-subtle)] rounded-2xl p-6">
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Current Plan</h2>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{planName}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-[rgba(139,92,246,0.15)] text-[#8B5CF6]">
                {isSubscribed ? "Active" : "Free tier"}
              </span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              A${price}/month · {conversationsLimit ? `${conversationsLimit} conversations` : "Unlimited conversations"}
            </p>
          </div>
          {isSubscribed && (
            <button
              onClick={managePortal}
              disabled={portalLoading}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[rgba(139,92,246,0.4)] transition-all"
            >
              {portalLoading ? "Loading..." : "Manage Billing"}
            </button>
          )}
        </div>

        {/* Usage bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-[var(--text-muted)] mb-2">
            <span>Conversations this month</span>
            <span>{conversationsUsed} / {conversationsLimit ?? "∞"}</span>
          </div>
          <div className="h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
            {conversationsLimit && (
              <div
                className={`h-full rounded-full transition-all ${usagePercent >= 90 ? "bg-red-500" : "gradient-btn"}`}
                style={{ width: `${usagePercent}%` }}
              />
            )}
          </div>
          {conversationsLimit && usagePercent >= 80 && (
            <p className="text-xs text-amber-400 mt-2">
              {usagePercent >= 100 ? "Limit reached — upgrade to keep responding." : `${Math.round(usagePercent)}% used — consider upgrading soon.`}
            </p>
          )}
        </div>
      </section>

      {/* Plan cards */}
      <section>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(Object.keys(PLANS) as PlanKey[]).map((key) => {
            const p = PLANS[key];
            const isCurrent = key === plan;
            const isPopular = key === "GROWTH";

            return (
              <div
                key={key}
                className={`relative card-gradient border rounded-2xl p-6 flex flex-col ${
                  isCurrent
                    ? "border-[rgba(139,92,246,0.5)]"
                    : isPopular
                    ? "border-[rgba(139,92,246,0.3)]"
                    : "border-[var(--border-subtle)]"
                }`}
              >
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold gradient-btn text-white">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-xs font-semibold bg-[rgba(139,92,246,0.2)] text-[#8B5CF6] border border-[rgba(139,92,246,0.4)]">
                    Current
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-base font-semibold text-[var(--text-primary)]">{p.name}</h3>
                  <div className="flex items-end gap-1 mt-1">
                    <span className="text-3xl font-bold text-[var(--text-primary)]">A${p.price}</span>
                    <span className="text-sm text-[var(--text-muted)] mb-1">/month</span>
                  </div>
                </div>

                <ul className="space-y-2 flex-1 mb-6">
                  {PLAN_FEATURES[key].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                      <svg className="w-4 h-4 text-[#8B5CF6] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full py-2 rounded-xl text-sm font-medium text-center text-[var(--text-muted)] border border-[var(--border-subtle)]">
                    Current plan
                  </div>
                ) : (
                  <button
                    onClick={() => upgrade(key)}
                    disabled={loadingPlan !== null}
                    className={`w-full py-2 rounded-xl text-sm font-medium transition-all ${
                      isPopular
                        ? "gradient-btn text-white hover:opacity-90"
                        : "border border-[rgba(139,92,246,0.4)] text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)]"
                    } disabled:opacity-50`}
                  >
                    {loadingPlan === key ? "Loading..." : `Upgrade to ${p.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
