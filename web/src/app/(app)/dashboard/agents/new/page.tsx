import AgentEditor from "@/components/dashboard/AgentEditor";
import { getScrapeQuota } from "@/server/agent-autofill";

export default async function NewAgentPage() {
  const rawQuota = await getScrapeQuota();
  const quota = {
    used: rawQuota.used,
    max: Number.isFinite(rawQuota.max) ? rawQuota.max : 999,
    remaining: Number.isFinite(rawQuota.remaining) ? rawQuota.remaining : 999,
    admin: rawQuota.admin,
  };

  return (
    <AgentEditor
      agent={{
        name: "",
        tone: "PROFESSIONAL",
        industry: "",
        status: "DRAFT",
        config: null,
      }}
      quota={quota}
    />
  );
}
