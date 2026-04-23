// ─── Shared Webchat Route Helpers ───
// Deduplicates CORS/JSON/parse/lookup logic across /config, /message, /stream,
// /seen, /offline, /upload route files.

import { prisma } from "@/server/prisma";
import { rateLimit } from "@/server/rate-limit";
import { decryptSecret } from "@/server/crypto";
import { clientIPFromRequest } from "@/server/request-meta";

// Public CORS — only for endpoints that must serve any origin (e.g. /config returns
// public branding before the widget knows its allowlist).
export function publicCorsHeaders(): HeadersInit {
  return {
    "Vary": "Origin",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

// Scoped CORS — reflect Origin only when it's in the widget's allowlist.
// Empty allowlist = no Allow-Origin header emitted (browser blocks cross-origin).
export function corsHeaders(req: Request, allowed: string[] = []): HeadersInit {
  const headers: Record<string, string> = {
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  const origin = req.headers.get("origin");
  if (origin && allowed.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

export function corsOptions(req: Request, allowed: string[] = []): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req, allowed) });
}

export function json(data: unknown, status: number, req: Request, allowed: string[] = []): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req, allowed) },
  });
}

export function safeParse(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function visitorFallbackName(sessionId: string): string {
  return "Visitor #" + sessionId.slice(-6).toUpperCase();
}

export interface ResolvedConfig {
  id: string;
  businessId: string;
  agentId: string;
  credentials: string;
  allowedOrigins: string[];
}

export async function resolveWebchatConfig(widgetKey: string): Promise<ResolvedConfig | null> {
  const config = await prisma.channelConfig.findFirst({
    where: { channel: "WEBCHAT", externalId: widgetKey, active: true },
  });
  if (!config) return null;

  const decrypted = decryptSecret(config.credentials);
  const credentials = safeParse(decrypted);
  const raw = credentials.allowedOrigins;
  const allowedOrigins: string[] = Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === "string")
    : [];

  return {
    id: config.id,
    businessId: config.businessId,
    agentId: config.agentId,
    credentials: decrypted,
    allowedOrigins,
  };
}

// Default-deny. Missing Origin is only permitted when there is no allowlist
// (e.g. the public /config bootstrap); otherwise the request must match.
export function originAllowed(origin: string, allowed: string[]): boolean {
  if (allowed.length === 0) return !origin;
  return !!origin && allowed.includes(origin);
}

export async function enforceRateLimit(
  req: Request,
  widgetKey: string,
  bucket: string,
  max: number,
  windowMs: number,
): Promise<Response | null> {
  const ip = clientIPFromRequest(req);
  const key = `webchat:${bucket}:${widgetKey}:${ip}`;
  const res = await rateLimit(key, max, windowMs);
  if (!res.ok) return json({ error: "Rate limit exceeded" }, 429, req);
  return null;
}
