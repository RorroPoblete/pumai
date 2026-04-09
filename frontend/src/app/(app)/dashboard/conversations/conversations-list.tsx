"use client";

import { useState, useEffect, useRef } from "react";
import TopBar from "@/components/dashboard/TopBar";

interface Message {
  id: string;
  content: string;
  role: "user" | "agent" | "system";
  createdAt: string;
}

interface Conversation {
  id: string;
  contact: string;
  phone: string;
  agentName: string;
  status: "active" | "resolved" | "escalated";
  lastMessage: string;
  updatedAt: string;
  messages: number;
  sentiment: "positive" | "neutral" | "negative";
  chatMessages: Message[];
}

const filters = ["All", "Active", "Resolved", "Escalated"] as const;

const statusColor = {
  active: "bg-[rgba(34,197,94,0.12)] text-[#22c55e]",
  resolved: "bg-[rgba(139,92,246,0.12)] text-[#A78BFA]",
  escalated: "bg-[rgba(239,68,68,0.12)] text-[#ef4444]",
};

const sentimentDot = {
  positive: "bg-[#22c55e]",
  neutral: "bg-[#f59e0b]",
  negative: "bg-[#ef4444]",
};

export default function ConversationsList({ conversations }: { conversations: Conversation[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const filtered = conversations.filter((c) => {
    if (filter !== "All" && c.status !== filter.toLowerCase()) return false;
    if (search && !c.contact.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedId]);

  return (
    <>
      <TopBar title="Conversations" />

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Conversation list */}
        <div className={`${selected ? "hidden lg:flex" : "flex"} flex-col w-full lg:w-[380px] lg:min-w-[380px] border-r border-[rgba(255,255,255,0.06)]`}>
          {/* Filters & Search */}
          <div className="p-4 space-y-3 border-b border-[rgba(255,255,255,0.06)]">
            <div className="flex gap-2">
              {filters.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    filter === f
                      ? "bg-[rgba(139,92,246,0.12)] text-white"
                      : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.04)]"
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
              className="w-full px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] transition-colors"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`w-full text-left px-4 py-4 border-b border-[rgba(255,255,255,0.04)] transition-all duration-150 ${
                  selectedId === c.id
                    ? "bg-[rgba(139,92,246,0.08)]"
                    : "hover:bg-[rgba(255,255,255,0.02)]"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${sentimentDot[c.sentiment]}`} />
                    <span className="text-sm font-semibold text-white truncate">{c.contact}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusColor[c.status]}`}>
                      {c.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#52525B] flex-shrink-0 ml-2">{c.updatedAt}</span>
                </div>
                <p className="text-xs text-[#71717A] truncate pl-4">{c.lastMessage}</p>
                <div className="flex items-center gap-3 mt-1.5 pl-4 text-[10px] text-[#52525B]">
                  <span>{c.agentName}</span>
                  <span>{c.messages} msgs</span>
                </div>
              </button>
            ))}

            {filtered.length === 0 && (
              <div className="text-center py-16 text-[#71717A] text-sm">
                No conversations found.
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Chat */}
        {selected ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-[rgba(255,255,255,0.06)]">
              <button
                onClick={() => setSelectedId(null)}
                className="lg:hidden text-[#71717A] hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-semibold text-white truncate">{selected.contact}</h3>
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${statusColor[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[#71717A]">
                  <span>{selected.phone}</span>
                  <span>Agent: {selected.agentName}</span>
                </div>
              </div>
              <div className={`w-2.5 h-2.5 rounded-full ${sentimentDot[selected.sentiment]}`} />
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {selected.chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      msg.role === "user"
                        ? "bg-[rgba(255,255,255,0.06)] rounded-bl-md"
                        : "bg-[rgba(139,92,246,0.15)] rounded-br-md"
                    }`}
                  >
                    <p className="text-sm text-[#E4E4E7] leading-relaxed">{msg.content}</p>
                    <div className={`flex items-center gap-1.5 mt-1 ${msg.role === "user" ? "" : "justify-end"}`}>
                      <span className="text-[10px] text-[#52525B]">
                        {msg.role === "user" ? selected.contact.split(" ")[0] : selected.agentName}
                      </span>
                      <span className="text-[10px] text-[#3F3F46]">{msg.createdAt}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-[#27272A] mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm text-[#3F3F46]">Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
