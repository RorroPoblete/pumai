// ─── WhatsApp Webhook Endpoint (Whapi.cloud) ───
// Whapi has no native signature verification. We require a per-environment
// shared secret in the URL path, plus per-IP rate limiting.

import crypto from "crypto";
import { whatsappAdapter } from "@/backend/channels/whatsapp";
import { handleInbound } from "@/backend/channels/pipeline";
import { rateLimit } from "@/backend/rate-limit";
import { scoped } from "@/backend/logger";

export const dynamic = "force-dynamic";

const log = scoped("webhook:whatsapp");

function clientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function timingSafeEqualStr(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
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

  const ip = clientIP(req);
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
