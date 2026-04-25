import { notFound } from "next/navigation";
import { prisma } from "@/server/prisma";
import { getActiveBusinessId } from "@/server/auth-utils";
import { getScrapeQuota } from "@/server/agent-autofill";
import AgentEditor from "@/components/dashboard/AgentEditor";
import type { FormState } from "@/lib/agent-templates";

export default async function EditAgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const businessId = await getActiveBusinessId();
  if (!businessId) notFound();

  const [agent, rawQuota] = await Promise.all([
    prisma.agent.findUnique({ where: { id, businessId } }),
    getScrapeQuota(),
  ]);
  if (!agent) notFound();

  const config: FormState | null =
    agent.config && typeof agent.config === "object" && !Array.isArray(agent.config)
      ? (agent.config as FormState)
      : null;

  const quota = {
    used: rawQuota.used,
    max: Number.isFinite(rawQuota.max) ? rawQuota.max : 999,
    remaining: Number.isFinite(rawQuota.remaining) ? rawQuota.remaining : 999,
    admin: rawQuota.admin,
  };

  return (
    <AgentEditor
      agent={{
        id: agent.id,
        name: agent.name,
        tone: agent.tone,
        industry: agent.industry ?? "",
        status: agent.status,
        config,
      }}
      quota={quota}
    />
  );
}
