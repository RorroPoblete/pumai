// ─── Webchat Read Receipt Endpoint ───
// Marks all agent messages in the visitor's conversation as read when the
// widget panel opens or new agent messages arrive.

import { prisma } from "@/server/prisma";
import { corsOptions, json, originAllowed, resolveWebchatConfig } from "../../_shared";

export const dynamic = "force-dynamic";

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

  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) return json({ error: "sessionId required" }, 400, req, resolved.allowedOrigins);

  const conversation = await prisma.conversation.findUnique({
    where: {
      businessId_channel_contactExternalId: {
        businessId: resolved.businessId,
        channel: "WEBCHAT",
        contactExternalId: sessionId,
      },
    },
    select: { id: true },
  });
  if (!conversation) return json({ ok: true }, 200, req, resolved.allowedOrigins);

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      role: "AGENT",
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return json({ ok: true }, 200, req, resolved.allowedOrigins);
}
