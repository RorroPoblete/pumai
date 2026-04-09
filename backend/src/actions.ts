"use server";

import { prisma } from "./prisma";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AgentTone } from "@/generated/prisma/enums";

// ─── Helpers ───

async function getBusinessId(): Promise<string> {
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) throw new Error("Not authenticated");

  const business = await prisma.business.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!business) throw new Error("No business found");
  return business.id;
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
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  if (!userId) throw new Error("Not authenticated");

  const existing = await prisma.business.findUnique({ where: { userId } });
  if (existing) {
    redirect("/dashboard");
  }

  await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: data.businessName || "My Business",
        industry: data.industry || "Other",
        website: data.website || null,
        phone: data.phone || null,
        userId,
      },
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
      where: { id: userId },
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

  const newStatus = agent.status === "ACTIVE" ? "PAUSED" : "ACTIVE";

  await prisma.agent.update({
    where: { id, businessId },
    data: { status: newStatus },
  });

  revalidatePath("/dashboard/agents");
  revalidatePath(`/dashboard/agents/${id}`);
}

export async function deleteAgent(id: string) {
  const businessId = await getBusinessId();

  await prisma.agent.delete({
    where: { id, businessId },
  });

  revalidatePath("/dashboard/agents");
  redirect("/dashboard/agents");
}
