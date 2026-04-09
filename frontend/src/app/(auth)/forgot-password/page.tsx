"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // TODO: integrate real password reset
    await new Promise((r) => setTimeout(r, 1000));
    setSent(true);
    setLoading(false);
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <span className="text-xl font-bold text-white">
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
          <h1 className="text-2xl font-extrabold text-white mb-2">Check your email</h1>
          <p className="text-sm text-[#A1A1AA] mb-8">
            We sent a password reset link to <strong className="text-white">{email}</strong>
          </p>
          <Link
            href="/login"
            className="text-[#8B5CF6] font-medium hover:text-[#A78BFA] transition-colors text-sm"
          >
            &larr; Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-2xl font-extrabold text-white mb-2">
            Reset your password
          </h1>
          <p className="text-sm text-[#A1A1AA] mb-8">
            Enter your email and we&apos;ll send you a reset link
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.1)] text-white text-sm placeholder-[#71717A] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
                placeholder="you@company.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-btn text-white font-semibold py-3 rounded-xl glow-sm hover:glow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#71717A]">
            <Link
              href="/login"
              className="text-[#8B5CF6] font-medium hover:text-[#A78BFA] transition-colors"
            >
              &larr; Back to sign in
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
