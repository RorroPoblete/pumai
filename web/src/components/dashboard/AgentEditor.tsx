"use client";

import { useState, useRef, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import TopBar from "./TopBar";
import { updateAgent, createAgent, deleteAgent, toggleAgentStatus } from "@/server/actions";
import { autoFillFromPdfs } from "@/server/agent-autofill";
import {
  industries,
  getFormSchema,
  defaultConfig,
  composeSystemPrompt,
  composeKnowledgeBase,
  LIMITS,
  PDF_LIMITS,
  limitState,
  type FormState,
  type LimitState,
  type LimitThresholds,
} from "@/lib/agent-templates";
import { StructuredForm, EmptyIndustryNotice } from "./AgentFormFields";

interface AgentData {
  id?: string;
  name: string;
  tone: string;
  industry: string;
  status: string;
  config: FormState | null;
}

export interface ScrapeQuota {
  used: number;
  max: number;
  remaining: number;
  admin: boolean;
}

const tabs = ["Configuration", "System Prompt", "Knowledge Base", "Test"] as const;
type Tab = (typeof tabs)[number];

const stateColors: Record<LimitState, { bg: string; text: string; border: string; label: string }> = {
  green: { bg: "rgba(34,197,94,0.12)", text: "#22c55e", border: "rgba(34,197,94,0.35)", label: "OK" },
  amber: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b", border: "rgba(245,158,11,0.35)", label: "Heavy" },
  red: { bg: "rgba(239,68,68,0.12)", text: "#ef4444", border: "rgba(239,68,68,0.35)", label: "Too long" },
  block: { bg: "rgba(239,68,68,0.18)", text: "#ef4444", border: "rgba(239,68,68,0.5)", label: "Blocked" },
};

function fmt(n: number) {
  return n.toLocaleString("en-AU");
}

function CharCounter({ chars, t }: { chars: number; t: LimitThresholds }) {
  const s = limitState(chars, t);
  const c = stateColors[s];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.text }} />
      {fmt(chars)} / {fmt(t.block)} chars · {c.label}
    </span>
  );
}

function TabBadge({ state }: { state: LimitState }) {
  if (state === "green") return null;
  const c = stateColors[state];
  return (
    <span
      className="ml-2 inline-block w-1.5 h-1.5 rounded-full"
      style={{ background: c.text }}
      aria-label={c.label}
    />
  );
}

const toneOptions = [
  { value: "PROFESSIONAL", label: "Professional", desc: "Formal & polished" },
  { value: "FRIENDLY", label: "Friendly", desc: "Warm & approachable" },
  { value: "CASUAL", label: "Casual", desc: "Relaxed but professional" },
];

export default function AgentEditor({
  agent,
  quota,
}: {
  agent: AgentData;
  quota: ScrapeQuota;
}) {
  const isNew = !agent.id;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("Configuration");
  const [saved, setSaved] = useState(false);

  const [name, setName] = useState(agent.name);
  const [tone, setTone] = useState(agent.tone);
  const [industry, setIndustry] = useState(agent.industry);
  const [config, setConfig] = useState<FormState>(
    agent.config ?? (agent.industry ? defaultConfig(agent.industry) : {}),
  );

  // Auto-fill state
  const [autoFillFiles, setAutoFillFiles] = useState<File[]>([]);
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFillMsg, setAutoFillMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [quotaState, setQuotaState] = useState<ScrapeQuota>(quota);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { MAX_PDFS, MAX_PDF_BYTES, MAX_TOTAL_BYTES } = PDF_LIMITS;

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "agent"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [chatMeta, setChatMeta] = useState<{
    sentiment: "positive" | "neutral" | "negative";
    escalation: boolean;
    language: string;
  } | null>(null);
  const [analysis, setAnalysis] = useState<{
    sentiment: string;
    sentimentScore: number;
    escalation: boolean;
    escalationReason: string | null;
    language: string;
    topics: string[];
    summary: string;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const schema = useMemo(() => (industry ? getFormSchema(industry) : null), [industry]);
  const composedSystemPrompt = useMemo(
    () => (industry ? composeSystemPrompt(industry, config) : ""),
    [industry, config],
  );
  const composedKnowledgeBase = useMemo(
    () => (industry ? composeKnowledgeBase(industry, config) : ""),
    [industry, config],
  );

  const spState = useMemo(() => limitState(composedSystemPrompt.length, LIMITS.systemPrompt), [composedSystemPrompt]);
  const kbState = useMemo(() => limitState(composedKnowledgeBase.length, LIMITS.knowledgeBase), [composedKnowledgeBase]);
  const isBlocked = spState === "block" || kbState === "block";

  function setValue(key: string, value: FormState[string]) {
    setConfig((prev) => ({ ...prev, [key]: value }));
  }

  function handleAddPdfs(incoming: FileList | null) {
    if (!incoming || incoming.length === 0) return;
    setAutoFillMsg(null);
    const next: File[] = [...autoFillFiles];
    for (const f of Array.from(incoming)) {
      if (next.length >= MAX_PDFS) break;
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        setAutoFillMsg({ kind: "err", text: `${f.name} is not a PDF` });
        continue;
      }
      if (f.size > MAX_PDF_BYTES) {
        setAutoFillMsg({ kind: "err", text: `${f.name} is over 10 MB` });
        continue;
      }
      if (next.some((x) => x.name === f.name && x.size === f.size)) continue;
      next.push(f);
    }
    if (next.reduce((s, f) => s + f.size, 0) > MAX_TOTAL_BYTES) {
      setAutoFillMsg({ kind: "err", text: "Combined PDF size exceeds 25 MB" });
      return;
    }
    setAutoFillFiles(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemovePdf(idx: number) {
    setAutoFillFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleAutoFill() {
    if (autoFillFiles.length === 0) return;
    if (!industry) {
      setAutoFillMsg({ kind: "err", text: "Pick an industry first." });
      return;
    }
    if (!quotaState.admin && quotaState.remaining <= 0) {
      setAutoFillMsg({ kind: "err", text: `No auto-fill credits remaining (${quotaState.max} per business).` });
      return;
    }
    if (kbState === "block" || spState === "block") {
      setAutoFillMsg({
        kind: "err",
        text: "Trim the current Knowledge Base or System Prompt before running auto-fill — content already over the limit.",
      });
      return;
    }
    if (kbState === "red" || spState === "red") {
      if (
        !confirm(
          "Knowledge Base or System Prompt is already heavy. Auto-fill could push it over the limit. Continue anyway?",
        )
      )
        return;
    } else if (!confirm("Auto-fill will overwrite matching fields with data found in the PDFs. Continue?")) {
      return;
    }

    setAutoFilling(true);
    setAutoFillMsg(null);
    try {
      const fd = new FormData();
      fd.set("industry", industry);
      autoFillFiles.forEach((file, i) => fd.set(`pdf${i}`, file));
      const result = await autoFillFromPdfs(fd);
      if (!result.ok) {
        setAutoFillMsg({ kind: "err", text: result.error });
        if (typeof result.remaining === "number") {
          setQuotaState((q) => ({ ...q, remaining: result.remaining as number, used: q.max - (result.remaining as number) }));
        }
        return;
      }
      setConfig((prev) => ({ ...prev, ...result.config }) as FormState);
      const totalPages = result.files.reduce((s, f) => s + f.pages, 0);
      setAutoFillMsg({
        kind: "ok",
        text: `Filled ${result.fieldsFilled} field${result.fieldsFilled === 1 ? "" : "s"} from ${result.files.length} PDF${result.files.length === 1 ? "" : "s"} (${totalPages} pages).`,
      });
      setAutoFillFiles([]);
      if (typeof result.remaining === "number") {
        setQuotaState((q) => ({ ...q, remaining: result.remaining as number, used: q.max - (result.remaining as number) }));
      }
    } catch (e) {
      setAutoFillMsg({ kind: "err", text: e instanceof Error ? e.message : "Auto-fill failed" });
    } finally {
      setAutoFilling(false);
    }
  }

  function formatBytes(n: number): string {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  }

  function handleSelectIndustry(ind: string) {
    if (ind === industry) return;
    const replace =
      Object.keys(config).length === 0 ||
      confirm("Switching industry will replace the current form fields with the new template. Continue?");
    if (!replace) return;
    setIndustry(ind);
    setConfig(defaultConfig(ind));
  }

  function handleSave() {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("tone", tone);
    fd.set("industry", industry);
    fd.set("systemPrompt", composedSystemPrompt);
    fd.set("knowledgeBase", composedKnowledgeBase);
    fd.set("config", JSON.stringify(config));

    startTransition(async () => {
      if (isNew) {
        await createAgent(fd);
      } else {
        await updateAgent(agent.id!, fd);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    });
  }

  function handleDelete() {
    if (!agent.id) return;
    if (!confirm("Delete this agent? This cannot be undone.")) return;
    startTransition(() => deleteAgent(agent.id!));
  }

  function handleToggleStatus() {
    if (!agent.id) return;
    startTransition(() => toggleAgentStatus(agent.id!));
  }

  function scrollChat() {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  async function handleSendTest() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    const updated = [...chatMessages, { role: "user" as const, content: userMsg }];
    setChatMessages(updated);
    setChatLoading(true);
    scrollChat();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated,
          systemPrompt: composedSystemPrompt,
          knowledgeBase: composedKnowledgeBase,
          agentName: name,
          tone,
        }),
      });

      if (!res.ok) throw new Error("API error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let agentReply = "";

      setChatMessages((prev) => [...prev, { role: "agent", content: "" }]);
      scrollChat();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        agentReply += decoder.decode(value, { stream: true });

        const visible = agentReply.split("\n__META__")[0].replace("[ESCALATE]", "").trim();
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "agent", content: visible },
        ]);
        scrollChat();
      }

      const metaMatch = agentReply.match(/__META__(.+)$/);
      if (metaMatch) {
        try {
          setChatMeta(JSON.parse(metaMatch[1]));
        } catch { /* ignore parse errors */ }
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: "agent", content: "Failed to get response. Check that OPENAI_API_KEY is configured." },
      ]);
    } finally {
      setChatLoading(false);
    }
  }

  async function handleAnalyze() {
    if (chatMessages.length === 0 || analyzing) return;
    setAnalyzing(true);
    try {
      const res = await fetch("/api/chat/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatMessages }),
      });
      if (!res.ok) throw new Error();
      setAnalysis(await res.json());
    } catch {
      setAnalysis(null);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <>
      <TopBar title={isNew ? "New Agent" : `Edit: ${agent.name}`} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top bar: back + actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard/agents")}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              &larr; Back to Agents
            </button>
            <div className="flex items-center gap-3">
              {!isNew && (
                <>
                  <button
                    onClick={handleToggleStatus}
                    disabled={isPending}
                    className={`text-xs font-semibold px-4 py-2 rounded-lg border transition-colors ${
                      agent.status === "ACTIVE"
                        ? "border-[rgba(245,158,11,0.3)] text-[#f59e0b] hover:bg-[rgba(245,158,11,0.08)]"
                        : "border-[rgba(34,197,94,0.3)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.08)]"
                    }`}
                  >
                    {agent.status === "ACTIVE" ? "Pause" : "Activate"}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-xs font-semibold px-4 py-2 rounded-lg border border-[rgba(239,68,68,0.3)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                  >
                    Delete
                  </button>
                </>
              )}
              <button
                onClick={handleSave}
                disabled={isPending || !name.trim() || !industry || isBlocked}
                title={isBlocked ? "Trim System Prompt or Knowledge Base — over the size limit" : undefined}
                className="gradient-btn !text-white text-sm font-semibold px-6 py-2 rounded-lg glow-sm hover:glow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "Saving..." : saved ? "Saved!" : isBlocked ? "Over limit" : isNew ? "Create Agent" : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Size alerts */}
          {industry && (spState !== "green" || kbState !== "green") && (
            <div
              className="rounded-xl px-4 py-3 border flex items-start gap-3"
              style={{
                background: stateColors[isBlocked ? "block" : spState === "red" || kbState === "red" ? "red" : "amber"].bg,
                borderColor: stateColors[isBlocked ? "block" : spState === "red" || kbState === "red" ? "red" : "amber"].border,
              }}
            >
              <svg
                className="w-4 h-4 flex-shrink-0 mt-0.5"
                style={{ color: stateColors[isBlocked ? "block" : spState === "red" || kbState === "red" ? "red" : "amber"].text }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-xs leading-relaxed flex-1" style={{ color: "var(--text-secondary)" }}>
                <strong style={{ color: stateColors[isBlocked ? "block" : "red"].text }}>
                  {isBlocked
                    ? "Save is blocked — content over the size limit."
                    : spState === "red" || kbState === "red"
                      ? "Content is too long — performance and cost will suffer."
                      : "Heads up — content is getting heavy."}
                </strong>{" "}
                {isBlocked
                  ? "Trim fields on the System Prompt and / or Knowledge Base tab until each badge turns amber or green."
                  : "The longer the prompt and KB, the slower and more expensive each chat reply gets. Aim for green."}
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="text-[10px] text-[var(--text-muted)]">System Prompt:</span>
                  <CharCounter chars={composedSystemPrompt.length} t={LIMITS.systemPrompt} />
                  <span className="text-[10px] text-[var(--text-muted)]">Knowledge Base:</span>
                  <CharCounter chars={composedKnowledgeBase.length} t={LIMITS.knowledgeBase} />
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[var(--border-subtle)] pb-px">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg flex items-center ${
                  tab === t
                    ? "text-[var(--text-primary)] border-b-2 border-[#8B5CF6] bg-[rgba(139,92,246,0.08)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-input)]"
                }`}
              >
                {t}
                {t === "System Prompt" && <TabBadge state={spState} />}
                {t === "Knowledge Base" && <TabBadge state={kbState} />}
              </button>
            ))}
          </div>

          {/* Tab: Configuration */}
          {tab === "Configuration" && (
            <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                  Agent name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sam, Reception Bot, Support"
                  className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-3">
                  Conversation tone
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {toneOptions.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setTone(t.value)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                        tone === t.value
                          ? "border-[#8B5CF6] bg-[rgba(139,92,246,0.12)]"
                          : "border-[var(--border-input)] bg-[var(--bg-input)] hover:border-[rgba(139,92,246,0.3)]"
                      }`}
                    >
                      <div className="text-sm font-semibold text-[var(--text-primary)]">{t.label}</div>
                      <div className="text-xs text-[var(--text-muted)] mt-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-3">
                  Industry
                </label>
                <p className="text-[11px] text-[var(--text-muted)] mb-3">
                  The form fields on the System Prompt and Knowledge Base tabs adapt to the chosen industry.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {industries.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => handleSelectIndustry(ind)}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        industry === ind
                          ? "border-[#8B5CF6] bg-[rgba(139,92,246,0.12)] text-[var(--text-primary)]"
                          : "border-[var(--border-input)] text-[var(--text-secondary)] hover:border-[rgba(139,92,246,0.3)]"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              {industry && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Reset all System Prompt and Knowledge Base fields back to the industry defaults?")) {
                      setConfig(defaultConfig(industry));
                    }
                  }}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[var(--border-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)] transition-colors"
                >
                  Reset form to {industry} defaults
                </button>
              )}

              {/* Auto-fill from PDFs */}
              <div className="pt-4 border-t border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Auto-fill from PDFs
                  </label>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {quotaState.admin
                      ? "Admin — unlimited"
                      : `${quotaState.remaining}/${quotaState.max} credits remaining`}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mb-3">
                  Upload up to {MAX_PDFS} PDFs (max 10 MB each) — e.g. brochures, menus, fee schedules, FAQs, or a print-to-PDF of your website. AI fills in matching fields. Pick an industry first.
                </p>

                <div
                  className="border-2 border-dashed border-[var(--border-input)] rounded-xl p-4 hover:border-[rgba(139,92,246,0.4)] transition-colors"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleAddPdfs(e.dataTransfer.files);
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,.pdf"
                    multiple
                    onChange={(e) => handleAddPdfs(e.target.files)}
                    className="hidden"
                    disabled={autoFilling}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs text-[var(--text-muted)]">
                      {autoFillFiles.length === 0
                        ? "Drop PDFs here or click to browse"
                        : `${autoFillFiles.length}/${MAX_PDFS} selected`}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={autoFilling || autoFillFiles.length >= MAX_PDFS}
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-[rgba(139,92,246,0.3)] text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)] transition-colors disabled:opacity-50"
                    >
                      Browse
                    </button>
                  </div>

                  {autoFillFiles.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {autoFillFiles.map((f, i) => (
                        <li
                          key={`${f.name}-${i}`}
                          className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs text-[var(--text-primary)] truncate">{f.name}</div>
                            <div className="text-[10px] text-[var(--text-muted)]">{formatBytes(f.size)}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePdf(i)}
                            disabled={autoFilling}
                            className="text-[10px] px-2 py-1 rounded-md border border-[rgba(239,68,68,0.25)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors"
                            aria-label={`Remove ${f.name}`}
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleAutoFill}
                    disabled={
                      autoFilling ||
                      autoFillFiles.length === 0 ||
                      !industry ||
                      (!quotaState.admin && quotaState.remaining <= 0)
                    }
                    className="gradient-btn !text-white text-sm font-semibold px-5 py-2.5 rounded-xl glow-sm hover:glow-md transition-all disabled:opacity-50"
                  >
                    {autoFilling ? "Reading PDFs..." : "Auto-fill from PDFs"}
                  </button>
                </div>

                {autoFillMsg && (
                  <p
                    className={`mt-2 text-xs ${
                      autoFillMsg.kind === "ok" ? "text-[#22c55e]" : "text-[#ef4444]"
                    }`}
                  >
                    {autoFillMsg.text}
                  </p>
                )}
                {!quotaState.admin && quotaState.remaining === 0 && (
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">
                    You&apos;ve used all auto-fill credits. Contact support if you need more.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab: System Prompt */}
          {tab === "System Prompt" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Fill in each section. We compose a structured prompt from your inputs — no need to write markdown by hand.
              </p>
              {schema ? (
                <>
                  <StructuredForm sections={schema.systemPrompt} state={config} setValue={setValue} />
                  <details className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
                    <summary className="text-xs font-semibold text-[var(--text-secondary)] cursor-pointer flex items-center gap-3">
                      <span>Preview composed prompt</span>
                      <CharCounter chars={composedSystemPrompt.length} t={LIMITS.systemPrompt} />
                    </summary>
                    <pre className="mt-3 text-[11px] text-[var(--text-muted)] whitespace-pre-wrap font-mono leading-relaxed">
                      {composedSystemPrompt || "Empty"}
                    </pre>
                  </details>
                </>
              ) : (
                <EmptyIndustryNotice />
              )}
            </div>
          )}

          {/* Tab: Knowledge Base */}
          {tab === "Knowledge Base" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Add business info, services, FAQs and policies. Each industry has its own structured fields.
              </p>
              {schema ? (
                <>
                  <StructuredForm sections={schema.knowledgeBase} state={config} setValue={setValue} />
                  <details className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
                    <summary className="text-xs font-semibold text-[var(--text-secondary)] cursor-pointer flex items-center gap-3">
                      <span>Preview composed knowledge base</span>
                      <CharCounter chars={composedKnowledgeBase.length} t={LIMITS.knowledgeBase} />
                    </summary>
                    <pre className="mt-3 text-[11px] text-[var(--text-muted)] whitespace-pre-wrap font-mono leading-relaxed">
                      {composedKnowledgeBase || "Empty"}
                    </pre>
                  </details>
                </>
              ) : (
                <EmptyIndustryNotice />
              )}
            </div>
          )}

          {/* Tab: Test */}
          {tab === "Test" && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-secondary)]">
                Test your agent with a live conversation. Responses use the composed prompt and knowledge base.
              </p>

              <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center text-xs font-bold !text-white">
                    {name.charAt(0) || "A"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{name || "Agent"}</div>
                    <div className="text-[10px] text-[#22c55e]">
                      {chatLoading ? "Typing..." : "Online"}
                    </div>
                  </div>
                  <button
                    onClick={() => { setChatMessages([]); setChatMeta(null); setAnalysis(null); }}
                    className="ml-auto text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                  >
                    Clear
                  </button>
                </div>

                <div className="h-80 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-sm text-[var(--text-muted)]">
                      Send a message to test your agent
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.role === "user"
                            ? "bg-[#8B5CF6] text-[var(--text-primary)] rounded-br-md"
                            : "bg-[var(--bg-hover)] text-[var(--text-primary)] rounded-bl-md"
                        }`}
                      >
                        {msg.content || (
                          <span className="inline-flex gap-1">
                            <span className="w-1.5 h-1.5 bg-[#71717A] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 bg-[#71717A] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 bg-[#71717A] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {chatMeta?.escalation && (
                  <div className="mx-3 mt-2 px-3 py-2 rounded-lg border border-[rgba(239,68,68,0.25)] bg-[rgba(239,68,68,0.06)] flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#ef4444] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span className="text-xs text-[#ef4444]">
                      <strong>Escalation detected</strong> — This conversation would be transferred to a human agent in production.
                    </span>
                  </div>
                )}

                <div className="border-t border-[var(--border-subtle)] p-3 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
                    placeholder={chatLoading ? "Waiting for response..." : "Type a test message..."}
                    disabled={chatLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={chatLoading}
                    className="gradient-btn !text-white px-4 py-2.5 rounded-xl glow-sm hover:glow-md transition-all disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>

              <button
                onClick={handleAnalyze}
                disabled={chatMessages.length === 0 || analyzing || chatLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-[rgba(139,92,246,0.2)] bg-[rgba(139,92,246,0.06)] text-sm font-semibold text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.12)] hover:border-[rgba(139,92,246,0.4)] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {analyzing ? "Analyzing..." : "Analyze Sentiment"}
              </button>

              {analysis && (
                <div className="card-gradient border border-[rgba(139,92,246,0.15)] rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)]">Conversation Analysis</h4>
                    <button onClick={() => setAnalysis(null)} className="text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-[var(--text-secondary)]">Sentiment</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        analysis.sentiment === "positive" ? "bg-[rgba(34,197,94,0.12)] text-[#22c55e]"
                        : analysis.sentiment === "negative" ? "bg-[rgba(239,68,68,0.12)] text-[#ef4444]"
                        : "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]"
                      }`}>
                        {analysis.sentiment.toUpperCase()} ({analysis.sentimentScore}/100)
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--bg-hover)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${analysis.sentimentScore}%`,
                          background: analysis.sentimentScore >= 60
                            ? "#22c55e"
                            : analysis.sentimentScore >= 40
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Escalation</div>
                      {analysis.escalation ? (
                        <div>
                          <span className="text-xs font-semibold text-[#ef4444]">Required</span>
                          {analysis.escalationReason && (
                            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{analysis.escalationReason}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-[#22c55e]">Not needed</span>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)]">
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Language</div>
                      <span className="text-xs font-semibold text-[var(--text-primary)] uppercase">{analysis.language}</span>
                    </div>
                  </div>

                  {analysis.topics.length > 0 && (
                    <div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-2">Topics</div>
                      <div className="flex flex-wrap gap-1.5">
                        {analysis.topics.map((t, i) => (
                          <span key={i} className="text-[10px] font-medium px-2 py-1 rounded-md bg-[rgba(139,92,246,0.1)] text-[#8B5CF6]">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {analysis.summary && (
                    <div>
                      <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">Summary</div>
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{analysis.summary}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
