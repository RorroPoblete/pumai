// ─── Webchat Agent→Visitor Push (SSE) ───
// Long-lived stream. Subscribes to Redis pub/sub for the visitor's conversation
// and forwards agent messages to the widget in real time.

import { prisma } from "@/backend/prisma";
import { createSubscriber } from "@/backend/rate-limit";
import { corsHeaders, corsOptions } from "../../_shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function OPTIONS(req: Request) {
  return corsOptions(req);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;
  const url = new URL(req.url);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    return new Response("sessionId required", { status: 400, headers: corsHeaders(req) });
  }

  const config = await prisma.channelConfig.findFirst({
    where: { channel: "WEBCHAT", externalId: widgetKey, active: true },
    select: { businessId: true },
  });
  if (!config) return new Response("Widget not found", { status: 404, headers: corsHeaders(req) });

  const conversation = await prisma.conversation.findUnique({
    where: {
      businessId_channel_contactExternalId: {
        businessId: config.businessId,
        channel: "WEBCHAT",
        contactExternalId: sessionId,
      },
    },
    select: { id: true },
  });
  if (!conversation) {
    return new Response("No conversation", { status: 404, headers: corsHeaders(req) });
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
        console.error("[Webchat Events] subscribe failed", err);
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
      ...corsHeaders(req),
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
