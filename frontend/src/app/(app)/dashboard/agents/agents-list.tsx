"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import Link from "next/link";
import TopBar from "@/components/dashboard/TopBar";
import { toggleAgentStatus } from "@/backend/actions";

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
  draft: { bg: "bg-[rgba(113,113,122,0.12)]", text: "text-[#71717A]", dot: "bg-[#71717A]" },
};

export default function AgentsList({ agents }: { agents: Agent[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string) {
    startTransition(() => toggleAgentStatus(id));
  }

  return (
    <>
      <TopBar title="AI Agents" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#A1A1AA]">{agents.length} agents configured</p>
          <Link
            href="/dashboard/agents/new"
            className="gradient-btn text-white text-sm font-semibold px-5 py-2.5 rounded-xl glow-sm hover:glow-md transition-all duration-300"
          >
            + New Agent
          </Link>
        </div>

        {/* Agent cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {agents.map((a) => {
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
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center text-sm font-bold text-white">
                      {a.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{a.name}</div>
                      <div className="text-xs text-[#71717A] capitalize">{a.tone}</div>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 ${s.bg} ${s.text} text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {a.status}
                  </div>
                </div>

                {/* Info */}
                <div className="text-xs text-[#71717A] mb-4">{a.industry}</div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[rgba(255,255,255,0.04)]">
                  <div>
                    <div className="text-lg font-black text-white">{a.conversationsToday}</div>
                    <div className="text-[10px] text-[#71717A] uppercase tracking-wider">Today</div>
                  </div>
                  <div>
                    <div className="text-lg font-black text-white">{a.conversionRate}%</div>
                    <div className="text-[10px] text-[#71717A] uppercase tracking-wider">Conversion</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-[rgba(255,255,255,0.04)] opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/agents/${a.id}`); }}
                    className="text-xs text-[#A1A1AA] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/agents/${a.id}?tab=test`); }}
                    className="text-xs text-[#A1A1AA] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[rgba(255,255,255,0.04)]"
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
