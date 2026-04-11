import { getSessionContext } from "@/backend/auth-utils";
import { redirect } from "next/navigation";
import { getPlatformConfigs, getAdminChannelConfigs, getAdminBusinessesWithAgents } from "@/backend/admin-queries";
import TopBar from "@/components/dashboard/TopBar";
import PlatformSettings from "./platform-settings";

export default async function PlatformPage() {
  const ctx = await getSessionContext();
  if (ctx?.role !== "SUPERADMIN") redirect("/dashboard");

  const [configs, channels, businesses] = await Promise.all([
    getPlatformConfigs(),
    getAdminChannelConfigs(),
    getAdminBusinessesWithAgents(),
  ]);

  return (
    <>
      <TopBar title="Platform Settings" />
      <div className="flex-1 overflow-y-auto p-6">
        <PlatformSettings configs={configs} channels={channels} businesses={businesses} />
      </div>
    </>
  );
}
