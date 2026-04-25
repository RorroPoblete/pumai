"use client";

import { useState, useEffect, useRef } from "react";
import TopBar from "@/components/dashboard/TopBar";

interface Message {
  id: string;
  content: string;
  role: "user" | "agent" | "system";
  createdAt: string;
}

type EscalationReason = "user_request" | "ai_rule" | "sentiment" | "manual" | null;

interface Conversation {
  id: string;
  contact: string;
  phone: string;
  channel: string;
  aiEnabled: boolean;
  agentName: string;
  status: "active" | "resolved" | "escalated";
  escalationReason: EscalationReason;
  lastMessage: string;
  updatedAt: string;
  messages: number;
  unreadCount: number;
  sentiment: "positive" | "neutral" | "negative";
  chatMessages: Message[];
}

const escalationLabel: Record<Exclude<EscalationReason, null>, { label: string; hint: string }> = {
  user_request: {
    label: "User requested human",
    hint: "The customer explicitly asked to speak with a person.",
  },
  ai_rule: {
    label: "AI rule triggered",
    hint: "The agent matched an escalation rule from its instructions (e.g. complaint, legal threat).",
  },
  sentiment: {
    label: "Sentiment flagged",
    hint: "Sentiment analysis detected distress or strong negative tone.",
  },
  manual: {
    label: "Marked manually",
    hint: "A team member flagged this conversation.",
  },
};

const filters = ["All", "Active", "Resolved", "Escalated"] as const;

const statusColor = {
  active: "bg-[rgba(34,197,94,0.12)] text-[#22c55e]",
  resolved: "bg-[rgba(139,92,246,0.12)] text-[#8B5CF6]",
  escalated: "bg-[rgba(239,68,68,0.12)] text-[#ef4444]",
};

const sentimentDot = {
  positive: "bg-[#22c55e]",
  neutral: "bg-[#f59e0b]",
  negative: "bg-[#ef4444]",
};

const channelLabel: Record<string, { label: string; color: string }> = {
  messenger: { label: "Messenger", color: "bg-[rgba(66,133,244,0.12)] text-[#4285F4]" },
  instagram: { label: "Instagram", color: "bg-[rgba(225,48,108,0.12)] text-[#E1306C]" },
  webchat:   { label: "Webchat",   color: "bg-[rgba(139,92,246,0.12)] text-[#8B5CF6]" },
  whatsapp:  { label: "WhatsApp",  color: "bg-[rgba(37,211,102,0.12)] text-[#25D366]" },
};

export default function ConversationsList({ conversations: initialConversations }: { conversations: Conversation[] }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const perPage = 20;

  const filtered = conversations.filter((c) => {
    if (filter !== "All" && c.status !== filter.toLowerCase()) return false;
    if (search && !c.contact.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);
  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId, conversations]);

  // Adaptive polling: 3s when a chat is open, 10s otherwise.
  useEffect(() => {
    const intervalMs = selectedId ? 3000 : 10000;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/conversations");
        if (!res.ok) return;
        const data = (await res.json()) as { conversations: Conversation[] };
        setConversations((prev) => {
          const prevMap = new Map(prev.map((c) => [c.id, c]));
          return data.conversations.map((incoming) => {
            const local = prevMap.get(incoming.id);
            if (local && local.id === selectedId) {
              return { ...incoming, chatMessages: incoming.chatMessages, unreadCount: 0 };
            }
            return incoming;
          });
        });
      } catch {
        // silent
      }
    }, intervalMs);
    return () => clearInterval(interval);
  }, [selectedId]);

  // Tab title shows total unread across all conversations.
  useEffect(() => {
    const total = conversations.reduce((s, c) => s + c.unreadCount, 0);
    document.title = total > 0 ? `(${total}) Conversations · PumAI` : "Conversations · PumAI";
    return () => {
      document.title = "PumAI";
    };
  }, [conversations]);

  // Highlight the latest message when it arrives via polling (not when the user sent it).
  const lastMsgIdRef = useRef<string | null>(null);
  const [pingMsgId, setPingMsgId] = useState<string | null>(null);
  useEffect(() => {
    if (!selected) {
      lastMsgIdRef.current = null;
      return;
    }
    const latest = selected.chatMessages[selected.chatMessages.length - 1];
    if (!latest) return;
    if (lastMsgIdRef.current === null) {
      lastMsgIdRef.current = latest.id;
      return;
    }
    if (latest.id !== lastMsgIdRef.current && latest.role !== "agent") {
      // New inbound — flash it.
      setPingMsgId(latest.id);
      const t = setTimeout(() => setPingMsgId(null), 1800);
      lastMsgIdRef.current = latest.id;
      return () => clearTimeout(t);
    }
    lastMsgIdRef.current = latest.id;
  }, [selected]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (!selectedId) return;
    const conv = conversations.find((c) => c.id === selectedId);
    if (!conv || conv.unreadCount === 0) return;
    fetch(`/api/conversations/${selectedId}/read`, { method: "POST" }).catch(() => {});
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedId ? { ...c, unreadCount: 0 } : c)),
    );
  }, [selectedId, conversations]);

  async function handleToggleAi() {
    if (!selectedId) return;
    try {
      const res = await fetch("/api/conversations/toggle-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId }),
      });
      if (res.ok) {
        const { aiEnabled } = (await res.json()) as { aiEnabled: boolean };
        setConversations((prev) =>
          prev.map((c) => (c.id === selectedId ? { ...c, aiEnabled } : c)),
        );
      }
    } catch {
      // silent
    }
  }

  async function handleReply() {
    if (!selectedId || !replyText.trim() || sending) return;
    setSending(true);

    try {
      const res = await fetch("/api/conversations/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: selectedId, message: replyText.trim() }),
      });

      if (res.ok) {
        const now = new Date().toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedId
              ? {
                  ...c,
                  messages: c.messages + 1,
                  lastMessage: replyText.trim(),
                  chatMessages: [
                    ...c.chatMessages,
                    { id: `tmp-${Date.now()}`, content: replyText.trim(), role: "agent" as const, createdAt: now },
                  ],
                }
              : c,
          ),
        );
        setReplyText("");
      }
    } catch {
      // silent
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <TopBar title="Conversations" />

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Conversation list */}
        <div className={`${selected ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-[380px] lg:min-w-[380px] border-r border-[var(--border-subtle)]`}>
          {/* Filters & Search */}
          <div className="p-4 space-y-3 border-b border-[var(--border-subtle)]">
            <div className="flex gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === f
                      ? "bg-[rgba(139,92,246,0.12)] text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-input)]"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Search contacts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {paginated.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-4 border-b border-[var(--border-subtle)] transition-all duration-150 ${
                  selectedId === c.id
                    ? "bg-[rgba(139,92,246,0.08)]"
                    : "hover:bg-[var(--bg-input)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sentimentDot[c.sentiment]}`} />
                    <span className={`text-sm truncate ${c.unreadCount > 0 ? "font-bold text-[var(--text-primary)]" : "font-semibold text-[var(--text-primary)]"}`}>{c.contact}</span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusColor[c.status]}`}
                      title={
                        c.status === "escalated" && c.escalationReason && escalationLabel[c.escalationReason]
                          ? escalationLabel[c.escalationReason].label
                          : undefined
                      }
                    >
                      {c.status}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="text-[10px] font-bold text-white bg-[#8B5CF6] rounded-full px-1.5 min-w-[18px] text-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 ml-2">{c.updatedAt}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)] truncate pl-4">{c.lastMessage}</p>
                <div className="flex items-center gap-2 mt-1.5 pl-4 text-[10px] text-[var(--text-muted)]">
                  {channelLabel[c.channel] && (
                    <span className={`px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider text-[8px] ${channelLabel[c.channel].color}`}>
                      {channelLabel[c.channel].label}
                    </span>
                  )}
                  <span>{c.agentName}</span>
                  <span>{c.messages} msgs</span>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-[var(--text-muted)] text-sm">
                No conversations found.
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)]">
                <span className="text-[10px] text-[var(--text-muted)]">{filtered.length} total</span>
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} className="px-2 py-1 text-[10px] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30">Prev</button>
                  <span className="text-[10px] text-[var(--text-secondary)] px-2">{page + 1}/{totalPages}</span>
                  <button onClick={() => setPage(Math.min(totalPages - 1, page + 1))} disabled={page >= totalPages - 1} className="px-2 py-1 text-[10px] rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-30">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Chat */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-[var(--border-subtle)]">
              <button
                onClick={() => setSelectedId(null)}
                className="lg:hidden text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{selected.contact}</h3>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusColor[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  {channelLabel[selected.channel] && (
                    <span className={`px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider text-[9px] ${channelLabel[selected.channel].color}`}>
                      {channelLabel[selected.channel].label}
                    </span>
                  )}
                  {selected.phone && <span>{selected.phone}</span>}
                  <span>Agent: {selected.agentName}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleToggleAi}
                  className="flex items-center gap-2 group"
                  title={selected.aiEnabled ? "AI is responding — click to take over" : "You are responding — click to enable AI"}
                >
                  <span className={`text-[10px] font-semibold transition-colors ${selected.aiEnabled ? "text-[#22c55e]" : "text-[#f59e0b]"}`}>
                    {selected.aiEnabled ? "AI" : "Human"}
                  </span>
                  <div className={`relative w-9 h-5 rounded-full transition-colors ${selected.aiEnabled ? "bg-[#22c55e]" : "bg-[#f59e0b]"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${selected.aiEnabled ? "left-[18px]" : "left-0.5"}`} />
                  </div>
                </button>
                <div className={`w-2.5 h-2.5 rounded-full ${sentimentDot[selected.sentiment]}`} />
              </div>
            </div>

            {/* Escalation banner */}
            {selected.status === "escalated" && (
              <div className="mx-6 mt-3 px-4 py-3 rounded-xl border border-[rgba(239,68,68,0.3)] bg-[rgba(239,68,68,0.06)] flex items-start gap-3">
                <svg className="w-4 h-4 text-[#ef4444] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div className="flex-1 text-xs leading-relaxed">
                  <strong className="text-[#ef4444]">Escalated to human</strong>
                  {selected.escalationReason && escalationLabel[selected.escalationReason] && (
                    <>
                      {" — "}
                      <span className="text-[var(--text-primary)] font-semibold">
                        {escalationLabel[selected.escalationReason].label}
                      </span>
                      <p className="text-[var(--text-muted)] mt-0.5">
                        {escalationLabel[selected.escalationReason].hint}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {selected.chatMessages.map((msg) => {
                const isPing = pingMsgId === msg.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 transition-shadow duration-700 ${
                        msg.role === "user"
                          ? "bg-[var(--bg-hover)] rounded-bl-md"
                          : "bg-[rgba(139,92,246,0.15)] rounded-br-md"
                      } ${isPing ? "ring-2 ring-[#8B5CF6] shadow-[0_0_24px_rgba(139,92,246,0.5)]" : ""}`}
                    >
                      <p className="text-sm text-[var(--text-primary)] leading-relaxed">{msg.content}</p>
                      <div className={`flex items-center gap-1.5 mt-1 ${msg.role === "user" ? "" : "justify-end"}`}>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {msg.role === "user" ? selected.contact.split(" ")[0] : selected.agentName}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">{msg.createdAt}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply input */}
            <div className="px-6 py-4 border-t border-[var(--border-subtle)]">
              <form
                onSubmit={(e) => { e.preventDefault(); handleReply(); }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Reply as human..."
                  disabled={sending}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium gradient-btn text-white hover:opacity-90 transition-all disabled:opacity-40"
                >
                  {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-[#27272A] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-[var(--text-muted)]">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
