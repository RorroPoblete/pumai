"use client";

import type { FormSection, FormField, FormState, Pair } from "@/lib/agent-templates";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors";

const textareaClass = `${inputClass} resize-y leading-relaxed`;

const labelClass = "block text-xs font-medium text-[var(--text-secondary)] mb-1.5";

const ghostBtn =
  "text-xs font-semibold px-3 py-1.5 rounded-lg border border-[rgba(139,92,246,0.3)] text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)] transition-colors";

const removeBtn =
  "text-xs px-2.5 py-1.5 rounded-lg border border-[rgba(239,68,68,0.25)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors";

function ensureString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function ensureList(v: unknown): string[] {
  return Array.isArray(v) ? (v.filter((x) => typeof x === "string") as string[]) : [];
}

function ensurePairs(v: unknown): Pair[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => ({
    key: typeof x?.key === "string" ? x.key : "",
    value: typeof x?.value === "string" ? x.value : "",
  }));
}

function FieldRenderer({
  field,
  state,
  setValue,
}: {
  field: FormField;
  state: FormState;
  setValue: (key: string, value: FormState[string]) => void;
}) {
  if (field.type === "text") {
    return (
      <div>
        <label className={labelClass}>{field.label}</label>
        <input
          type="text"
          value={ensureString(state[field.key])}
          onChange={(e) => setValue(field.key, e.target.value)}
          placeholder={field.placeholder}
          className={inputClass}
        />
        {field.hint && <p className="text-[10px] text-[var(--text-muted)] mt-1">{field.hint}</p>}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div>
        <label className={labelClass}>{field.label}</label>
        <textarea
          value={ensureString(state[field.key])}
          onChange={(e) => setValue(field.key, e.target.value)}
          placeholder={field.placeholder}
          rows={field.rows ?? 3}
          className={textareaClass}
        />
        {field.hint && <p className="text-[10px] text-[var(--text-muted)] mt-1">{field.hint}</p>}
      </div>
    );
  }

  if (field.type === "list") {
    const items = ensureList(state[field.key]);
    return (
      <div>
        <label className={labelClass}>{field.label}</label>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={item}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = e.target.value;
                  setValue(field.key, next);
                }}
                placeholder={field.placeholder}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setValue(field.key, items.filter((_, idx) => idx !== i))}
                className={removeBtn}
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setValue(field.key, [...items, ""])}
            className={ghostBtn}
          >
            + Add
          </button>
        </div>
        {field.hint && <p className="text-[10px] text-[var(--text-muted)] mt-1">{field.hint}</p>}
      </div>
    );
  }

  if (field.type === "kvList") {
    const items = ensurePairs(state[field.key]);
    return (
      <div>
        <label className={labelClass}>{field.label}</label>
        <div className="space-y-3">
          {items.map((pair, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-input)]">
              <div>
                <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {field.keyLabel ?? "Key"}
                </label>
                <input
                  type="text"
                  value={pair.key}
                  onChange={(e) => {
                    const next = [...items];
                    next[i] = { ...next[i], key: e.target.value };
                    setValue(field.key, next);
                  }}
                  placeholder={field.keyPlaceholder}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">
                  {field.valueLabel ?? "Value"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(e) => {
                      const next = [...items];
                      next[i] = { ...next[i], value: e.target.value };
                      setValue(field.key, next);
                    }}
                    placeholder={field.valuePlaceholder}
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setValue(field.key, items.filter((_, idx) => idx !== i))}
                    className={removeBtn}
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setValue(field.key, [...items, { key: "", value: "" }])}
            className={ghostBtn}
          >
            + Add
          </button>
        </div>
        {field.hint && <p className="text-[10px] text-[var(--text-muted)] mt-1">{field.hint}</p>}
      </div>
    );
  }

  return null;
}

export function StructuredForm({
  sections,
  state,
  setValue,
}: {
  sections: FormSection[];
  state: FormState;
  setValue: (key: string, value: FormState[string]) => void;
}) {
  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <div
          key={section.title}
          className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-5 space-y-4"
        >
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{section.title}</h3>
            {section.description && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{section.description}</p>
            )}
          </div>
          <div className="space-y-4">
            {section.fields.map((field) => (
              <FieldRenderer key={field.key} field={field} state={state} setValue={setValue} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyIndustryNotice() {
  return (
    <div className="card-gradient border border-[rgba(245,158,11,0.25)] rounded-xl p-5 text-sm text-[var(--text-secondary)]">
      Pick an industry on the <strong className="text-[var(--text-primary)]">Configuration</strong> tab to load the matching form.
    </div>
  );
}
