// ─── Webchat Config Endpoint ───
// Returns public branding config for the widget to render (color, logo, welcome).
// Does NOT return allowedOrigins or other non-public credentials fields.

import { prisma } from "@/backend/prisma";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;

  const config = await prisma.channelConfig.findFirst({
    where: { channel: "WEBCHAT", externalId: widgetKey, active: true },
    include: { business: { select: { name: true } } },
  });

  if (!config) {
    return json({ error: "Widget not found" }, 404, req);
  }

  const credentials = safeParse(config.credentials);
  const branding = (credentials.branding ?? {}) as Record<string, string>;

  return json(
    {
      businessName: config.business.name,
      primaryColor: branding.primaryColor ?? "#8B5CF6",
      logoUrl: branding.logoUrl ?? null,
      welcomeMessage: branding.welcomeMessage ?? "Hi! How can we help?",
      position: branding.position ?? "right",
      title: branding.title ?? config.business.name,
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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
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
