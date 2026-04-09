import { auth } from "@/auth";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const { messages, systemPrompt, knowledgeBase, agentName, tone } = await req.json();

  const toneInstruction =
    tone === "CASUAL"
      ? "Use a casual, laid-back Australian tone. Be relaxed and use informal language."
      : tone === "FRIENDLY"
        ? "Use a warm, friendly tone. Be approachable and personable."
        : "Use a professional, polished tone. Be courteous and efficient.";

  const systemContent = [
    `You are ${agentName || "an AI assistant"} — an SMS/WhatsApp agent for an Australian business.`,
    toneInstruction,
    "Keep responses concise (1-3 sentences) since this is SMS/chat. Use Australian English (favourite, colour, etc).",
    systemPrompt && `\n--- Agent Instructions ---\n${systemPrompt}`,
    knowledgeBase && `\n--- Knowledge Base ---\n${knowledgeBase}`,
  ]
    .filter(Boolean)
    .join("\n");

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    stream: true,
    max_tokens: 300,
    messages: [
      { role: "system", content: systemContent },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "agent" ? "assistant" : ("user" as const),
        content: m.content,
      })),
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          controller.enqueue(encoder.encode(text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
