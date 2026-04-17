// ─── WhatsApp Webhook Endpoint (Whapi.cloud) ───
// POST: Inbound message events. Whapi does not use signature verification;
// security relies on HTTPS + deduplication via externalMsgId in the pipeline.

import { whatsappAdapter } from "@/backend/channels/whatsapp";
import { handleInbound } from "@/backend/channels/pipeline";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const messages = whatsappAdapter.parseInbound(body);

  for (const msg of messages) {
    handleInbound(msg).catch((err) =>
      console.error(`[WhatsApp Webhook] Pipeline error for ${msg.senderExternalId}:`, err),
    );
  }

  return Response.json({ status: "ok" });
}
