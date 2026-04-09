import { getAgents } from "@/backend/queries";
import AgentsList from "./agents-list";

export default async function AgentsPage() {
  const agents = await getAgents();
  return <AgentsList agents={agents} />;
}
