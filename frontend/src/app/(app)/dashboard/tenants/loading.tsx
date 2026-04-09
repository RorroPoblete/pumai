export default function TenantsLoading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      <div className="h-10 w-56 rounded-xl bg-[var(--bg-input)]" />
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 rounded-xl bg-[var(--bg-input)]" />
        ))}
      </div>
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-24 rounded-xl bg-[var(--bg-input)]" />
      ))}
    </div>
  );
}
