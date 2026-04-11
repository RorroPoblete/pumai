"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePlatformConfigs, adminConnectChannel, adminDisconnectChannel, adminToggleChannel } from "@/backend/admin-actions";

interface AdminChannelView {
  id: string;
  channel: string;
  active: boolean;
  externalId: string;
  agentId: string;
  agentName: string;
  businessId: string;
  businessName: string;
}

interface BusinessAgent {
  businessId: string;
  businessName: string;
  agents: { id: string; name: string }[];
}

const inputClass = "w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6]";

const channelColors: Record<string, { bg: string; text: string }> = {
  MESSENGER: { bg: "rgba(66,133,244,0.12)", text: "#4285F4" },
  INSTAGRAM: { bg: "rgba(225,48,108,0.12)", text: "#E1306C" },
  WEBCHAT: { bg: "rgba(139,92,246,0.12)", text: "#8B5CF6" },
  WHATSAPP: { bg: "rgba(37,211,102,0.12)", text: "#25D366" },
  SMS: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
};

export default function PlatformSettings({
  configs,
  channels,
  businesses,
}: {
  configs: Record<string, string>;
  channels: AdminChannelView[];
  businesses: BusinessAgent[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Meta credentials
  const [metaAppSecret, setMetaAppSecret] = useState(configs.META_APP_SECRET ?? "");
  const [metaVerifyToken, setMetaVerifyToken] = useState(configs.META_WEBHOOK_VERIFY_TOKEN ?? "");
  const [metaSaved, setMetaSaved] = useState(false);

  // Channel connect form
  const [showConnect, setShowConnect] = useState(false);
  const [form, setForm] = useState({ businessId: "", channel: "MESSENGER", externalId: "", credentials: "", agentId: "" });
  const [error, setError] = useState("");

  const selectedBiz = businesses.find((b) => b.businessId === form.businessId);

  function handleSaveMeta() {
    setMetaSaved(false);
    startTransition(async () => {
      await savePlatformConfigs([
        { key: "META_APP_SECRET", value: metaAppSecret },
        { key: "META_WEBHOOK_VERIFY_TOKEN", value: metaVerifyToken },
      ]);
      setMetaSaved(true);
      router.refresh();
    });
  }

  function handleConnect() {
    if (!form.businessId || !form.externalId || !form.credentials || !form.agentId) {
      setError("All fields are required");
      return;
    }
    setError("");

    const creds = form.channel === "MESSENGER"
      ? JSON.stringify({ pageAccessToken: form.credentials })
      : form.credentials;

    startTransition(async () => {
      await adminConnectChannel(form.businessId, form.channel, form.externalId, creds, form.agentId);
      setShowConnect(false);
      setForm({ businessId: "", channel: "MESSENGER", externalId: "", credentials: "", agentId: "" });
      router.refresh();
    });
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Meta API Credentials */}
      <div className="card-gradient border border-[rgba(239,68,68,0.1)] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Meta API Credentials</h2>
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[rgba(239,68,68,0.12)] text-[#ef4444]">Superadmin</span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          These credentials are shared across all tenants. Get them from{" "}
          <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-[#8B5CF6] hover:underline">
            Meta Developer Console
          </a>.
        </p>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Webhook URL (copy to Meta)</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value="https://YOUR_DOMAIN/api/webhooks/meta"
                className={`${inputClass} text-[var(--text-muted)] cursor-text`}
              />
              <button
                onClick={() => navigator.clipboard.writeText(window.location.origin + "/api/webhooks/meta")}
                className="px-3 py-2 rounded-lg text-xs font-medium bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all whitespace-nowrap"
              >
                Copy URL
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">App Secret</label>
            <input
              type="password"
              value={metaAppSecret}
              onChange={(e) => setMetaAppSecret(e.target.value)}
              placeholder="From App Settings → Basic"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Webhook Verify Token</label>
            <input
              type="text"
              value={metaVerifyToken}
              onChange={(e) => setMetaVerifyToken(e.target.value)}
              placeholder="Arbitrary string (must match Meta config)"
              className={inputClass}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveMeta}
              disabled={pending}
              className="gradient-btn !text-white text-sm font-semibold px-6 py-2.5 rounded-xl glow-sm hover:glow-md transition-all disabled:opacity-50"
            >
              {pending ? "Saving..." : "Save Meta Credentials"}
            </button>
            {metaSaved && <span className="text-xs text-[#22c55e] font-medium">Saved</span>}
          </div>
        </div>
      </div>

      {/* Connected Channels */}
      <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Connected Channels ({channels.length})</h2>
          <button
            onClick={() => setShowConnect(!showConnect)}
            className="gradient-btn !text-white text-xs font-semibold px-4 py-1.5 rounded-lg hover:opacity-90 transition-all"
          >
            {showConnect ? "Cancel" : "+ Connect Channel"}
          </button>
        </div>

        {/* Connect form */}
        {showConnect && (
          <div className="border border-[var(--border-subtle)] rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Tenant</label>
                <select
                  value={form.businessId}
                  onChange={(e) => setForm({ ...form, businessId: e.target.value, agentId: "" })}
                  className={inputClass}
                >
                  <option value="">Select tenant...</option>
                  {businesses.map((b) => (
                    <option key={b.businessId} value={b.businessId}>{b.businessName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Channel</label>
                <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })} className={inputClass}>
                  <option value="MESSENGER">Facebook Messenger</option>
                  <option value="INSTAGRAM">Instagram DMs</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="SMS">SMS</option>
                  <option value="WEBCHAT">Webchat</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  {form.channel === "MESSENGER" ? "Page ID" : "External ID"}
                </label>
                <input
                  type="text"
                  value={form.externalId}
                  onChange={(e) => setForm({ ...form, externalId: e.target.value })}
                  placeholder={form.channel === "MESSENGER" ? "e.g. 592289943976769" : "External identifier"}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  {form.channel === "MESSENGER" ? "Page Access Token" : "Credentials"}
                </label>
                <input
                  type="password"
                  value={form.credentials}
                  onChange={(e) => setForm({ ...form, credentials: e.target.value })}
                  placeholder="Paste token/credentials"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Default Agent</label>
                <select
                  value={form.agentId}
                  onChange={(e) => setForm({ ...form, agentId: e.target.value })}
                  className={inputClass}
                  disabled={!form.businessId}
                >
                  <option value="">{form.businessId ? "Select agent..." : "Select tenant first"}</option>
                  {selectedBiz?.agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {error && <p className="text-xs text-[#ef4444]">{error}</p>}

            <button
              onClick={handleConnect}
              disabled={pending}
              className="gradient-btn !text-white text-sm font-semibold px-6 py-2 rounded-xl glow-sm hover:glow-md transition-all disabled:opacity-50"
            >
              {pending ? "Connecting..." : "Connect Channel"}
            </button>
          </div>
        )}

        {/* Channel list */}
        <div className="space-y-2">
          {channels.map((ch) => {
            const colors = channelColors[ch.channel] ?? { bg: "rgba(139,92,246,0.12)", text: "#8B5CF6" };
            return (
              <div key={ch.id} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {ch.channel}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-semibold text-[var(--text-primary)]">{ch.businessName}</span>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                    <span>Agent: {ch.agentName}</span>
                    <span>ID: {ch.externalId}</span>
                  </div>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    ch.active
                      ? "bg-[rgba(34,197,94,0.12)] text-[#22c55e]"
                      : "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]"
                  }`}
                >
                  {ch.active ? "Active" : "Paused"}
                </span>
                <button
                  onClick={() => startTransition(() => adminToggleChannel(ch.id))}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {ch.active ? "Pause" : "Resume"}
                </button>
                <button
                  onClick={() => { if (confirm(`Disconnect ${ch.channel} for ${ch.businessName}?`)) startTransition(() => adminDisconnectChannel(ch.id)); }}
                  disabled={pending}
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-[rgba(239,68,68,0.08)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.15)] transition-colors"
                >
                  Disconnect
                </button>
              </div>
            );
          })}

          {channels.length === 0 && (
            <div className="text-center py-8 text-[var(--text-muted)] text-xs">
              No channels connected yet. Click "+ Connect Channel" to get started.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
