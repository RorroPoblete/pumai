import Link from "next/link";

interface Props {
  webchatUsed: number;
  webchatLimit: number | null;
}

export default function UpgradeBanner({ webchatUsed, webchatLimit }: Props) {
  const limit = webchatLimit ?? 10;
  const remaining = Math.max(0, limit - webchatUsed);
  const atLimit = webchatUsed >= limit;

  return (
    <div
      className={`w-full border-b px-4 py-2.5 flex items-center justify-center gap-3 text-sm ${
        atLimit
          ? "bg-[rgba(239,68,68,0.08)] border-[rgba(239,68,68,0.25)] text-red-400"
          : "bg-[rgba(139,92,246,0.08)] border-[rgba(139,92,246,0.25)] text-[var(--text-secondary)]"
      }`}
    >
      <span className="font-medium">
        {atLimit
          ? `Free Webchat limit reached (${webchatUsed}/${limit}). Upgrade to keep responding.`
          : `Free plan · Webchat ${webchatUsed}/${limit} conversations this month · ${remaining} left`}
      </span>
      <Link
        href="/dashboard/billing"
        className={`text-xs font-semibold px-3 py-1 rounded-lg transition-all ${
          atLimit
            ? "bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25"
            : "gradient-btn !text-white hover:opacity-90"
        }`}
      >
        Upgrade →
      </Link>
    </div>
  );
}
