"use client";

import { useState } from "react";
import TopBar from "@/components/dashboard/TopBar";

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
  const [email, setEmail] = useState(initialEmail);
  const [timezone, setTimezone] = useState(initialTimezone);
  const [notifications, setNotifications] = useState({
    escalations: true,
    dailyReport: true,
    weeklyReport: false,
    newConversation: false,
  });

  return (
    <>
      <TopBar title="Settings" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl">
        {/* Business Info */}
        <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-5">Business Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Business name</label>
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white text-sm focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white text-sm focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">Timezone</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white text-sm focus:outline-none focus:border-[#8B5CF6] transition-colors"
              >
                <option value="Australia/Sydney">Australia/Sydney (AEST)</option>
                <option value="Australia/Melbourne">Australia/Melbourne (AEST)</option>
                <option value="Australia/Brisbane">Australia/Brisbane (AEST)</option>
                <option value="Australia/Perth">Australia/Perth (AWST)</option>
                <option value="Australia/Adelaide">Australia/Adelaide (ACST)</option>
              </select>
            </div>
            <button className="gradient-btn text-white text-sm font-semibold px-6 py-2.5 rounded-xl glow-sm hover:glow-md transition-all">
              Save Changes
            </button>
          </div>
        </div>

        {/* SMS Configuration */}
        <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-5">SMS Configuration</h3>
          <div className="space-y-4">
            {smsNumbers.map((sms) => (
              <div key={sms.number} className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
                <div>
                  <div className="text-sm font-medium text-white">Virtual Number</div>
                  <div className="text-xs text-[#71717A]">{sms.number}</div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                  sms.active
                    ? "bg-[rgba(34,197,94,0.12)] text-[#22c55e]"
                    : "bg-[rgba(113,113,122,0.12)] text-[#71717A]"
                }`}>
                  {sms.active ? "Active" : "Inactive"}
                </span>
              </div>
            ))}
            {smsNumbers.length === 0 && (
              <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] text-sm text-[#71717A]">
                No SMS numbers configured yet.
              </div>
            )}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]">
              <div>
                <div className="text-sm font-medium text-white">SMS Provider</div>
                <div className="text-xs text-[#71717A]">Cellcast — Direct carrier connection (Telstra, Optus, Vodafone)</div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-[rgba(34,197,94,0.12)] text-[#22c55e]">
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card-gradient border border-[rgba(139,92,246,0.1)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-white mb-5">Notifications</h3>
          <div className="space-y-3">
            {[
              { key: "escalations", label: "Escalation alerts", desc: "Get notified when a conversation is escalated to a human" },
              { key: "dailyReport", label: "Daily report", desc: "Summary of all conversations every morning at 8am" },
              { key: "weeklyReport", label: "Weekly analytics", desc: "Performance report every Monday" },
              { key: "newConversation", label: "New conversations", desc: "Alert for every new inbound message" },
            ].map((n) => (
              <div
                key={n.key}
                className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)]"
              >
                <div>
                  <div className="text-sm font-medium text-white">{n.label}</div>
                  <div className="text-xs text-[#71717A]">{n.desc}</div>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      [n.key]: !prev[n.key as keyof typeof prev],
                    }))
                  }
                  className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                    notifications[n.key as keyof typeof notifications]
                      ? "bg-[#8B5CF6]"
                      : "bg-[rgba(255,255,255,0.1)]"
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
                      notifications[n.key as keyof typeof notifications]
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Danger zone */}
        <div className="border border-[rgba(239,68,68,0.2)] rounded-xl p-6">
          <h3 className="text-sm font-semibold text-[#ef4444] mb-2">Danger Zone</h3>
          <p className="text-xs text-[#71717A] mb-4">
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
