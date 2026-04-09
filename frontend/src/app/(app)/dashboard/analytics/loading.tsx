export default function AnalyticsLoading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      <div className="h-10 w-48 rounded-xl bg-[var(--bg-input)]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-[var(--bg-input)]" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-[var(--bg-input)]" />
      <div className="h-48 rounded-xl bg-[var(--bg-input)]" />
    </div>
  );
}
