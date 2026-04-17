// ─── Webchat File Upload ───
// Accepts image upload from the widget, saves to UPLOADS_DIR volume,
// returns public URL served by /api/uploads/[file].

import { writeFile, mkdir } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import { corsOptions, enforceRateLimit, json, originAllowed, resolveWebchatConfig } from "../../_shared";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export async function OPTIONS(req: Request) {
  return corsOptions(req);
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
    return json({ error: "Origin not allowed" }, 403, req);
  }

  const limited = await enforceRateLimit(req, widgetKey, "upload", 5, 60_000);
  if (limited) return limited;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return json({ error: "file required" }, 400, req);

  if (!ALLOWED_TYPES.includes(file.type)) {
    return json({ error: "Only PNG, JPEG, WEBP, GIF allowed" }, 400, req);
  }

  if (file.size > MAX_BYTES) {
    return json({ error: "Max 2MB" }, 400, req);
  }

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const filename = `${randomBytes(12).toString("hex")}.${ext}`;
  const dir = process.env.UPLOADS_DIR || "/app/uploads";
  await mkdir(dir, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, filename), bytes);

  return json(
    {
      url: `/api/uploads/${filename}`,
      type: file.type,
      filename,
    },
    200,
    req,
  );
}
