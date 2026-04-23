# PumAI — Deployment Plan (Google Cloud, Sydney)

**Target:** Production deployment to Google Cloud (region `australia-southeast1`) using Cloud Run + Cloud SQL + Upstash Redis + GCS.
**Author:** Claude (Cyber Neo audit + deploy planning session, 2026-04-23)
**Status:** DRAFT — awaiting user approval on open decisions before execution.

---

## 1. Goals

- Ship PumAI to production on managed, auto-scaling infrastructure.
- Keep fixed cost low (<$40/mo baseline, scales with traffic).
- All components co-located in Sydney to minimise latency and egress.
- Zero long-lived service-account keys (Workload Identity Federation for GitHub Actions).
- All secrets in Secret Manager — no secret ever on a developer disk after rotation.
- TLS-terminated on Cloud Run, HSTS enforced, same-origin redirects only.
- No regression vs the existing security posture (per `docs/SECURITY-AUDIT.md` if added, else Cyber Neo report dated 2026-04-23).

## 2. Open Decisions (confirm before executing)

| # | Decision | Default recommendation | Alternative |
|---|---|---|---|
| D1 | Redis backend | **Upstash Redis free tier** — $0/mo, no VPC connector, no refactor | Memorystore Basic 1 GB ($37/mo + VPC connector $11/mo) |
| D2 | Cloud SQL HA | **No HA** at launch (single zone) — ~$13/mo | Add HA failover replica — ~$26/mo, activatable later without migration |
| D3 | GCP project | — *to be provided by user* — | Create fresh `pumai-prod` if none exists |
| D4 | Domain | — *to be provided by user* — | Cloud Run auto-issues TLS via Google-managed cert |
| D5 | DNS provider | — *to be provided by user* — (Cloudflare / Namecheap / Route 53) | Cloud DNS ($0.20/zone/mo) |
| D6 | Uploads retention | Default GCS bucket lifecycle = keep indefinitely | Add lifecycle rule to delete after N days |
| D7 | Monitoring alerts | Cloud Monitoring free tier + email alerts to owner | Integrate with PagerDuty / Slack later |

All subsequent steps assume the default recommendations unless the user overrides.

## 3. Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ australia-southeast1 (Sydney)                                    │
│                                                                  │
│   ┌───────────────┐        ┌─────────────────────────────┐       │
│   │ Cloud Run     │───────▶│ Cloud SQL Postgres 16       │       │
│   │ pumai-app     │ socket │ private IP, shared-core     │       │
│   │ 1 vCPU / 1GB  │        └─────────────────────────────┘       │
│   │ min=0 max=3   │                                              │
│   │ timeout=3600s │        ┌─────────────────────────────┐       │
│   │               │───────▶│ GCS bucket pumai-uploads    │       │
│   │               │ REST   │ (uniform bucket-level IAM)  │       │
│   │               │        └─────────────────────────────┘       │
│   │               │                                              │
│   │               │        ┌─────────────────────────────┐       │
│   │               │───────▶│ Secret Manager              │       │
│   │               │ env    │ (mounted as env vars)       │       │
│   │               │        └─────────────────────────────┘       │
│   │               │                                              │
│   └───────┬───────┘                                              │
│           │                                                      │
└───────────┼──────────────────────────────────────────────────────┘
            │ TLS (Upstash)
            ▼
    ┌───────────────────┐
    │ Upstash Redis     │  (ap-southeast-2 closest, Sydney if available)
    │ rediss://…        │  free tier 10k cmd/day
    └───────────────────┘

  User ──HTTPS──▶ Cloud Run custom domain (e.g. app.pumai.com.au)
                    │  Google-managed cert (auto-renew)
```

**Why this shape:**
- Cloud Run handles TLS + autoscale + zero-ops — fits the "simple + cheap" goal.
- Cloud SQL over **Unix socket** (`?host=/cloudsql/PROJECT:REGION:INSTANCE`) — no VPC connector needed, no public IP exposure.
- Upstash Redis is external over `rediss://` — no VPC connector, ~$40/mo saved vs Memorystore.
- GCS replaces local `/app/uploads` — Cloud Run filesystem is ephemeral.
- Secret Manager replaces the `.env` file entirely.

## 4. Cost Estimate (USD/mo, Sydney)

| Item | Config | Est. cost |
|---|---|---|
| Cloud Run | 1 vCPU / 1 GB, min=0 max=3, ~2M req/mo | $5–20 |
| Cloud SQL Postgres 16 | Enterprise shared-core, 10 GB SSD, no HA | ~$13 |
| Upstash Redis | Free tier (10k cmd/day) | $0 |
| Artifact Registry | ~500 MB image, handful of tags | <$1 |
| Secret Manager | ~15 secrets | <$0.50 |
| GCS uploads bucket | ~5 GB + standard ops | ~$1 |
| Cloud DNS (if used) | 1 zone | $0.20 |
| Egress | ~10 GB/mo out of Sydney | ~$1.20 |
| **Baseline** | | **~$22–37/mo** |

Upside scenarios:
- Traffic 10× expected → Cloud Run scales linearly (~$50-100 compute only).
- Enable Cloud SQL HA later → +$13/mo.

## 5. Pre-requisites (user side)

1. Google Cloud account with billing enabled.
2. `gcloud` CLI installed locally (or happy to `! gcloud auth login` in the Claude session).
3. Domain registered + access to DNS (to add A/CNAME record).
4. Upstash account created at https://upstash.com (free signup, no card required for free tier).
5. GitHub repository admin access (to configure WIF + branch protection).

## 6. Phase 1 — Fix Security Blockers (BEFORE any deploy)

Ordered by priority. Each item = 1 commit, each merged via PR to `main`.

### P1.1 — Gate the seed script (CN-005) — **blocker**
- File: `web/entrypoint.sh`
- Change: wrap `npx prisma db seed` in `if [ "${NODE_ENV}" != "production" ] && [ "${RUN_SEED:-0}" = "1" ]; then … fi`.
- File: `web/prisma/seed.ts` — early-return when `NODE_ENV === "production"` unless `SEED_ADMIN_PASSWORD` is supplied.
- Verification: build image with `NODE_ENV=production`, run `docker run` — seed must be skipped.

### P1.2 — Kill host-header redirects (CN-001) — **blocker**
- File: `web/src/middleware.ts`
  - Remove `appBase()` function.
  - Replace `NextResponse.redirect(\`${base}/dashboard\`)` → `NextResponse.redirect(new URL("/dashboard", req.url))`.
  - Same for the login redirect.
- Files: `web/src/app/api/auth/invalid-session/route.ts`, `web/src/app/api/meta/deletion-callback/route.ts`, `web/src/server/billing-actions.ts`
  - Remove `publicBase()` fallbacks to `http://localhost:3002`.
  - Require `NEXT_PUBLIC_APP_URL` at module load when `NODE_ENV === "production"`.

### P1.3 — Remove dev widget script from production layout (CN-003) — **blocker**
- File: `web/src/app/layout.tsx`
- Change: gate the `<Script src="http://localhost:3002/widget.js">` behind `{process.env.NODE_ENV !== "production" && …}`, or delete entirely if the main app should never auto-mount the widget.

### P1.4 — Harden NextAuth cookies + require `AUTH_URL=https://` (CN-009) — **blocker**
- File: `web/src/auth.ts`
- Add explicit `cookies` block forcing `__Secure-authjs.session-token` / `__Host-authjs.csrf-token` in prod with `secure: true`.
- Add startup guard: throw if `NODE_ENV === "production"` and `AUTH_URL` does not start with `https://`.

### P1.5 — Rotate exposed secrets (CN-004)
- Rotate `OPENAI_API_KEY` at https://platform.openai.com/api-keys.
- Rotate `AUTH_SECRET` = `openssl rand -base64 32`.
- Rotate `POSTGRES_PASSWORD` + `REDIS_PASSWORD` (local dev — will be new values in GCP regardless).
- Update local `.env`. Do not commit.

**Exit criteria for Phase 1:** all 5 merged to `main`, CI green, `/api/health` responds 200 in dev.

## 7. Phase 2 — Code Refactors for Cloud Run

### P2.1 — Uploads → GCS
- Add dep: `npm i @google-cloud/storage`.
- New file: `web/src/server/storage.ts` — wrapper around `Storage.bucket(bucketName)` with `putObject(name, buffer, contentType)` and `signedReadUrl(name, ttl)`.
- File: `web/src/app/api/webchat/[widgetKey]/upload/route.ts` — replace `await writeFile(join(UPLOADS_DIR, filename), buffer)` with `await storage.putObject(filename, buffer, contentType)`.
- File: `web/src/app/api/uploads/[filename]/route.ts` — replace `readFile` with a `NextResponse.redirect(signedReadUrl)`, or stream via `bucket.file(name).createReadStream()`.
- New env var: `UPLOADS_BUCKET`. Remove `UPLOADS_DIR` from all production code (keep for local dev if desired).
- Auth on uploads: the existing HMAC-signed URL scheme (`web/src/app/api/webchat/[widgetKey]/upload/route.ts:46-55`) still signs the logical filename. Either keep the HMAC wrapper unchanged, or migrate to GCS signed URLs (v4) for download — pick one, do not mix.
- Cyber Neo findings CN-021 and CN-030 become irrelevant once filesystem is gone; leave the code comments clean, no back-compat shim.

### P2.2 — Prisma → Cloud SQL socket
- File: `web/src/server/prisma.ts`
- Change: `@prisma/adapter-pg` accepts `{ connectionString }`. Cloud SQL socket format:
  ```
  postgresql://USER:PASSWORD@/DB_NAME?host=/cloudsql/PROJECT:REGION:INSTANCE&sslmode=disable
  ```
  (SSL is N/A on the Unix socket path — GCP handles it.)
- Add `statement_timeout: 15000`, `connection_limit` param (CN-015 remediation is part of this refactor).

### P2.3 — Rate-limit + SSE keep using `REDIS_URL`
- No code change — Upstash speaks the Redis protocol via `rediss://`.
- Verify `web/src/server/redis.ts` uses `new Redis(process.env.REDIS_URL!)` (it does).
- Confirm TLS certificate validation — Upstash uses Let's Encrypt, ioredis trusts system CAs by default (good, do not disable).

### P2.4 — Trusted-proxy hops for Cloud Run
- Set env `TRUSTED_PROXY_HOPS=1` in Cloud Run service config.
- Cloud Run places requests behind Google Front End (1 hop). The existing `request-meta.ts` IP parser then reads the client IP correctly for rate-limit keys.

### P2.5 — Container listens on `$PORT`
- Verify `web/Dockerfile` `CMD` respects `PORT` env. Next.js standalone output does by default when `HOSTNAME=0.0.0.0` is set — already the case.
- Add `ENV PORT=8080` default (Cloud Run sets it, but explicit is better).

### P2.6 — Misc hardening bundled with this PR
From Cyber Neo findings easy to fix in this PR:
- CN-024 `poweredByHeader: false` in `next.config.ts`.
- CN-019 replace `console.*` in `stripe/route.ts`, `webchat/stream/route.ts`, `webchat/events/route.ts` with `scoped(...)` from `@/server/logger`.
- CN-020 extend `SENSITIVE_PATHS` in `logger.ts` with the missing paths listed in the audit.
- CN-026 drop `pumai_active_business` cookie `maxAge` to 30 days + clear on NextAuth `signOut`.

**Exit criteria for Phase 2:** PR merged. Local `docker compose up` still works (pointing at local Postgres + Redis + local filesystem `UPLOADS_DIR`). A feature flag on `UPLOADS_BUCKET` toggles local FS vs GCS.

## 8. Phase 3 — Provision GCP Infrastructure

All steps run as `gcloud` commands. The user will approve each destructive/creation step.

### P3.1 — Project + APIs
```bash
PROJECT=pumai-prod   # or user-supplied
REGION=australia-southeast1
gcloud projects create "$PROJECT" --name="PumAI Prod"
gcloud config set project "$PROJECT"
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  storage.googleapis.com \
  iamcredentials.googleapis.com \
  sts.googleapis.com
```

### P3.2 — Artifact Registry
```bash
gcloud artifacts repositories create pumai \
  --repository-format=docker \
  --location="$REGION" \
  --description="PumAI container images"
```

### P3.3 — Cloud SQL Postgres 16
```bash
gcloud sql instances create pumai-db \
  --database-version=POSTGRES_16 \
  --edition=ENTERPRISE \
  --tier=db-perf-optimized-N-2   # or shared-core equivalent — confirm SKU availability in Sydney
  --region="$REGION" \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=14:00    # UTC = 00:00 AEST
gcloud sql databases create pumai --instance=pumai-db
gcloud sql users create pumai --instance=pumai-db --password=<generated>
```
The tier will be tuned to the cheapest Postgres 16 SKU available in Sydney at execution time — `gcloud sql tiers list --filter="region:australia-southeast1"` to confirm.

### P3.4 — GCS uploads bucket
```bash
gcloud storage buckets create gs://pumai-uploads-prod \
  --location="$REGION" \
  --uniform-bucket-level-access \
  --public-access-prevention
```

### P3.5 — Secret Manager entries
Load rotated secrets:
```bash
for S in OPENAI_API_KEY AUTH_SECRET STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET \
         META_APP_SECRET META_APP_SECRET_IG CHANNEL_CRED_KEY UPLOAD_SIGNING_KEY \
         WHATSAPP_WEBHOOK_TOKEN GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET \
         DATABASE_URL REDIS_URL; do
  gcloud secrets create "$S" --replication-policy=automatic
  # value pasted interactively or via --data-file=-
done
```

### P3.6 — Service accounts + IAM
- Runtime SA: `pumai-run@$PROJECT.iam.gserviceaccount.com` — grant:
  - `roles/cloudsql.client`
  - `roles/secretmanager.secretAccessor` (scoped per-secret)
  - `roles/storage.objectAdmin` (scoped to `gs://pumai-uploads-prod`)
- Deploy SA for GitHub Actions: `pumai-deploy@...` — grant:
  - `roles/run.admin`
  - `roles/artifactregistry.writer`
  - `roles/iam.serviceAccountUser` on `pumai-run`

### P3.7 — Workload Identity Federation for GitHub Actions
Create pool + provider restricted to the repo (`RorroPoblete/AUSTRALIAN_DREAM`), bind `pumai-deploy` SA. Avoids long-lived service-account keys (Cyber Neo CN-018-adjacent hardening).

### P3.8 — Upstash Redis
Outside GCP: create database in Upstash dashboard, region closest to Sydney. Copy TLS connection string (`rediss://default:TOKEN@xxxxx.upstash.io:6379`). Save it to Secret Manager as `REDIS_URL`.

## 9. Phase 4 — CI/CD Wiring

### P4.1 — Update `.github/workflows/ci.yml`
Add deploy job gated on `push` to `main` + successful test/lint/trivy jobs:
```yaml
deploy:
  needs: [typecheck-lint, trivy]
  if: github.ref == 'refs/heads/main'
  runs-on: ubuntu-latest
  permissions:
    contents: read
    id-token: write  # for WIF
  steps:
    - uses: actions/checkout@<sha>
    - uses: google-github-actions/auth@<sha>
      with:
        workload_identity_provider: projects/.../providers/github
        service_account: pumai-deploy@pumai-prod.iam.gserviceaccount.com
    - uses: google-github-actions/setup-gcloud@<sha>
    - name: Build + push
      run: |
        gcloud auth configure-docker australia-southeast1-docker.pkg.dev
        docker build -t australia-southeast1-docker.pkg.dev/pumai-prod/pumai/app:${{ github.sha }} ./web
        docker push australia-southeast1-docker.pkg.dev/pumai-prod/pumai/app:${{ github.sha }}
    - name: Deploy to Cloud Run
      run: |
        gcloud run deploy pumai-app \
          --image=australia-southeast1-docker.pkg.dev/pumai-prod/pumai/app:${{ github.sha }} \
          --region=australia-southeast1 \
          --service-account=pumai-run@pumai-prod.iam.gserviceaccount.com \
          --add-cloudsql-instances=pumai-prod:australia-southeast1:pumai-db \
          --set-env-vars=NODE_ENV=production,UPLOADS_BUCKET=pumai-uploads-prod,TRUSTED_PROXY_HOPS=1,AUTH_URL=https://app.pumai.com.au,AUTH_TRUST_HOST=true,NEXT_PUBLIC_APP_URL=https://app.pumai.com.au \
          --set-secrets=OPENAI_API_KEY=OPENAI_API_KEY:latest,AUTH_SECRET=AUTH_SECRET:latest,DATABASE_URL=DATABASE_URL:latest,REDIS_URL=REDIS_URL:latest,STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,META_APP_SECRET=META_APP_SECRET:latest,META_APP_SECRET_IG=META_APP_SECRET_IG:latest,CHANNEL_CRED_KEY=CHANNEL_CRED_KEY:latest,UPLOAD_SIGNING_KEY=UPLOAD_SIGNING_KEY:latest,WHATSAPP_WEBHOOK_TOKEN=WHATSAPP_WEBHOOK_TOKEN:latest,GOOGLE_CLIENT_ID=GOOGLE_CLIENT_ID:latest,GOOGLE_CLIENT_SECRET=GOOGLE_CLIENT_SECRET:latest \
          --min-instances=0 \
          --max-instances=3 \
          --memory=1Gi \
          --cpu=1 \
          --timeout=3600 \
          --concurrency=80 \
          --allow-unauthenticated
```

### P4.2 — Addressing the `--ignore-scripts` hardening (CN-035)
Also in the same CI update: add `--ignore-scripts` to `npm ci` and add explicit `npx prisma generate` step.

### P4.3 — Address Trivy installer (CN-018)
Pin the installer to a tagged release + sha256 verify. Same PR as P4.1.

## 10. Phase 5 — First Deploy + Smoke Tests

1. Run Prisma migrations once from the CI container against Cloud SQL (via socket):
   ```
   gcloud run jobs create pumai-migrate --image=... --command="npx,prisma,migrate,deploy"
   gcloud run jobs execute pumai-migrate --wait
   ```
2. Seed a single real admin user manually (not via `prisma db seed` — that's dev-only):
   ```
   gcloud sql connect pumai-db --user=pumai -- psql pumai
   -- INSERT a single admin with bcrypt(<strong password>)
   ```
3. Map custom domain: `gcloud run domain-mappings create --service=pumai-app --domain=app.pumai.com.au --region=...`. Copy the CNAME/A record targets and paste into the DNS provider.
4. Wait for Google-managed cert provisioning (~10–30 min).
5. Smoke tests:
   - `curl -sS https://app.pumai.com.au/api/health` → 200.
   - Browser: login page loads, TLS is valid, HSTS header present, CSP header present.
   - Log in as the admin created in step 2.
   - Create a test agent, send a chat message, verify Prisma writes + OpenAI response.
   - Post a dummy message to `/api/webhooks/meta` — expect 403 (no valid signature). Then post a correctly signed one — expect 200 + dedupe idempotency.
   - Upload a file via webchat widget → GCS writes object; reading via `/api/uploads/<filename>` serves it.
6. Check logs: `gcloud run services logs tail pumai-app`. No `TOO_MANY_ATTEMPTS` leaks, no unredacted secrets, no stack traces to the client.

## 11. Phase 6 — Post-Deploy Operations

### P6.1 — Backups
Cloud SQL automated backups are on by default (retention 7 days). Add point-in-time recovery (PITR) for 7-day granular restore:
```bash
gcloud sql instances patch pumai-db \
  --enable-point-in-time-recovery \
  --backup-location=australia-southeast1
```

### P6.2 — Monitoring + alerts
Cloud Monitoring free alerting policies:
- Cloud Run 5xx rate > 1% over 5 min → email.
- Cloud Run request latency p95 > 2 s over 10 min → email.
- Cloud SQL CPU > 80% over 10 min → email.
- Secret Manager access denied events → email.
Log-based metric: count of `TOTP_INVALID` events > 20 in 10 min → email (brute-force signal).

### P6.3 — Uptime check
Cloud Monitoring synthetic `GET /api/health` from 3 regions every 5 min. Alerts if 2 consecutive failures.

### P6.4 — Dependabot (CN-012)
Merge the `.github/dependabot.yml` PR described in the Cyber Neo report. Enable Dependabot alerts + security updates in GitHub repo settings.

### P6.5 — SECURITY.md (CN-034)
Add a root `SECURITY.md` with disclosure email + SLA.

## 12. Rollback Plan

Cloud Run keeps all past revisions. Rollback is 1 command:
```bash
gcloud run services update-traffic pumai-app \
  --to-revisions=pumai-app-<previous-rev>=100 \
  --region=australia-southeast1
```

Database rollback = restore from automated backup (last 7 days) or PITR to an exact timestamp.

Uploads bucket has object versioning disabled by default — turn on **if** accidental deletes are a likely failure mode (adds storage cost).

## 13. Final Checklist (pre-launch)

**Security**
- [ ] CN-001 host-header redirects fixed and deployed
- [ ] CN-003 dev widget script removed from prod layout
- [ ] CN-004 all listed secrets rotated
- [ ] CN-005 seed gated behind `NODE_ENV` + `RUN_SEED`
- [ ] CN-009 NextAuth cookies hardened + `AUTH_URL=https://...`
- [ ] At least CN-010 (resource limits), CN-011 (`no-new-privileges`), CN-019 (`console.*`), CN-020 (Pino redact paths) from Phase 2 hardening bundle
- [ ] SECURITY.md present
- [ ] Dependabot enabled

**Infra**
- [ ] Artifact Registry repo created
- [ ] Cloud SQL instance created with automated backups + PITR
- [ ] GCS uploads bucket with uniform IAM + public-access-prevention
- [ ] Secret Manager has every required secret (listed in Phase 3.5)
- [ ] Workload Identity Federation configured for GitHub Actions
- [ ] Upstash Redis provisioned, `REDIS_URL` stored

**App**
- [ ] `UPLOADS_BUCKET` + Cloud SQL socket + Upstash URL work end-to-end locally with staging credentials
- [ ] Prisma migrations applied to prod DB
- [ ] Single real admin user created (seed not run in prod)
- [ ] Custom domain mapped, cert issued
- [ ] Meta / Stripe webhooks repointed to `https://app.pumai.com.au/api/webhooks/…`
- [ ] Stripe customer portal return URL updated
- [ ] Google OAuth authorised redirect URIs updated

**Observability**
- [ ] Monitoring alerts live
- [ ] Uptime check live
- [ ] Log-based TOTP-invalid metric alert live

**Go-live**
- [ ] Smoke tests from Phase 5 all pass
- [ ] Rotate admin password immediately after first login
- [ ] Invite real team members via `Invitation` table (not seed)
- [ ] Monitor first 24 h for anomalies

---

## Appendix A — Files that will change in Phases 1 & 2

Tracked here so reviewers know the blast radius in advance.

**Phase 1 (security):**
- `web/entrypoint.sh`
- `web/prisma/seed.ts`
- `web/src/middleware.ts`
- `web/src/app/api/auth/invalid-session/route.ts`
- `web/src/app/api/meta/deletion-callback/route.ts`
- `web/src/server/billing-actions.ts`
- `web/src/app/layout.tsx`
- `web/src/auth.ts`
- `.env` (local, not committed — rotated values)

**Phase 2 (Cloud Run refactor + hardening):**
- `web/package.json` (`@google-cloud/storage`)
- `web/src/server/storage.ts` (new)
- `web/src/app/api/webchat/[widgetKey]/upload/route.ts`
- `web/src/app/api/uploads/[filename]/route.ts`
- `web/src/server/prisma.ts`
- `web/src/server/logger.ts`
- `web/next.config.ts`
- `web/src/app/api/webhooks/stripe/route.ts`
- `web/src/app/api/webchat/[widgetKey]/stream/route.ts`
- `web/src/app/api/webchat/[widgetKey]/events/route.ts`
- `web/src/server/actions.ts` (cookie maxAge)

**Phase 4 (CI):**
- `.github/workflows/ci.yml`
- `.github/dependabot.yml` (new)
- `SECURITY.md` (new, root)

## Appendix B — Environment variables in prod

| Var | Source | Purpose |
|---|---|---|
| `NODE_ENV` | env (literal `production`) | Gates seed, dev-only behaviour |
| `AUTH_URL` | env (`https://app.pumai.com.au`) | NextAuth canonical URL |
| `AUTH_TRUST_HOST` | env (`true`) | Required behind GFE |
| `NEXT_PUBLIC_APP_URL` | env (`https://app.pumai.com.au`) | Public-facing URL |
| `TRUSTED_PROXY_HOPS` | env (`1`) | XFF parsing depth |
| `UPLOADS_BUCKET` | env (`pumai-uploads-prod`) | GCS bucket name |
| `AUTH_SECRET` | Secret Manager | NextAuth JWT signing |
| `DATABASE_URL` | Secret Manager | Postgres connection (Unix socket) |
| `REDIS_URL` | Secret Manager | Upstash `rediss://` URL |
| `OPENAI_API_KEY` | Secret Manager | OpenAI |
| `STRIPE_SECRET_KEY` | Secret Manager | Stripe API |
| `STRIPE_WEBHOOK_SECRET` | Secret Manager | Stripe webhook HMAC |
| `META_APP_SECRET` | Secret Manager | Messenger HMAC |
| `META_APP_SECRET_IG` | Secret Manager | Instagram HMAC |
| `CHANNEL_CRED_KEY` | Secret Manager | AES-GCM envelope key |
| `UPLOAD_SIGNING_KEY` | Secret Manager | Upload HMAC |
| `WHATSAPP_WEBHOOK_TOKEN` | Secret Manager | Whapi verify token |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Secret Manager | Google OAuth |

## Appendix C — Non-goals for this plan (explicitly out of scope)

- Horizontal DB read replicas. Skip until metrics prove need.
- Multi-region failover. Single region until traffic justifies.
- VPC Service Controls. Not worth the complexity for a single-tenant-per-business SaaS at this stage.
- Cloud Armor / WAF. Cloud Run already has DDoS protection via Google Front End. Add later if targeted.
- IAP or VPN for admin access. Keep it simple — Cloud Run service is public, admin gating is application-level (`requireSuperadmin`).
