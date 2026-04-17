// ─── Conversations Polling Endpoint ───
// Returns the latest conversation list for the active business, used by the
// dashboard to refresh in real time without a full page reload.

import { getConversations } from "@/backend/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const conversations = await getConversations();
  return Response.json({ conversations });
}
