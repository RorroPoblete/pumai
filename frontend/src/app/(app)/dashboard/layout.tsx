import Sidebar from "@/components/dashboard/Sidebar";
import UpgradeBanner from "@/components/dashboard/UpgradeBanner";
import { ChannelsProvider } from "@/components/dashboard/SubscriptionContext";
import { getBusinessSummary, getActiveBusiness, getAvailableTenants } from "@/backend/queries";
import { getSessionContext } from "@/backend/auth-utils";
import { getAllChannelAccess, hasAnyActiveSubscription } from "@/backend/channel-gate";
import { prisma } from "@/backend/prisma";
import { redirect } from "next/navigation";
import type { ChannelKey } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");

  const isSuperadmin = ctx.role === "SUPERADMIN";
  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { onboarded: true },
  });
  if (!user) redirect("/api/auth/invalid-session");
  if (!isSuperadmin && !user.onboarded) redirect("/onboarding");

  const [summary, tenants, activeBusiness] = await Promise.all([
    getBusinessSummary(),
    getAvailableTenants(),
    getActiveBusiness(),
  ]);

  const channels = activeBusiness
    ? await getAllChannelAccess(activeBusiness.id)
    : null;

  const hasAnyPaid = activeBusiness ? await hasAnyActiveSubscription(activeBusiness.id) : false;

  const showBanner = !isSuperadmin && !hasAnyPaid;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <Sidebar
        plan={summary?.topTier ?? "FREE"}
        conversationsUsed={summary?.conversationsUsed ?? 0}
        conversationsLimit={summary?.conversationsLimit ?? 10}
        tenants={tenants}
        activeBusinessId={activeBusiness?.id ?? null}
        activeBusinessName={activeBusiness?.name ?? null}
        isSuperadmin={isSuperadmin}
      />
      <ChannelsProvider
        value={{
          channels: channels ?? ({} as Record<ChannelKey, never>),
          hasAnyPaid,
        }}
      >
        <div className="lg:ml-60 min-h-screen flex flex-col">
          {showBanner && channels && (
            <UpgradeBanner
              webchatUsed={channels.WEBCHAT?.conversationsUsed ?? 0}
              webchatLimit={channels.WEBCHAT?.conversationsLimit ?? 10}
            />
          )}
          {children}
        </div>
      </ChannelsProvider>
    </div>
  );
}
