import { getSessionContext } from "@/server/auth-utils";
import { prisma } from "@/server/prisma";

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

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, businessId: ctx.activeBusinessId },
    select: { aiEnabled: true },
  });

  if (!conversation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const next = !conversation.aiEnabled;
  const { count } = await prisma.conversation.updateMany({
    where: { id: conversationId, businessId: ctx.activeBusinessId },
    data: { aiEnabled: next },
  });
  if (count !== 1) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ aiEnabled: next });
}
