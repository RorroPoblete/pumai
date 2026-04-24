# PumAI — Omnichannel AI Agents for Australian Business

## Current state (2026-04-24)

- **🚀 Production live at https://pumai.com.au** — Cloud Run in `asia-southeast1` (Singapore), Cloud SQL Postgres, Upstash Redis, GCS uploads, Secret Manager, Google-managed TLS, DNS at GoDaddy. CI/CD via GitHub Actions + Workload Identity Federation — every push to `main` auto-deploys.
- **Billing & subscriptions live** — Stripe integration with per-channel pricing (12 prices + 4 add-ons), bundle discount, free tier (Webchat 10 conv/mo), subscription gating on agents, channels and webhook pipeline.
- **Cart checkout flow** — multi-select on `/dashboard/billing` → review summary → single Stripe Checkout with all recurring subs + setup fees as line items.
- **Webchat** production-ready: streaming SSE, agent push via Redis pub/sub, Shadow DOM widget, vision, rate limiting, offline mode. Landing widget lives at `wk_pumai_landing` and is wired to a dedicated `PumAI Assistant` agent with PumAI product knowledge.
- **Messenger** and **WhatsApp** working end-to-end.
- **Instagram** stalled on Meta app review.
- See `TECHNICAL_DEBT.md` for outstanding items and `docs/DEPLOY_GCP.md` for the full deployment runbook.

## Deployment follow-ups (pending)

The platform is live; these items are **not blocking** but remain to complete the production story. Most depend on an external service being registered against the new prod URL.

### Third-party integrations to repoint at prod URL
- **Stripe prod webhook** — register `https://pumai.com.au/api/webhooks/stripe` in the Stripe dashboard, copy the new `whsec_…` signing secret into Secret Manager (`gcloud secrets versions add STRIPE_WEBHOOK_SECRET --data-file=-`), then `gcloud run services update pumai-app --region=asia-southeast1 --update-secrets=STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest` to pick it up. Also move from test to live keys if/when going to real payments (`STRIPE_SECRET_KEY`).
- **Meta (Messenger + Instagram) webhooks** — update the Callback URL in the Meta App dashboard to `https://pumai.com.au/api/webhooks/meta` for both Page and Instagram products; verify token stays as `META_WEBHOOK_VERIFY_TOKEN`.
- **Google OAuth** — create a production OAuth 2.0 Client ID in the Google Cloud console, add `https://pumai.com.au/api/auth/callback/google` as an Authorised redirect URI, and populate `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` in Secret Manager (currently empty, so the "Continue with Google" button on `/login` returns an error).

### Observability / ops — add once there is measurable traffic
- Cloud Monitoring alert policies: 5xx rate > 1% / 5 min, p95 request latency > 2 s / 10 min, Cloud SQL CPU > 80% / 10 min, Secret-Manager access-denied.
- Uptime check hitting `/api/health` from 3 regions every 5 min.
- Turn on Dependabot alerts + Dependabot security updates in GitHub → Settings → Security (Dependabot PRs for npm/actions/docker are already enabled via `.github/dependabot.yml`).

### Scaling / reliability — revisit when justified
- Cloud SQL HA failover replica (+ ~$10/mo) once real paying customers rely on uptime.
- Move Upstash Redis from Sydney (`ap-southeast-2`) to Singapore (`ap-southeast-1`) to eliminate the cross-region Redis hop — only worth it if rate-limit / SSE fanout latency becomes a measurable hot-path cost.
- Global External HTTPS Load Balancer in front of Cloud Run — only if we need WAF / Cloud Armor / multi-region.

### Nice to have
- Test-live Stripe mode switch with real bank account registration.
- Local dev parity: the root `.env.example` already covers the env vars for Cloud SQL / GCS / Upstash, but contributors still need the `CHANNEL_CRED_KEY` to decrypt any channel credentials imported from prod.
- Re-enable Cloud SQL `pumai-db` backups download for a periodic offsite snapshot.

---

## Phase status

| Phase | Status |
|-------|--------|
| 1. Landing & Config | ✅ |
| 2. Auth & Onboarding | ✅ |
| 3. Dashboard | ✅ |
| 4. Database & Docker | ✅ |
| 5. Agent Builder | ✅ |
| 6. AI Engine | ✅ |
| 7. Facebook Messenger | ✅ |
| 8. Instagram DMs | ⏸ (blocked on Meta publish) |
| 9. Webchat | ✅ |
| 10. WhatsApp | ✅ |
| 12. External integrations | ⬜ (HubSpot, Shopify, Xero, Calendly) |
| 13. Billing & Plans | ✅ |
| 14. Compliance & Production | ⬜ |

---

## Billing model

### Free tier
- **Webchat only**, 10 conversations/month total, 1 agent
- Other channels locked
- Webhook pipeline drops inbound messages once limit reached

### Paid tiers (per channel)
Each of the 4 channels can be subscribed independently:

| Tier | Conversations/mo | Notes |
|------|------------------|-------|
| Starter | 500 | Entry |
| Growth | 2,000 | Most popular |
| Enterprise | Unlimited | Custom setup |

Per-channel pricing:

| Channel | Starter (500 conv) | Growth (2,000 conv) | Scale (10,000 conv) | Enterprise | Add-on (after first paid) |
|---------|---------|--------|-------|------------|---------------------------|
| Webchat | A$99 | A$299 | A$599 | Contact sales | A$350/mo (Growth-level) |
| Messenger | A$129 | A$349 | A$699 | Contact sales | A$350/mo |
| Instagram | A$129 | A$349 | A$699 | Contact sales | A$350/mo |
| WhatsApp | A$199 | A$499 | A$899 | Contact sales | A$350/mo |

Enterprise is not backed by a self-serve Stripe Price — it's a contact-sales tier for volumes above 10,000 conversations/month, multi-brand portfolios, custom SLAs, dedicated account manager, and compliance requirements (SOC 2 / ISO 27001 / data residency).

### Setup fees
- **Single channel**: channel/tier specific (e.g. Webchat Growth = A$300)
- **Bundle (2+ channels in single cart)**: flat **A$350 total** (one-time, shown in checkout)
- **Add-on** (subsequent channels after first paid): no setup fee

### Subscription gates (runtime)
- `requireChannelAccess(businessId, channel)` used by `connectChannel`, `saveWebchat`
- Pipeline: drops inbound messages if channel not active OR monthly limit reached
- Agent creation: FREE = 1 agent max; any paid sub = unlimited

---

## Quick start

### Docker (full stack)
```bash
cp .env.example .env   # fill in keys
docker compose up --build
# App:   http://localhost:3002
# DB:    localhost:5432 (pumai/pumai_secret/pumai_db)
# Redis: localhost:6379
```

### Development (without Docker)
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

### Database
```bash
cd frontend
npm run db:generate   # Generate Prisma client + sync to src/generated
npm run db:push       # Push schema to DB
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio
```

### Demo login
- **Demo** (all 4 channels GROWTH active): `demo@pumai.com.au` / `password123`
- **Superadmin**: `admin@pumai.com.au` / `password123`

---

## Stripe setup

### 1. Create products + prices (one-time, idempotent scripts)

Inside `frontend/` with `STRIPE_SECRET_KEY` in your env:

```bash
# Core channel tiers (12 prices: 4 channels × Starter/Growth/Enterprise)
npx tsx scripts/create-stripe-products.ts

# Add-on prices (4 prices: A$350/mo per channel for omnichannel bundle)
npx tsx scripts/create-stripe-addons.ts
```

Copy the 16 `STRIPE_PRICE_*` lines output by each script into `.env`.

### 2. Webhook endpoint

Point Stripe to `POST /api/webhooks/stripe` and subscribe to:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

Copy the signing secret to `STRIPE_WEBHOOK_SECRET` in `.env`.

**Local testing**: run `stripe listen --forward-to localhost:3002/api/webhooks/stripe` in another terminal.

### 3. Customer portal
In Stripe dashboard → **Settings → Billing → Customer portal**, enable:
- Cancel subscription
- Update payment method
- View invoices
- Update billing address / tax ID

---

## Environment variables

```env
# Database
DATABASE_URL=postgresql://pumai:pumai_secret@postgres:5432/pumai_db

# Redis
REDIS_URL=redis://redis:6379

# Auth
AUTH_SECRET=<random 32-byte base64>
AUTH_URL=http://localhost:3002
AUTH_TRUST_HOST=true
AUTH_GOOGLE_ID=<optional>
AUTH_GOOGLE_SECRET=<optional>

# App
NEXT_PUBLIC_APP_URL=http://localhost:3002

# AI
OPENAI_API_KEY=sk-...

# Meta (Facebook + Instagram)
META_APP_SECRET=<from Meta developer console>
META_APP_SECRET_IG=<optional separate IG app secret>
META_WEBHOOK_VERIFY_TOKEN=<arbitrary string>

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# 12 channel × tier prices
STRIPE_PRICE_WEBCHAT_STARTER=price_...
STRIPE_PRICE_WEBCHAT_GROWTH=price_...
STRIPE_PRICE_WEBCHAT_ENTERPRISE=price_...
STRIPE_PRICE_WA_STARTER=price_...
STRIPE_PRICE_WA_GROWTH=price_...
STRIPE_PRICE_WA_ENTERPRISE=price_...
STRIPE_PRICE_IG_STARTER=price_...
STRIPE_PRICE_IG_GROWTH=price_...
STRIPE_PRICE_IG_ENTERPRISE=price_...
STRIPE_PRICE_MSG_STARTER=price_...
STRIPE_PRICE_MSG_GROWTH=price_...
STRIPE_PRICE_MSG_ENTERPRISE=price_...

# 4 add-on prices (A$350/mo each)
STRIPE_PRICE_WEBCHAT_ADDON=price_...
STRIPE_PRICE_WA_ADDON=price_...
STRIPE_PRICE_IG_ADDON=price_...
STRIPE_PRICE_MSG_ADDON=price_...
```

---

## Architecture

```
AUSTRALIAN_DREAM/
  backend/
    prisma/
      schema.prisma       # Users, Business, Agents, Channels, Subscriptions, Messages
      seed.ts
    src/
      auth-utils.ts       # Session + active business resolution
      billing-actions.ts  # Cart/addon/portal checkout, upsertSubscriptionFromStripe
      billing-queries.ts  # Billing data for UI
      billing-types.ts    # CartItem, BillingError
      channel-gate.ts     # Per-channel access + conversation limits
      channels/
        pipeline.ts       # Unified inbound pipeline (messenger/instagram/webchat/whatsapp)
        registry.ts       # Channel adapter registry
      ai.ts, actions.ts, queries.ts, etc.
  frontend/
    src/
      lib/stripe.ts       # CHANNEL_CATALOG, PLANS, BUNDLE_SETUP_FEE, resolveTierByPriceId
      app/
        (app)/dashboard/billing/   # Billing page + cart + summary
        api/webhooks/stripe/       # Webhook handler (idempotent)
        api/webhooks/meta/         # Messenger + Instagram
      components/dashboard/        # Sidebar, UpgradeBanner, SubscriptionContext
    scripts/
      create-stripe-products.ts    # 12 channel × tier prices
      create-stripe-addons.ts      # 4 add-on prices
```

### Key patterns

**Channel adapter + unified pipeline** — each channel has a thin adapter (`parseInbound`, `sendMessage`); all run through `handleInbound()` in `backend/src/channels/pipeline.ts`.

**Subscription model** — 1 DB row per `(businessId, channel)`. Multiple rows can share a `stripeSubscriptionId` when bought together in a cart. Webhook iterates `subscription.items` and upserts one row per item.

**Idempotent webhook** — `ProcessedWebhookEvent` table dedupes by Stripe `event.id`. Permanent errors (bad metadata) are logged and marked processed to avoid infinite retry; transient errors return 500 so Stripe retries.

---

## Flow diagrams

### Register → pay
```
Landing → /register → /onboarding (business + agent) → /dashboard
  ↓ (free state)
/dashboard/billing → select channels × tiers → Review order
  ↓ cart summary (monthly + setup separate)
Stripe Checkout → webhook → subscription active → unlock channels
```

### Omnichannel add-on
```
Billing page (existing paid sub) → see "+A$350/mo Add channel" on locked channels
  ↓
Single-click → Stripe Checkout → webhook → channel active at GROWTH tier
```

### Upgrade / cancel
```
Billing page → "Manage billing portal" → Stripe-hosted portal → cancel / upgrade
  ↓ webhook (subscription.updated or .deleted)
DB synced automatically
```

---

## Tech stack
- **Frontend:** Next.js 16 (Turbopack), TypeScript, Tailwind CSS v4
- **Auth:** NextAuth.js v5 (Credentials + Google)
- **Database:** PostgreSQL 16 + Prisma v7
- **Cache:** Redis 7
- **AI:** OpenAI GPT-4o Mini (vision)
- **Payments:** Stripe (subscriptions, invoice items, customer portal, AU tax ID collection)
- **Channels:** Webchat (custom widget), WhatsApp (Whapi.cloud), Meta Graph API (Messenger + Instagram)
- **Deploy:** Docker / docker-compose

---

## Docs
- `WEBCHAT.md` — full webchat integration guide
- `FACEBOOK_MESSENGER.md` — Messenger integration guide
- `WHATSAPP.md` — WhatsApp via Whapi.cloud
- `docs/integrations/instagram-status-2026-04-16.md` — Instagram status & blockers
- `TECHNICAL_DEBT.md` — pending work
- `CLAUDE.md` — project rules & architecture decisions





           


