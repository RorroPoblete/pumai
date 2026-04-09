"use server";

import { prisma } from "./prisma";
import { requireSuperadmin } from "./auth-utils";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTenant(formData: FormData) {
  await requireSuperadmin();

  const name = formData.get("name") as string;
  const industry = formData.get("industry") as string;
  const plan = (formData.get("plan") as string) || "STARTER";
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
        plan: plan as "STARTER" | "GROWTH" | "ENTERPRISE",
        userId: owner.id,
      },
    });

    await tx.businessMember.create({
      data: { userId: owner.id, businessId: business.id, role: "OWNER" },
    });
  });

  revalidatePath("/dashboard/tenants");
  redirect("/dashboard/tenants");
}

export async function deleteTenant(businessId: string) {
  await requireSuperadmin();

  await prisma.business.delete({ where: { id: businessId } });

  const cookieStore = await cookies();
  if (cookieStore.get("pumai_active_business")?.value === businessId) {
    cookieStore.delete("pumai_active_business");
  }

  revalidatePath("/dashboard/tenants");
}

export async function updateTenantPlan(businessId: string, plan: string) {
  await requireSuperadmin();

  await prisma.business.update({
    where: { id: businessId },
    data: { plan: plan as "STARTER" | "GROWTH" | "ENTERPRISE" },
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
