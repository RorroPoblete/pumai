// ─── Webchat Message Endpoint ───
// Receives visitor messages from the embedded widget, runs them through the
// same pipeline used by Messenger/Instagram, and returns the AI response
// synchronously so the widget can render it.

import { prisma } from "@/backend/prisma";
import { handleInbound } from "@/backend/channels/pipeline";
import type { InboundMessage } from "@/backend/channels/types";

export const dynamic = "force-dynamic";

interface Body {
  sessionId?: string;
  message?: string;
  visitor?: { name?: string; email?: string };
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;
  const origin = req.headers.get("origin") ?? "";

  const config = await prisma.channelConfig.findFirst({
    where: { channel: "WEBCHAT", externalId: widgetKey, active: true },
  });

  if (!config) {
    return json({ error: "Widget not found" }, 404, req);
  }

  const credentials = safeParse(config.credentials);
  const raw = credentials.allowedOrigins;
  const allowed: string[] = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
  if (allowed.length > 0 && !allowed.includes(origin)) {
    return json({ error: "Origin not allowed" }, 403, req);
  }

  const body = (await req.json()) as Body;
  const text = body.message?.trim();
  const sessionId = body.sessionId?.trim();

  if (!text || !sessionId) {
    return json({ error: "sessionId and message required" }, 400, req);
  }

  const inbound: InboundMessage = {
    channel: "WEBCHAT",
    externalPageId: widgetKey,
    senderExternalId: sessionId,
    senderName: body.visitor?.name,
    messageText: text,
    timestamp: Date.now(),
  };

  const result = await handleInbound(inbound);

  return json(
    {
      response: result.aiResponse,
      conversationId: result.conversationId,
      escalated: result.isEscalated,
    },
    200,
    req,
  );
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(data: unknown, status: number, req: Request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
  });
}
