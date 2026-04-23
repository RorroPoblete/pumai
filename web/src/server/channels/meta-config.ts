// ─── Meta Credentials Resolver ───
// Reads from PlatformConfig (DB) first, falls back to env vars.
// Supports multiple app secrets for apps with separate sub-apps
// (e.g. Instagram Login API uses a distinct App Secret from the main app).

import { prisma } from "../prisma";

interface MetaCredentials {
  appSecrets: string[];   // All valid secrets; HMAC check passes if any matches
  verifyToken: string;
}

const KEYS = [
  "META_APP_SECRET",
  "META_APP_SECRET_IG",
  "META_WEBHOOK_VERIFY_TOKEN",
] as const;

export async function getMetaCredentials(): Promise<MetaCredentials> {
  const configs = await prisma.platformConfig.findMany({
    where: { key: { in: [...KEYS] } },
  });

  const dbMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));

  const primary   = dbMap.META_APP_SECRET    || process.env.META_APP_SECRET    || "";
  const secondary = dbMap.META_APP_SECRET_IG || process.env.META_APP_SECRET_IG || "";

  const appSecrets = [primary, secondary].filter((s): s is string => !!s);

  return {
    appSecrets,
    verifyToken:
      dbMap.META_WEBHOOK_VERIFY_TOKEN ||
      process.env.META_WEBHOOK_VERIFY_TOKEN ||
      "",
  };
}
