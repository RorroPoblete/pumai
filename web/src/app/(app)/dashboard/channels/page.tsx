import { getChannelConfigs } from "@/server/channel-queries";
import { getAgents } from "@/server/queries";
import ChannelManager from "./channel-manager";

export default async function ChannelsPage() {
  const [channels, agents] = await Promise.all([
    getChannelConfigs(),
    getAgents(),
  ]);

  const activeAgents = agents
    .filter((a) => a.status === "active")
    .map((a) => ({ id: a.id, name: a.name }));

  return <ChannelManager channels={channels} agents={activeAgents} />;
}
