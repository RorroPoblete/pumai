import { getSessionContext } from "@/server/auth-utils";
import { rateLimit } from "@/server/rate-limit";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`analyze:${ctx.activeBusinessId ?? ctx.userId}`, 10, 60000);
  if (!rl.ok) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const { messages } = await req.json();

  const convo = messages
    .map((m: { role: string; content: string }) =>
      `${m.role === "user" ? "Customer" : "Agent"}: ${m.content}`,
    )
    .join("\n");

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    max_tokens: 250,
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `You are a conversation analyst for a customer service platform. Analyze the conversation and return ONLY valid JSON with this exact format:
{
  "sentiment": "positive" | "neutral" | "negative",
  "sentimentScore": number between 0 and 100 (0 = very negative, 50 = neutral, 100 = very positive),
  "escalation": true | false,
  "escalationReason": "brief reason if escalation is true, or null",
  "language": "ISO 639-1 code",
  "topics": ["array", "of", "main", "topics"],
  "summary": "One sentence summary of the conversation so far"
}`,
      },
      { role: "user", content: convo },
    ],
  });

  const raw = res.choices[0]?.message?.content?.trim() ?? "{}";
  try {
    return Response.json(JSON.parse(raw));
  } catch {
    return Response.json({
      sentiment: "neutral",
      sentimentScore: 50,
      escalation: false,
      escalationReason: null,
      language: "en",
      topics: [],
      summary: "Unable to analyze conversation.",
    });
  }
}
