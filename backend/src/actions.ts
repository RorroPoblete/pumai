"use server";

import { prisma } from "./prisma";
import { auth } from "@/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AgentTone } from "@/generated/prisma/enums";

// ─── Helpers ───

async function getSessionUser() {
  const session = await auth();
  const user = session?.user as Record<string, unknown> | undefined;
  if (!user?.id) throw new Error("Not authenticated");
  return {
    userId: user.id as string,
    role: (user.role as string) ?? "USER",
    activeBusinessId: (user.activeBusinessId as string) ?? null,
    businessRole: (user.businessRole as string) ?? null,
  };
}

async function getBusinessId(): Promise<string> {
  const ctx = await getSessionUser();
  if (ctx.activeBusinessId) return ctx.activeBusinessId;
  // Fallback: legacy 1:1
  const business = await prisma.business.findUnique({
    where: { userId: ctx.userId },
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
  const ctx = await getSessionUser();

  const existing = await prisma.business.findUnique({ where: { userId: ctx.userId } });
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
        userId: ctx.userId,
      },
    });

    // Create owner membership
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

// ─── Tenant Switching ───

export async function switchTenant(businessId: string) {
  const ctx = await getSessionUser();

  // Superadmin can switch to any business
  if (ctx.role === "SUPERADMIN") {
    const biz = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
    if (!biz) throw new Error("Business not found");
  } else {
    // Regular users can only switch to businesses they're a member of
    const membership = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: ctx.userId, businessId } },
    });
    if (!membership) throw new Error("Not a member of this business");
  }

  const cookieStore = await cookies();
  cookieStore.set("pumai_active_business", businessId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/dashboard", "layout");
  redirect("/dashboard");
}

