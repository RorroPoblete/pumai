import { notFound } from "next/navigation";
import { prisma } from "@/backend/prisma";
import { getActiveBusinessId } from "@/backend/auth-utils";
import AgentEditor from "@/components/dashboard/AgentEditor";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = await getActiveBusinessId();
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
