// ─── Uploaded File Serving ───
// Serves files from storage (GCS or local FS). Protected by HMAC-signed URL + expiry.
// The signature is generated at upload time (see /api/webchat/.../upload).

import crypto from "crypto";
import { getObjectBytes } from "@/server/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

function verifySignature(filename: string, exp: string | null, sig: string | null): boolean {
  if (!exp || !sig) return false;
  const key = process.env.UPLOAD_SIGNING_KEY;
  if (!key) return false;
  const expNum = Number(exp);
  if (!Number.isFinite(expNum) || expNum < Math.floor(Date.now() / 1000)) return false;
  const expected = crypto
    .createHmac("sha256", key)
    .update(`${filename}:${exp}`)
    .digest("hex")
    .slice(0, 32);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!/^[a-f0-9]+\.(png|jpe?g|webp|gif)$/i.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const url = new URL(req.url);
  if (!verifySignature(filename, url.searchParams.get("exp"), url.searchParams.get("sig"))) {
    return new Response("Forbidden", { status: 403 });
  }

  const bytes = await getObjectBytes(filename);
  if (!bytes) return new Response("Not found", { status: 404 });

  const ext = filename.split(".").pop()!.toLowerCase();
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
