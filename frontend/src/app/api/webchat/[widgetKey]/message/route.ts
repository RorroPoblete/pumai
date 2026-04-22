// ─── Webchat Message Endpoint ───
// Non-streaming fallback. Runs the shared pipeline.handleInbound and returns
// the AI response in a single JSON payload. Used if SSE is blocked.

import { handleInbound } from "@/backend/channels/pipeline";
import type { InboundMessage } from "@/backend/channels/types";
import {
  corsOptions,
  enforceRateLimit,
  json,
  originAllowed,
  resolveWebchatConfig,
  visitorFallbackName,
} from "../../_shared";

export const dynamic = "force-dynamic";

interface Body {
  sessionId?: string;
  message?: string;
  visitor?: { name?: string };
}

export async function OPTIONS(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;
  const config = await resolveWebchatConfig(widgetKey);
  return corsOptions(req, config?.allowedOrigins ?? []);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;
  const origin = req.headers.get("origin") ?? "";

  const config = await resolveWebchatConfig(widgetKey);
  if (!config) return json({ error: "Widget not found" }, 404, req);
  if (!originAllowed(origin, config.allowedOrigins)) {
    return json({ error: "Origin not allowed" }, 403, req, config.allowedOrigins);
  }

  const limited = await enforceRateLimit(req, widgetKey, "msg", 30, 60_000);
  if (limited) return limited;

  const body = (await req.json()) as Body;
  const text = body.message?.trim();
  const sessionId = body.sessionId?.trim();
  if (!text || !sessionId) return json({ error: "sessionId and message required" }, 400, req, config.allowedOrigins);

  const inbound: InboundMessage = {
    channel: "WEBCHAT",
    externalPageId: widgetKey,
    senderExternalId: sessionId,
    senderName: body.visitor?.name || visitorFallbackName(sessionId),
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
    config.allowedOrigins,
  );
}
