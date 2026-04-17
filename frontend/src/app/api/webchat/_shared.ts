// ─── Shared Webchat Route Helpers ───
// Deduplicates CORS/JSON/parse/lookup logic across /config, /message, /stream,
// /seen, /offline, /upload route files.

import { prisma } from "@/backend/prisma";
import { rateLimit } from "@/backend/rate-limit";

export function corsHeaders(req: Request): HeadersInit {
  const origin = req.headers.get("origin") ?? "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function corsOptions(req: Request): Response {
  return new Response(null, { status: 204, headers: corsHeaders(req) });
}

export function json(data: unknown, status: number, req: Request): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders(req) },
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

  const credentials = safeParse(config.credentials);
  const raw = credentials.allowedOrigins;
  const allowedOrigins: string[] = Array.isArray(raw)
    ? raw.filter((v): v is string => typeof v === "string")
    : [];

  return {
    id: config.id,
    businessId: config.businessId,
    agentId: config.agentId,
    credentials: config.credentials,
    allowedOrigins,
  };
}

export function originAllowed(origin: string, allowed: string[]): boolean {
  return allowed.length === 0 || allowed.includes(origin);
}

export function clientIP(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function enforceRateLimit(
  req: Request,
  widgetKey: string,
  bucket: string,
  max: number,
  windowMs: number,
): Promise<Response | null> {
  const ip = clientIP(req);
  const key = `webchat:${bucket}:${widgetKey}:${ip}`;
  const res = await rateLimit(key, max, windowMs);
  if (!res.ok) return json({ error: "Rate limit exceeded" }, 429, req);
  return null;
}
