"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import TopBar from "./TopBar";
import { updateAgent, createAgent, deleteAgent, toggleAgentStatus } from "@/lib/actions";

interface AgentData {
  id?: string;
  name: string;
  tone: string;
  industry: string;
  status: string;
  systemPrompt: string;
  knowledgeBase: string;
}

const tabs = ["Configuration", "System Prompt", "Knowledge Base", "Test"] as const;
type Tab = (typeof tabs)[number];

const industries = [
  "Healthcare",
  "Automotive",
  "Real Estate",
  "E-commerce & Retail",
  "Trades & Services",
  "Hospitality",
  "Education",
  "Other",
];

const toneOptions = [
  { value: "PROFESSIONAL", label: "Professional", desc: "Formal & polished" },
  { value: "FRIENDLY", label: "Friendly", desc: "Warm & approachable" },
  { value: "CASUAL", label: "Casual", desc: "Relaxed & laid-back" },
];

const promptTemplates: Record<string, string> = {
  Healthcare: `You are a virtual receptionist for an Australian medical clinic.

ROLE: Book/reschedule/cancel appointments, answer clinic questions, provide pre-appointment instructions, triage urgency.

RULES:
- Be empathetic, professional, and concise (1-3 sentences for SMS)
- NEVER provide medical diagnoses or medication advice
- Emergencies (chest pain, breathing difficulty, severe bleeding): direct to 000 immediately
- After-hours: direct to 13SICK (13 7425) or nearest ED
- Confirm bookings with: date, time, doctor, "please arrive 10 min early"
- Use Australian English

ESCALATE TO HUMAN: upset patient, billing disputes, complex medical questions, complaints.`,

  Automotive: `You are a virtual assistant for an Australian car dealership.

ROLE: Help with test drives, service bookings, vehicle enquiries, trade-in estimates, finance overview.

RULES:
- Be relaxed and approachable — like a mate who knows cars
- Keep it short for SMS (1-3 sentences)
- Use casual Australian language (arvo, reckon, no worries, mate)
- Give ballpark prices only, recommend visiting for final figures
- NEVER lock in exact prices or finance rates via SMS
- For mechanical issues, recommend booking a service

ESCALATE TO HUMAN: price negotiation, finance docs, warranty/lemon law, complaints.`,

  "Real Estate": `You are a virtual property assistant for an Australian real estate agency.

ROLE: Help buyers/renters find properties, answer listing questions, schedule inspections, qualify leads, provide suburb info.

RULES:
- Be warm, enthusiastic, and genuinely helpful
- Keep concise for SMS (1-3 sentences), offer email for detailed info
- Use AUD with commas ($1,250,000)
- NEVER guarantee property values or investment returns
- Collect: budget, preferred suburbs, bedrooms, timeline
- Use Australian English and local references

ESCALATE TO HUMAN: formal offers, contracts, settlement questions, vendor enquiries, complaints.`,

  "E-commerce & Retail": `You are a customer support assistant for an Australian online retailer.

ROLE: Track orders, process returns/exchanges, answer product questions, resolve delivery issues, handle discount codes.

RULES:
- Be polite, efficient, and solution-oriented
- Keep concise for SMS (1-3 sentences)
- Always provide the next actionable step
- For returns: confirm order number, reason, preferred resolution
- NEVER share customer data or process payments via SMS
- Apologise sincerely for mistakes — don't blame carriers
- Set clear expectations: "I'll investigate and get back to you within 24 hours"

ESCALATE TO HUMAN: refunds over $200, third attempt same issue, manager request, legal threats.`,

  "Trades & Services": `You are a booking assistant for an Australian trades business (plumber, electrician, builder, etc).

ROLE: Schedule jobs, provide rough quotes, confirm appointments, follow up on completed work, answer service questions.

RULES:
- Be practical, straightforward, and reliable
- Keep concise for SMS (1-3 sentences)
- Collect: name, address, issue description, preferred date/time
- Give price ranges only — final quote after on-site inspection
- Emergency callouts: confirm surcharge and estimated arrival
- Use Australian English

ESCALATE TO HUMAN: quotes over $5,000, complaints, insurance/warranty claims, safety concerns.`,

  Hospitality: `You are a booking assistant for an Australian restaurant/bar.

ROLE: Take and modify reservations, answer menu and dietary questions, assist with event enquiries, share location info.

RULES:
- Be warm, welcoming, and enthusiastic about the dining experience
- Keep concise for SMS (1-3 sentences)
- Collect for bookings: name, date, time, number of guests, special requests
- Confirm: "Booked! [Name], [date] at [time] for [X] guests"
- Groups over 10: direct to events team
- NEVER guarantee specific table locations — note as "request"
- For allergies: reassure but recommend discussing with chef on arrival

ESCALATE TO HUMAN: events 10+, dining complaints, gift voucher disputes, large cancellations.`,
};

export default function AgentEditor({ agent }: { agent: AgentData }) {
  const isNew = !agent.id;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<Tab>("Configuration");
  const [saved, setSaved] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const [name, setName] = useState(agent.name);
  const [tone, setTone] = useState(agent.tone);
  const [industry, setIndustry] = useState(agent.industry);
  const [systemPrompt, setSystemPrompt] = useState(agent.systemPrompt);
  const [knowledgeBase, setKnowledgeBase] = useState(agent.knowledgeBase);

  // Chat state
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "agent"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  function handleSave() {
    const fd = new FormData();
    fd.set("name", name);
    fd.set("tone", tone);
    fd.set("industry", industry);
    fd.set("systemPrompt", systemPrompt);
    fd.set("knowledgeBase", knowledgeBase);

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

  function handleApplyTemplate() {
    const tpl = promptTemplates[industry];
    if (tpl && (!systemPrompt || confirm("Replace current system prompt with template?"))) {
      setSystemPrompt(tpl);
    }
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
          systemPrompt,
          knowledgeBase,
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
        const current = agentReply;
        setChatMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "agent", content: current },
        ]);
        scrollChat();
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

  return (
    <>
      <TopBar title={isNew ? "New Agent" : `Edit: ${agent.name}`} />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Top bar: back + actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push("/dashboard/agents")}
              className="text-sm text-[#A1A1AA] hover:text-white transition-colors"
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
                disabled={isPending || !name.trim()}
                className="gradient-btn text-white text-sm font-semibold px-6 py-2 rounded-lg glow-sm hover:glow-md transition-all disabled:opacity-50"
              >
                {isPending ? "Saving..." : saved ? "Saved!" : isNew ? "Create Agent" : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-[rgba(255,255,255,0.06)] pb-px">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-sm font-medium transition-colors rounded-t-lg ${
                  tab === t
                    ? "text-white border-b-2 border-[#8B5CF6] bg-[rgba(139,92,246,0.08)]"
                    : "text-[#71717A] hover:text-[#A1A1AA] hover:bg-[rgba(255,255,255,0.03)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Tab: Configuration */}
          {tab === "Configuration" && (
            <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                  Agent name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sam, Reception Bot, Support"
                  className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white text-sm placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
                />
              </div>

              {/* Tone */}
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-3">
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
                          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(139,92,246,0.3)]"
                      }`}
                    >
                      <div className="text-sm font-semibold text-white">{t.label}</div>
                      <div className="text-xs text-[#71717A] mt-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Industry */}
              <div>
                <label className="block text-xs font-medium text-[#A1A1AA] mb-3">
                  Industry
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {industries.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => setIndustry(ind)}
                      className={`px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                        industry === ind
                          ? "border-[#8B5CF6] bg-[rgba(139,92,246,0.12)] text-white"
                          : "border-[rgba(255,255,255,0.08)] text-[#A1A1AA] hover:border-[rgba(139,92,246,0.3)]"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab: System Prompt */}
          {tab === "System Prompt" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-[#A1A1AA]">
                  Define your agent&apos;s personality, instructions, and behaviour rules.
                </p>
                {industry && promptTemplates[industry] && (
                  <button
                    onClick={handleApplyTemplate}
                    className="text-xs font-semibold text-[#8B5CF6] hover:text-[#A78BFA] transition-colors px-3 py-1.5 rounded-lg border border-[rgba(139,92,246,0.3)] hover:bg-[rgba(139,92,246,0.08)]"
                  >
                    Apply {industry} template
                  </button>
                )}
              </div>
              <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">System Prompt</span>
                  <span className="text-[10px] text-[#71717A]">{systemPrompt.length} chars</span>
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={16}
                  placeholder="You are a helpful AI assistant for [business name]. You help customers with..."
                  className="w-full px-4 py-4 bg-transparent text-sm text-[#e2e8f0] placeholder-[#71717A] focus:outline-none resize-none leading-relaxed font-mono"
                />
              </div>
              <div className="text-xs text-[#71717A] space-y-1">
                <p><strong className="text-[#A1A1AA]">Tips:</strong></p>
                <p>- Start with &quot;You are...&quot; to define the agent&apos;s role</p>
                <p>- Include specific business information (hours, services, policies)</p>
                <p>- Define boundaries (what the agent should NOT do)</p>
                <p>- Add escalation rules (when to hand off to a human)</p>
              </div>
            </div>
          )}

          {/* Tab: Knowledge Base */}
          {tab === "Knowledge Base" && (
            <div className="space-y-4">
              <p className="text-sm text-[#A1A1AA]">
                Add your FAQs, product information, policies, and any context your agent needs to answer customer questions accurately.
              </p>
              <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">Knowledge Base</span>
                  <span className="text-[10px] text-[#71717A]">{knowledgeBase.length} chars</span>
                </div>
                <textarea
                  value={knowledgeBase}
                  onChange={(e) => setKnowledgeBase(e.target.value)}
                  rows={20}
                  placeholder={`# FAQs\n\nQ: What are your opening hours?\nA: We're open Monday to Friday, 9am to 5pm AEST.\n\nQ: How do I book an appointment?\nA: You can book online at our website or reply here with your preferred time.\n\n# Services\n\n- Service 1: Description and pricing\n- Service 2: Description and pricing\n\n# Policies\n\n- Cancellation policy: 24 hours notice required\n- Payment: We accept card, cash, and bank transfer`}
                  className="w-full px-4 py-4 bg-transparent text-sm text-[#e2e8f0] placeholder-[#71717A] focus:outline-none resize-none leading-relaxed font-mono"
                />
              </div>
              <div className="text-xs text-[#71717A] space-y-1">
                <p><strong className="text-[#A1A1AA]">What to include:</strong></p>
                <p>- Frequently asked questions and answers</p>
                <p>- Product/service catalogue with prices</p>
                <p>- Business policies (refunds, cancellations, warranties)</p>
                <p>- Contact information and business hours</p>
                <p>- Any specific instructions or scripts</p>
              </div>
            </div>
          )}

          {/* Tab: Test */}
          {tab === "Test" && (
            <div className="space-y-4">
              <p className="text-sm text-[#A1A1AA]">
                Test your agent by simulating a conversation. Responses are mocked until AI integration is connected.
              </p>

              {/* Channel selector visual */}
              <div className="flex gap-3">
                <div className="flex-1 card-gradient border border-[rgba(34,197,94,0.2)] rounded-xl p-3 text-center">
                  <svg className="w-5 h-5 mx-auto mb-1 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div className="text-xs font-semibold text-[#22c55e]">SMS Preview</div>
                </div>
                <div className="flex-1 card-gradient border border-[rgba(59,130,246,0.2)] rounded-xl p-3 text-center">
                  <svg className="w-5 h-5 mx-auto mb-1 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <div className="text-xs font-semibold text-[#3b82f6]">WhatsApp Preview</div>
                </div>
              </div>

              {/* Chat window */}
              <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
                {/* Chat header */}
                <div className="px-4 py-3 border-b border-[rgba(255,255,255,0.06)] flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center text-xs font-bold text-white">
                    {name.charAt(0) || "A"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{name || "Agent"}</div>
                    <div className="text-[10px] text-[#22c55e]">Online</div>
                  </div>
                  <button
                    onClick={() => setChatMessages([])}
                    className="ml-auto text-xs text-[#71717A] hover:text-[#A1A1AA] transition-colors"
                  >
                    Clear chat
                  </button>
                </div>

                {/* Messages */}
                <div className="h-80 overflow-y-auto p-4 space-y-3">
                  {chatMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full text-sm text-[#71717A]">
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
                            ? "bg-[#8B5CF6] text-white rounded-br-md"
                            : "bg-[rgba(255,255,255,0.06)] text-[#e2e8f0] rounded-bl-md"
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

                {/* Input */}
                <div className="border-t border-[rgba(255,255,255,0.06)] p-3 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendTest()}
                    placeholder={chatLoading ? "Waiting for response..." : "Type a test message..."}
                    disabled={chatLoading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendTest}
                    disabled={chatLoading}
                    className="gradient-btn text-white px-4 py-2.5 rounded-xl glow-sm hover:glow-md transition-all disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="text-xs text-[#71717A] p-3 rounded-lg border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.05)]">
                <strong className="text-[#22c55e]">AI connected:</strong> Responses powered by GPT-4o Mini using your system prompt and knowledge base.
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
