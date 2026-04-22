import { NextResponse } from "next/server";
import { prisma } from "@/backend/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.json({ error: "missing code" }, { status: 400 });

  const record = await prisma.processedWebhookEvent.findUnique({
    where: { id: `meta-deletion:${code}` },
  });

  return NextResponse.json({
    code,
    status: record ? "completed" : "not_found",
    processedAt: record?.processedAt ?? null,
  });
}
