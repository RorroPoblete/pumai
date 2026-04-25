"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { PasswordChecklist, isStrongPassword } from "@/components/PasswordChecklist";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!consent) {
      setError("You must accept the Terms of Service and Privacy Policy to continue.");
      return;
    }

    if (!isStrongPassword(password)) {
      setError("Password does not meet requirements.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, consent: true }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Account created but sign-in failed. Please log in.");
        setLoading(false);
      } else {
        window.location.href = signInRes?.url ?? "/onboarding";
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Mobile logo */}
      <div className="lg:hidden flex items-center gap-2 mb-8">
        <span className="text-xl font-bold text-[var(--text-primary)]">
          Pum<span className="text-[#8B5CF6]">AI</span>
        </span>
      </div>

      <h1 className="text-2xl font-extrabold text-[var(--text-primary)] mb-2">
        Create your account
      </h1>
      <p className="text-sm text-[var(--text-secondary)] mb-8">
        Start free — upgrade anytime to unlock channels and agents.
      </p>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-sm text-red-400 bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg px-4 py-2.5">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Full name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
            placeholder="John Smith"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Work email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
            placeholder="you@company.com.au"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={12}
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-input)] border border-[var(--border-input)] text-[var(--text-primary)] text-sm placeholder-[var(--text-muted)] focus:outline-none focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6] transition-colors"
            placeholder="Min. 12 characters"
          />
          <PasswordChecklist password={password} />
        </div>

        <label className="flex items-start gap-3 text-xs text-[var(--text-secondary)] cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[var(--border-input)] bg-[var(--bg-input)] accent-[#8B5CF6]"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" target="_blank" className="text-[#8B5CF6] underline hover:opacity-80">Terms of Service</Link>,{" "}
            <Link href="/privacy" target="_blank" className="text-[#8B5CF6] underline hover:opacity-80">Privacy Policy</Link>{" "}
            and{" "}
            <Link href="/acceptable-use" target="_blank" className="text-[#8B5CF6] underline hover:opacity-80">Acceptable Use Policy</Link>.
            I acknowledge my data may be processed outside Australia by OpenAI, Stripe and other service providers.
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !consent}
          className="w-full gradient-btn !text-white font-semibold py-3 rounded-xl glow-sm hover:glow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[var(--text-muted)]">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-[#8B5CF6] font-medium hover:text-[#8B5CF6] transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
