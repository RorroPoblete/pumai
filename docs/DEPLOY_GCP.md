# PumAI — GCP Deployment Runbook

**Region:** `asia-southeast1` (Singapore)
**Status:** Production live on Cloud Run auto URL; custom domain `pumai.com.au` uses native Cloud Run domain mapping, DNS at GoDaddy.
**Last updated:** 2026-04-23

No secret values appear in this document. All secrets live in Secret Manager and in local `.env` (gitignored).

**Why Singapore and not Sydney:** `australia-southeast1` does not support native Cloud Run domain mappings (`gcloud beta run domain-mappings create` returns HTTP 501). Singapore supports them, adds ~60-70 ms latency for Australian users (still under 120 ms), and keeps the stack pure GCP + GoDaddy DNS — no Cloudflare proxy, no Worker, no Load Balancer, $0 extra infrastructure cost.

All Sydney resources (Cloud Run service, Cloud SQL instance `pumai-db`, Artifact Registry repo, GCS bucket `pumai-uploads-prod`) have been deleted to avoid idle cost. The short-lived Cloudflare zone that was created while exploring the Sydney-with-CDN option was removed as well.

---

## 1. Live service

- **Cloud Run URL:** `https://pumai-app-822489336766.asia-southeast1.run.app`
- **Custom domain:** `https://pumai.com.au` + `https://www.pumai.com.au`
- **Admin login:** `admin@pumai.com.au` (password stored in user's password manager, not here)
- **GCP project:** `pumai-prod` (project number `822489336766`)
- **Billing account:** `017703-67E2C4-BFBF04`

## 2. Architecture

```
             Browser
               │ HTTPS (Google-managed cert)
               ▼
GoDaddy DNS → 4 A + 4 AAAA (Google Cloud Run IPs)
               │
               ▼
Cloud Run service: pumai-app  (asia-southeast1, min=0 max=3, 1 vCPU / 1 GiB)
      │              │                 │                │
      │ socket       │ REST            │ env            │ rediss://
      ▼              ▼                 ▼                ▼
Cloud SQL       GCS bucket        Secret Manager    Upstash Redis
Postgres 16     pumai-uploads-sg  (12 secrets)      (free tier,
db-f1-micro     uniform IAM       runtime SA        Sydney, cross-
ENTERPRISE      public-access-    has accessor      region ok)
edition         prevention
asia-southeast1
```

### Runtime identity

- Cloud Run service account: `pumai-run@pumai-prod.iam.gserviceaccount.com`
  - `roles/cloudsql.client` (project)
  - `roles/storage.objectAdmin` (bucket-scoped)
  - `roles/secretmanager.secretAccessor` (per-secret)

### Deploy identity

- GitHub Actions impersonates: `pumai-deploy@pumai-prod.iam.gserviceaccount.com`
  - `roles/run.admin`
  - `roles/artifactregistry.writer`
  - `roles/cloudbuild.builds.editor`
  - `roles/iam.serviceAccountUser` on `pumai-run`
- WIF provider: `projects/822489336766/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- Pool only accepts OIDC tokens where `repository = RorroPoblete/AUSTRALIAN_DREAM`.

## 3. Resources provisioned

| Resource | Name / ID | Notes |
|---|---|---|
| GCP project | `pumai-prod` | linked to billing `017703-...` |
| Enabled APIs | `run`, `sqladmin`, `secretmanager`, `artifactregistry`, `storage`, `iamcredentials`, `sts`, `cloudbuild` | |
| Artifact Registry | `asia-southeast1-docker.pkg.dev/pumai-prod/pumai` | Docker repo (Singapore) |
| Cloud SQL instance | `pumai-db-sg` | Postgres 16, `db-f1-micro`, ENTERPRISE, 10 GB SSD, backups 14:00 UTC, PITR on |
| Cloud SQL connection name | `pumai-prod:asia-southeast1:pumai-db-sg` | used as `host=/cloudsql/<conn>` |
| Cloud SQL database | `pumai` | |
| Cloud SQL user | `pumai` | password in Secret Manager (`DATABASE_URL` composite) |
| GCS bucket | `gs://pumai-uploads-sg` | Singapore, uniform IAM, public-access-prevention |
| Upstash Redis | `precious-zebra-105408.upstash.io:6379` | TLS required (`rediss://`), Sydney, free tier |
| Cloud Run service | `pumai-app` (asia-southeast1) | min=0, max=3, 1 vCPU / 1 GiB, timeout=3600 s (SSE), concurrency=80 |
| Cloud Run domain mappings | `pumai.com.au`, `www.pumai.com.au` | native mapping in Singapore, Google-managed SSL |
| Runtime SA | `pumai-run@pumai-prod.iam.gserviceaccount.com` | bound to Cloud Run |
| Deploy SA | `pumai-deploy@pumai-prod.iam.gserviceaccount.com` | impersonated by WIF |
| WIF pool / provider | `github-pool` / `github-provider` | |

### Secret Manager entries (names only)

```
DATABASE_URL              (Postgres URL with Cloud SQL socket host)
REDIS_URL                 (Upstash rediss:// URL)
AUTH_SECRET               (NextAuth JWT signing key; prod-only)
CHANNEL_CRED_KEY          (AES-256-GCM envelope key; prod-only)
UPLOAD_SIGNING_KEY        (HMAC for signed upload URLs; prod-only)
OPENAI_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
META_APP_SECRET
META_APP_SECRET_IG
META_WEBHOOK_VERIFY_TOKEN
WHATSAPP_WEBHOOK_TOKEN
```

`AUTH_SECRET`, `CHANNEL_CRED_KEY`, `UPLOAD_SIGNING_KEY` were freshly generated for production — they are not the same values used in local dev.

## 4. Code changes shipped

All on `main`. Commit hashes in chronological order:

| SHA | Summary |
|---|---|
| `f3a257a` | Phase 1 security blockers — host-header redirects, seed gate, dev widget, NextAuth cookie hardening + AUTH_URL guard |
| `0488bbd` | Phase 2 Cloud Run refactor — uploads → GCS via `@google-cloud/storage`, Pino redact expansion, `console.*` → `scoped()`, `poweredByHeader: false`, cookie maxAge 30d |
| `8cb2894` | Entrypoint detects Cloud SQL Unix socket and skips TCP wait |
| `8ad0cc8` | `proxy.ts` passes `cookieName: __Secure-authjs.session-token` + `secureCookie: true` to `getToken()` so middleware finds the prod session cookie |
| `5b3aa28` | `prisma/prod-bootstrap.ts` — idempotent prod-safe seed (assumes admin exists; no demo user; encrypts channel-config credentials with prod `CHANNEL_CRED_KEY`) |
| `d37acb7` | Phase 4 CI/CD — WIF deploy job, `npm ci --ignore-scripts`, Trivy installer pinned to `v0.69.3`, Dependabot (npm + actions + docker, weekly), root `SECURITY.md` |

### Key environment behaviour

- `NODE_ENV=production` is set in the Dockerfile (required for Next build) — so guards in `auth.ts` and `billing-actions.ts` check `NEXT_PHASE !== 'phase-production-build'` to avoid firing during `next build`, and allow `http://localhost` URLs through (docker-compose dev runs a prod build locally).
- Cookies switch to `__Secure-` / `__Host-` prefixes **based on `AUTH_URL` starting with `https://`**, not on `NODE_ENV`. This keeps docker-compose dev working over plain HTTP.
- Seed refuses to run when `DATABASE_URL` is not `@localhost:` / `@127.0.0.1:` / `@postgres:` — which means it is automatically blocked against Cloud SQL sockets in prod.
- Middleware renamed `middleware.ts` → `proxy.ts` (Next 16 convention). Root layout uses `export const dynamic = "force-dynamic"` so the CSP nonce actually gets injected into hydration scripts (required for `'strict-dynamic'`).

## 5. First deploy (already done — manual)

The initial deploy used local `docker buildx --platform linux/amd64 --push` from the developer machine to populate Artifact Registry (tags `v1`, `v2`, `latest`). After that, `gcloud run services update` swapped the image. CI (below) will take over from the next push.

### Manual prod-bootstrap run

Once per environment, executed locally via Cloud SQL Auth Proxy:

```bash
# ADC must be set: gcloud auth application-default login
cloud-sql-proxy pumai-prod:australia-southeast1:pumai-db --port=15432 &

DB_PWD=...                      # from the user's password manager
PROD_KEY=$(gcloud secrets versions access latest --secret=CHANNEL_CRED_KEY)

cd web
DATABASE_URL="postgresql://pumai:${DB_PWD}@localhost:15432/pumai" \
CHANNEL_CRED_KEY="$PROD_KEY" \
ADMIN_EMAIL="admin@pumai.com.au" \
npx tsx prisma/prod-bootstrap.ts
```

The script upserts: PumAI business, 4 channel subscriptions (GROWTH), 5 demo agents, and the landing webchat widget (`wk_pumai_landing`). Idempotent — safe to re-run after schema changes.

## 6. CI/CD (active from next push to `main`)

`.github/workflows/ci.yml` runs on every PR and every push to `main`.

**Jobs:**
1. `typecheck-lint` — `npm ci --ignore-scripts`, `prisma generate`, `tsc --noEmit`, `eslint`
2. `npm-audit` — `npm audit --omit=dev --audit-level=high`
3. `trivy` — filesystem scan with vuln/secret/misconfig; SARIF uploaded to GitHub Security; blocks on Critical/High
4. `deploy` — only on `push` to `main` after all above pass. Auths via WIF, builds the image on the x86 runner (no QEMU needed), pushes `${sha}` + `latest` to Artifact Registry, `gcloud run services update --image=...` (preserves env vars and secrets), smoke-tests `/api/health`

**Dependabot (`.github/dependabot.yml`)** opens weekly Monday PRs for `/web` npm, root GitHub Actions, and `/web` Docker base images. `next-auth` major bumps are ignored (beta pinned).

## 7. Custom domain (`pumai.com.au` + `www`)

Native Cloud Run domain mapping in `asia-southeast1`. DNS at GoDaddy. No Cloudflare proxy, no Worker, no Load Balancer.

### Cloud Run side

```bash
gcloud beta run domain-mappings create --service=pumai-app --domain=pumai.com.au --region=asia-southeast1
gcloud beta run domain-mappings create --service=pumai-app --domain=www.pumai.com.au --region=asia-southeast1
```

Cloud Run returns 4 A + 4 AAAA records for the apex and a CNAME for `www` (→ `ghs.googlehosted.com`). Google provisions a managed SSL certificate automatically once DNS propagates (5-30 min).

### GoDaddy DNS configuration

The apex gets 4 Google anycast IPs (IPv4 + IPv6); `www` becomes a CNAME to the Google hosted services alias. Managed in the GoDaddy DNS panel or via the GoDaddy REST API (`api.godaddy.com/v1/domains/pumai.com.au/records`).

Records set at apex (`@`):
- **A** × 4: `216.239.32.21`, `216.239.34.21`, `216.239.36.21`, `216.239.38.21`
- **AAAA** × 4: `2001:4860:4802:32::15`, `2001:4860:4802:34::15`, `2001:4860:4802:36::15`, `2001:4860:4802:38::15`

Record at `www`:
- **CNAME** → `ghs.googlehosted.com`

Nameservers: GoDaddy's own (`ns43.domaincontrol.com`, `ns44.domaincontrol.com`).

### Records preserved unchanged (M365 email)

- `MX pumai.com.au → pumai-com-au.mail.protection.outlook.com`
- `TXT SPF` (`v=spf1 include:secureserver.net -all`)
- `TXT NETORG...onmicrosoft.com` (M365 verify)
- `TXT google-site-verification=...`
- `TXT _dmarc` (current quarantine policy)
- `CNAME autodiscover` → `autodiscover.outlook.com`
- `CNAME lyncdiscover` → `webdir.online.lync.com`
- `CNAME sip` → `sipdir.online.lync.com`
- `CNAME msoid` → `clientconfig.microsoftonline-p.net`
- `CNAME email` → GoDaddy email forwarding
- `CNAME _domainconnect` → GoDaddy domain connect
- `SRV _sipfederationtls._tcp` — Teams federation
- `SRV _sip._tls` — Teams SIP/TLS

### Cloud Run env vars (already set)

`AUTH_URL=https://pumai.com.au` and `NEXT_PUBLIC_APP_URL=https://pumai.com.au` were set at deploy time; no post-DNS update needed.

### Follow-ups once HTTPS is live

1. Register the prod webhook endpoint in Stripe (`https://pumai.com.au/api/webhooks/stripe`) and rotate `STRIPE_WEBHOOK_SECRET` in Secret Manager.
2. Update Meta Messenger / Instagram webhook callback URLs to `https://pumai.com.au/api/webhooks/meta`.
3. Update Google OAuth authorised redirect URIs to `https://pumai.com.au/api/auth/callback/google` once a prod OAuth client is created.

## 8. Cost snapshot (expected monthly, USD, Singapore)

| Item | Cost |
|---|---|
| Cloud SQL Postgres 16 `db-f1-micro` + 10 GB SSD + backups | ~$10 |
| Cloud Run 1 vCPU / 1 GiB, min=0, low traffic | $0–5 |
| Artifact Registry (~500 MB) | <$0.10 |
| Secret Manager (12 secrets, a few versions each) | <$0.50 |
| GCS uploads (low volume) | ~$1 |
| Cloud Monitoring / logging | $0 (free tier) |
| Upstash Redis free tier | $0 |
| Egress (~10 GB/mo out of Singapore) | ~$1.20 |
| **Baseline** | **~$13–18/month** |

Well inside the GCP $300 / 90-day new-account credit.

## 9. Operations runbook

### Deploy a change

Normal flow — push to `main`:

```bash
git push origin main
# CI runs: typecheck + lint + npm audit + Trivy + WIF deploy to Cloud Run
```

### Roll back to a previous revision

```bash
# List recent revisions
gcloud run revisions list --service=pumai-app --region=australia-southeast1

# Route all traffic to an older one
gcloud run services update-traffic pumai-app \
  --to-revisions=<previous-revision-name>=100 \
  --region=australia-southeast1
```

### Tail production logs

```bash
gcloud logging tail 'resource.type=cloud_run_revision AND resource.labels.service_name=pumai-app'
```

### Connect to the prod database (read-only investigation)

```bash
cloud-sql-proxy pumai-prod:asia-southeast1:pumai-db-sg --port=15433 &
# Password from the user's password manager
PGPASSWORD=$DB_PWD psql -h 127.0.0.1 -p 15433 -U pumai -d pumai
```

### Rotate a Secret Manager secret

```bash
# Generate new value
NEW=$(openssl rand -base64 32)
# Add as new version
printf '%s' "$NEW" | gcloud secrets versions add AUTH_SECRET --data-file=-
# Trigger Cloud Run to pick it up (empty update forces a revision)
gcloud run services update pumai-app \
  --region=australia-southeast1 \
  --update-secrets=AUTH_SECRET=AUTH_SECRET:latest
```

Rotating `AUTH_SECRET` invalidates all active sessions — users have to log in again. Expected.

### Add a new secret to Secret Manager

```bash
printf '%s' "$VALUE" | gcloud secrets create NEW_SECRET \
  --replication-policy=automatic \
  --data-file=-
gcloud secrets add-iam-policy-binding NEW_SECRET \
  --member=serviceAccount:pumai-run@pumai-prod.iam.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
# Mount it on the Cloud Run service
gcloud run services update pumai-app \
  --region=australia-southeast1 \
  --update-secrets=NEW_SECRET=NEW_SECRET:latest
```

### Re-run prod-bootstrap (idempotent — updates agents/widgets after schema change)

See section 5.

## 10. Known follow-ups

- Finish DNS propagation, update `AUTH_URL` + `NEXT_PUBLIC_APP_URL`.
- Register the Stripe prod webhook and rotate `STRIPE_WEBHOOK_SECRET`.
- Configure Google OAuth client for production and store `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in Secret Manager (currently empty in `.env`).
- Cloud Monitoring alert policies: 5xx rate, p95 latency, Cloud SQL CPU, Secret-Manager access-denied events.
- Uptime check on `/api/health`.
- Enable Dependabot alerts + security updates in GitHub repo settings.
- Consider enabling Cloud SQL HA (+~$10/mo) once real users are on the platform.
- Consider a GCP Global Load Balancer later if the Cloudflare-proxied traffic needs finer backend control or you want to centralise everything inside GCP.

## 11. Out of scope

Same as the original plan — no multi-region failover, no read replicas, no VPC Service Controls, no IAP, no Cloud Armor. Revisit once the app actually needs them.

## Appendix A — Files that changed during the rollout

Source code:

- `web/entrypoint.sh` — gate seed behind `RUN_SEED=1`; detect Cloud SQL socket
- `web/prisma/seed.ts` — refuse non-local DB; drop password logging; upsert demo webchat config
- `web/prisma/prod-bootstrap.ts` — new, prod-safe bootstrap
- `docker-compose.yml` — `RUN_SEED: "1"` in dev
- `web/src/proxy.ts` — renamed from `middleware.ts`; dropped XFH trust; passes cookieName to `getToken()`
- `web/src/auth.ts` — explicit `cookies` block; AUTH_URL guard; localhost escape hatch
- `web/src/app/layout.tsx` — removed hardcoded dev widget; added `dynamic = "force-dynamic"`
- `web/src/app/api/auth/invalid-session/route.ts` — `new URL(path, req.url)` pattern
- `web/src/app/api/meta/deletion-callback/route.ts` — same
- `web/src/server/billing-actions.ts` — same + `NEXT_PUBLIC_APP_URL` guard
- `web/src/server/storage.ts` — new, GCS wrapper with FS fallback
- `web/src/app/api/webchat/[widgetKey]/upload/route.ts` — uses storage wrapper
- `web/src/app/api/uploads/[filename]/route.ts` — uses storage wrapper
- `web/src/app/api/webchat/[widgetKey]/stream/route.ts` — uses storage wrapper + scoped logger
- `web/src/app/api/webchat/[widgetKey]/events/route.ts` — scoped logger
- `web/src/app/api/webhooks/stripe/route.ts` — scoped logger
- `web/src/server/logger.ts` — redact paths expanded
- `web/src/server/actions.ts` — cookie maxAge 30d, secure gated on AUTH_URL
- `web/next.config.ts` — `poweredByHeader: false`
- `web/package.json` / `web/package-lock.json` — `@google-cloud/storage` added

Infrastructure / meta:

- `.github/workflows/ci.yml` — Phase 4 rewrite (WIF deploy, pinned Trivy, --ignore-scripts)
- `.github/dependabot.yml` — new
- `SECURITY.md` — new
- `docs/DEPLOY_GCP.md` — this document
