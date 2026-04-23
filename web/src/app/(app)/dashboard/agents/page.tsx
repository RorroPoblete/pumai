import { getAgents } from "@/server/queries";
import AgentsList from "./agents-list";

export default async function AgentsPage() {
  const agents = await getAgents();
  return <AgentsList agents={agents} />;
}
