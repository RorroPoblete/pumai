import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How PumAI collects, uses, stores and discloses personal information under the Privacy Act 1988 (Cth) and the Australian Privacy Principles.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated="20 April 2026">
      <p>
        This Privacy Policy explains how <strong>PumAI</strong> (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) collects, uses, stores
        and discloses personal information in accordance with the <em>Privacy Act 1988</em> (Cth) and the Australian Privacy
        Principles (APPs).
      </p>

      <h2>1. Who we are</h2>
      <p>
        PumAI provides AI-powered conversational agents for Webchat, WhatsApp, Instagram and Messenger. Our registered business
        address is located in Australia. For privacy matters contact{" "}
        <a href="mailto:privacy@pumai.com.au">privacy@pumai.com.au</a>.
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li><strong>Account data</strong>: name, email, password (hashed), business name, industry, phone.</li>
        <li><strong>Billing data</strong>: collected and stored by Stripe (we do not store card details).</li>
        <li><strong>Conversation data</strong>: messages exchanged between customers and AI agents, including attachments.</li>
        <li><strong>Usage data</strong>: dashboard access logs, feature usage, error logs.</li>
        <li><strong>Integration data</strong>: tokens and identifiers supplied by Meta (Page IDs, access tokens) and Whapi
          (WhatsApp session).</li>
        <li><strong>Technical data</strong>: IP address, browser type, device identifiers.</li>
      </ul>

      <h2>3. How we collect it</h2>
      <ul>
        <li>Directly from you when you register, configure channels or update your account.</li>
        <li>From third parties when you connect integrations (Meta, Whapi, Google OAuth).</li>
        <li>Automatically when you use the service (cookies, logs, analytics).</li>
      </ul>

      <h2>4. Why we collect it (purposes)</h2>
      <ul>
        <li>Provide, maintain and improve the service.</li>
        <li>Process payments and manage subscriptions.</li>
        <li>Generate AI responses to messages.</li>
        <li>Send service-related notifications.</li>
        <li>Comply with legal obligations.</li>
      </ul>

      <h2>5. Who we share it with</h2>
      <p>We share limited information with the following processors, only as necessary to operate the service:</p>
      <ul>
        <li><strong>OpenAI</strong> (United States) — processes conversation text to generate AI responses.</li>
        <li><strong>Stripe</strong> (United States / Ireland) — processes payments and manages subscriptions.</li>
        <li><strong>Meta Platforms</strong> (United States) — provides the Facebook Messenger and Instagram APIs.</li>
        <li><strong>Whapi</strong> (Israel / United States) — WhatsApp integration.</li>
        <li><strong>Google</strong> (United States) — OAuth authentication (only if you sign in with Google).</li>
        <li>Our hosting and infrastructure providers.</li>
      </ul>
      <p>We do not sell your personal information to third parties.</p>

      <h2>6. Cross-border disclosure (APP 8)</h2>
      <p>
        Some of our processors operate outside Australia. By using PumAI you acknowledge that your personal information
        (including the content of conversations) may be transferred to and processed in the United States, Ireland, Israel and
        other jurisdictions where our providers operate. These transfers are governed by the data protection agreements we
        maintain with each provider.
      </p>

      <h2>7. How we secure it (APP 11)</h2>
      <ul>
        <li>Passwords hashed with bcrypt.</li>
        <li>Data transmitted over HTTPS / TLS in production.</li>
        <li>Access to production systems restricted to authorised personnel.</li>
        <li>Regular backups with retention.</li>
        <li>Encryption at rest for sensitive credentials.</li>
      </ul>

      <h2>8. How long we keep it</h2>
      <ul>
        <li>Account data: while your account is active, then up to 12 months after deletion for legal purposes.</li>
        <li>Conversation data: up to 24 months unless deleted earlier by you.</li>
        <li>Billing records: 7 years, as required by Australian tax law.</li>
        <li>Logs: 12 months.</li>
      </ul>

      <h2>9. Your rights (APP 12, APP 13)</h2>
      <ul>
        <li><strong>Access</strong>: request a copy of your personal information.</li>
        <li><strong>Correction</strong>: correct inaccurate or outdated information.</li>
        <li><strong>Deletion</strong>: request deletion of your account and associated data.</li>
        <li><strong>Portability</strong>: request export of your data in a machine-readable format.</li>
        <li><strong>Complaint</strong>: lodge a complaint with us or the{" "}
          <a href="https://www.oaic.gov.au/" target="_blank" rel="noopener">Office of the Australian Information Commissioner (OAIC)</a>.</li>
      </ul>
      <p>Requests can be made via <a href="mailto:privacy@pumai.com.au">privacy@pumai.com.au</a>.</p>

      <h2>10. AI-generated content</h2>
      <p>
        Conversations with PumAI are handled by artificial intelligence. Responses may contain errors and should not be relied
        upon for professional, legal, medical or financial advice. You can request human takeover of any conversation at any
        time.
      </p>

      <h2>11. Notifiable Data Breaches</h2>
      <p>
        In the event of an eligible data breach we will notify affected individuals and the OAIC within the timeframes required
        by the Notifiable Data Breaches scheme.
      </p>

      <h2>12. Changes to this policy</h2>
      <p>
        We may update this policy. We will notify you of material changes by email or via the dashboard. The effective date is
        shown at the top of this page.
      </p>

      <h2>13. Contact</h2>
      <p>
        Privacy Officer — <a href="mailto:privacy@pumai.com.au">privacy@pumai.com.au</a>
      </p>
    </LegalLayout>
  );
}
