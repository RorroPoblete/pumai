// ─── Unified uploads storage ───
// GCS when UPLOADS_BUCKET is set (Cloud Run prod).
// Local filesystem fallback otherwise (docker-compose dev).
//
// Cloud Run has no persistent filesystem, so GCS is required in prod.
// Dev keeps the FS path so contributors don't need GCS credentials.

import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import type { Bucket } from "@google-cloud/storage";

let _bucket: Bucket | null = null;

async function getBucket(): Promise<Bucket> {
  if (_bucket) return _bucket;
  const name = process.env.UPLOADS_BUCKET;
  if (!name) throw new Error("UPLOADS_BUCKET is not set");
  const { Storage } = await import("@google-cloud/storage");
  _bucket = new Storage().bucket(name);
  return _bucket;
}

function localDir(): string {
  return process.env.UPLOADS_DIR || "/app/uploads";
}

function isGCS(): boolean {
  return !!process.env.UPLOADS_BUCKET;
}

export async function putObject(
  filename: string,
  bytes: Buffer,
  contentType: string,
): Promise<void> {
  if (isGCS()) {
    const b = await getBucket();
    await b.file(filename).save(bytes, {
      contentType,
      resumable: false,
      metadata: { cacheControl: "private, max-age=3600" },
    });
    return;
  }
  const dir = localDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), bytes);
}

export async function getObjectBytes(filename: string): Promise<Buffer | null> {
  if (isGCS()) {
    const b = await getBucket();
    const file = b.file(filename);
    const [exists] = await file.exists();
    if (!exists) return null;
    const [contents] = await file.download();
    return contents;
  }
  try {
    return await readFile(path.join(localDir(), filename));
  } catch {
    return null;
  }
}
