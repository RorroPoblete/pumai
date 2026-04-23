export default function AgentsLoading() {
  return (
    <div className="flex-1 p-6 space-y-4 animate-pulse">
      <div className="h-10 w-48 rounded-xl bg-[var(--bg-input)]" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-44 rounded-xl bg-[var(--bg-input)]" />
        ))}
      </div>
    </div>
  );
}
