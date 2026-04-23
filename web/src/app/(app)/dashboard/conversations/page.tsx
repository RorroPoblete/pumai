import { getConversations } from "@/server/queries";
import ConversationsList from "./conversations-list";

export default async function ConversationsPage() {
  const conversations = await getConversations();
  return <ConversationsList conversations={conversations} />;
}
