import Link from "next/link";
import Image from "next/image";

export default function LegalLayout({ title, lastUpdated, children }: { title: string; lastUpdated: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border-subtle)] bg-[rgba(9,9,11,0.8)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2" aria-label="PumAI home">
            <Image src="/logo.png" alt="PumAI logo" width={28} height={28} className="rounded-lg" />
            <span className="text-base font-bold text-[var(--text-primary)]">
              Pum<span className="text-[#8B5CF6]">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-6 text-xs text-[var(--text-muted)]">
            <Link href="/privacy" className="hover:text-[var(--text-primary)]">Privacy</Link>
            <Link href="/terms" className="hover:text-[var(--text-primary)]">Terms</Link>
            <Link href="/acceptable-use" className="hover:text-[var(--text-primary)]">Acceptable Use</Link>
            <Link href="/cookies" className="hover:text-[var(--text-primary)]">Cookies</Link>
          </div>
        </div>
      </nav>

      <main className="pt-28 pb-20 px-6 max-w-3xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--text-primary)]">{title}</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Last updated: {lastUpdated}</p>
        </header>
        <article className="prose prose-invert max-w-none text-[var(--text-secondary)] leading-relaxed space-y-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-[var(--text-primary)] [&_h2]:mt-10 [&_h2]:mb-3 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[var(--text-primary)] [&_h3]:mt-6 [&_h3]:mb-2 [&_a]:text-[#8B5CF6] [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_strong]:text-[var(--text-primary)]">
          {children}
        </article>
      </main>
    </div>
  );
}
