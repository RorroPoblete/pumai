"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TopBar from "@/components/dashboard/TopBar";
import { connectChannel, disconnectChannel, toggleChannelActive, saveWebchat } from "@/server/channel-actions";
import type { WebchatBranding } from "@/server/channel-queries";
import WebchatForm from "./webchat-form";
import { useChannels } from "@/components/dashboard/SubscriptionContext";
import type { ChannelKey } from "@/lib/stripe";

interface ChannelConfig {
  id: string;
  channel: string;
  active: boolean;
  externalId: string;
  agentId: string;
  agentName: string;
  createdAt: Date;
  webchatBranding?: WebchatBranding;
}

interface Agent {
  id: string;
  name: string;
}

const CHANNELS = [
  {
    key: "MESSENGER",
    name: "Facebook Messenger",
    description: "Receive and respond to messages from your Facebook Page",
    color: "#4285F4",
    bgColor: "rgba(66,133,244,0.12)",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.36 2 2 6.13 2 11.7c0 2.91 1.2 5.42 3.15 7.2.16.15.26.36.27.59l.05 1.83c.02.57.6.94 1.12.7l2.04-.9c.17-.07.37-.09.55-.05.94.26 1.94.4 2.82.4 5.64 0 10-4.13 10-9.7C22 6.13 17.64 2 12 2zm5.89 7.56l-2.89 4.59c-.46.73-1.44.91-2.12.39l-2.3-1.72a.58.58 0 00-.7 0l-3.1 2.35c-.41.31-.95-.18-.67-.62l2.89-4.59c.46-.73 1.44-.91 2.12-.39l2.3 1.72a.58.58 0 00.7 0l3.1-2.35c.41-.31.95.18.67.62z" />
      </svg>
    ),
  },
  {
    key: "INSTAGRAM",
    name: "Instagram DMs",
    description: "Auto-reply to Instagram Direct Messages",
    color: "#E1306C",
    bgColor: "rgba(225,48,108,0.12)",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    key: "WEBCHAT",
    name: "Webchat Widget",
    description: "Embed a live chat widget on your website",
    color: "#8B5CF6",
    bgColor: "rgba(139,92,246,0.12)",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        <path strokeLinecap="round" d="M8 9h8M8 13h5" />
      </svg>
    ),
  },
  {
    key: "WHATSAPP",
    name: "WhatsApp",
    description: "Connect WhatsApp Business API for rich messaging",
    color: "#25D366",
    bgColor: "rgba(37,211,102,0.12)",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
];

export default function ChannelManager({
  channels,
  agents,
}: {
  channels: ChannelConfig[];
  agents: Agent[];
}) {
  const router = useRouter();
  const [connectingChannel, setConnectingChannel] = useState<string | null>(null);
  const [formData, setFormData] = useState({ externalId: "", credentials: "", agentId: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { channels: accessMap } = useChannels();

  const connectedMap = new Map(channels.map((c) => [c.channel, c]));

  async function handleConnect(channelKey: string) {
    if (!formData.externalId || !formData.credentials || !formData.agentId) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");
    try {
      // Wrap raw token as JSON credentials per channel type
      let credentials: string;
      if (channelKey === "MESSENGER") {
        credentials = JSON.stringify({ pageAccessToken: formData.credentials });
      } else if (channelKey === "INSTAGRAM") {
        credentials = JSON.stringify({ accessToken: formData.credentials });
      } else if (channelKey === "WHATSAPP") {
        credentials = JSON.stringify({ apiToken: formData.credentials });
      } else {
        credentials = formData.credentials;
      }

      await connectChannel({
        channel: channelKey,
        externalId: formData.externalId,
        credentials,
        agentId: formData.agentId,
      });
      setConnectingChannel(null);
      setFormData({ externalId: "", credentials: "", agentId: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect channel");
    } finally {
      setLoading(false);
    }
  }

  async function handleDisconnect(configId: string) {
    setLoading(true);
    try {
      await disconnectChannel(configId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(configId: string) {
    try {
      await toggleChannelActive(configId);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle channel");
    }
  }

  return (
    <>
      <TopBar title="Channels" />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {CHANNELS.map((ch) => {
            const config = connectedMap.get(ch.key);
            const isConnecting = connectingChannel === ch.key;
            const access = accessMap[ch.key as ChannelKey];
            const canUse = access?.allowed ?? false;

            return (
              <div
                key={ch.key}
                className="card-gradient border border-[var(--border-subtle)] rounded-2xl p-5 transition-all"
              >
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center w-14 h-14 rounded-xl flex-shrink-0"
                    style={{ backgroundColor: ch.bgColor, color: ch.color }}
                  >
                    {ch.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">{ch.name}</h3>
                      {config && (
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            config.active
                              ? "bg-[rgba(34,197,94,0.12)] text-[#22c55e]"
                              : "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]"
                          }`}
                        >
                          {config.active ? "Active" : "Paused"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{ch.description}</p>
                    {config && (
                      <p className="text-[10px] text-[var(--text-muted)] mt-1">
                        Agent: <span className="text-[var(--text-secondary)]">{config.agentName}</span>
                        <span className="mx-2">|</span>
                        ID: <span className="text-[var(--text-secondary)]">{config.externalId}</span>
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {config ? (
                      <>
                        {ch.key === "WEBCHAT" && (
                          <button
                            onClick={() => {
                              setConnectingChannel(isConnecting ? null : ch.key);
                              setError("");
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                          >
                            {isConnecting ? "Close" : "Configure"}
                          </button>
                        )}
                        <button
                          onClick={() => handleToggle(config.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-input)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                        >
                          {config.active ? "Pause" : "Resume"}
                        </button>
                        <button
                          onClick={() => handleDisconnect(config.id)}
                          disabled={loading}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[rgba(239,68,68,0.08)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.15)] transition-all"
                        >
                          Disconnect
                        </button>
                      </>
                    ) : canUse ? (
                      <button
                        onClick={() => {
                          setConnectingChannel(isConnecting ? null : ch.key);
                          setError("");
                        }}
                        className="px-4 py-1.5 rounded-lg text-xs font-medium gradient-btn text-white hover:opacity-90 transition-all"
                      >
                        {isConnecting ? "Cancel" : "Connect"}
                      </button>
                    ) : (
                      <Link
                        href="/dashboard/billing"
                        className="px-4 py-1.5 rounded-lg text-xs font-medium border border-[rgba(139,92,246,0.4)] text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)] transition-all flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Upgrade
                      </Link>
                    )}
                  </div>
                </div>

                {/* Webchat embed snippet (when connected) */}
                {ch.key === "WEBCHAT" && config && !isConnecting && (
                  <EmbedSnippet widgetKey={config.externalId} />
                )}

                {/* Connect Form */}
                {isConnecting && ch.key === "WEBCHAT" && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
                    <WebchatForm
                      agents={agents}
                      initial={config?.webchatBranding ?? null}
                      initialAgentId={config?.agentId ?? null}
                      onSaved={() => {
                        setConnectingChannel(null);
                        router.refresh();
                      }}
                    />
                  </div>
                )}

                {isConnecting && ch.key !== "WEBCHAT" && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-subtle)] space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        {ch.key === "MESSENGER"
                          ? "Facebook Page ID"
                          : ch.key === "INSTAGRAM"
                          ? "Instagram Business Account ID"
                          : ch.key === "WHATSAPP"
                          ? "Whapi Channel ID"
                          : "External ID"}
                      </label>
                      <input
                        type="text"
                        value={formData.externalId}
                        onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
                        placeholder={
                          ch.key === "MESSENGER"
                            ? "e.g. 123456789012345"
                            : ch.key === "INSTAGRAM"
                            ? "e.g. 17841400000000000"
                            : ch.key === "WHATSAPP"
                            ? "e.g. MANTIS-M72HC"
                            : "External identifier"
                        }
                        className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        {ch.key === "MESSENGER"
                          ? "Page Access Token"
                          : ch.key === "INSTAGRAM"
                          ? "Instagram Access Token"
                          : ch.key === "WHATSAPP"
                          ? "Whapi API Token"
                          : "Credentials (JSON)"}
                      </label>
                      <input
                        type="password"
                        value={formData.credentials}
                        onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                        placeholder="Paste your access token"
                        className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                        Default Agent
                      </label>
                      <select
                        value={formData.agentId}
                        onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                        className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
                      >
                        <option value="">Select an agent...</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>

                    {error && (
                      <p className="text-xs text-[#ef4444]">{error}</p>
                    )}

                    <button
                      onClick={() => handleConnect(ch.key)}
                      disabled={loading}
                      className="px-6 py-2 rounded-xl text-sm font-medium gradient-btn text-white hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {loading ? "Connecting..." : `Connect ${ch.name}`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function EmbedSnippet({ widgetKey }: { widgetKey: string }) {
  const [copied, setCopied] = useState(false);
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const snippet = `<script src="${base}/widget.js" data-widget-key="${widgetKey}" async></script>`;

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--text-secondary)]">Embed snippet</span>
        <button
          onClick={copy}
          className="text-xs font-medium text-[#8B5CF6] hover:text-[#A78BFA] transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="text-[11px] text-[var(--text-primary)] bg-[var(--bg-input)] border border-[var(--border-input)] rounded-lg p-3 overflow-x-auto font-mono whitespace-pre-wrap break-all">
        {snippet}
      </pre>
      <p className="text-[10px] text-[var(--text-muted)] mt-2">
        Paste this before the closing <code>&lt;/body&gt;</code> tag of any page.
      </p>
    </div>
  );
}
