// ─── Webchat Read Receipt Endpoint ───
// Marks all agent messages in the visitor's conversation as read when the
// widget panel opens or new agent messages arrive.

import { prisma } from "@/backend/prisma";
import { corsOptions, json } from "../../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return corsOptions(req);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;
  const { sessionId } = (await req.json()) as { sessionId?: string };
  if (!sessionId) return json({ error: "sessionId required" }, 400, req);

  const config = await prisma.channelConfig.findFirst({
    where: { channel: "WEBCHAT", externalId: widgetKey, active: true },
    select: { businessId: true },
  });
  if (!config) return json({ error: "Widget not found" }, 404, req);

  const conversation = await prisma.conversation.findUnique({
    where: {
      businessId_channel_contactExternalId: {
        businessId: config.businessId,
        channel: "WEBCHAT",
        contactExternalId: sessionId,
      },
    },
    select: { id: true },
  });
  if (!conversation) return json({ ok: true }, 200, req);

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      role: "AGENT",
      readAt: null,
    },
    data: { readAt: new Date() },
  });

  return json({ ok: true }, 200, req);
}
