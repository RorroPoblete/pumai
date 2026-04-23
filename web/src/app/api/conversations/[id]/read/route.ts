// ─── Mark Conversation Read ───
// Marks all unread USER messages in the conversation as read when the agent
// opens it from the dashboard.

import { prisma } from "@/server/prisma";
import { getActiveBusinessId } from "@/server/auth-utils";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const businessId = await getActiveBusinessId();
  if (!businessId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const conv = await prisma.conversation.findFirst({
    where: { id, businessId },
    select: { id: true },
  });
  if (!conv) return Response.json({ error: "Not found" }, { status: 404 });

  await prisma.message.updateMany({
    where: { conversationId: id, role: "USER", readAt: null },
    data: { readAt: new Date() },
  });

  return Response.json({ ok: true });
}
