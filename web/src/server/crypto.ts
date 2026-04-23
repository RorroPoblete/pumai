// ─── Envelope encryption for sensitive DB-stored credentials ───
// AES-256-GCM, explicit 16-byte auth tag. Versioned envelope allows key rotation.
//
// Format: "enc:vN:" + base64( iv(12) || tag(16) || ciphertext )
//
// Key rotation:
//   - Set CHANNEL_CRED_KEY to the current key (32 bytes base64).
//   - Set CHANNEL_CRED_KEYS to a comma-separated list of old keys for decryption-only fallback
//     during rotation windows. Oldest → newest doesn't matter; we try each.
//   - New writes always use CHANNEL_CRED_KEY; old ciphertexts still decrypt via fallback.
//   - Re-encrypt data in batches, then retire the old key from CHANNEL_CRED_KEYS.

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { scoped } from "./logger";

const log = scoped("crypto");
let _legacyWarned = false;
let _legacyCount = 0;

const ENC_PREFIX = "enc:";
const CURRENT_VERSION = 1;
const TAG_LENGTH = 16;
const IV_LENGTH = 12;

function parseKey(raw: string): Buffer {
  const buf = Buffer.from(raw, "base64");
  if (buf.length !== 32) throw new Error("Encryption key must decode to 32 bytes");
  return buf;
}

let _primary: Buffer | null = null;
let _fallbacks: Buffer[] | null = null;

function primaryKey(): Buffer {
  if (_primary) return _primary;
  const raw = process.env.CHANNEL_CRED_KEY;
  if (!raw) throw new Error("CHANNEL_CRED_KEY is not set");
  _primary = parseKey(raw);
  return _primary;
}

function fallbackKeys(): Buffer[] {
  if (_fallbacks) return _fallbacks;
  const raw = process.env.CHANNEL_CRED_KEYS;
  if (!raw) {
    _fallbacks = [];
    return _fallbacks;
  }
  _fallbacks = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map(parseKey);
  return _fallbacks;
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", primaryKey(), iv, { authTagLength: TAG_LENGTH });
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, tag, enc]).toString("base64");
  return `${ENC_PREFIX}v${CURRENT_VERSION}:${payload}`;
}

function tryDecrypt(key: Buffer, iv: Buffer, tag: Buffer, enc: Buffer): string | null {
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
  } catch {
    return null;
  }
}

export function decryptSecret(payload: string): string {
  if (!payload.startsWith(ENC_PREFIX)) {
    _legacyCount++;
    if (!_legacyWarned) {
      _legacyWarned = true;
      log.warn({ legacyCount: _legacyCount }, "legacy_plaintext_credential_detected");
    }
    return payload;
  }

  const body = payload.slice(ENC_PREFIX.length);
  const colonIdx = body.indexOf(":");
  if (colonIdx === -1) throw new Error("Invalid ciphertext envelope");

  const version = body.slice(0, colonIdx);
  if (!version.startsWith("v")) throw new Error("Invalid ciphertext version");

  const buf = Buffer.from(body.slice(colonIdx + 1), "base64");
  const iv = buf.subarray(0, IV_LENGTH);
  const tag = buf.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const enc = buf.subarray(IV_LENGTH + TAG_LENGTH);

  // Try primary key first, then fallbacks (rotation support).
  const candidates = [primaryKey(), ...fallbackKeys()];
  for (const key of candidates) {
    const out = tryDecrypt(key, iv, tag, enc);
    if (out !== null) return out;
  }

  throw new Error("Decryption failed with all configured keys");
}

export function isEncrypted(payload: string): boolean {
  return payload.startsWith(ENC_PREFIX);
}

/** Count of legacy plaintext credentials read since process start. Surface in admin dashboards. */
export function legacyDecryptCount(): number {
  return _legacyCount;
}

/**
 * Re-encrypts a ciphertext with the current primary key. Returns the original
 * payload if it's already encrypted with the current primary (no-op) or if it
 * cannot be decrypted. Intended for batch rotation scripts.
 */
export function rotateCiphertext(payload: string): string {
  if (!payload.startsWith(ENC_PREFIX)) return encryptSecret(payload);
  try {
    const plaintext = decryptSecret(payload);
    return encryptSecret(plaintext);
  } catch {
    return payload;
  }
}
