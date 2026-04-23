// ─── Webchat Agent→Visitor Push (SSE) ───
// Long-lived stream. Subscribes to Redis pub/sub for the visitor's conversation
// and forwards agent messages to the widget in real time.

import { createSubscriber } from "@/server/redis";
import { prisma } from "@/server/prisma";
import { scoped } from "@/server/logger";
import { corsHeaders, corsOptions, originAllowed, resolveWebchatConfig } from "../../_shared";

const log = scoped("webchat:events");

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function OPTIONS(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;
  const config = await resolveWebchatConfig(widgetKey);
  return corsOptions(req, config?.allowedOrigins ?? []);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");
  const origin = req.headers.get("origin") ?? "";

  const resolved = await resolveWebchatConfig(widgetKey);
  if (!resolved) return new Response("Widget not found", { status: 404 });
  if (!originAllowed(origin, resolved.allowedOrigins)) {
    return new Response("Origin not allowed", { status: 403, headers: corsHeaders(req, resolved.allowedOrigins) });
  }

  if (!sessionId) {
    return new Response("sessionId required", { status: 400, headers: corsHeaders(req, resolved.allowedOrigins) });
  }

  const conversation = await prisma.conversation.findUnique({
    where: {
      businessId_channel_contactExternalId: {
        businessId: resolved.businessId,
        channel: "WEBCHAT",
        contactExternalId: sessionId,
      },
    },
    select: { id: true },
  });
  if (!conversation) {
    return new Response("No conversation", { status: 404, headers: corsHeaders(req, resolved.allowedOrigins) });
  }

  const channel = `webchat:${conversation.id}:events`;
  const encoder = new TextEncoder();
  const subscriber = createSubscriber();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => {
        try { controller.enqueue(encoder.encode(`data: ${data}\n\n`)); } catch {}
      };

      try {
        await subscriber.subscribe(channel);
      } catch (err) {
        log.error({ err }, "subscribe_failed");
        controller.close();
        return;
      }

      subscriber.on("message", (_ch, msg) => send(msg));

      send(JSON.stringify({ type: "connected" }));

      const keepalive = setInterval(() => {
        try { controller.enqueue(encoder.encode(`: ka\n\n`)); } catch {}
      }, 20000);

      const close = () => {
        clearInterval(keepalive);
        subscriber.disconnect();
        try { controller.close(); } catch {}
      };
      req.signal.addEventListener("abort", close);
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders(req, resolved.allowedOrigins),
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
