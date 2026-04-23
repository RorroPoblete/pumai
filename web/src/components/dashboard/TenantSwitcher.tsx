"use client";

import { useTransition } from "react";
import { setActiveBusiness } from "@/server/actions";

interface Tenant {
  id: string;
  name: string;
  industry: string;
}

export default function TenantSwitcher({
  tenants,
  activeId,
  activeName,
  isSuperadmin,
}: {
  tenants: Tenant[];
  activeId: string | null;
  activeName: string | null;
  isSuperadmin: boolean;
}) {
  const [, startTransition] = useTransition();
  if (tenants.length <= 1 && !isSuperadmin) return null;

  function handleSwitch(businessId: string) {
    if (!businessId) return;
    startTransition(() => setActiveBusiness(businessId));
  }

  return (
    <div className="px-3 mb-2">
      {isSuperadmin && (
        <div className="flex items-center gap-1.5 px-3 mb-2">
          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[rgba(239,68,68,0.12)] text-[#ef4444]">
            Admin
          </span>
          <a href="/dashboard/tenants" className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors">
            Manage tenants
          </a>
        </div>
      )}
      <select
        value={activeId ?? ""}
        onChange={(e) => handleSwitch(e.target.value)}
        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6] transition-colors appearance-none cursor-pointer"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2371717A'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          backgroundSize: "16px",
        }}
      >
        {!activeId && <option value="">Select a business...</option>}
        {tenants.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.industry})
          </option>
        ))}
      </select>
    </div>
  );
}
