// ─── Meta Webhook Endpoint ───
// Shared for Facebook Messenger + Instagram DMs.
// GET: Webhook verification (hub.challenge)
// POST: Inbound events with HMAC-SHA256 signature verification

import { messengerAdapter } from "@/backend/channels/messenger";
import { handleInbound } from "@/backend/channels/pipeline";
import { getMetaCredentials } from "@/backend/channels/meta-config";
import type { InboundMessage } from "@/backend/channels/types";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// ─── GET: Webhook Verification ───

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");

  const { verifyToken } = await getMetaCredentials();

  if (mode === "subscribe" && token === verifyToken) {
    return new Response(url.searchParams.get("hub.challenge"), { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// ─── POST: Inbound Events ───

export async function POST(req: Request) {
  const { appSecret } = await getMetaCredentials();
  if (!appSecret) {
    console.error("[Meta Webhook] META_APP_SECRET not configured");
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Read raw body for HMAC verification before JSON parsing
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!verifySignature(rawBody, signature, appSecret)) {
    return new Response("Invalid signature", { status: 403 });
  }

  const body = JSON.parse(rawBody) as { object?: string };

  // Route to the correct adapter based on platform
  let messages: InboundMessage[] = [];
  if (body.object === "page") {
    messages = messengerAdapter.parseInbound(body);
  }
  // else if (body.object === "instagram") {
  //   messages = instagramAdapter.parseInbound(body);
  // }

  // Fire-and-forget — Meta expects a fast 200
  for (const msg of messages) {
    handleInbound(msg).catch((err) =>
      console.error(`[Meta Webhook] Pipeline error for ${msg.senderExternalId}:`, err),
    );
  }

  return Response.json({ status: "ok" });
}

// ─── HMAC-SHA256 Signature Verification ───

function verifySignature(rawBody: string, signature: string | null, appSecret: string): boolean {
  if (!signature) return false;

  const expected =
    "sha256=" + crypto.createHmac("sha256", appSecret).update(rawBody, "utf-8").digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false; // Length mismatch
  }
}
