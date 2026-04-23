import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/server/prisma";
import { scoped } from "@/server/logger";

export const dynamic = "force-dynamic";

const log = scoped("meta-deletion");

function hashId(id: string): string {
  return crypto.createHash("sha256").update(id).digest("hex").slice(0, 12);
}

// Meta Data Deletion Callback
// https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

function base64UrlDecode(input: string): Buffer {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function parseSignedRequest(signedRequest: string, secret: string): { user_id?: string } | null {
  const [encodedSig, payload] = signedRequest.split(".");
  if (!encodedSig || !payload) return null;

  const expectedSig = crypto.createHmac("sha256", secret).update(payload).digest();
  const providedSig = base64UrlDecode(encodedSig);
  if (providedSig.length !== expectedSig.length || !crypto.timingSafeEqual(providedSig, expectedSig)) return null;

  try {
    return JSON.parse(base64UrlDecode(payload).toString("utf8"));
  } catch {
    return null;
  }
}

function publicBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3002";
}

export async function POST(req: Request) {
  const form = await req.formData();
  const signedRequest = form.get("signed_request");
  if (typeof signedRequest !== "string") {
    return NextResponse.json({ error: "missing signed_request" }, { status: 400 });
  }

  const secrets = [process.env.META_APP_SECRET, process.env.META_APP_SECRET_IG].filter(
    (s): s is string => typeof s === "string" && s.length > 0,
  );
  if (secrets.length === 0) {
    log.error("META_APP_SECRET not configured");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  let data: { user_id?: string } | null = null;
  for (const secret of secrets) {
    data = parseSignedRequest(signedRequest, secret);
    if (data) break;
  }
  if (!data?.user_id) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const metaUserId = data.user_id;
  const userHash = hashId(metaUserId);
  const confirmationCode = crypto.randomUUID();

  try {
    // Only delete conversations belonging to businesses with a Meta ChannelConfig.
    const scopedBusinesses = await prisma.channelConfig.findMany({
      where: { channel: { in: ["MESSENGER", "INSTAGRAM"] } },
      select: { businessId: true },
    });
    const businessIds = [...new Set(scopedBusinesses.map((c) => c.businessId))];

    const deleted = businessIds.length
      ? await prisma.conversation.deleteMany({
          where: {
            contactExternalId: metaUserId,
            channel: { in: ["MESSENGER", "INSTAGRAM"] },
            businessId: { in: businessIds },
          },
        })
      : { count: 0 };

    await prisma.processedWebhookEvent.create({
      data: { id: `meta-deletion:${confirmationCode}`, type: "meta.data_deletion" },
    }).catch(() => {});

    log.info(
      { userHash, deleted: deleted.count, confirmationCode, businesses: businessIds.length },
      "deletion_complete",
    );
  } catch (err) {
    log.error({ err, userHash }, "deletion_failed");
    return NextResponse.json({ error: "deletion_failed" }, { status: 500 });
  }

  return NextResponse.json({
    url: `${publicBase()}/api/meta/deletion-status?code=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}
