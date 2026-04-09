import TopBar from "@/components/dashboard/TopBar";
import { getDashboardOverview } from "@/backend/queries";

export default async function AnalyticsPage() {
  const data = await getDashboardOverview();

  if (!data) {
    return (
      <>
        <TopBar title="Analytics" />
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)] text-sm">
          Complete onboarding to see analytics.
        </div>
      </>
    );
  }

  const { metrics: m, chart, agents } = data;
  const maxChart = Math.max(...chart.conversationsPerDay.map((d) => d.value), 1);

  return (
    <>
      <TopBar title="Analytics" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Conversations", value: m.totalConversations.toLocaleString(), change: `${m.conversationsChange >= 0 ? "+" : ""}${m.conversationsChange}%` },
            { label: "Messages Sent", value: m.messagesThisMonth.toLocaleString(), change: `${m.messagesChange >= 0 ? "+" : ""}${m.messagesChange}%` },
            { label: "Conversion Rate", value: `${m.conversionRate}%`, change: `${m.conversionChange >= 0 ? "+" : ""}${m.conversionChange}%` },
            { label: "Avg Response", value: m.responseTime, change: `${m.responseTimeChange}%` },
          ].map((k) => (
            <div key={k.label} className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-5">
              <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-2">{k.label}</div>
              <div className="text-2xl font-black text-[var(--text-primary)]">{k.value}</div>
              <div className={`text-xs font-medium mt-1 ${k.change.startsWith("-") ? "text-[#ef4444]" : "text-[#22c55e]"}`}>
                {k.change} vs last month
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly chart */}
          <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-6">Daily Conversations</h3>
            <div className="flex items-end justify-between gap-3 h-48">
              {chart.conversationsPerDay.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-[var(--text-secondary)] font-medium">{d.value}</span>
                  <div
                    className="w-full rounded-t-lg gradient-btn"
                    style={{ height: `${(d.value / maxChart) * 100}%`, minHeight: 8 }}
                  />
                  <span className="text-xs text-[var(--text-muted)]">{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sentiment */}
          <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-6">Sentiment Analysis</h3>

            {/* Donut-like visual */}
            <div className="flex items-center justify-center mb-8">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="var(--border-subtle)" strokeWidth="12" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12"
                    strokeDasharray={`${chart.sentimentBreakdown.positive * 2.51} 251`} strokeLinecap="round" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12"
                    strokeDasharray={`${chart.sentimentBreakdown.neutral * 2.51} 251`}
                    strokeDashoffset={`${-chart.sentimentBreakdown.positive * 2.51}`} strokeLinecap="round" />
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12"
                    strokeDasharray={`${chart.sentimentBreakdown.negative * 2.51} 251`}
                    strokeDashoffset={`${-(chart.sentimentBreakdown.positive + chart.sentimentBreakdown.neutral) * 2.51}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-xl font-black text-[var(--text-primary)]">{chart.sentimentBreakdown.positive}%</div>
                    <div className="text-[10px] text-[var(--text-muted)]">Positive</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Positive", value: chart.sentimentBreakdown.positive, color: "#22c55e" },
                { label: "Neutral", value: chart.sentimentBreakdown.neutral, color: "#f59e0b" },
                { label: "Negative", value: chart.sentimentBreakdown.negative, color: "#ef4444" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1.5" style={{ background: s.color }} />
                  <div className="text-sm font-bold text-[var(--text-primary)]">{s.value}%</div>
                  <div className="text-[10px] text-[var(--text-muted)]">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Agent performance table */}
        <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border-subtle)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Agent Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border-subtle)]">
                  {["Agent", "Status", "Industry", "Conversations", "Conversion"].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map((a) => (
                  <tr key={a.id} className="border-b border-[var(--border-subtle)] hover:bg-[rgba(139,92,246,0.04)] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center text-xs font-bold !text-white">
                          {a.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${
                        a.status === "active" ? "bg-[rgba(34,197,94,0.12)] text-[#22c55e]" :
                        a.status === "paused" ? "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]" :
                        "bg-[rgba(113,113,122,0.12)] text-[var(--text-muted)]"
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[var(--text-secondary)]">{a.industry}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-[var(--text-primary)]">{a.conversationsToday}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                          <div className="h-full rounded-full gradient-btn" style={{ width: `${a.conversionRate}%` }} />
                        </div>
                        <span className="text-xs text-[var(--text-secondary)]">{a.conversionRate}%</span>
                      </div>
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
