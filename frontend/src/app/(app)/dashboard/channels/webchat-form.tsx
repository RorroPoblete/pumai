"use client";

import { useState } from "react";
import { saveWebchat } from "@/backend/channel-actions";
import type { WebchatBranding } from "@/backend/channel-queries";

interface Props {
  agents: { id: string; name: string }[];
  initial: WebchatBranding | null;
  initialAgentId: string | null;
  onSaved: () => void;
}

export default function WebchatForm({ agents, initial, initialAgentId, onSaved }: Props) {
  const [agentId, setAgentId] = useState(initialAgentId ?? "");
  const [primaryColor, setPrimaryColor] = useState(initial?.primaryColor ?? "#8B5CF6");
  const [title, setTitle] = useState(initial?.title ?? "Chat");
  const [welcomeMessage, setWelcomeMessage] = useState(initial?.welcomeMessage ?? "Hi! How can we help?");
  const [position, setPosition] = useState<"left" | "right">(initial?.position ?? "right");
  const [collectVisitor, setCollectVisitor] = useState<"off" | "optional" | "required">(
    initial?.collectVisitor ?? "off",
  );
  const [offlineMode, setOfflineMode] = useState<"off" | "always">(
    initial?.offlineMode ?? "off",
  );
  const [allowedOriginsText, setAllowedOriginsText] = useState(
    (initial?.allowedOrigins ?? []).join("\n"),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!agentId) {
      setError("Select an agent");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const origins = allowedOriginsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      await saveWebchat({
        agentId,
        primaryColor,
        title,
        welcomeMessage,
        position,
        collectVisitor,
        offlineMode,
        allowedOrigins: origins,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Agent</label>
          <select
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
          >
            <option value="">Select an agent...</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Position</label>
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value as "left" | "right")}
            className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
          >
            <option value="right">Bottom right</option>
            <option value="left">Bottom left</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={40}
            className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Primary color</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded-lg border border-[var(--border-input)] bg-transparent cursor-pointer"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              maxLength={7}
              className="flex-1 px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[#8B5CF6] transition-colors"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Welcome message</label>
        <input
          type="text"
          value={welcomeMessage}
          onChange={(e) => setWelcomeMessage(e.target.value)}
          maxLength={200}
          className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Visitor name capture
          </label>
          <select
            value={collectVisitor}
            onChange={(e) => setCollectVisitor(e.target.value as "off" | "optional" | "required")}
            className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
          >
            <option value="off">Do not ask</option>
            <option value="optional">Ask, allow skip</option>
            <option value="required">Required before chat</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
            Offline mode
          </label>
          <select
            value={offlineMode}
            onChange={(e) => setOfflineMode(e.target.value as "off" | "always")}
            className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#8B5CF6] transition-colors"
          >
            <option value="off">Live chat (AI replies)</option>
            <option value="always">Offline (capture email, async)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
          Allowed origins (one per line, empty = any)
        </label>
        <textarea
          value={allowedOriginsText}
          onChange={(e) => setAllowedOriginsText(e.target.value)}
          rows={2}
          placeholder="https://www.example.com"
          className="w-full px-4 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-sm text-[var(--text-primary)] font-mono focus:outline-none focus:border-[#8B5CF6] transition-colors"
        />
      </div>

      {error && <p className="text-xs text-[#ef4444]">{error}</p>}

      <button
        onClick={save}
        disabled={saving}
        className="px-6 py-2 rounded-xl text-sm font-medium gradient-btn text-white hover:opacity-90 transition-all disabled:opacity-50"
      >
        {saving ? "Saving..." : initial ? "Save changes" : "Create widget"}
      </button>
    </div>
  );
}
