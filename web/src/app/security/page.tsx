import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Security",
  description:
    "How PumAI protects your data — encryption, access controls, 2FA, Australian hosting, incident response and responsible disclosure. Report vulnerabilities to security@pumai.com.au.",
  alternates: { canonical: "/security" },
  robots: { index: true, follow: true },
};

export default function SecurityPage() {
  return (
    <LegalLayout title="Security & Responsible Disclosure" slug="security" lastUpdated="24 April 2026">
      <p>
        PumAI is built for Australian businesses that handle sensitive customer conversations across WhatsApp, Instagram,
        Messenger and Webchat. Security is a first-class concern across every layer of the platform. This page
        summarises how we protect your data, the controls available to your team, and how to report vulnerabilities.
      </p>

      <h2>Data protection</h2>
      <h3>Encryption in transit</h3>
      <p>
        All traffic between your browser, end users, the dashboard and our APIs is served over HTTPS with TLS 1.2 or
        higher. HSTS is enforced (<code>max-age=63072000; includeSubDomains; preload</code>) so browsers always upgrade
        connections to HTTPS. Outbound connections to Meta, Whapi, OpenAI and Stripe are also TLS-encrypted.
      </p>

      <h3>Encryption at rest</h3>
      <p>
        Primary data stores (PostgreSQL, Redis, object storage) are encrypted at rest using AES-256 managed by our
        infrastructure provider. Channel credentials such as Meta page tokens and Whapi session keys are additionally
        encrypted application-side before they are written to the database — the raw token value is never stored in
        plaintext.
      </p>

      <h3>Passwords and secrets</h3>
      <p>
        User passwords are hashed with bcrypt. 2FA secrets (TOTP) are stored encrypted and never returned through the
        API. Backup codes are hashed on write and single-use. API keys and webhook secrets are rotatable from the
        dashboard.
      </p>

      <h2>Hosting and data residency</h2>
      <p>
        PumAI application infrastructure runs in Australian regions. Customer-facing endpoints, primary databases and
        Redis instances are hosted in Australia. Operational backups are stored encrypted within the same region with
        cross-zone redundancy. See our{" "}
        <a href="/privacy">Privacy Policy</a> for the full list of sub-processors and the jurisdictions where each
        operates (cross-border disclosures under APP 8).
      </p>

      <h2>Access controls</h2>
      <ul>
        <li>
          <strong>Role-based access</strong> — Owner, Admin and Member roles scope what team members can see and do
          within a business.
        </li>
        <li>
          <strong>Two-factor authentication (2FA)</strong> — TOTP (Google Authenticator, 1Password, Authy, etc.) is
          available on every account. Admins can require 2FA for their team.
        </li>
        <li>
          <strong>Multi-tenant isolation</strong> — every database query is scoped by <code>businessId</code>. A user in
          one business cannot read or write data belonging to another.
        </li>
        <li>
          <strong>Session management</strong> — sessions are HTTP-only, Secure, SameSite cookies signed and rotated by
          NextAuth. You can revoke active sessions from the dashboard.
        </li>
        <li>
          <strong>Least privilege in production</strong> — access to production systems is limited to named engineers
          and gated by SSO with 2FA. Access is logged and audited.
        </li>
      </ul>

      <h2>Application security</h2>
      <ul>
        <li>Content Security Policy with per-request nonce applied via middleware.</li>
        <li>CSRF protection on all authenticated form posts.</li>
        <li>Server-side input validation with Zod on every API and server action.</li>
        <li>HMAC-SHA256 verification of Meta, Whapi and Stripe webhook signatures.</li>
        <li>Redis-backed rate limiting on authentication, sign-up and public APIs.</li>
        <li>Dependency scanning and automated upgrades for critical vulnerabilities.</li>
        <li>OWASP Top 10 aligned code review for every change touching auth, payments or webhooks.</li>
      </ul>

      <h2>Backups and continuity</h2>
      <ul>
        <li>Automated daily backups of the primary database with 30-day retention.</li>
        <li>Point-in-time recovery available for the last 7 days.</li>
        <li>Backups are encrypted and stored redundantly across zones.</li>
        <li>We rehearse database restore procedures on a scheduled basis.</li>
      </ul>

      <h2>Logging and monitoring</h2>
      <p>
        Structured logs (Pino) capture authentication events, webhook deliveries, billing changes and administrative
        actions. Logs are retained for 12 months. Production errors are surfaced via real-time alerts to on-call
        engineers. Anomalous sign-in patterns and rate-limit violations are recorded for investigation.
      </p>

      <h2>Incident response</h2>
      <p>
        If a security incident occurs we follow a documented runbook:
      </p>
      <ol className="list-decimal pl-5 space-y-1">
        <li>Detect and contain — isolate affected systems and revoke compromised credentials.</li>
        <li>Assess impact — determine what data and which customers are affected.</li>
        <li>Notify — under the Australian Notifiable Data Breaches scheme we notify affected individuals and the OAIC within the required timeframes.</li>
        <li>Remediate — deploy the fix, rotate secrets, restore service.</li>
        <li>Post-incident review — publish an internal write-up and implement preventative controls.</li>
      </ol>

      <h2>Compliance</h2>
      <ul>
        <li>Privacy Act 1988 (Cth) and the Australian Privacy Principles.</li>
        <li>Spam Act 2003 (Cth) — outbound messaging controls and unsubscribe handling.</li>
        <li>Meta Platform Terms, WhatsApp Business Policy and Instagram Platform Policy.</li>
        <li>SOC 2 Type II and ISO/IEC 27001 on our roadmap for Enterprise customers; enquiries at{" "}
          <a href="mailto:sales@pumai.com.au">sales@pumai.com.au</a>.</li>
      </ul>

      <h2>Sub-processors</h2>
      <p>
        We use a small set of vetted sub-processors to operate the service (OpenAI for AI responses, Stripe for
        payments, Meta for channel APIs, Whapi for WhatsApp, Google for optional SSO). The full list, purposes and
        jurisdictions are documented in our <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>Report a vulnerability</h2>
      <p>
        Email <a href="mailto:security@pumai.com.au">security@pumai.com.au</a>. Please include:
      </p>
      <ul>
        <li>A clear description of the issue.</li>
        <li>Steps to reproduce.</li>
        <li>Affected endpoint or component.</li>
        <li>Impact assessment (what an attacker could do).</li>
        <li>Your contact details for follow-up.</li>
      </ul>
      <p>PGP key available on request.</p>

      <h2>Our commitment</h2>
      <ul>
        <li>We acknowledge reports within <strong>2 business days</strong>.</li>
        <li>We provide regular status updates while we investigate.</li>
        <li>We coordinate public disclosure with you once a fix is deployed.</li>
        <li>We do not pursue legal action against researchers acting in good faith and within this policy.</li>
      </ul>

      <h2>Scope</h2>
      <ul>
        <li>pumai.com.au and its subdomains.</li>
        <li>The PumAI dashboard, APIs and embeddable webchat widget.</li>
        <li>Our published Stripe, Meta and Whapi integrations.</li>
      </ul>

      <h2>Out of scope</h2>
      <ul>
        <li>Social engineering, phishing or physical attacks against PumAI staff.</li>
        <li>Denial-of-service testing without prior arrangement.</li>
        <li>Missing best-practice configurations that do not lead to a direct vulnerability (e.g. missing security headers on static pages).</li>
        <li>Vulnerabilities in third-party services we consume — please report directly to the vendor.</li>
      </ul>

      <h2>Safe harbour</h2>
      <p>
        Researchers who follow this policy and avoid privacy violations, destruction of data and interruption of service
        are welcome to test against production. Use test accounts where possible and delete any data obtained during
        testing.
      </p>

      <h2>Contact</h2>
      <p>
        Security team — <a href="mailto:security@pumai.com.au">security@pumai.com.au</a>
      </p>
    </LegalLayout>
  );
}
