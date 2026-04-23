export default function SettingsLoading() {
  return (
    <div className="flex-1 p-6 space-y-6 max-w-3xl animate-pulse">
      <div className="h-10 w-32 rounded-xl bg-[var(--bg-input)]" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-48 rounded-xl bg-[var(--bg-input)]" />
      ))}
    </div>
  );
}
