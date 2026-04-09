import { notFound } from "next/navigation";
import { prisma } from "@/backend/prisma";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import AgentEditor from "@/frontend/components/dashboard/AgentEditor";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;
  if (!user?.id) notFound();

  // Resolve active business: cookie > membership > legacy 1:1
  const cookieStore = await cookies();
  const cookieBiz = cookieStore.get("pumai_active_business")?.value;
  let businessId: string | null = null;

  if (cookieBiz && user.role === "SUPERADMIN") {
    businessId = cookieBiz;
  } else if (cookieBiz) {
    const member = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: user.id!, businessId: cookieBiz } },
    });
    if (member) businessId = cookieBiz;
  }

  if (!businessId) {
    const biz = await prisma.business.findUnique({
      where: { userId: user.id! },
      select: { id: true },
    });
    businessId = biz?.id ?? null;
  }

  if (!businessId) notFound();

  const agent = await prisma.agent.findUnique({
    where: { id, businessId },
  });
  if (!agent) notFound();

  return (
    <AgentEditor
      agent={{
        id: agent.id,
        name: agent.name,
        tone: agent.tone,
        industry: agent.industry ?? "",
        status: agent.status,
        systemPrompt: agent.systemPrompt ?? "",
        knowledgeBase: agent.knowledgeBase ?? "",
      }}
    />
  );
}
