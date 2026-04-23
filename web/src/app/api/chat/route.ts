import { getSessionContext } from "@/server/auth-utils";
import { buildSystemPrompt, streamChatResponse, analyzeConversation } from "@/server/ai";
import { rateLimit } from "@/server/rate-limit";
import { chatSchema } from "@/server/validation";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await rateLimit(`chat:${ctx.activeBusinessId ?? ctx.userId}`, 20, 60000);
  if (!rl.ok) {
    return Response.json({ error: "Too many requests. Try again in a minute." }, { status: 429 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const body = await req.json();
  const { messages, systemPrompt, knowledgeBase, agentName, tone } = chatSchema.parse(body);

  const systemContent = buildSystemPrompt({ agentName, tone, systemPrompt, knowledgeBase });
  const stream = await streamChatResponse(systemContent, messages);

  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      // Stream the AI response
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) {
          fullResponse += text;
          controller.enqueue(encoder.encode(text));
        }
      }

      // After stream ends, analyze the full conversation for metadata
      try {
        const allMessages = [
          ...messages,
          { role: "agent", content: fullResponse },
        ];
        const meta = await analyzeConversation(allMessages);

        // Check if AI flagged escalation in its response
        if (fullResponse.includes("[ESCALATE]")) {
          meta.escalation = true;
        }

        // Send metadata as a delimited JSON line
        controller.enqueue(encoder.encode(`\n__META__${JSON.stringify(meta)}`));
      } catch {
        // Metadata analysis failed — still close stream gracefully
      }

      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
