"use client";

import { useState, useTransition } from "react";
import TopBar from "@/components/dashboard/TopBar";
import { updateSettings, updatePassword } from "@/backend/actions";

interface SettingsFormProps {
  initialBusinessName: string;
  initialEmail: string;
  initialTimezone: string;
  smsNumbers: { number: string; active: boolean }[];
}

export default function SettingsForm({
  initialBusinessName,
  initialEmail,
  initialTimezone,
  smsNumbers,
}: SettingsFormProps) {
  const [businessName, setBusinessName] = useState(initialBusinessName);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [notifications, setNotifications] = useState({
    escalations: true,
    dailyReport: true,
    weeklyReport: false,
    newConversation: false,
  });

  function handleSaveSettings() {
    startTransition(async () => {
      await updateSettings({ businessName, timezone });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  function handleChangePassword() {
    if (!currentPw || !newPw || newPw.length < 8) {
      setPwMsg({ ok: false, text: "New password must be at least 8 characters" });
      return;
    }
    startTransition(async () => {
      try {
        await updatePassword(currentPw, newPw);
        setPwMsg({ ok: true, text: "Password updated" });
        setCurrentPw("");
        setNewPw("");
      } catch {
        setPwMsg({ ok: false, text: "Current password is incorrect" });
      }
      setTimeout(() => setPwMsg(null), 3000);
    });
  }

  const inputClass = "w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm focus:outline-none focus:border-[#8B5CF6] transition-colors";

  return (
    <>
      <TopBar title="Settings" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl">
        {/* Business Info */}
        <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Business Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Business name</label>
              <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <input type="email" value={initialEmail} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Email cannot be changed</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Timezone</label>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className={inputClass}>
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                <option value="Australia/Melbourne">Australia/Melbourne (AEST)</option>
                <option value="Australia/Brisbane">Australia/Brisbane (AEST)</option>
                <option value="Australia/Perth">Australia/Perth (AWST)</option>
                <option value="Australia/Adelaide">Australia/Adelaide (ACST)</option>
              </select>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={pending}
              className="gradient-btn !text-white text-sm font-semibold px-6 py-2.5 rounded-xl glow-sm hover:glow-md transition-all disabled:opacity-50"
            >
              {pending ? "Saving..." : saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Change Password</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Current password</label>
              <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Enter current password" className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">New password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Minimum 8 characters" className={inputClass} />
            </div>
            {pwMsg && (
              <p className={`text-xs ${pwMsg.ok ? "text-[#22c55e]" : "text-[#ef4444]"}`}>{pwMsg.text}</p>
            )}
            <button
              onClick={handleChangePassword}
              disabled={pending || !currentPw || !newPw}
              className="text-sm font-semibold px-6 py-2.5 rounded-xl border border-[rgba(139,92,246,0.3)] text-[#8B5CF6] hover:bg-[rgba(139,92,246,0.08)] transition-all disabled:opacity-50"
            >
              {pending ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>

        {/* SMS Configuration */}
        <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5">SMS Configuration</h3>
          <div className="space-y-4">
            {smsNumbers.map((sms) => (
              <div key={sms.number} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">Virtual Number</div>
                  <div className="text-xs text-[var(--text-muted)]">{sms.number}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  sms.active ? "bg-[rgba(34,197,94,0.12)] text-[#22c55e]" : "bg-[rgba(113,113,122,0.12)] text-[var(--text-muted)]"
                }`}>
                  {sms.active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
            {smsNumbers.length === 0 && (
              <div className="p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)] text-sm text-[var(--text-muted)]">
                No SMS numbers configured yet.
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-5">Notifications</h3>
          <div className="space-y-3">
            {[
              { key: "escalations", label: "Escalation alerts", desc: "Get notified when a conversation is escalated" },
              { key: "dailyReport", label: "Daily report", desc: "Summary of all conversations every morning at 8am" },
              { key: "weeklyReport", label: "Weekly analytics", desc: "Performance report every Monday" },
              { key: "newConversation", label: "New conversations", desc: "Alert for every new inbound message" },
            ].map((n) => (
              <div key={n.key} className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-input)] border border-[var(--border-subtle)]">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{n.label}</div>
                  <div className="text-xs text-[var(--text-muted)]">{n.desc}</div>
                </div>
                <button
                  onClick={() => setNotifications((prev) => ({ ...prev, [n.key]: !prev[n.key as keyof typeof prev] }))}
                  className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                    notifications[n.key as keyof typeof notifications] ? "bg-[#8B5CF6]" : "bg-[var(--bg-hover)]"
                  }`}
                >
                  <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                    notifications[n.key as keyof typeof notifications] ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="border border-[rgba(239,68,68,0.2)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#ef4444] mb-2">Danger Zone</h3>
          <p className="text-xs text-[var(--text-muted)] mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          <button className="text-sm font-semibold text-[#ef4444] px-5 py-2.5 rounded-xl border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.08)] transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </>
  );
}
