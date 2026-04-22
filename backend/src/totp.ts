"use server";

import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { prisma } from "./prisma";
import { requireAuth } from "./auth-utils";
import { encryptSecret, decryptSecret } from "./crypto";
import { auditWrite } from "./audit";

const ISSUER = "PumAI";
const RECOVERY_CODE_COUNT = 10;

function generateRecoveryCode(): string {
  // 10 chars, readable (no 0/O, 1/l confusion) base32
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(10);
  let out = "";
  for (let i = 0; i < 10; i++) out += alphabet[bytes[i] % alphabet.length];
  return `${out.slice(0, 5)}-${out.slice(5)}`;
}

async function regenerateRecoveryCodes(userId: string): Promise<string[]> {
  await prisma.totpRecoveryCode.deleteMany({ where: { userId } });

  const codes: string[] = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) codes.push(generateRecoveryCode());

  const hashed = await Promise.all(codes.map((c) => bcrypt.hash(c, 10)));
  await prisma.totpRecoveryCode.createMany({
    data: hashed.map((codeHash: string) => ({ userId, codeHash })),
  });

  return codes;
}

function buildTotp(secret: string, email: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: ISSUER,
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

export async function startTotpEnrollment(): Promise<{ secret: string; otpauthUrl: string; qrDataUrl: string }> {
  const ctx = await requireAuth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: ctx.userId },
    select: { email: true, totpEnabled: true },
  });
  if (user.totpEnabled) throw new Error("2FA already enabled");

  const secret = new OTPAuth.Secret({ size: 20 }).base32;
  const totp = buildTotp(secret, user.email);
  const otpauthUrl = totp.toString();
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);

  await prisma.user.update({
    where: { id: ctx.userId },
    data: { totpSecret: encryptSecret(secret), totpEnabled: false },
  });

  return { secret, otpauthUrl, qrDataUrl };
}

export async function confirmTotpEnrollment(code: string): Promise<{ recoveryCodes: string[] }> {
  const ctx = await requireAuth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: ctx.userId },
    select: { email: true, totpSecret: true },
  });
  if (!user.totpSecret) throw new Error("No enrollment in progress");

  const secret = decryptSecret(user.totpSecret);
  const totp = buildTotp(secret, user.email);
  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) throw new Error("Invalid code");

  await prisma.user.update({
    where: { id: ctx.userId },
    data: { totpEnabled: true, totpVerifiedAt: new Date() },
  });

  const recoveryCodes = await regenerateRecoveryCodes(ctx.userId);

  await auditWrite("user.consent_updated", {
    actorId: ctx.userId,
    metadata: { totpEnabled: true, recoveryCodesIssued: recoveryCodes.length },
  });

  return { recoveryCodes };
}

export async function regenerateTotpRecoveryCodes(code: string): Promise<{ recoveryCodes: string[] }> {
  const ctx = await requireAuth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: ctx.userId },
    select: { email: true, totpSecret: true, totpEnabled: true },
  });
  if (!user.totpEnabled || !user.totpSecret) throw new Error("2FA not enabled");

  const secret = decryptSecret(user.totpSecret);
  const totp = buildTotp(secret, user.email);
  if (totp.validate({ token: code, window: 1 }) === null) throw new Error("Invalid code");

  const recoveryCodes = await regenerateRecoveryCodes(ctx.userId);
  return { recoveryCodes };
}

export async function verifyRecoveryCode(userId: string, code: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase();
  const rows = await prisma.totpRecoveryCode.findMany({
    where: { userId, usedAt: null },
    select: { id: true, codeHash: true },
  });
  for (const row of rows) {
    if (await bcrypt.compare(normalized, row.codeHash)) {
      await prisma.totpRecoveryCode.update({
        where: { id: row.id },
        data: { usedAt: new Date() },
      });
      return true;
    }
  }
  return false;
}

export async function disableTotp(code: string): Promise<void> {
  const ctx = await requireAuth();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: ctx.userId },
    select: { email: true, totpSecret: true, totpEnabled: true, role: true },
  });
  if (!user.totpEnabled || !user.totpSecret) throw new Error("2FA not enabled");

  // Superadmins cannot disable 2FA (mandatory).
  if (user.role === "SUPERADMIN") {
    throw new Error("Superadmins cannot disable 2FA");
  }

  const secret = decryptSecret(user.totpSecret);
  const totp = buildTotp(secret, user.email);
  if (totp.validate({ token: code, window: 1 }) === null) throw new Error("Invalid code");

  await prisma.user.update({
    where: { id: ctx.userId },
    data: { totpEnabled: false, totpSecret: null, totpVerifiedAt: null },
  });
}

// Called during NextAuth authorize() — verifies code against stored secret.
export async function verifyTotpCode(userId: string, code: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, totpSecret: true, totpEnabled: true },
  });
  if (!user?.totpEnabled || !user.totpSecret) return false;

  const secret = decryptSecret(user.totpSecret);
  const totp = buildTotp(secret, user.email);
  return totp.validate({ token: code, window: 1 }) !== null;
}

export async function userHasTotpEnabled(userId: string): Promise<boolean> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { totpEnabled: true } });
  return !!u?.totpEnabled;
}
