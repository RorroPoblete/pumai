import { headers } from "next/headers";

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

// TRUSTED_PROXY_HOPS: number of reverse proxies in front of the app.
// The client IP is taken from XFF at position (length - HOPS). Default: 1
// (one trusted proxy, typical docker-compose / nginx / Cloudflare setup).
// Set to 0 only when the app is directly internet-facing with no proxy.
function trustedHops(): number {
  const raw = process.env.TRUSTED_PROXY_HOPS;
  if (!raw) return 1;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : 1;
}

/**
 * Extract the client IP from proxy headers.
 * Reads the rightmost XFF entry the trusted proxy appended, resisting
 * spoofing by clients who prepend fake IPs to the header.
 */
export function extractClientIP(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const parts = headerValue.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  const hops = trustedHops();
  // rightmost-N-1 index; clamp to 0 for short headers
  const idx = Math.max(0, parts.length - hops);
  return parts[idx] ?? null;
}

export function clientIPFromRequest(req: Request): string {
  const xff = extractClientIP(req.headers.get("x-forwarded-for"));
  return xff ?? req.headers.get("x-real-ip") ?? "unknown";
}

export async function getRequestMeta(): Promise<RequestMeta> {
  const h = await headers();
  const ip = extractClientIP(h.get("x-forwarded-for")) ?? h.get("x-real-ip") ?? null;
  const userAgent = h.get("user-agent") ?? null;
  return { ip, userAgent };
}
