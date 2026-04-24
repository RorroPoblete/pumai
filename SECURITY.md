# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities privately to **security@pumai.com.au**. Do not open a public issue.

Include, where possible:
- A clear description of the issue and its impact
- Steps to reproduce, proof-of-concept, or exploit path
- Any affected endpoints, files, or versions
- Your name/handle if you wish to be credited

We aim to:
- Acknowledge receipt within **2 business days (AEST)**
- Share an initial assessment within **7 business days**
- Ship a fix or mitigation as fast as severity allows (Critical ≤ 7 days, High ≤ 30 days, Medium/Low at the next scheduled release)

## Supported Versions

Only the `main` branch deployed on production Cloud Run receives security updates. Forks and past releases are not supported.

## Dependencies and Automation

- Trivy filesystem scan runs on every push and PR (see `.github/workflows/ci.yml`) and blocks merges on Critical/High findings.
- `npm audit --omit=dev --audit-level=high` runs in CI.
- Dependabot (`.github/dependabot.yml`) opens weekly PRs for npm, GitHub Actions, and Docker base image updates.
- `next-auth@5.0.0-beta.*` is exact-pinned. Auth.js security advisories are tracked via the [GHSA feed for `next-auth`](https://github.com/nextauthjs/next-auth/security/advisories).

## Scope

In scope for reports:
- Authentication and session handling (NextAuth / Credentials / Google / TOTP)
- Multi-tenant isolation (any cross-business data access)
- Webhook signature verification (Meta, Stripe, Whapi)
- Channel-credential encryption envelope (`CHANNEL_CRED_KEY`)
- Uploaded file signed URLs (`UPLOAD_SIGNING_KEY`)
- Content Security Policy and CSRF protection

Out of scope:
- Volumetric DDoS against Cloud Run / Cloudflare
- Self-XSS that requires the victim to paste code into their own console
- Missing security headers on `/widget.js` (served cross-origin by design)
- Reports from automated scanners without a working proof-of-concept
