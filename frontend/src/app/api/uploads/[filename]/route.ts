// ─── Uploaded File Serving ───
// Serves files written by /api/webchat/[key]/upload from the volume-mounted directory.

import { readFile } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  const { filename } = await params;

  if (!/^[a-f0-9]+\.(png|jpe?g|webp|gif)$/i.test(filename)) {
    return new Response("Not found", { status: 404 });
  }

  const dir = process.env.UPLOADS_DIR || "/app/uploads";
  try {
    const bytes = await readFile(path.join(dir, filename));
    const ext = filename.split(".").pop()!.toLowerCase();
    return new Response(bytes, {
      headers: {
        "Content-Type": MIME[ext] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
