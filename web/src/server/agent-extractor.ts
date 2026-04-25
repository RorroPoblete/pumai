import OpenAI from "openai";
import {
  getFormSchema,
  type FormField,
  type FormState,
  type Pair,
} from "@/lib/agent-templates";

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

type JsonSchema = {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required: string[];
  additionalProperties: false;
};

type JsonSchemaProperty =
  | { type: "string"; description?: string }
  | { type: "array"; items: { type: "string" }; description?: string }
  | {
      type: "array";
      items: {
        type: "object";
        properties: { key: { type: "string" }; value: { type: "string" } };
        required: ["key", "value"];
        additionalProperties: false;
      };
      description?: string;
    };

function fieldDescription(field: FormField): string {
  const base = field.hint ? `${field.label}. ${field.hint}` : field.label;
  if (field.placeholder) return `${base} Example: ${field.placeholder}`;
  return base;
}

function fieldToJsonSchema(field: FormField): JsonSchemaProperty {
  const desc = fieldDescription(field);
  if (field.type === "text" || field.type === "textarea") {
    return { type: "string", description: desc };
  }
  if (field.type === "list") {
    return { type: "array", items: { type: "string" }, description: desc };
  }
  return {
    type: "array",
    items: {
      type: "object",
      properties: { key: { type: "string" }, value: { type: "string" } },
      required: ["key", "value"],
      additionalProperties: false,
    },
    description: `${desc}. Each item is {key, value}.`,
  };
}

function buildJsonSchema(industry: string): { schema: JsonSchema; fields: FormField[] } | null {
  const schema = getFormSchema(industry);
  if (!schema) return null;
  const fields: FormField[] = [];
  const properties: Record<string, JsonSchemaProperty> = {};
  for (const section of [...schema.systemPrompt, ...schema.knowledgeBase]) {
    for (const f of section.fields) {
      fields.push(f);
      properties[f.key] = fieldToJsonSchema(f);
    }
  }
  return {
    schema: {
      type: "object",
      properties,
      required: Object.keys(properties),
      additionalProperties: false,
    },
    fields,
  };
}

function isPair(v: unknown): v is Pair {
  return (
    typeof v === "object" &&
    v !== null &&
    "key" in v &&
    "value" in v &&
    typeof (v as { key: unknown }).key === "string" &&
    typeof (v as { value: unknown }).value === "string"
  );
}

function nonEmpty(field: FormField, raw: unknown): unknown {
  if (field.type === "text" || field.type === "textarea") {
    return typeof raw === "string" && raw.trim().length > 0 ? raw.trim() : undefined;
  }
  if (field.type === "list") {
    if (!Array.isArray(raw)) return undefined;
    const items = raw.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
    return items.length ? items : undefined;
  }
  if (field.type === "kvList") {
    if (!Array.isArray(raw)) return undefined;
    const pairs = raw
      .filter(isPair)
      .map((p) => ({ key: p.key.trim(), value: p.value.trim() }))
      .filter((p) => p.key || p.value);
    return pairs.length ? pairs : undefined;
  }
  return undefined;
}

const SYSTEM_INSTRUCTION = `You extract structured business data from source material (PDFs, brochures, website content) for an Australian customer-service AI agent template.

Rules:
- Use only information found in the provided content. Do NOT invent details.
- Leave a field as an empty string or empty array if the content does not support it.
- Use Australian English. Format prices in AUD with the dollar sign.
- For business hours, format as "Mon-Fri: 9:00am - 5:00pm AEST" style lines.
- For phone numbers, use the format that appears in the source (preserve country code if shown).
- For lists of services / products / FAQs, prefer 3-10 high-value items; do not pad.
- Do not output marketing fluff. Be concise and factual.

Length budget (HARD limits — exceed and the agent context will overflow):
- Each text / textarea field: ≤ 600 characters.
- Each list: ≤ 10 items, ≤ 120 chars per item.
- Each kvList: ≤ 12 items, ≤ 200 chars per value.
- "extraInformation" specifically: ≤ 3,000 characters total.
- If the source has more material, pick the most useful and stop. Do not paste long passages verbatim.

The "extraInformation" field is a CATCH-ALL.
- After filling every field that has a clear match, scan the source for any other material details that did NOT fit a specific field.
- Examples: unique policies, regional differences, partnership notes, awards, important fine-print, cohort-specific notes, accreditation footnotes, named contacts, dates not covered by other fields, and anything else a customer might ask about.
- Summarise these in extraInformation using short labelled paragraphs or bullet lines. Preserve specific numbers, names, dates, and codes verbatim.
- Do NOT duplicate content already captured in another field.
- If nothing material is left over, leave extraInformation empty.`;

export async function extractAgentConfig(
  industry: string,
  scrapedContent: string,
): Promise<Partial<FormState>> {
  const built = buildJsonSchema(industry);
  if (!built) return {};

  const client = getClient();
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "agent_config_extract",
        strict: true,
        schema: built.schema as unknown as Record<string, unknown>,
      },
    },
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      {
        role: "user",
        content: `Industry: ${industry}\n\nWebsite content:\n${scrapedContent}\n\nExtract the agent configuration JSON.`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) return {};
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }

  const result: Partial<FormState> = {};
  for (const f of built.fields) {
    const value = nonEmpty(f, parsed[f.key]);
    if (value !== undefined) (result as Record<string, unknown>)[f.key] = value;
  }
  return result;
}
