import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "What cookies and similar technologies PumAI uses, why we use them, and how to control them.",
  alternates: { canonical: "/cookies" },
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" lastUpdated="20 April 2026">
      <p>
        This page explains what cookies and similar technologies PumAI uses and why.
      </p>

      <h2>1. What is a cookie?</h2>
      <p>
        A cookie is a small text file stored in your browser that allows a site to remember information between visits.
      </p>

      <h2>2. Cookies we use</h2>
      <ul>
        <li>
          <strong>Authentication</strong> — NextAuth session cookies (<code>next-auth.session-token</code>) keep you signed in.
          Strictly necessary.
        </li>
        <li>
          <strong>Active business</strong> — <code>pumai_active_business</code> remembers the current tenant when you use the
          superadmin switcher.
        </li>
        <li>
          <strong>Theme</strong> — stored in <code>localStorage</code> as <code>pumai-theme</code> to remember dark/light mode.
        </li>
        <li>
          <strong>CSRF</strong> — NextAuth CSRF cookie used during sign-in.
        </li>
        <li>
          <strong>Stripe</strong> — Stripe sets its own cookies on their hosted checkout and customer portal pages. See{" "}
          <a href="https://stripe.com/cookies-policy/legal" target="_blank" rel="noopener">Stripe Cookie Policy</a>.
        </li>
      </ul>

      <h2>3. Analytics</h2>
      <p>
        We do not currently use third-party analytics cookies. If we add them in the future this page will be updated and you
        will be asked for consent where required.
      </p>

      <h2>4. Managing cookies</h2>
      <p>
        You can delete or block cookies via your browser settings. Note that disabling strictly necessary cookies will prevent
        you from signing in to PumAI.
      </p>

      <h2>5. Contact</h2>
      <p>
        Questions? <a href="mailto:privacy@pumai.com.au">privacy@pumai.com.au</a>
      </p>
    </LegalLayout>
  );
}
