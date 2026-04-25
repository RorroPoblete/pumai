"use client";

// Mirrors web/src/server/validation.ts → strongPassword. Keep in sync.
export const passwordRules = {
  length: (p: string) => p.length >= 12,
  uppercase: (p: string) => /[A-Z]/.test(p),
  number: (p: string) => /\d/.test(p),
  symbol: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p),
};

export function isStrongPassword(p: string): boolean {
  return passwordRules.length(p)
    && passwordRules.uppercase(p)
    && passwordRules.number(p)
    && passwordRules.symbol(p);
}

export function PasswordChecklist({ password, size = "sm" }: { password: string; size?: "xs" | "sm" }) {
  const items = [
    { ok: passwordRules.length(password), label: "At least 12 characters" },
    { ok: passwordRules.uppercase(password), label: "At least 1 capital letter" },
    { ok: passwordRules.number(password), label: "At least 1 number" },
    { ok: passwordRules.symbol(password), label: "At least 1 special character" },
  ];
  const text = size === "xs" ? "text-[9px]" : "text-[10px]";
  return (
    <div className={`${text} space-y-0.5 mt-2`}>
      {items.map((it) => (
        <p key={it.label} className={it.ok ? "text-[#22c55e]" : "text-[var(--text-muted)]"}>
          {it.ok ? "✓" : "○"} {it.label}
        </p>
      ))}
    </div>
  );
}
