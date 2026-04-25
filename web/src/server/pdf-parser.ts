import { PDFParse } from "pdf-parse";
import { PDF_LIMITS } from "@/lib/agent-templates";

export const MAX_PDF_BYTES = PDF_LIMITS.MAX_PDF_BYTES;
export const MAX_PDFS = PDF_LIMITS.MAX_PDFS;
export const MAX_TOTAL_BYTES = PDF_LIMITS.MAX_TOTAL_BYTES;
export const MAX_EXTRACTED_CHARS = 25_000;

export class PdfParseError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = "PdfParseError";
  }
}

function isPdfMagic(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2d
  );
}

export async function parsePdfFile(
  file: File,
): Promise<{ name: string; text: string; pages: number }> {
  if (file.size > MAX_PDF_BYTES) {
    throw new PdfParseError("too_large", `${file.name} is over 10 MB`);
  }
  const buffer = new Uint8Array(await file.arrayBuffer());
  if (!isPdfMagic(buffer)) {
    throw new PdfParseError("not_pdf", `${file.name} is not a valid PDF`);
  }
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = (result?.text ?? "").replace(/\s+\n/g, "\n").trim();
    return { name: file.name, text, pages: result?.total ?? 0 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    throw new PdfParseError("extract_failed", `Could not extract text from ${file.name}: ${msg}`);
  }
}

export type ParsedPdfBundle = {
  combinedText: string;
  files: { name: string; pages: number; chars: number }[];
};

export async function parsePdfFiles(files: File[]): Promise<ParsedPdfBundle> {
  if (files.length === 0) throw new PdfParseError("empty", "Add at least one PDF");
  if (files.length > MAX_PDFS) {
    throw new PdfParseError("too_many", `Maximum ${MAX_PDFS} PDFs per upload`);
  }
  const totalBytes = files.reduce((s, f) => s + f.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new PdfParseError("too_large_total", "Combined PDF size exceeds 25 MB");
  }

  const parts: string[] = [];
  const summary: ParsedPdfBundle["files"] = [];
  for (const file of files) {
    const parsed = await parsePdfFile(file);
    if (!parsed.text) continue;
    parts.push(`# ${parsed.name} (${parsed.pages} pages)\n${parsed.text}`);
    summary.push({ name: parsed.name, pages: parsed.pages, chars: parsed.text.length });
  }
  if (parts.length === 0) {
    throw new PdfParseError("no_text", "Could not extract any text from these PDFs");
  }

  let combined = parts.join("\n\n---\n\n");
  if (combined.length > MAX_EXTRACTED_CHARS) {
    combined = combined.slice(0, MAX_EXTRACTED_CHARS) + "\n...[truncated]";
  }
  return { combinedText: combined, files: summary };
}
