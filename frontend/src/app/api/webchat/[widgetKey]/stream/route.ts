// ─── Webchat Streaming Endpoint ───
// SSE stream: emits token events as AI response generates, then a final done event.

import { prisma } from "@/backend/prisma";
import { buildSystemPrompt, streamChatResponse, analyzeConversation } from "@/backend/ai";
import { CONTEXT_WINDOW_MS, SENTIMENT_MAP } from "@/backend/channels/types";
import { readFile } from "fs/promises";
import path from "path";
import {
  corsHeaders,
  corsOptions,
  enforceRateLimit,
  json,
  originAllowed,
  resolveWebchatConfig,
  visitorFallbackName,
} from "../../_shared";

export const dynamic = "force-dynamic";

interface Body {
  sessionId?: string;
  message?: string;
  visitor?: { name?: string };
  attachment?: { url?: string; type?: string };
}

export async function OPTIONS(req: Request) {
  return corsOptions(req);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;
  const origin = req.headers.get("origin") ?? "";

  const resolved = await resolveWebchatConfig(widgetKey);
  if (!resolved) return json({ error: "Widget not found" }, 404, req);
  if (!originAllowed(origin, resolved.allowedOrigins)) {
    return json({ error: "Origin not allowed" }, 403, req);
  }

  const limited = await enforceRateLimit(req, widgetKey, "msg", 30, 60_000);
  if (limited) return limited;

  const config = await prisma.channelConfig.findUnique({
    where: { id: resolved.id },
    include: { agent: true },
  });
  if (!config) return json({ error: "Widget not found" }, 404, req);

  const body = (await req.json()) as Body;
  const text = body.message?.trim() ?? "";
  const sessionId = body.sessionId?.trim();
  const attachment = body.attachment;
  if (!sessionId || (!text && !attachment?.url)) {
    return json({ error: "sessionId and message or attachment required" }, 400, req);
  }

  const fallbackName = visitorFallbackName(sessionId);
  const conversation = await prisma.conversation.upsert({
    where: {
      businessId_channel_contactExternalId: {
        businessId: config.businessId,
        channel: "WEBCHAT",
        contactExternalId: sessionId,
      },
    },
    create: {
      businessId: config.businessId,
      agentId: config.agentId,
      channel: "WEBCHAT",
      contactExternalId: sessionId,
      contactName: body.visitor?.name || fallbackName,
      status: "ACTIVE",
    },
    update: {
      status: "ACTIVE",
      lastMessageAt: new Date(),
      ...(body.visitor?.name ? { contactName: body.visitor.name } : {}),
    },
  });

  const recentMessages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
      createdAt: { gte: new Date(Date.now() - CONTEXT_WINDOW_MS) },
    },
    orderBy: { createdAt: "asc" },
    take: 30,
    select: { role: true, content: true, attachmentUrl: true, attachmentType: true },
  });

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: text || (attachment?.url ? "[image]" : ""),
        role: "USER",
        attachmentUrl: attachment?.url ?? null,
        attachmentType: attachment?.type ?? null,
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { messagesCount: { increment: 1 }, lastMessageAt: new Date() },
    }),
  ]);

  if (!conversation.aiEnabled) {
    return sseResponse(req, async (send) => {
      send({ type: "done", conversationId: conversation.id, escalated: false });
    });
  }

  const { agent } = config;
  const systemContent = buildSystemPrompt({
    agentName: agent.name,
    tone: agent.tone,
    systemPrompt: agent.systemPrompt ?? "",
    knowledgeBase: agent.knowledgeBase ?? "",
  });

  const history = await Promise.all(
    recentMessages.map(async (m) => ({
      role: m.role.toLowerCase(),
      content: m.content,
      attachmentUrl: await toDataUrl(m.attachmentUrl, m.attachmentType),
      attachmentType: m.attachmentType,
    })),
  );
  history.push({
    role: "user",
    content: text || (attachment?.url ? "[image]" : ""),
    attachmentUrl: await toDataUrl(attachment?.url ?? null, attachment?.type ?? null),
    attachmentType: attachment?.type ?? null,
  });

  return sseResponse(req, async (send) => {
    const stream = await streamChatResponse(systemContent, history);
    let buffer = "";
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content ?? "";
      if (!delta) continue;
      buffer += delta;
      send({ type: "token", content: delta });
    }

    const isEscalated = buffer.includes("[ESCALATE]");
    const cleanResponse = buffer.replace("[ESCALATE]", "").trim();

    await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId: conversation.id,
          content: cleanResponse,
          role: "AGENT",
        },
      }),
      prisma.message.updateMany({
        where: { conversationId: conversation.id, role: "USER", readAt: null },
        data: { readAt: new Date() },
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          messagesCount: { increment: 1 },
          lastMessageAt: new Date(),
          ...(isEscalated ? { status: "ESCALATED" } : {}),
        },
      }),
    ]);

    send({ type: "done", conversationId: conversation.id, escalated: isEscalated });

    analyzeConversation([...history, { role: "agent", content: cleanResponse }])
      .then(async (meta) => {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            sentiment: SENTIMENT_MAP[meta.sentiment] ?? "NEUTRAL",
            ...(meta.escalation ? { status: "ESCALATED" } : {}),
          },
        });
      })
      .catch((err) => console.error(`[Webchat] Analysis failed:`, err));
  });
}

async function toDataUrl(url: string | null, type: string | null): Promise<string | null> {
  if (!url || !type?.startsWith("image/")) return null;
  const match = url.match(/\/api\/uploads\/([a-f0-9]+\.(?:png|jpe?g|webp|gif))$/i);
  if (!match) return url;
  try {
    const dir = process.env.UPLOADS_DIR || "/app/uploads";
    const bytes = await readFile(path.join(dir, match[1]));
    return `data:${type};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

type SendFn = (event: Record<string, unknown>) => void;

function sseResponse(req: Request, run: (send: SendFn) => Promise<void>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send: SendFn = (event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };
      try {
        await run(send);
      } catch (err) {
        console.error("[Webchat SSE] error", err);
        send({ type: "error", message: "Internal error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders(req),
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
