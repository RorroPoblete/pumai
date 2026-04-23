import TopBar from "@/components/dashboard/TopBar";
import { getDashboardOverview } from "@/server/queries";

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

export default async function DashboardOverview() {
  const data = await getDashboardOverview();

  if (!data) {
    return (
      <>
        <TopBar title="Overview" />
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          Complete onboarding to see your dashboard.
        </div>
      </>
    );
  }

  const { metrics: m, conversations, agents, chart } = data;
  const maxChart = Math.max(...chart.conversationsPerDay.map((d) => d.value), 1);

  return (
    <>
      <TopBar title="Overview" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Conversations",
              value: m.totalConversations.toLocaleString(),
              change: m.conversationsChange,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ),
            },
            {
              label: "Active Agents",
              value: m.activeAgents.toString(),
              change: null,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              ),
            },
            {
              label: "Avg Response",
              value: m.responseTime,
              change: m.responseTimeChange || null,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              ),
            },
            {
              label: "Conversion Rate",
              value: `${m.conversionRate}%`,
              change: m.conversionChange || null,
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              ),
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  {kpi.label}
                </span>
                <div className="w-8 h-8 rounded-lg bg-[rgba(139,92,246,0.1)] flex items-center justify-center text-[#8B5CF6]">
                  {kpi.icon}
                </div>
              </div>
              <div className="text-2xl font-black text-[var(--text-primary)]">{kpi.value}</div>
              {kpi.change !== null && (
                <div
                  className={`text-xs font-medium mt-1 ${
                    kpi.change > 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                  }`}
                >
                  {kpi.change > 0 ? "+" : ""}
                  {kpi.change}% vs last week
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart - Conversations per day */}
          <div className="lg:col-span-2 card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Conversations This Week</h3>
              <span className="text-xs text-[var(--text-muted)]">{m.messagesThisMonth.toLocaleString()} messages total</span>
            </div>
            <div className="flex items-end justify-between gap-2 h-40">
              {chart.conversationsPerDay.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)] font-medium">{d.value}</span>
                  <div
                    className="w-full rounded-t-md gradient-btn transition-all duration-300 hover:opacity-80"
                    style={{ height: `${(d.value / maxChart) * 100}%`, minHeight: 8 }}
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sentiment breakdown */}
          <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-6">Sentiment</h3>
            <div className="space-y-4">
              {(
                [
                  { label: "Positive", value: chart.sentimentBreakdown.positive, color: "#22c55e" },
                  { label: "Neutral", value: chart.sentimentBreakdown.neutral, color: "#f59e0b" },
                  { label: "Negative", value: chart.sentimentBreakdown.negative, color: "#ef4444" },
                ] as const
              ).map((s) => (
                <div key={s.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[var(--text-secondary)]">{s.label}</span>
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{s.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${s.value}%`, background: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Agent status */}
            <div className="mt-8">
              <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Agent Status
              </h4>
              <div className="space-y-2">
                {agents.slice(0, 3).map((a) => (
                  <div key={a.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${a.status === "active" ? "bg-[#22c55e]" : a.status === "paused" ? "bg-[#f59e0b]" : "bg-[#71717A]"}`} />
                      <span className="text-xs text-[var(--text-secondary)]">{a.name}</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">{a.conversationsToday} today</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Conversations */}
        <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Conversations</h3>
            <a href="/dashboard/conversations" className="text-xs text-[#8B5CF6] hover:text-[#8B5CF6] transition-colors">
              View all &rarr;
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Contact", "Agent", "Status", "Last Message", "Time"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {conversations.slice(0, 6).map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-[var(--border-subtle)] hover:bg-[rgba(139,92,246,0.04)] transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${sentimentDot[c.sentiment]}`} />
                        <div>
                          <div className="text-sm font-medium text-[var(--text-primary)]">{c.contact}</div>
                          <div className="text-xs text-[var(--text-muted)]">{c.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)]">{c.agentName}</td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${statusColor[c.status]}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)] max-w-xs truncate">
                      {c.lastMessage}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--text-muted)] whitespace-nowrap">
                      {c.updatedAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
