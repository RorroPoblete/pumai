import Link from "next/link";
import Image from "next/image";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Sales",
  description:
    "Talk to our team about Enterprise plans for PumAI — custom SLAs, dedicated account management, SOC 2 / ISO 27001 and data-residency requirements.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Sales · PumAI",
    description: "Talk to our team about Enterprise plans for PumAI.",
    url: "/contact",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-base)" }}>
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-[var(--border-subtle)] bg-[rgba(9,9,11,0.8)] backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="PumAI" width={28} height={28} className="rounded-lg" />
            <span className="text-base font-bold text-[var(--text-primary)]">
              Pum<span className="text-[#8B5CF6]">AI</span>
            </span>
          </Link>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6 max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold text-[#8B5CF6] tracking-widest uppercase">
            Enterprise
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]">
            Let&apos;s build <span className="gradient-text-violet">together</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--text-secondary)]">
            Tell us about your business and we&apos;ll reach out within one business day.
          </p>
        </div>

        <div className="card-gradient border border-[var(--border-subtle)] rounded-2xl p-8 space-y-6">
          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Email us</p>
            <a
              href="mailto:sales@pumai.com.au?subject=Enterprise%20enquiry"
              className="text-lg font-semibold text-[#8B5CF6] hover:opacity-80 transition-opacity"
            >
              sales@pumai.com.au
            </a>
          </div>

          <div className="h-px bg-[var(--border-subtle)]" />

          <div>
            <p className="text-sm text-[var(--text-muted)] mb-1">Prefer a quick demo?</p>
            <p className="text-[var(--text-secondary)]">
              Book a 20-minute call and we&apos;ll walk through your channels, volume and integration needs.
            </p>
          </div>

          <a
            href="mailto:sales@pumai.com.au?subject=Enterprise%20demo%20request&body=Hi%20PumAI%20team%2C%0A%0ACompany%3A%0AChannels%20needed%3A%0AMonthly%20conversation%20volume%3A%0ABest%20time%20to%20chat%3A%0A"
            className="block w-full gradient-btn !text-white font-semibold py-3 rounded-xl text-center hover:opacity-90 transition-all"
          >
            Request a demo →
          </a>
        </div>

        <p className="mt-8 text-center text-sm text-[var(--text-muted)]">
          Not enterprise yet?{" "}
          <Link href="/register" className="text-[#8B5CF6] font-medium hover:opacity-80 transition-opacity">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
