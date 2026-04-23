"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import TopBar from "@/components/dashboard/TopBar";
import { toggleAgentStatus } from "@/server/actions";
import { useChannels } from "@/components/dashboard/SubscriptionContext";

interface Agent {
  id: string;
  name: string;
  tone: "professional" | "friendly" | "casual";
  status: "active" | "paused" | "draft";
  industry: string;
  conversationsToday: number;
  conversionRate: number;
}

const statusStyle = {
  active: { bg: "bg-[rgba(34,197,94,0.12)]", text: "text-[#22c55e]", dot: "bg-[#22c55e]" },
  paused: { bg: "bg-[rgba(245,158,11,0.12)]", text: "text-[#f59e0b]", dot: "bg-[#f59e0b]" },
  draft: { bg: "bg-[rgba(113,113,122,0.12)]", text: "text-[var(--text-muted)]", dot: "bg-[#71717A]" },
};

export default function AgentsList({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { hasAnyPaid } = useChannels();
  const canCreate = hasAnyPaid || agents.length < 1;

  const filtered = agents.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (search && !a.name.toLowerCase().includes(search.toLowerCase()) && !a.industry.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  function handleToggle(id: string) {
    startTransition(() => toggleAgentStatus(id));
  }

  return (
    <>
      <TopBar title="AI Agents" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="Search agents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-56 px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
            />
            <div className="flex gap-1">
              {["all", "active", "paused", "draft"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    statusFilter === s
                      ? "bg-[rgba(139,92,246,0.12)] text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <span className="text-xs text-[var(--text-muted)] hidden sm:inline">{filtered.length} of {agents.length}</span>
          </div>
          {canCreate ? (
            <Link
              href="/dashboard/agents/new"
              className="gradient-btn !text-white text-sm font-semibold px-5 py-2.5 rounded-xl glow-sm hover:glow-md transition-all duration-300"
            >
              + New Agent
            </Link>
          ) : (
            <Link
              href="/dashboard/billing"
              title="Free tier allows 1 agent. Upgrade a channel to add more."
              className="text-sm font-semibold px-5 py-2.5 rounded-xl border border-[rgba(139,92,246,0.4)] text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)] transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Unlock more agents
            </Link>
          )}
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((a) => {
            const s = statusStyle[a.status];
            return (
              <div
                key={a.id}
                className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-6 hover:border-[rgba(139,92,246,0.3)] transition-all duration-200 cursor-pointer group"
                onClick={() => router.push(`/dashboard/agents/${a.id}`)}
              >
                {/* Top row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center text-sm font-bold text-[var(--text-primary)]">
                      {a.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{a.name}</div>
                      <div className="text-xs text-[var(--text-muted)] capitalize">{a.tone}</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 ${s.bg} ${s.text} text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {a.status}
                  </div>
                </div>

                {/* Info */}
                <div className="text-xs text-[var(--text-muted)] mb-4">{a.industry}</div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--border-subtle)]">
                  <div>
                    <div className="text-lg font-black text-[var(--text-primary)]">{a.conversationsToday}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Today</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-[var(--text-primary)]">{a.conversionRate}%</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Conversion</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/agents/${a.id}`); }}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--bg-input)]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/agents/${a.id}?tab=test`); }}
                    className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--bg-input)]"
                  >
                    Test
                  </button>
                  {a.status === "active" ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggle(a.id); }}
                      disabled={isPending}
                      className="text-xs text-[#f59e0b] hover:text-[#fbbf24] transition-colors px-3 py-1.5 rounded-lg hover:bg-[rgba(245,158,11,0.08)]"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggle(a.id); }}
                      disabled={isPending}
                      className="text-xs text-[#22c55e] hover:text-[#4ade80] transition-colors px-3 py-1.5 rounded-lg hover:bg-[rgba(34,197,94,0.08)]"
                    >
                      Activate
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
