# PumAI — Security Roadmap & Cost Estimates

Planning document for the platform owner. Numbers in AUD. Separates what we already ship, what to build next, what to buy, and what certifications cost — with honest year-one spend by growth stage.

**Audience:** internal / founder. Not customer-facing pricing.

---

## Already shipped (baseline, every plan)

Zero extra cost — these are in the codebase today and covered by the current Cloud Run / Cloud SQL / Upstash bill.

- TLS 1.3 + HSTS + Content-Security-Policy with per-request nonce + `strict-dynamic`
- bcrypt password hashing (cost 12), TOTP 2FA + recovery codes
- Two-dimensional login rate-limit (per-email + per-IP, fail-closed)
- AES-256-GCM envelope encryption for channel credentials (versioned, rotation-friendly)
- HMAC verification on Meta, Stripe, Whapi webhooks; idempotent via `ProcessedWebhookEvent`
- Multi-tenant isolation — every Prisma query scoped by `businessId`
- Pino log redaction (passwords, tokens, session cookies, webhook signatures, PII paths)
- Workload Identity Federation for GitHub Actions → Cloud Run (zero long-lived service-account keys)
- Trivy filesystem scan + npm audit in CI, Dependabot for npm/actions/docker weekly

---

## Tier 1 — Dev time only, no new infra

Build next. Costs ~10 days of development across all of these and $0/mo in extra infrastructure.

| Feature | Dev days | Recurring cost |
|---|---|---|
| Audit logs (new Prisma table + dashboard view) | 3–5 | $0 (~$0.50/mo storage) |
| Active sessions list + "kick device" | 2 | $0 |
| Password history (disallow last 5) | 0.5 | $0 |
| PII redaction in log output (regex for emails, phones, card numbers) | 2–3 | $0 |
| CSP violation report endpoint + dashboard | 1–2 | $0 |
| **Total** | **~10 days** | **$0/month** |

---

## Tier 2 — Infra-level security services

| Service | Where | Cost AUD/month |
|---|---|---|
| Cloud Armor WAF | GCP | ~$7 base + $1/rule |
| Cloud KMS for CMEK | GCP | $0.10/key + $0.05 per 10k ops ≈ $5 |
| Extra Secret Manager versions | GCP | <$1 |
| Uptime monitoring | UptimeRobot free / Better Stack $45 | $0–65 |
| Error tracking | Sentry free (5k events) / Datadog paid | $0–150 |
| Status page | GitHub Status / Instatus $29 | $0–44 |
| **Realistic bundle** | | **$20–100/month** |

---

## Tier 3 — SSO (buy vs build)

SSO is the single most-asked-for enterprise feature. Options:

| Option | Upfront cost | Recurring cost AUD |
|---|---|---|
| **Self-built** via `next-auth` providers (Google Workspace, Microsoft Entra, Okta SAML). Reuses our existing auth layer. | 1 week dev | $0 |
| **WorkOS** — drop-in SSO, SCIM, audit logs | 1–2 days integration | ~$200/mo base + $5/connection |
| **Auth0** — B2B Essential | 2–3 days | ~$350/mo |
| **Clerk** — B2B plan, 100 MAU | ~2 days | ~$400/mo |

**Recommendation:** self-build. We already own the auth surface; adding Google Workspace + Microsoft Entra OIDC is a week. Defer Okta / SAML until a specific customer asks.

---

## Tier 4 — Pentest + bug bounty

| Item | Cost AUD |
|---|---|
| Annual penetration test (AU firms: Pentora, Gridware, Trusted Impact) | $8–25k / year |
| Bug bounty on HackerOne / Intigriti | $1,000/mo platform + $200–10,000 per accepted vuln |
| Indie alternative: Hacktrophy / OpenBugBounty | $0 platform + pay bounties ad-hoc |

**Realistic year one:** one pentest (~$10k) plus ad-hoc bounties (~$2–5k) ≈ **$15k / year**.

---

## Tier 5 — Compliance certifications (one-time, expensive)

| Certification | Year one cost AUD | Recurring | When to pursue |
|---|---|---|---|
| **ISO 27001** | $35–65k ($20–40k consultant + $15–25k auditor) | $5–10k annual surveillance | When a deal of $100k+ requires it |
| **SOC 2 Type I** | $30–50k | — | Prerequisite for Type II |
| **SOC 2 Type II** | $45–75k | $40–60k / year | Selling to Fortune 500 / US enterprise |
| **Essential Eight (ACSC)** | $5–15k with consultant | — | AU government tenders |
| **AU Privacy Act review** (lawyer) | $3–8k one-time | — | **Do this before invoicing real customers** |
| **PCI DSS SAQ-A** | $5–10k if we ever touch cards | — | Not needed — Stripe handles it |
| **HIPAA / BAA** | — | — | Skip — US healthcare, doesn't apply AU |

Rule of thumb: don't start ISO 27001 / SOC 2 without a signed deal or strong pipeline that requires it. The consultant clock starts at sign-up and the audit fee hits ~12 months later whether or not the deal closes.

---

## Tier 6 — Developer-security tooling

Mostly covered by GitHub's free + built-in tools today.

| Tool | Use case | Cost AUD/month |
|---|---|---|
| **Dependabot + Trivy** (already wired) | SCA, image scan | $0 |
| **GitHub secret scanning** (free on public repos) | Leaked key detection | $0 |
| Snyk | SAST + SCA, continuous | $100–500 |
| Semgrep Pro | Custom SAST rules | ~$40 / dev |
| GitHub Advanced Security | CodeQL + secrets on private repos | ~$50 / user |

Keep to the free stack until a customer contract obliges otherwise.

---

## Recommended spend by growth stage

### Stage 0 → 10 paying customers (first 6 months)

```
Tier 1 complete                                    ~10 days dev
Cloud Armor + Sentry free                           1 day
AU Privacy Act lawyer review                        —
Budget: $3–8k once + ~$10/mo infra
```

### Stage 10 → 50 customers (months 6–12)

```
SSO self-built (Google Workspace + Microsoft Entra) ~1 week
Audit log export API                                ~2 days
First annual pentest                                —
Bug bounty via OpenBugBounty (pay-per-accepted)     —
CMEK + Cloud KMS                                    ~3 days
Budget: ~$12k once + ~$15/mo infra
```

### Stage 50+ customers / first Enterprise deal

```
ISO 27001 (only if the deal requires it)            6–12 months
Annual pentest                                       —
SIEM / Datadog real                                  —
SOC 2 Type II (only if US enterprise)                12 months
Budget: $50–150k across the year, $200–500/mo tooling
```

---

## TL;DR — numbers to plan around

- **First 12 months realistic:** **~$15–20k AUD one-time + $15–30/mo infra**.
- **Jump to Enterprise:** +$50–100k one-time certification + $200–500/mo in tooling.
- **Most expensive line items are not infrastructure — they are audits.** Pay them only when a signed contract (or a clear pipeline that will close in 6 months) requires them.
- **Cheapest dollar of security:** finishing Tier 1 (audit logs + session management + PII redaction). ~10 days dev, $0 infra, removes the top three objections from every enterprise sales call.

---

## Change log

- 2026-04-24 — initial draft; production deployed on Cloud Run Singapore.
