"use server";

import { prisma } from "./prisma";
import { requireAuth, getActiveBusinessId } from "./auth-utils";
import { rateLimit } from "./rate-limit";
import { logger } from "./logger";
import { parsePdfFiles, PdfParseError, MAX_PDFS } from "./pdf-parser";
import { extractAgentConfig } from "./agent-extractor";
import type { FormState } from "@/lib/agent-templates";

const MAX_AUTOFILLS_PER_BUSINESS = 3;

export type AutoFillResult =
  | {
      ok: true;
      config: Partial<FormState>;
      remaining: number | null;
      files: { name: string; pages: number; chars: number }[];
      fieldsFilled: number;
    }
  | { ok: false; error: string; code: string; remaining: number | null };

export async function autoFillFromPdfs(formData: FormData): Promise<AutoFillResult> {
  const ctx = await requireAuth();
  const isAdmin = ctx.role === "SUPERADMIN";

  const businessId = await getActiveBusinessId();
  if (!businessId) {
    return { ok: false, error: "No active business", code: "no_business", remaining: null };
  }

  const industry = String(formData.get("industry") ?? "").trim();
  if (!industry) {
    return {
      ok: false,
      error: "Pick an industry first so we know which fields to extract",
      code: "no_industry",
      remaining: null,
    };
  }

  const files: File[] = [];
  for (let i = 0; i < MAX_PDFS; i++) {
    const entry = formData.get(`pdf${i}`);
    if (entry instanceof File && entry.size > 0) files.push(entry);
  }
  if (files.length === 0) {
    return { ok: false, error: "Attach at least one PDF", code: "no_files", remaining: null };
  }

  if (!isAdmin) {
    const rl = await rateLimit(`autofill:${businessId}`, 5, 60_000, { failClosed: true });
    if (!rl.ok) {
      return { ok: false, error: "Too many auto-fill attempts. Try again in a minute.", code: "rate_limit", remaining: null };
    }
  }

  // Lifetime quota: atomic increment if under cap.
  let remaining: number | null = null;
  if (!isAdmin) {
    const updated = await prisma.business.updateMany({
      where: { id: businessId, scrapeCount: { lt: MAX_AUTOFILLS_PER_BUSINESS } },
      data: { scrapeCount: { increment: 1 } },
    });
    if (updated.count !== 1) {
      return {
        ok: false,
        error: `You've used all ${MAX_AUTOFILLS_PER_BUSINESS} auto-fill credits for this business.`,
        code: "quota_exceeded",
        remaining: 0,
      };
    }
    const after = await prisma.business.findUnique({
      where: { id: businessId },
      select: { scrapeCount: true },
    });
    remaining = Math.max(0, MAX_AUTOFILLS_PER_BUSINESS - (after?.scrapeCount ?? MAX_AUTOFILLS_PER_BUSINESS));
  }

  const refundCredit = async () => {
    if (isAdmin) return;
    await prisma.business.update({
      where: { id: businessId },
      data: { scrapeCount: { decrement: 1 } },
    });
  };

  try {
    const bundle = await parsePdfFiles(files);
    const config = await extractAgentConfig(industry, bundle.combinedText);
    const fieldsFilled = Object.keys(config).length;

    logger.info(
      {
        businessId,
        industry,
        pdfCount: bundle.files.length,
        totalChars: bundle.combinedText.length,
        fieldsFilled,
        admin: isAdmin,
      },
      "agent autofill from pdfs",
    );

    return { ok: true, config, remaining, files: bundle.files, fieldsFilled };
  } catch (err) {
    await refundCredit();
    if (err instanceof PdfParseError) {
      return { ok: false, error: err.message, code: err.code, remaining };
    }
    logger.error({ err }, "agent autofill failed");
    return { ok: false, error: "Failed to read or analyse the PDFs", code: "unknown", remaining };
  }
}

export async function getScrapeQuota(): Promise<{ used: number; max: number; remaining: number; admin: boolean }> {
  const ctx = await requireAuth();
  if (ctx.role === "SUPERADMIN") {
    return { used: 0, max: Infinity, remaining: Infinity, admin: true };
  }
  const businessId = await getActiveBusinessId();
  if (!businessId) return { used: 0, max: MAX_AUTOFILLS_PER_BUSINESS, remaining: MAX_AUTOFILLS_PER_BUSINESS, admin: false };
  const biz = await prisma.business.findUnique({ where: { id: businessId }, select: { scrapeCount: true } });
  const used = biz?.scrapeCount ?? 0;
  return { used, max: MAX_AUTOFILLS_PER_BUSINESS, remaining: Math.max(0, MAX_AUTOFILLS_PER_BUSINESS - used), admin: false };
}
