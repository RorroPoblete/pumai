"use client";

import { useMemo, useState, useTransition } from "react";
import { createCartCheckoutSession, createAddonCheckoutSession, createBillingPortal } from "@/server/billing-actions";
import { CHANNEL_CATALOG, CHANNEL_KEYS, PAID_TIERS, BUNDLE_SETUP_FEE, computeSetupFee, type ChannelKey, type PaidTier, type PlanTier } from "@/lib/stripe";

interface ChannelAccess {
  channel: ChannelKey;
  tier: PlanTier;
  status: string | null;
  allowed: boolean;
  conversationsUsed: number;
  conversationsLimit: number | null;
  atLimit: boolean;
  reason: string;
}

interface Props {
  stripeCustomerId: string | null;
  channels: ChannelAccess[];
  success?: boolean;
  cancelled?: boolean;
  successChannel?: string | null;
}

type CartState = Partial<Record<ChannelKey, PaidTier>>;

function formatLimit(v: number | null): string {
  return v === null ? "Unlimited" : `${v.toLocaleString()}/mo`;
}

export default function BillingClient({ stripeCustomerId, channels, success, cancelled, successChannel }: Props) {
  const [, startTransition] = useTransition();
  const [loading, setLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [step, setStep] = useState<"select" | "summary">("select");
  const [cart, setCart] = useState<CartState>({});

  const hasAnySub = channels.some((c) => c.tier !== "FREE" && (c.status === "active" || c.status === "trialing"));

  const cartItems = useMemo(() => {
    return (Object.entries(cart) as [ChannelKey, PaidTier][])
      .filter(([, tier]) => tier)
      .map(([channel, tier]) => {
        const catalog = CHANNEL_CATALOG[channel];
        const cfg = catalog.tiers[tier];
        return { channel, tier, label: catalog.label, tierLabel: cfg.label, price: cfg.price, setupFee: cfg.setupFee, conversationsLimit: cfg.conversationsLimit, color: catalog.color };
      });
  }, [cart]);

  const totals = useMemo(() => {
    const monthly = cartItems.reduce((s, i) => s + i.price, 0);
    const setup = computeSetupFee(cartItems.map(({ channel, tier }) => ({ channel, tier })));
    const isBundle = cartItems.length >= 2;
    return { monthly, setup, isBundle };
  }, [cartItems]);

  function toggleCart(channel: ChannelKey, tier: PaidTier) {
    setCart((prev) => {
      const next = { ...prev };
      if (next[channel] === tier) delete next[channel];
      else next[channel] = tier;
      return next;
    });
  }

  function checkout() {
    if (!cartItems.length) return;
    setLoading("cart");
    startTransition(async () => {
      try {
        const { url } = await createCartCheckoutSession(
          cartItems.map(({ channel, tier }) => ({ channel, tier })),
        );
        window.location.href = url;
      } catch (err) {
        console.error(err);
        setLoading(null);
      }
    });
  }

  function addOn(channel: ChannelKey) {
    const key = `${channel}:ADDON`;
    setLoading(key);
    startTransition(async () => {
      try {
        const { url } = await createAddonCheckoutSession(channel);
        window.location.href = url;
      } catch (err) {
        console.error(err);
        setLoading(null);
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

  if (step === "summary") {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setStep("select")}
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
        >
          ← Back to selection
        </button>

        <h2 className="text-lg font-semibold text-[var(--text-primary)]">Review your order</h2>

        <div className="card-gradient border border-[var(--border-subtle)] rounded-2xl divide-y divide-[var(--border-subtle)]">
          {cartItems.map((item) => (
            <div key={item.channel} className="p-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</span>
                  <span
                    className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: `${item.color}22`, color: item.color }}
                  >
                    {item.tierLabel}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">{formatLimit(item.conversationsLimit)}</p>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-semibold text-[var(--text-primary)]">A${item.price}/mo</div>
                {!totals.isBundle && item.setupFee > 0 && (
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">A${item.setupFee} setup</div>
                )}
                {totals.isBundle && item.setupFee > 0 && (
                  <div className="text-xs text-[var(--text-muted)] mt-0.5 line-through">A${item.setupFee} setup</div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card-gradient border border-[var(--border-subtle)] rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-secondary)]">Monthly subscription</span>
            <span className="text-sm font-semibold text-[var(--text-primary)]">A${totals.monthly}/mo</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-[var(--text-secondary)]">Setup fees (one-time)</span>
              {totals.isBundle && (
                <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">
                  Omnichannel bundle · flat A${BUNDLE_SETUP_FEE} instead of A${cartItems.reduce((s, i) => s + i.setupFee, 0)}
                </div>
              )}
            </div>
            <span className="text-sm font-semibold text-[var(--text-primary)]">A${totals.setup}</span>
          </div>
          <div className="h-px bg-[var(--border-subtle)]" />
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-[var(--text-secondary)]">First invoice total</span>
            <span className="text-xl font-bold text-[var(--text-primary)]">A${totals.monthly + totals.setup}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Then A${totals.monthly}/mo recurring. Cancel anytime via the billing portal.
          </p>
        </div>

        <button
          onClick={checkout}
          disabled={loading !== null}
          className="w-full gradient-btn !text-white font-semibold py-3 rounded-xl glow-sm hover:glow-md transition-all disabled:opacity-60"
        >
          {loading === "cart" ? "Redirecting to Stripe..." : "Continue to Stripe →"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {success && (
        <div className="card-gradient border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm text-emerald-400">
            {successChannel ? `${CHANNEL_CATALOG[successChannel as ChannelKey]?.label ?? successChannel} activated.` : "Subscription activated successfully!"}
          </p>
        </div>
      )}

      {cancelled && (
        <div className="card-gradient border border-amber-500/20 rounded-2xl p-4 flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <p className="text-sm text-amber-400">Payment cancelled. No charges were made.</p>
        </div>
      )}

      {hasAnySub && stripeCustomerId && (
        <div className="flex justify-end">
          <button
            onClick={managePortal}
            disabled={portalLoading}
            className="px-4 py-2 rounded-xl text-sm font-medium border border-[var(--border-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[rgba(139,92,246,0.4)] transition-all"
          >
            {portalLoading ? "Loading..." : "Manage billing portal"}
          </button>
        </div>
      )}

      <div className="space-y-8 pb-32">
        {CHANNEL_KEYS.map((channelKey) => {
          const access = channels.find((c) => c.channel === channelKey);
          if (!access) return null;
          const catalog = CHANNEL_CATALOG[channelKey];
          const isPaid = access.tier !== "FREE" && (access.status === "active" || access.status === "trialing");
          const isPastDue = access.status === "past_due" || access.status === "unpaid";

          return (
            <section key={channelKey} className="card-gradient border rounded-2xl overflow-hidden" style={{ borderColor: isPaid ? `${catalog.color}66` : "var(--border-subtle)" }}>
              <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap" style={{ backgroundColor: `${catalog.color}12` }}>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-[var(--text-primary)]">{catalog.label}</h2>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: isPaid ? `${catalog.color}22` : "rgba(113,113,122,0.15)",
                        color: isPaid ? catalog.color : "var(--text-muted)",
                      }}
                    >
                      {isPaid ? access.tier : isPastDue ? "Past due" : catalog.free ? "Free" : "Locked"}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{catalog.subtitle}</p>
                </div>
                {access.tier !== "FREE" && access.conversationsLimit !== null && (
                  <div className="text-xs text-[var(--text-muted)]">
                    {access.conversationsUsed.toLocaleString()} / {access.conversationsLimit.toLocaleString()} conversations this month
                  </div>
                )}
                {access.tier === "FREE" && catalog.free && (
                  <div className="text-xs text-[var(--text-muted)]">
                    {access.conversationsUsed} / {catalog.free.conversationsLimit} free conversations this month
                  </div>
                )}
              </div>

              {hasAnySub && !isPaid ? (
                <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-2xl font-bold text-[var(--text-primary)]">A${catalog.addon.price}</span>
                      <span className="text-xs text-[var(--text-muted)]">/mo · omnichannel add-on</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {catalog.addon.conversationsLimit.toLocaleString()} conversations/month · no setup fee
                    </p>
                  </div>
                  <button
                    onClick={() => addOn(channelKey)}
                    disabled={loading !== null}
                    className="gradient-btn !text-white text-xs font-semibold px-5 py-2.5 rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    {loading === `${channelKey}:ADDON` ? "Loading..." : "Add channel →"}
                  </button>
                </div>
              ) : (
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {PAID_TIERS.map((tier) => {
                    const cfg = catalog.tiers[tier];
                    const isCurrent = access.tier === tier && isPaid;
                    const isPopular = tier === "GROWTH";
                    const isSelected = cart[channelKey] === tier;

                    return (
                      <div
                        key={tier}
                        className={`relative rounded-xl p-5 flex flex-col border-2 transition-all ${
                          isCurrent
                            ? "border-[rgba(139,92,246,0.5)]"
                            : isSelected
                            ? "border-[#8B5CF6]"
                            : isPopular
                            ? "border-[rgba(139,92,246,0.3)]"
                            : "border-[var(--border-subtle)]"
                        }`}
                      >
                        {isCurrent && (
                          <div className="absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[rgba(139,92,246,0.2)] text-[#8B5CF6] border border-[rgba(139,92,246,0.4)]">
                            Current
                          </div>
                        )}
                        {isPopular && !isCurrent && !isSelected && (
                          <div className="absolute -top-2 left-3 px-2 py-0.5 text-[10px] font-semibold rounded-full gradient-btn text-white">
                            Popular
                          </div>
                        )}
                        {isSelected && (
                          <div className="absolute -top-2 right-3 w-5 h-5 rounded-full flex items-center justify-center bg-[#8B5CF6]">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className="text-2xl font-bold text-[var(--text-primary)]">A${cfg.price}</span>
                          <span className="text-xs text-[var(--text-muted)]">/mo</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] mb-3">{cfg.label}</div>
                        <div className="text-xs text-[var(--text-secondary)] mb-4 space-y-1">
                          <div>· {formatLimit(cfg.conversationsLimit)}</div>
                          {cfg.setupFee > 0 && <div>· A${cfg.setupFee} one-time setup</div>}
                        </div>
                        {isCurrent ? (
                          <div className="mt-auto w-full py-2 rounded-lg text-xs font-medium text-center text-[var(--text-muted)] border border-[var(--border-subtle)]">
                            Active
                          </div>
                        ) : (
                          <button
                            onClick={() => toggleCart(channelKey, tier)}
                            className={`mt-auto w-full py-2 rounded-lg text-xs font-semibold transition-all ${
                              isSelected
                                ? "bg-[#8B5CF6] text-white hover:opacity-90"
                                : isPopular
                                ? "gradient-btn text-white hover:opacity-90"
                                : "border border-[rgba(139,92,246,0.4)] text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)]"
                            }`}
                          >
                            {isSelected ? "Selected ✓" : "Select"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {cartItems.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 border-t border-[var(--border-subtle)] bg-[rgba(9,9,11,0.95)] backdrop-blur-xl lg:ml-60">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex flex-wrap gap-2 flex-1 min-w-0">
              {cartItems.map((i) => (
                <div
                  key={i.channel}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border"
                  style={{ borderColor: i.color, color: i.color, backgroundColor: `${i.color}15` }}
                >
                  {i.label} {i.tierLabel}
                  <button onClick={() => toggleCart(i.channel, i.tier)} className="ml-1 hover:opacity-70">×</button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-xs text-[var(--text-muted)]">
                  A${totals.monthly}/mo {totals.setup > 0 && `+ A$${totals.setup} setup${totals.isBundle ? " bundle" : ""}`}
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)]">
                  {cartItems.length} {cartItems.length === 1 ? "channel" : "channels"}
                </div>
              </div>
              <button
                onClick={() => setStep("summary")}
                className="gradient-btn !text-white text-sm font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-all"
              >
                Review order →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
