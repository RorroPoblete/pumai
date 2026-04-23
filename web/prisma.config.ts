import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnv(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

loadEnv(resolve(__dirname, ".env.local"));
loadEnv(resolve(__dirname, ".env"));

export default {
  schema: "prisma/schema.prisma",
  datasource: { url: process.env.DATABASE_URL },
  migrations: {
    seed: `node --import tsx ${resolve(__dirname, "prisma/seed.ts")}`,
  },
};
