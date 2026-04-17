// ─── Webchat Config Endpoint ───
// Returns public branding config for the widget to render (color, welcome, etc).
// Does NOT return allowedOrigins or other non-public credentials fields.

import { prisma } from "@/backend/prisma";
import { corsOptions, json, safeParse } from "../../_shared";

export const dynamic = "force-dynamic";

export async function OPTIONS(req: Request) {
  return corsOptions(req);
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

  if (!config) return json({ error: "Widget not found" }, 404, req);

  const credentials = safeParse(config.credentials);
  const branding = (credentials.branding ?? {}) as Record<string, string>;

  const collect = branding.collectVisitor;
  const collectVisitor: "off" | "optional" | "required" =
    collect === "optional" || collect === "required" ? collect : "off";
  const offlineMode: "off" | "always" = branding.offlineMode === "always" ? "always" : "off";

  return json(
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
    req,
  );
}
