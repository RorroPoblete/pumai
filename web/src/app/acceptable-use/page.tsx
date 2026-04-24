import type { Metadata } from "next";
import LegalLayout from "@/components/legal/LegalLayout";

export const metadata: Metadata = {
  title: "Acceptable Use Policy",
  description:
    "Rules for acceptable use of the PumAI platform — what's allowed, what's not, and consequences of breach.",
  alternates: { canonical: "/acceptable-use" },
  robots: { index: true, follow: true },
};

export default function AcceptableUsePage() {
  return (
    <LegalLayout title="Acceptable Use Policy" slug="acceptable-use" lastUpdated="20 April 2026">
      <p>
        This Acceptable Use Policy applies to everyone who uses PumAI. It works together with the{" "}
        <a href="/terms">Terms of Service</a>. Breach may result in suspension or termination of your account.
      </p>

      <h2>1. Prohibited uses</h2>
      <ul>
        <li>Use the Service to send spam, unsolicited messages or mass outbound campaigns without consent.</li>
        <li>Configure the AI to impersonate a real human without disclosure when asked.</li>
        <li>Generate content that is unlawful, defamatory, harassing, hateful or discriminatory.</li>
        <li>Generate sexually explicit content, content involving minors, or content that promotes violence or self-harm.</li>
        <li>Use the Service for phishing, fraud, identity theft or financial scams.</li>
        <li>Generate deepfakes or synthetic media intended to deceive.</li>
        <li>Circumvent rate limits, security measures or abuse third-party platforms connected to the Service.</li>
        <li>Reverse engineer, copy or resell the Service.</li>
        <li>Use the Service to process data you are not authorised to process.</li>
        <li>Breach the terms of connected platforms (Meta, WhatsApp, Google).</li>
      </ul>

      <h2>2. AI disclosure</h2>
      <p>
        The Service interacts with end users on your behalf. You must clearly disclose to end users that they are interacting
        with an AI assistant when asked, and provide a way to reach a human. PumAI includes default disclosures in widgets and
        first messages; you are responsible for not removing or misrepresenting them.
      </p>

      <h2>3. Data minimisation</h2>
      <ul>
        <li>Do not use the AI to collect sensitive personal information (health, racial, religious, financial account
          numbers) unless legally authorised and necessary.</li>
        <li>Do not load credentials, secrets or API keys into the agent knowledge base.</li>
      </ul>

      <h2>4. Platform-specific obligations</h2>
      <ul>
        <li><strong>WhatsApp</strong>: respect the 24-hour messaging window. Outbound messages outside the window require
          approved templates and opt-in.</li>
        <li><strong>Messenger / Instagram</strong>: follow Meta Platform Policy. Do not send sponsored or unsolicited
          broadcasts outside the 24-hour window.</li>
        <li><strong>Email / SMS</strong> (future): include unsubscribe links and honour opt-outs promptly (Spam Act 2003).</li>
      </ul>

      <h2>5. Reporting abuse</h2>
      <p>
        If you become aware of a breach of this policy report it to{" "}
        <a href="mailto:abuse@pumai.com.au">abuse@pumai.com.au</a>.
      </p>

      <h2>6. Enforcement</h2>
      <p>
        We reserve the right to investigate suspected breaches. We may suspend or terminate accounts, remove content, and
        cooperate with law enforcement where required.
      </p>
    </LegalLayout>
  );
}
