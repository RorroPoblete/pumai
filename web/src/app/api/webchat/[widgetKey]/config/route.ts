// ─── Webchat Config Endpoint ───
// Returns public branding config for the widget to render (color, welcome, etc).
// Public CORS by design — the widget needs to fetch this before knowing its origin allowlist.

import { prisma } from "@/server/prisma";
import { decryptSecret } from "@/server/crypto";
import { publicCorsHeaders, safeParse } from "../../_shared";

export const dynamic = "force-dynamic";

function pubJson(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...publicCorsHeaders() },
  });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: publicCorsHeaders() });
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;

  const config = await prisma.channelConfig.findFirst({
    where: { channel: "WEBCHAT", externalId: widgetKey, active: true },
    include: { business: { select: { name: true } } },
  });

  if (!config) return pubJson({ error: "Widget not found" }, 404);

  const credentials = safeParse(decryptSecret(config.credentials));
  const branding = (credentials.branding ?? {}) as Record<string, string>;

  const collect = branding.collectVisitor;
  const collectVisitor: "off" | "optional" | "required" =
    collect === "optional" || collect === "required" ? collect : "off";
  const offlineMode: "off" | "always" = branding.offlineMode === "always" ? "always" : "off";

  return pubJson(
    {
      businessName: config.business.name,
      primaryColor: branding.primaryColor ?? "#8B5CF6",
      logoUrl: branding.logoUrl ?? null,
      welcomeMessage: branding.welcomeMessage ?? "Hi! How can we help?",
      position: branding.position ?? "right",
      title: branding.title ?? config.business.name,
      collectVisitor,
      offlineMode,
    },
    200,
  );
}
