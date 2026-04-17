import { prisma } from "./prisma";
import { getActiveBusinessId } from "./auth-utils";

export interface ChannelConfigView {
  id: string;
  channel: string;
  active: boolean;
  externalId: string;
  agentId: string;
  agentName: string;
  createdAt: Date;
  webchatBranding?: WebchatBranding;
}

export interface WebchatBranding {
  primaryColor: string;
  title: string;
  welcomeMessage: string;
  position: "left" | "right";
  collectVisitor: "off" | "optional" | "required";
  offlineMode: "off" | "always";
  allowedOrigins: string[];
}

export async function getChannelConfigs(): Promise<ChannelConfigView[]> {
  const businessId = await getActiveBusinessId();
  if (!businessId) return [];

  const configs = await prisma.channelConfig.findMany({
    where: { businessId },
    include: { agent: { select: { name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return configs.map((c) => ({
    id: c.id,
    channel: c.channel,
    active: c.active,
    externalId: c.externalId,
    agentId: c.agentId,
    agentName: c.agent.name,
    createdAt: c.createdAt,
    webchatBranding: c.channel === "WEBCHAT" ? parseBranding(c.credentials) : undefined,
  }));
}

function parseBranding(raw: string): WebchatBranding {
  try {
    const parsed = JSON.parse(raw) as {
      branding?: Partial<WebchatBranding>;
      allowedOrigins?: unknown;
    };
    const b = parsed.branding ?? {};
    const origins = Array.isArray(parsed.allowedOrigins)
      ? parsed.allowedOrigins.filter((v): v is string => typeof v === "string")
      : [];
    return {
      primaryColor: b.primaryColor ?? "#8B5CF6",
      title: b.title ?? "Chat",
      welcomeMessage: b.welcomeMessage ?? "Hi! How can we help?",
      position: b.position === "left" ? "left" : "right",
      collectVisitor:
        b.collectVisitor === "optional" || b.collectVisitor === "required"
          ? b.collectVisitor
          : "off",
      offlineMode: b.offlineMode === "always" ? "always" : "off",
      allowedOrigins: origins,
    };
  } catch {
    return {
      primaryColor: "#8B5CF6",
      title: "Chat",
      welcomeMessage: "Hi! How can we help?",
      position: "right",
      collectVisitor: "off",
      offlineMode: "off",
      allowedOrigins: [],
    };
  }
}
