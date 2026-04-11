// ─── Meta Credentials Resolver ───
// Reads from PlatformConfig (DB) first, falls back to env vars.

import { prisma } from "../prisma";

interface MetaCredentials {
  appSecret: string;
  verifyToken: string;
}

export async function getMetaCredentials(): Promise<MetaCredentials> {
  const configs = await prisma.platformConfig.findMany({
    where: { key: { in: ["META_APP_SECRET", "META_WEBHOOK_VERIFY_TOKEN"] } },
  });

  const dbMap = Object.fromEntries(configs.map((c) => [c.key, c.value]));

  return {
    appSecret: dbMap.META_APP_SECRET || process.env.META_APP_SECRET || "",
    verifyToken: dbMap.META_WEBHOOK_VERIFY_TOKEN || process.env.META_WEBHOOK_VERIFY_TOKEN || "",
  };
}
