"use server";

import { prisma } from "./prisma";
import { requireAuth, getActiveBusinessId } from "./auth-utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { AgentTone } from "@/generated/prisma/enums";
import { onboardingSchema, agentSchema, settingsSchema } from "./validation";

// ─── Helpers ───

async function getBusinessId(): Promise<string> {
  const id = await getActiveBusinessId();
  if (!id) throw new Error("No active business");
  return id;
}

// ─── Onboarding ───

export async function completeOnboarding(raw: {
  businessName: string;
  industry: string;
  website: string;
  agentName: string;
  agentTone: string;
  phone: string;
}) {
  const data = onboardingSchema.parse(raw);
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
  const data = agentSchema.parse({
    name: formData.get("name"),
    tone: formData.get("tone") || "PROFESSIONAL",
    industry: formData.get("industry") || null,
    systemPrompt: formData.get("systemPrompt") || null,
    knowledgeBase: formData.get("knowledgeBase") || null,
  });

  const agent = await prisma.agent.create({
    data: { ...data, tone: data.tone as AgentTone, status: "DRAFT", businessId },
  });

  redirect(`/dashboard/agents/${agent.id}`);
}

export async function updateAgent(id: string, formData: FormData) {
  const businessId = await getBusinessId();
  const data = agentSchema.parse({
    name: formData.get("name"),
    tone: formData.get("tone") || "PROFESSIONAL",
    industry: formData.get("industry") || null,
    systemPrompt: formData.get("systemPrompt") || null,
    knowledgeBase: formData.get("knowledgeBase") || null,
  });

  await prisma.agent.update({
    where: { id, businessId },
    data: { ...data, tone: data.tone as AgentTone },
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

// ─── Settings ───

export async function updateSettings(raw: { businessName: string; timezone: string }) {
  const data = settingsSchema.parse(raw);
  const businessId = await getBusinessId();

  await prisma.business.update({
    where: { id: businessId },
    data: { name: data.businessName, timezone: data.timezone },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
}

export async function updatePassword(currentPassword: string, newPassword: string) {
  const ctx = await requireAuth();
  const bcrypt = await import("bcryptjs");

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { password: true },
  });
  if (!user?.password) throw new Error("No password set");

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw new Error("Current password is incorrect");

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: ctx.userId },
    data: { password: hashed },
  });
}

export async function requestPasswordReset(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) return;
  // In production: generate token, save to DB, send email via SendGrid/Resend
  // For now: log the reset request
  console.log(`Password reset requested for ${email}`);
}
