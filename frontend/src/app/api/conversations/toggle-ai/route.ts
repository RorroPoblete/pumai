import { getSessionContext } from "@/backend/auth-utils";
import { prisma } from "@/backend/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ctx = await getSessionContext();
  if (!ctx?.activeBusinessId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = (await req.json()) as { conversationId?: string };
  if (!conversationId) {
    return Response.json({ error: "conversationId is required" }, { status: 400 });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, businessId: ctx.activeBusinessId },
    select: { aiEnabled: true },
  });

  if (!conversation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { aiEnabled: !conversation.aiEnabled },
  });

  return Response.json({ aiEnabled: !conversation.aiEnabled });
}
