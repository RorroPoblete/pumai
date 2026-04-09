"use client";

import { useState, useTransition } from "react";
import { createTenant, deleteTenant, updateTenantPlan } from "@/backend/admin-actions";

interface Business {
  id: string;
  name: string;
  plan: string;
  industry: string;
  phone: string | null;
  conversations: number;
  agents: number;
  members: number;
  createdAt: string;
}

const planColor: Record<string, string> = {
  ENTERPRISE: "bg-[rgba(139,92,246,0.12)] text-[#A78BFA]",
  GROWTH: "bg-[rgba(59,130,246,0.12)] text-[#3b82f6]",
  STARTER: "bg-[rgba(255,255,255,0.06)] text-[#71717A]",
};

const industries = ["Healthcare", "Automotive", "Real Estate", "E-commerce & Retail", "Trades & Services", "Hospitality", "Education", "Other"];

export default function TenantsList({ businesses }: { businesses: Business[] }) {
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = businesses.filter(
    (b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.industry.toLowerCase().includes(search.toLowerCase()),
  );

  function handleView(id: string) {
    document.cookie = `pumai_active_business=${id};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    window.location.href = "/dashboard";
  }

  function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}" and ALL its data? This cannot be undone.`)) return;
    startTransition(() => deleteTenant(id));
  }

  function handlePlanChange(id: string, plan: string) {
    startTransition(() => updateTenantPlan(id, plan));
  }

  return (
    <>
      {/* Actions bar */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-xs px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] transition-colors"
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="gradient-btn text-white text-sm font-semibold px-5 py-2 rounded-xl glow-sm hover:glow-md transition-all whitespace-nowrap"
        >
          {showForm ? "Cancel" : "+ New Tenant"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form
          action={(fd) => startTransition(() => createTenant(fd))}
          className="card-gradient border border-[rgba(139,92,246,0.15)] rounded-xl p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-white">Create New Tenant</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Business Name</label>
              <input name="name" required placeholder="Acme Pty Ltd" className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6]" />
            </div>
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Industry</label>
              <select name="industry" required className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-sm text-white focus:outline-none focus:border-[#8B5CF6]">
                <option value="">Select...</option>
                {industries.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Owner Name</label>
              <input name="ownerName" required placeholder="John Smith" className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6]" />
            </div>
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Owner Email</label>
              <input name="ownerEmail" type="email" required placeholder="john@acme.com.au" className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-sm text-white placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6]" />
            </div>
            <div>
              <label className="block text-xs text-[#A1A1AA] mb-1">Plan</label>
              <select name="plan" className="w-full px-3 py-2 rounded-lg bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-sm text-white focus:outline-none focus:border-[#8B5CF6]">
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="gradient-btn text-white text-sm font-semibold px-6 py-2.5 rounded-xl glow-sm hover:glow-md transition-all disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create Tenant"}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.06)]">
                {["Business", "Plan", "Industry", "Members", "Convos", "Agents", "Created", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(139,92,246,0.03)] transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-white">{b.name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={b.plan}
                      onChange={(e) => handlePlanChange(b.id, e.target.value)}
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border-0 cursor-pointer ${planColor[b.plan] ?? planColor.STARTER}`}
                      style={{ background: "transparent" }}
                    >
                      <option value="STARTER">Starter</option>
                      <option value="GROWTH">Growth</option>
                      <option value="ENTERPRISE">Enterprise</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#A1A1AA]">{b.industry}</td>
                  <td className="px-4 py-3 text-xs text-[#A1A1AA]">{b.members}</td>
                  <td className="px-4 py-3 text-xs text-[#A1A1AA]">{b.conversations}</td>
                  <td className="px-4 py-3 text-xs text-[#A1A1AA]">{b.agents}</td>
                  <td className="px-4 py-3 text-xs text-[#71717A]">{b.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleView(b.id)}
                        disabled={pending}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-[rgba(139,92,246,0.1)] text-[#A78BFA] hover:bg-[rgba(139,92,246,0.2)] transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDelete(b.id, b.name)}
                        disabled={pending}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-[rgba(239,68,68,0.08)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.15)] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[#71717A] text-sm">No tenants found.</div>
        )}
      </div>
    </>
  );
}
