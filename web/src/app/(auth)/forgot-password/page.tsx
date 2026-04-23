"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/server/actions";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await requestPasswordReset(email);
      setSent(true);
    });
  }

  return (
    <div>
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <span className="text-xl font-bold text-[var(--text-primary)]">
          Pum<span className="text-[#8B5CF6]">AI</span>
        </span>
      </div>

      {sent ? (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[rgba(139,92,246,0.12)] flex items-center justify-center">
            <svg className="w-8 h-8 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">Check your email</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            If an account exists for <strong className="text-[var(--text-primary)]">{email}</strong>, we sent a password reset link.
          </p>
          <Link href="/login" className="text-[#8B5CF6] font-medium hover:text-[#A78BFA] transition-colors text-sm">
            &larr; Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">Reset your password</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Enter your email and we&apos;ll send you a reset link
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
                placeholder="you@company.com"
              />
            </div>

            <button
              type="submit"
              disabled={pending}
              className="w-full gradient-btn !text-white font-semibold py-3 rounded-xl glow-sm hover:glow-md transition-all duration-300 disabled:opacity-50"
            >
              {pending ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
            <Link href="/login" className="text-[#8B5CF6] font-medium hover:text-[#A78BFA] transition-colors">
              &larr; Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
