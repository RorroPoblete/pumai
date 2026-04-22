"use server";

import { prisma } from "./prisma";
import { requireSuperadmin } from "./auth-utils";
import type { Channel } from "./channels/types";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { encryptSecret } from "./crypto";
import { auditWrite } from "./audit";
import { getRequestMeta } from "./request-meta";

export async function createTenant(formData: FormData) {
  const ctx = await requireSuperadmin();

  const name = formData.get("name") as string;
  const industry = formData.get("industry") as string;
  const ownerEmail = formData.get("ownerEmail") as string;
  const ownerName = formData.get("ownerName") as string;

  if (!name || !industry || !ownerEmail || !ownerName) {
    throw new Error("All fields are required");
  }

  const existingUser = await prisma.user.findUnique({ where: { email: ownerEmail } });

  await prisma.$transaction(async (tx) => {
    const owner = existingUser ?? await tx.user.create({
      data: { name: ownerName, email: ownerEmail, onboarded: true },
    });

    const existingBiz = await tx.business.findUnique({ where: { userId: owner.id } });
    if (existingBiz) throw new Error(`User ${ownerEmail} already owns a business`);

    const business = await tx.business.create({
      data: {
        name,
        industry,
        userId: owner.id,
      },
    });

    await tx.businessMember.create({
      data: { userId: owner.id, businessId: business.id, role: "OWNER" },
    });
  });

  const meta = await getRequestMeta();
  await auditWrite("admin.tenant_created", {
    actorId: ctx.userId,
    actorRole: ctx.role,
    targetType: "Business",
    metadata: { name, industry, ownerEmail },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  revalidatePath("/dashboard/tenants");
  redirect("/dashboard/tenants");
}

export async function deleteTenant(businessId: string) {
  const ctx = await requireSuperadmin();

  await prisma.business.delete({ where: { id: businessId } });

  const meta = await getRequestMeta();
  await auditWrite("admin.tenant_deleted", {
    actorId: ctx.userId,
    actorRole: ctx.role,
    targetType: "Business",
    targetId: businessId,
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  const cookieStore = await cookies();
  if (cookieStore.get("pumai_active_business")?.value === businessId) {
    cookieStore.delete("pumai_active_business");
  }

  revalidatePath("/dashboard/tenants");
}

export async function updateTenantPlan(businessId: string, tier: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE") {
  const ctx = await requireSuperadmin();

  const channels = ["WEBCHAT", "MESSENGER", "INSTAGRAM", "WHATSAPP"] as const;
  for (const channel of channels) {
    await prisma.subscription.upsert({
      where: { businessId_channel: { businessId, channel } },
      create: {
        businessId,
        channel,
        tier,
        stripeStatus: tier === "FREE" ? null : "active",
      },
      update: {
        tier,
        stripeStatus: tier === "FREE" ? null : "active",
      },
    });
  }

  const meta = await getRequestMeta();
  await auditWrite("admin.tenant_plan_changed", {
    actorId: ctx.userId,
    actorRole: ctx.role,
    targetType: "Business",
    targetId: businessId,
    metadata: { tier },
    ip: meta.ip,
    userAgent: meta.userAgent,
  });

  revalidatePath("/dashboard/tenants");
}

// ─── User Management ───

export async function addUserToTenant(formData: FormData) {
  await requireSuperadmin();

  const businessId = formData.get("businessId") as string;
  const email = formData.get("email") as string;
  const name = formData.get("name") as string;
  const role = (formData.get("role") as string) || "MEMBER";

  if (!businessId || !email || !name) throw new Error("All fields are required");

  const existing = await prisma.user.findUnique({ where: { email } });
  const user = existing ?? await prisma.user.create({
    data: { name, email, onboarded: true },
  });

  const alreadyMember = await prisma.businessMember.findUnique({
    where: { userId_businessId: { userId: user.id, businessId } },
  });
  if (alreadyMember) throw new Error("User is already a member of this business");

  await prisma.businessMember.create({
    data: { userId: user.id, businessId, role: role as "OWNER" | "ADMIN" | "MEMBER" },
  });

  revalidatePath("/dashboard/tenants");
}

export async function removeUserFromTenant(membershipId: string) {
  await requireSuperadmin();

  const membership = await prisma.businessMember.findUnique({
    where: { id: membershipId },
    select: { role: true },
  });
  if (membership?.role === "OWNER") throw new Error("Cannot remove the owner");

  await prisma.businessMember.delete({ where: { id: membershipId } });
  revalidatePath("/dashboard/tenants");
}

export async function updateMemberRole(membershipId: string, newRole: string) {
  await requireSuperadmin();

  if (newRole === "OWNER") throw new Error("Cannot assign owner role");

  await prisma.businessMember.update({
    where: { id: membershipId },
    data: { role: newRole as "ADMIN" | "MEMBER" },
  });
  revalidatePath("/dashboard/tenants");
}

export async function deleteUser(userId: string) {
  await requireSuperadmin();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "SUPERADMIN") throw new Error("Cannot delete a superadmin");

  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/dashboard/tenants");
}

// ─── Platform Config ───

export async function savePlatformConfigs(configs: { key: string; value: string }[]) {
  await requireSuperadmin();

  await prisma.$transaction(
    configs.map((c) =>
      prisma.platformConfig.upsert({
        where: { key: c.key },
        create: { key: c.key, value: c.value },
        update: { value: c.value },
      }),
    ),
  );

  revalidatePath("/dashboard/tenants/platform");
}

// ─── Admin Channel Management ───

export async function adminConnectChannel(
  businessId: string,
  channel: string,
  externalId: string,
  credentials: string,
  agentId: string,
) {
  await requireSuperadmin();

  const ch = channel as Channel;
  const encrypted = encryptSecret(credentials);
  await prisma.channelConfig.upsert({
    where: { businessId_channel: { businessId, channel: ch } },
    create: { businessId, channel: ch, externalId, credentials: encrypted, agentId, active: true },
    update: { externalId, credentials: encrypted, agentId, active: true },
  });

  revalidatePath("/dashboard/tenants/platform");
}

export async function adminDisconnectChannel(channelConfigId: string) {
  await requireSuperadmin();
  await prisma.channelConfig.delete({ where: { id: channelConfigId } });
  revalidatePath("/dashboard/tenants/platform");
}

export async function adminToggleChannel(channelConfigId: string) {
  await requireSuperadmin();

  const config = await prisma.channelConfig.findUnique({ where: { id: channelConfigId } });
  if (!config) throw new Error("Channel config not found");

  await prisma.channelConfig.update({
    where: { id: channelConfigId },
    data: { active: !config.active },
  });

  revalidatePath("/dashboard/tenants/platform");
}
