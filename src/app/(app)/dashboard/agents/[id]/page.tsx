import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import AgentEditor from "@/components/dashboard/AgentEditor";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) notFound();

  const business = await prisma.business.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!business) notFound();

  const agent = await prisma.agent.findUnique({
    where: { id, businessId: business.id },
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
