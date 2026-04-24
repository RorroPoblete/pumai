import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How PumAI uses cookies and similar technologies across our AI platform, why we use them, and how you can control them.",
  alternates: { canonical: "/cookies" },
  robots: { index: true, follow: true },
};

export default function CookiesPage() {
  return (
    <LegalLayout title="Cookie Policy" slug="cookies" lastUpdated="24 April 2026">
      <p>
        This Cookie Policy explains what cookies and similar technologies PumAI uses, why we use them, and how you can
        control them. It applies to <strong>pumai.com.au</strong>, our dashboard, and our embeddable webchat widget.
      </p>

      <h2>1. What is a cookie?</h2>
      <p>
        A cookie is a small text file a website places in your browser to remember information between visits. Similar
        technologies include <code>localStorage</code>, <code>sessionStorage</code>, and pixel tags. We refer to all of
        these as &quot;cookies&quot; in this policy.
      </p>

      <h2>2. Categories of cookies we use</h2>
      <ul>
        <li><strong>Strictly necessary</strong> — required for the site to function (authentication, CSRF, session).</li>
        <li><strong>Functional</strong> — remember your preferences (theme, active tenant).</li>
        <li><strong>Third-party</strong> — set by processors such as Stripe on their hosted pages.</li>
      </ul>
      <p>We do <strong>not</strong> currently use analytics, advertising or tracking cookies.</p>

      <h2>3. Cookies we set</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-left">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Purpose</th>
              <th className="py-2 pr-4">Duration</th>
              <th className="py-2">Party</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 pr-4"><code>next-auth.session-token</code></td>
              <td className="py-2 pr-4">Strictly necessary</td>
              <td className="py-2 pr-4">Keeps you signed in</td>
              <td className="py-2 pr-4">Session / 30 days</td>
              <td className="py-2">First-party</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 pr-4"><code>next-auth.csrf-token</code></td>
              <td className="py-2 pr-4">Strictly necessary</td>
              <td className="py-2 pr-4">Protects sign-in from CSRF</td>
              <td className="py-2 pr-4">Session</td>
              <td className="py-2">First-party</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 pr-4"><code>next-auth.callback-url</code></td>
              <td className="py-2 pr-4">Strictly necessary</td>
              <td className="py-2 pr-4">Stores post-login redirect URL</td>
              <td className="py-2 pr-4">Session</td>
              <td className="py-2">First-party</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 pr-4"><code>pumai_active_business</code></td>
              <td className="py-2 pr-4">Functional</td>
              <td className="py-2 pr-4">Remembers active tenant for superadmins</td>
              <td className="py-2 pr-4">30 days</td>
              <td className="py-2">First-party</td>
            </tr>
            <tr className="border-b border-[var(--border-subtle)]">
              <td className="py-2 pr-4"><code>pumai-theme</code> (localStorage)</td>
              <td className="py-2 pr-4">Functional</td>
              <td className="py-2 pr-4">Remembers dark/light mode</td>
              <td className="py-2 pr-4">Persistent</td>
              <td className="py-2">First-party</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">Stripe cookies</td>
              <td className="py-2 pr-4">Third-party</td>
              <td className="py-2 pr-4">Fraud prevention on checkout / customer portal</td>
              <td className="py-2 pr-4">Up to 1 year</td>
              <td className="py-2">Stripe</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2>4. Analytics</h2>
      <p>
        We do not currently use third-party analytics or advertising cookies. If we add them in the future this page will
        be updated and we will request consent where required under Australian and European law.
      </p>

      <h2>5. How to control cookies</h2>
      <p>
        You can delete or block cookies at any time via your browser settings. Most modern browsers also let you block
        third-party cookies by default. Instructions:
      </p>
      <ul>
        <li>
          <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener">Google Chrome</a>
        </li>
        <li>
          <a href="https://support.mozilla.org/en-US/kb/block-websites-storing-cookies-site-data-firefox" target="_blank" rel="noopener">Mozilla Firefox</a>
        </li>
        <li>
          <a href="https://support.apple.com/en-au/guide/safari/sfri11471/mac" target="_blank" rel="noopener">Apple Safari</a>
        </li>
        <li>
          <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener">Microsoft Edge</a>
        </li>
      </ul>
      <p>
        Note: disabling strictly necessary cookies will prevent you from signing in to the PumAI dashboard and using
        authenticated features.
      </p>

      <h2>6. Changes to this policy</h2>
      <p>
        We may update this policy from time to time. The effective date is shown at the top of the page. Material changes
        will be notified via email or the dashboard.
      </p>

      <h2>7. Contact</h2>
      <p>
        Questions about cookies? <a href="mailto:privacy@pumai.com.au">privacy@pumai.com.au</a>
      </p>
    </LegalLayout>
  );
}
