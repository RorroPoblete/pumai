// ─── WhatsApp Webhook Endpoint (Whapi.cloud) ───
// Whapi has no native signature verification. We require a per-environment
// shared secret in the URL path, plus per-IP rate limiting.

import crypto from "crypto";
import { whatsappAdapter } from "@/server/channels/whatsapp";
import { handleInbound } from "@/server/channels/pipeline";
import { rateLimit } from "@/server/rate-limit";
import { scoped } from "@/server/logger";
import { clientIPFromRequest } from "@/server/request-meta";

export const dynamic = "force-dynamic";

const log = scoped("webhook:whatsapp");

function timingSafeEqualStr(a: string, b: string): boolean {
  // Hash both sides to fixed length first so length is not leaked via timing.
  const aHash = crypto.createHash("sha256").update(a).digest();
  const bHash = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(aHash, bHash);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const expected = process.env.WHATSAPP_WEBHOOK_TOKEN;
  if (!expected) {
    log.error("missing_webhook_token");
    return Response.json({ error: "not_configured" }, { status: 500 });
  }

  const { token } = await params;
  if (!timingSafeEqualStr(token, expected)) {
    return new Response("Forbidden", { status: 403 });
  }

  const ip = clientIPFromRequest(req);
  const rl = await rateLimit(`whapi:${ip}`, 60, 60_000);
  if (!rl.ok) return new Response("Too many requests", { status: 429 });

  const body = await req.json();
  const messages = whatsappAdapter.parseInbound(body);

  for (const msg of messages) {
    handleInbound(msg).catch((err) =>
      log.error({ err, senderExternalId: msg.senderExternalId }, "pipeline_error"),
    );
  }

  return Response.json({ status: "ok" });
}
