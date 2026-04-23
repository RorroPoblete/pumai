// ─── Webchat File Upload ───
// Accepts image upload from the widget, saves to UPLOADS_DIR volume,
// returns public URL served by /api/uploads/[file].

import { writeFile, mkdir } from "fs/promises";
import { randomBytes, createHmac } from "crypto";
import path from "path";
import { corsOptions, enforceRateLimit, json, originAllowed, resolveWebchatConfig } from "../../_shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

// Magic-byte signatures for supported image types
const MAGIC_SIGNATURES: Array<{ type: string; ext: string; starts: number[][] }> = [
  { type: "image/png", ext: "png", starts: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]] },
  { type: "image/jpeg", ext: "jpg", starts: [[0xFF, 0xD8, 0xFF]] },
  { type: "image/gif", ext: "gif", starts: [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]] },
];

function detectImageType(buf: Buffer): { type: string; ext: string } | null {
  for (const sig of MAGIC_SIGNATURES) {
    for (const start of sig.starts) {
      if (start.every((b, i) => buf[i] === b)) return { type: sig.type, ext: sig.ext };
    }
  }
  // WebP: RIFF....WEBP
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
      buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) {
    return { type: "image/webp", ext: "webp" };
  }
  return null;
}

export async function OPTIONS(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;
  const config = await resolveWebchatConfig(widgetKey);
  return corsOptions(req, config?.allowedOrigins ?? []);
}

function signUploadUrl(filename: string, ttlSec = 3600): string {
  const key = process.env.UPLOAD_SIGNING_KEY;
  if (!key) throw new Error("UPLOAD_SIGNING_KEY not configured");
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const sig = createHmac("sha256", key)
    .update(`${filename}:${exp}`)
    .digest("hex")
    .slice(0, 32);
  return `/api/uploads/${filename}?exp=${exp}&sig=${sig}`;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ widgetKey: string }> },
) {
  const { widgetKey } = await params;
  const origin = req.headers.get("origin") ?? "";

  const config = await resolveWebchatConfig(widgetKey);
  if (!config) return json({ error: "Widget not found" }, 404, req);
  if (!originAllowed(origin, config.allowedOrigins)) {
    return json({ error: "Origin not allowed" }, 403, req, config.allowedOrigins);
  }

  const limited = await enforceRateLimit(req, widgetKey, "upload", 5, 60_000);
  if (limited) return limited;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "file required" }, 400, req, config.allowedOrigins);

  if (!ALLOWED_TYPES.includes(file.type)) {
    return json({ error: "Only PNG, JPEG, WEBP, GIF allowed" }, 400, req, config.allowedOrigins);
  }

  if (file.size > MAX_BYTES) {
    return json({ error: "Max 2MB" }, 400, req, config.allowedOrigins);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const detected = detectImageType(bytes);
  if (!detected || detected.type !== file.type) {
    return json({ error: "File content does not match declared type" }, 400, req, config.allowedOrigins);
  }

  const filename = `${randomBytes(12).toString("hex")}.${detected.ext}`;
  const dir = process.env.UPLOADS_DIR || "/app/uploads";
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);

  return json(
    {
      url: signUploadUrl(filename),
      type: detected.type,
      filename,
    },
    200,
    req,
    config.allowedOrigins,
  );
}
