export default function ConversationsLoading() {
  return (
    <div className="flex-1 p-6 space-y-4 animate-pulse">
      <div className="h-10 w-64 rounded-xl bg-[var(--bg-input)]" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-8 w-20 rounded-lg bg-[var(--bg-input)]" />
        ))}
      </div>
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-20 rounded-xl bg-[var(--bg-input)]" />
      ))}
    </div>
  );
}
