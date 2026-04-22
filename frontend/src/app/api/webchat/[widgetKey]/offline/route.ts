// ─── Webchat Offline Submission ───
// Captures an async message when the widget is in offline mode. Creates a
// conversation with aiEnabled=false so no auto-reply is generated; the
// business replies later from the dashboard.

import { prisma } from "@/backend/prisma";
import { corsOptions, enforceRateLimit, json, resolveWebchatConfig, originAllowed, visitorFallbackName } from "../../_shared";

export const dynamic = "force-dynamic";

interface Body {
  sessionId?: string;
  name?: string;
  message?: string;
}

export async function OPTIONS(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;
  const config = await resolveWebchatConfig(widgetKey);
  return corsOptions(req, config?.allowedOrigins ?? []);
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
    return json({ error: "Origin not allowed" }, 403, req, resolved.allowedOrigins);
  }

  const body = (await req.json()) as Body;
  const sessionId = body.sessionId?.trim();
  const message = body.message?.trim();
  const name = body.name?.trim();

  if (!sessionId || !message) {
    return json({ error: "sessionId and message required" }, 400, req, resolved.allowedOrigins);
  }

  const config = await prisma.channelConfig.findFirst({
    where: { id: resolved.id },
  });
  if (!config) return json({ error: "Widget not found" }, 404, req, resolved.allowedOrigins);

  const limited = await enforceRateLimit(req, widgetKey, "offline", 3, 3_600_000);
  if (limited) return limited;

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
      contactName: name || fallbackName,
      status: "ACTIVE",
      aiEnabled: false,
    },
    update: {
      contactName: name || undefined,
      aiEnabled: false,
      lastMessageAt: new Date(),
    },
  });

  await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: conversation.id,
        content: message,
        role: "USER",
      },
    }),
    prisma.conversation.update({
      where: { id: conversation.id },
      data: { messagesCount: { increment: 1 }, lastMessageAt: new Date() },
    }),
  ]);

  return json({ ok: true, conversationId: conversation.id }, 200, req, resolved.allowedOrigins);
}
