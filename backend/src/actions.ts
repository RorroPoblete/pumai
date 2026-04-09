"use server";

import { prisma } from "./prisma";
import { requireAuth, getActiveBusinessId } from "./auth-utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AgentTone } from "@/generated/prisma/enums";

// ─── Helpers ───

async function getBusinessId(): Promise<string> {
  const id = await getActiveBusinessId();
  if (!id) throw new Error("No active business");
  return id;
}

// ─── Onboarding ───

export async function completeOnboarding(data: {
  businessName: string;
  industry: string;
  website: string;
  agentName: string;
  agentTone: string;
  phone: string;
}) {
  const ctx = await requireAuth();

  const existing = await prisma.business.findUnique({ where: { userId: ctx.userId } });
  if (existing) redirect("/dashboard");

  await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: data.businessName || "My Business",
        industry: data.industry || "Other",
        website: data.website || null,
        phone: data.phone || null,
        userId: ctx.userId,
      },
    });

    await tx.businessMember.create({
      data: { userId: ctx.userId, businessId: business.id, role: "OWNER" },
    });

    if (data.agentName) {
      await tx.agent.create({
        data: {
          name: data.agentName,
          tone: (data.agentTone?.toUpperCase() || "PROFESSIONAL") as AgentTone,
          industry: data.industry || null,
          status: "ACTIVE",
          businessId: business.id,
        },
      });
    }

    await tx.user.update({
      where: { id: ctx.userId },
      data: { onboarded: true },
    });
  });

  redirect("/dashboard");
}

// ─── Agent CRUD ───

export async function createAgent(formData: FormData) {
  const businessId = await getBusinessId();

  const agent = await prisma.agent.create({
    data: {
      name: formData.get("name") as string,
      tone: ((formData.get("tone") as string) || "PROFESSIONAL") as AgentTone,
      industry: (formData.get("industry") as string) || null,
      systemPrompt: (formData.get("systemPrompt") as string) || null,
      knowledgeBase: (formData.get("knowledgeBase") as string) || null,
      status: "DRAFT" as const,
      businessId,
    },
  });

  redirect(`/dashboard/agents/${agent.id}`);
}

export async function updateAgent(id: string, formData: FormData) {
  const businessId = await getBusinessId();

  await prisma.agent.update({
    where: { id, businessId },
    data: {
      name: formData.get("name") as string,
      tone: ((formData.get("tone") as string) || "PROFESSIONAL") as AgentTone,
      industry: (formData.get("industry") as string) || null,
      systemPrompt: (formData.get("systemPrompt") as string) || null,
      knowledgeBase: (formData.get("knowledgeBase") as string) || null,
    },
  });

  revalidatePath("/dashboard/agents");
  revalidatePath(`/dashboard/agents/${id}`);
}

export async function toggleAgentStatus(id: string) {
  const businessId = await getBusinessId();

  const agent = await prisma.agent.findUnique({
    where: { id, businessId },
    select: { status: true },
  });
  if (!agent) throw new Error("Agent not found");

  await prisma.agent.update({
    where: { id, businessId },
    data: { status: agent.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
  });

  revalidatePath("/dashboard/agents");
  revalidatePath(`/dashboard/agents/${id}`);
}

export async function deleteAgent(id: string) {
  const businessId = await getBusinessId();

  await prisma.agent.delete({ where: { id, businessId } });

  revalidatePath("/dashboard/agents");
  redirect("/dashboard/agents");
}
