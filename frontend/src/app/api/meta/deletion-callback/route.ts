import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/backend/prisma";

export const dynamic = "force-dynamic";

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

  const secret = process.env.META_APP_SECRET;
  if (!secret) {
    console.error("[meta-deletion] META_APP_SECRET not configured");
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const data = parseSignedRequest(signedRequest, secret);
  if (!data?.user_id) {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const metaUserId = data.user_id;
  const confirmationCode = crypto.randomUUID();

  try {
    // Delete conversations keyed by Meta user id (PSID / IGSID = contactExternalId)
    const deleted = await prisma.conversation.deleteMany({
      where: {
        contactExternalId: metaUserId,
        channel: { in: ["MESSENGER", "INSTAGRAM"] },
      },
    });

    await prisma.processedWebhookEvent.create({
      data: { id: `meta-deletion:${confirmationCode}`, type: "meta.data_deletion" },
    }).catch(() => {});

    console.log(`[meta-deletion] deleted ${deleted.count} conversations for Meta user ${metaUserId} (confirmation=${confirmationCode})`);
  } catch (err) {
    console.error("[meta-deletion] failed", err);
    return NextResponse.json({ error: "deletion_failed" }, { status: 500 });
  }

  return NextResponse.json({
    url: `${publicBase()}/api/meta/deletion-status?code=${confirmationCode}`,
    confirmation_code: confirmationCode,
  });
}
