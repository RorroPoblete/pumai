import LegalLayout from "@/components/legal/LegalLayout";

export const metadata = { title: "Security Policy · PumAI" };

export default function SecurityPage() {
  return (
    <LegalLayout title="Security & Responsible Disclosure" lastUpdated="22 April 2026">
      <p>
        PumAI takes security seriously. This page explains how to report vulnerabilities and what to expect when you do.
      </p>

      <h2>Report a vulnerability</h2>
      <p>
        Email <a href="mailto:security@pumai.com.au">security@pumai.com.au</a> with:
      </p>
      <ul>
        <li>A clear description of the issue.</li>
        <li>Steps to reproduce.</li>
        <li>Affected endpoint or component.</li>
        <li>Impact assessment (what an attacker could do).</li>
        <li>Your contact details for follow-up.</li>
      </ul>

      <h2>Our commitment</h2>
      <ul>
        <li>We acknowledge reports within <strong>2 business days</strong>.</li>
        <li>We provide regular status updates while we investigate.</li>
        <li>We coordinate public disclosure with you once a fix is deployed.</li>
        <li>We will not pursue legal action against researchers acting in good faith and within this policy.</li>
      </ul>

      <h2>Scope</h2>
      <ul>
        <li>pumai.com.au and its subdomains.</li>
        <li>The PumAI dashboard, APIs and embeddable widget.</li>
        <li>Our published Stripe, Meta and Whapi integrations.</li>
      </ul>

      <h2>Out of scope</h2>
      <ul>
        <li>Social engineering, phishing or physical attacks against PumAI staff.</li>
        <li>Denial-of-service testing without prior arrangement.</li>
        <li>Missing best-practice configurations that do not lead to a direct vulnerability (e.g. missing security headers on static pages).</li>
        <li>Vulnerabilities in third-party services we consume (please report directly to the vendor).</li>
      </ul>

      <h2>Safe harbour</h2>
      <p>
        Researchers who follow this policy, avoid privacy violations, destruction of data and interruption of service are
        welcome to test against production. Use test accounts where possible and delete any data obtained during testing.
      </p>

      <h2>Contact</h2>
      <p>
        <a href="mailto:security@pumai.com.au">security@pumai.com.au</a> — PGP key available on request.
      </p>
    </LegalLayout>
  );
}
