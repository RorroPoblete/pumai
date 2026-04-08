"use client";

import { useState } from "react";
import TopBar from "@/components/dashboard/TopBar";

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

  const filtered = conversations.filter((c) => {
    if (filter !== "All" && c.status !== filter.toLowerCase()) return false;
    if (search && !c.contact.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <TopBar title="Conversations" />

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
            className="sm:ml-auto w-full sm:w-64 px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] transition-colors"
          />
        </div>

        {/* Conversation cards */}
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="card-gradient border border-[rgba(139,92,246,0.08)] rounded-xl p-5 hover:border-[rgba(139,92,246,0.25)] transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${sentimentDot[c.sentiment]}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-semibold text-white">{c.contact}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${statusColor[c.status]}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-sm text-[#A1A1AA] truncate">{c.lastMessage}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-[#71717A]">
                      <span>Agent: {c.agentName}</span>
                      <span>{c.messages} messages</span>
                      <span>{c.phone}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-[#71717A] whitespace-nowrap flex-shrink-0">{c.updatedAt}</span>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-[#71717A] text-sm">
              No conversations found.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
