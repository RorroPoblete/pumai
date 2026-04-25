import OpenAI from "openai";
import type { ChatCompletionContentPart, ChatCompletionMessageParam } from "openai/resources/chat/completions";

// ─── Types ───

export interface ChatMeta {
  sentiment: "positive" | "neutral" | "negative";
  escalation: boolean;
  language: string;
}

export interface AgentContext {
  agentName: string;
  tone: string;
  systemPrompt: string;
  knowledgeBase: string;
}

// ─── OpenAI Client (lazy) ───

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _client;
}

// ─── System Prompt Builder ───

export function buildSystemPrompt(ctx: AgentContext): string {
  const toneMap: Record<string, string> = {
    CASUAL: "Use a relaxed, conversational tone — but always professional. No slang, no informal address. This is a service interaction.",
    FRIENDLY: "Use a warm, welcoming tone. Be approachable and personable while staying professional. No slang.",
    PROFESSIONAL: "Use a professional, polished tone. Be courteous, efficient, and clear.",
  };

  return [
    `You are ${ctx.agentName || "an AI assistant"} — a customer service agent for an Australian business.`,
    toneMap[ctx.tone] || toneMap.PROFESSIONAL,
    "Keep responses concise (1-3 sentences max) since this is messaging/chat. Use Australian English (favourite, colour, organisation).",
    "If the customer speaks in a language other than English, respond in their language while maintaining the same tone and role.",
    "If the customer shows signs of needing human assistance (anger, complex issues beyond your scope, explicit request for a person, legal threats, emergencies), clearly state you are transferring them and include the phrase '[ESCALATE]' at the end of your response.",
    ctx.systemPrompt && `\n--- Agent Instructions ---\n${ctx.systemPrompt}`,
    ctx.knowledgeBase && `\n--- Knowledge Base ---\n${ctx.knowledgeBase}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ─── Streaming Chat Response ───

export interface ChatMessage {
  role: string;
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
}

function buildMessage(m: ChatMessage): ChatCompletionMessageParam {
  const role = m.role === "agent" ? "assistant" : "user";
  if (role === "user" && m.attachmentUrl && m.attachmentType?.startsWith("image/")) {
    const parts: ChatCompletionContentPart[] = [];
    if (m.content && m.content.trim() && m.content !== "[image]") {
      parts.push({ type: "text", text: m.content });
    }
    parts.push({ type: "image_url", image_url: { url: m.attachmentUrl } });
    return { role: "user", content: parts };
  }
  return { role, content: m.content };
}

export async function streamChatResponse(
  systemContent: string,
  messages: ChatMessage[],
) {
  const openai = getClient();
  return openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    max_tokens: 400,
    messages: [
      { role: "system", content: systemContent } as ChatCompletionMessageParam,
      ...messages.map(buildMessage),
    ],
  });
}

// ─── Non-Streaming Chat Response (for webhook pipeline) ───

export async function getChatResponse(
  systemContent: string,
  messages: ChatMessage[],
): Promise<string> {
  const openai = getClient();
  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 400,
    messages: [
      { role: "system", content: systemContent } as ChatCompletionMessageParam,
      ...messages.map(buildMessage),
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? "";
}

// ─── Sentiment & Metadata Analysis ───

export async function analyzeConversation(
  messages: { role: string; content: string }[],
): Promise<ChatMeta> {
  const openai = getClient();

  const lastMessages = messages.slice(-6);
  const convo = lastMessages
    .map((m) => `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`)
    .join("\n");

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 80,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `Analyze this customer service conversation. Return ONLY valid JSON, no other text.
Format: {"sentiment":"positive|neutral|negative","escalation":true|false,"language":"ISO 639-1 code"}
- sentiment: overall customer sentiment based on their messages
- escalation: true if customer needs human handoff (angry, complex issue, legal, emergency, explicit request)
- language: primary language the customer is writing in`,
      },
      { role: "user", content: convo },
    ],
  });

  const raw = res.choices[0]?.message?.content?.trim() ?? "";
  try {
    const parsed = JSON.parse(raw);
    return {
      sentiment: ["positive", "neutral", "negative"].includes(parsed.sentiment) ? parsed.sentiment : "neutral",
      escalation: parsed.escalation === true,
      language: parsed.language || "en",
    };
  } catch {
    return { sentiment: "neutral", escalation: false, language: "en" };
  }
}
