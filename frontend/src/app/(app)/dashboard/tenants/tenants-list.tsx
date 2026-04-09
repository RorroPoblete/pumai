"use client";

import { useState, useTransition } from "react";
import { createTenant, deleteTenant, updateTenantPlan, addUserToTenant, removeUserFromTenant, updateMemberRole, deleteUser } from "@/backend/admin-actions";

interface Member {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  role: string;
  globalRole: string;
  createdAt: string;
}

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
  membersList: Member[];
}

const planColor: Record<string, string> = {
  ENTERPRISE: "bg-[rgba(139,92,246,0.12)] text-[#8B5CF6]",
  GROWTH: "bg-[rgba(59,130,246,0.12)] text-[#3b82f6]",
  STARTER: "bg-[var(--bg-hover)] text-[var(--text-muted)]",
};

const roleColor: Record<string, string> = {
  OWNER: "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]",
  ADMIN: "bg-[rgba(59,130,246,0.12)] text-[#3b82f6]",
  MEMBER: "bg-[var(--bg-hover)] text-[var(--text-muted)]",
};

const industries = ["Healthcare", "Automotive", "Real Estate", "E-commerce & Retail", "Trades & Services", "Hospitality", "Education", "Other"];
const inputClass = "w-full px-3 py-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6]";

export default function TenantsList({ businesses }: { businesses: Business[] }) {
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addUserForBiz, setAddUserForBiz] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = businesses.filter(
    (b) => b.name.toLowerCase().includes(search.toLowerCase()) || b.industry.toLowerCase().includes(search.toLowerCase()),
  );

  function handleView(id: string) {
    document.cookie = `pumai_active_business=${id};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;
    window.location.href = "/dashboard";
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
          className="w-full max-w-xs px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
        />
        <button
          onClick={() => setShowForm(!showForm)}
          className="gradient-btn !text-white text-sm font-semibold px-5 py-2 rounded-xl glow-sm hover:glow-md transition-all whitespace-nowrap"
        >
          {showForm ? "Cancel" : "+ New Tenant"}
        </button>
      </div>

      {/* Create tenant form */}
      {showForm && (
        <form
          action={(fd) => startTransition(() => createTenant(fd))}
          className="card-gradient border border-[rgba(139,92,246,0.15)] rounded-xl p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Create New Tenant</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Business Name</label>
              <input name="name" required placeholder="Acme Pty Ltd" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Industry</label>
              <select name="industry" required className={inputClass}>
                <option value="">Select...</option>
                {industries.map((i) => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Owner Name</label>
              <input name="ownerName" required placeholder="John Smith" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Owner Email</label>
              <input name="ownerEmail" type="email" required placeholder="john@acme.com.au" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Plan</label>
              <select name="plan" className={inputClass}>
                <option value="STARTER">Starter</option>
                <option value="GROWTH">Growth</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={pending} className="gradient-btn !text-white text-sm font-semibold px-6 py-2.5 rounded-xl glow-sm hover:glow-md transition-all disabled:opacity-50">
            {pending ? "Creating..." : "Create Tenant"}
          </button>
        </form>
      )}

      {/* Tenant cards with expandable users */}
      <div className="space-y-3">
        {filtered.map((b) => {
          const isExpanded = expandedId === b.id;
          return (
            <div key={b.id} className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
              {/* Tenant row */}
              <div className="flex flex-wrap items-center gap-3 px-4 sm:px-5 py-4">
                <button onClick={() => setExpandedId(isExpanded ? null : b.id)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  <svg className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-0.5">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{b.name}</span>
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${planColor[b.plan]}`}>{b.plan}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-[var(--text-muted)]">
                    <span>{b.industry}</span>
                    <span>{b.members} users</span>
                    <span>{b.conversations} convos</span>
                    <span>{b.agents} agents</span>
                    <span>{b.createdAt}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={b.plan}
                    onChange={(e) => startTransition(() => updateTenantPlan(b.id, e.target.value))}
                    className="text-[10px] font-semibold px-2 py-1 rounded-md bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-secondary)] cursor-pointer"
                  >
                    <option value="STARTER">Starter</option>
                    <option value="GROWTH">Growth</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                  <button onClick={() => handleView(b.id)} className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-[rgba(139,92,246,0.1)] text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.2)] transition-colors">
                    View
                  </button>
                  <button onClick={() => { if (confirm(`Delete "${b.name}"?`)) startTransition(() => deleteTenant(b.id)); }} disabled={pending} className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-[rgba(239,68,68,0.08)] text-[#ef4444] hover:bg-[rgba(239,68,68,0.15)] transition-colors">
                    Delete
                  </button>
                </div>
              </div>

              {/* Expanded: User management */}
              {isExpanded && (
                <div className="border-t border-[var(--border-subtle)] px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Users ({b.membersList.length})</h4>
                    <button
                      onClick={() => setAddUserForBiz(addUserForBiz === b.id ? null : b.id)}
                      className="text-[10px] font-semibold px-3 py-1 rounded-md bg-[rgba(34,197,94,0.1)] text-[#22c55e] hover:bg-[rgba(34,197,94,0.2)] transition-colors"
                    >
                      {addUserForBiz === b.id ? "Cancel" : "+ Add User"}
                    </button>
                  </div>

                  {/* Add user form */}
                  {addUserForBiz === b.id && (
                    <form
                      action={(fd) => { fd.set("businessId", b.id); startTransition(() => addUserToTenant(fd)); setAddUserForBiz(null); }}
                      className="flex items-end gap-3 p-3 rounded-lg bg-[var(--bg-input)] border border-[var(--border-subtle)]"
                    >
                      <div className="flex-1">
                        <label className="block text-[10px] text-[var(--text-muted)] mb-1">Name</label>
                        <input name="name" required placeholder="Jane Doe" className="w-full px-2.5 py-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-input)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6]" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] text-[var(--text-muted)] mb-1">Email</label>
                        <input name="email" type="email" required placeholder="jane@company.com" className="w-full px-2.5 py-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-input)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6]" />
                      </div>
                      <div className="w-28">
                        <label className="block text-[10px] text-[var(--text-muted)] mb-1">Role</label>
                        <select name="role" className="w-full px-2.5 py-1.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-input)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6]">
                          <option value="MEMBER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </div>
                      <button type="submit" disabled={pending} className="gradient-btn !text-white text-[10px] font-semibold px-4 py-1.5 rounded-md disabled:opacity-50">
                        Add
                      </button>
                    </form>
                  )}

                  {/* Members table */}
                  <div className="space-y-1">
                    {b.membersList.map((m) => (
                      <div key={m.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-hover)] transition-colors">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#A78BFA] flex items-center justify-center text-[10px] font-bold !text-white flex-shrink-0">
                          {m.userName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{m.userName}</span>
                            {m.globalRole === "SUPERADMIN" && (
                              <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-[rgba(239,68,68,0.12)] text-[#ef4444]">SA</span>
                            )}
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] truncate block">{m.userEmail}</span>
                        </div>
                        <select
                          value={m.role}
                          onChange={(e) => startTransition(() => updateMemberRole(m.id, e.target.value))}
                          disabled={m.role === "OWNER"}
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border-0 cursor-pointer ${roleColor[m.role]} disabled:cursor-default`}
                          style={{ background: "transparent" }}
                        >
                          {m.role === "OWNER" && <option value="OWNER">Owner</option>}
                          <option value="ADMIN">Admin</option>
                          <option value="MEMBER">Member</option>
                        </select>
                        <span className="text-[10px] text-[var(--text-muted)]">{m.createdAt}</span>
                        {m.role !== "OWNER" && (
                          <button
                            onClick={() => { if (confirm(`Remove ${m.userName} from ${b.name}?`)) startTransition(() => removeUserFromTenant(m.id)); }}
                            disabled={pending}
                            className="text-[10px] text-[#ef4444] hover:text-[#f87171] transition-colors disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                    {b.membersList.length === 0 && (
                      <div className="text-center py-4 text-[var(--text-muted)] text-xs">No users assigned</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">No tenants found.</div>
        )}
      </div>
    </>
  );
}
