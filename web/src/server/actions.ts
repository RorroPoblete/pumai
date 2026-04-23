"use server";

import { prisma } from "./prisma";
import { requireAuth, getActiveBusinessId } from "./auth-utils";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import type { AgentTone } from "@/generated/prisma/enums";
import { onboardingSchema, agentSchema, settingsSchema } from "./validation";
import { hasAnyActiveSubscription } from "./channel-gate";

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
}): Promise<{ destination: string }> {
  const data = onboardingSchema.parse(raw);
  const ctx = await requireAuth();

  const userExists = await prisma.user.findUnique({ where: { id: ctx.userId }, select: { id: true } });
  if (!userExists) {
    return { destination: "/api/auth/invalid-session" };
  }

  const existing = await prisma.business.findUnique({ where: { userId: ctx.userId } });

  await prisma.$transaction(async (tx) => {
    let businessId: string;

    if (existing) {
      const updated = await tx.business.update({
        where: { id: existing.id },
        data: {
          name: data.businessName || existing.name,
          industry: data.industry || existing.industry,
          website: data.website || existing.website,
          phone: data.phone || existing.phone,
        },
      });
      businessId = updated.id;
    } else {
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
      businessId = business.id;
    }

    if (data.agentName) {
      await tx.agent.create({
        data: {
          name: data.agentName,
          tone: (data.agentTone?.toUpperCase() || "PROFESSIONAL") as AgentTone,
          industry: data.industry || null,
          status: "ACTIVE",
          businessId,
        },
      });
    }

    await tx.user.update({
      where: { id: ctx.userId },
      data: { onboarded: true },
    });
  });

  return { destination: await postOnboardingDestination() };
}

async function postOnboardingDestination(): Promise<string> {
  return "/dashboard";
}

// ─── Agent CRUD ───

export async function createAgent(formData: FormData) {
  const businessId = await getBusinessId();

  const existingCount = await prisma.agent.count({ where: { businessId } });
  const hasPaid = await hasAnyActiveSubscription(businessId);
  if (!hasPaid && existingCount >= 1) {
    throw new Error("Free tier allows 1 agent. Upgrade a channel to add more.");
  }

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

  const { count } = await prisma.agent.updateMany({
    where: { id, businessId },
    data: { ...data, tone: data.tone as AgentTone },
  });
  if (count !== 1) throw new Error("Agent not found");

  revalidatePath("/dashboard/agents");
  revalidatePath(`/dashboard/agents/${id}`);
}

export async function toggleAgentStatus(id: string) {
  const businessId = await getBusinessId();

  const agent = await prisma.agent.findFirst({
    where: { id, businessId },
    select: { status: true },
  });
  if (!agent) throw new Error("Agent not found");

  const { count } = await prisma.agent.updateMany({
    where: { id, businessId },
    data: { status: agent.status === "ACTIVE" ? "PAUSED" : "ACTIVE" },
  });
  if (count !== 1) throw new Error("Agent not found");

  revalidatePath("/dashboard/agents");
  revalidatePath(`/dashboard/agents/${id}`);
}

export async function deleteAgent(id: string) {
  const businessId = await getBusinessId();

  const { count } = await prisma.agent.deleteMany({ where: { id, businessId } });
  if (count !== 1) throw new Error("Agent not found");

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
  const { rateLimit } = await import("./rate-limit");
  const { passwordSchema } = await import("./validation");

  passwordSchema.parse({ currentPassword, newPassword });

  const rl = await rateLimit(`pwchg:${ctx.userId}`, 5, 15 * 60_000, { failClosed: true });
  if (!rl.ok) throw new Error("Too many password change attempts. Try again later.");

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
  // TODO: generate token, save to DB, send email via SendGrid/Resend
}

// ─── Active Business Switcher (HttpOnly cookie) ───

export async function setActiveBusiness(businessId: string) {
  const ctx = await requireAuth();

  if (ctx.role !== "SUPERADMIN") {
    const member = await prisma.businessMember.findUnique({
      where: { userId_businessId: { userId: ctx.userId, businessId } },
    });
    if (!member) {
      const owned = await prisma.business.findFirst({
        where: { id: businessId, userId: ctx.userId },
        select: { id: true },
      });
      if (!owned) throw new Error("Unauthorized");
    }
  }

  const store = await cookies();
  store.set("pumai_active_business", businessId, {
    httpOnly: true,
    secure: (process.env.AUTH_URL ?? "").startsWith("https://"),
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard");
}
