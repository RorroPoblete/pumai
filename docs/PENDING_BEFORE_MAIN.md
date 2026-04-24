# Pending before promoting `dev` → `main`

Checklist to run through before fast-forwarding `main` to catch up with `dev`. Every item here is something `main` (and therefore the live Cloud Run service) needs in order to work correctly after the promotion.

---

## 1. Stripe — test-mode Price IDs → Secret Manager

The pricing refactor (tiers "Scale" with cap, new Growth amounts, etc.) created seven new Stripe Prices in test mode. They are already set in the local `.env` but **not yet in Secret Manager**. Cloud Run mounts its env from Secret Manager, so until the secrets are updated the live service will still try to check out against the archived old prices and fail.

Rotate these seven secrets to the values currently in `.env`:

| Secret | New price |
|---|---|
| `STRIPE_PRICE_WEBCHAT_GROWTH` | `price_1TPib5EINodtNUwSyYKlayqV` (A$299) |
| `STRIPE_PRICE_MSG_STARTER` | `price_1TPib6EINodtNUwSpzO9o7U1` (A$129) |
| `STRIPE_PRICE_MSG_GROWTH` | `price_1TPib8EINodtNUwSijMa4z5K` (A$349) |
| `STRIPE_PRICE_MSG_ENTERPRISE` | `price_1TPibAEINodtNUwS2xlnH4nZ` (A$699) |
| `STRIPE_PRICE_IG_ENTERPRISE` | `price_1TPibCEINodtNUwSWeJch8c5` (A$699) |
| `STRIPE_PRICE_WA_GROWTH` | `price_1TPibEEINodtNUwSGlM3FsDZ` (A$499) |
| `STRIPE_PRICE_WA_ENTERPRISE` | `price_1TPibGEINodtNUwSMthUgJah` (A$899) |

```bash
# Example for one secret — repeat for each row above
printf '%s' "price_1TPib5EINodtNUwSyYKlayqV" | \
  gcloud secrets versions add STRIPE_PRICE_WEBCHAT_GROWTH --data-file=-

# Then force Cloud Run to pick up the new secret versions
gcloud run services update pumai-app \
  --region=asia-southeast1 \
  --update-secrets=STRIPE_PRICE_WEBCHAT_GROWTH=STRIPE_PRICE_WEBCHAT_GROWTH:latest,STRIPE_PRICE_MSG_STARTER=STRIPE_PRICE_MSG_STARTER:latest,STRIPE_PRICE_MSG_GROWTH=STRIPE_PRICE_MSG_GROWTH:latest,STRIPE_PRICE_MSG_ENTERPRISE=STRIPE_PRICE_MSG_ENTERPRISE:latest,STRIPE_PRICE_IG_ENTERPRISE=STRIPE_PRICE_IG_ENTERPRISE:latest,STRIPE_PRICE_WA_GROWTH=STRIPE_PRICE_WA_GROWTH:latest,STRIPE_PRICE_WA_ENTERPRISE=STRIPE_PRICE_WA_ENTERPRISE:latest
```

The old Price IDs have been archived in Stripe (`active=false`). Existing paying subscribers remain on their original Price — they are not force-migrated. Stripe will keep charging their amount until they manually upgrade.

## 2. Stripe live-mode Prices (when switching from test to live)

`STRIPE_SECRET_KEY` currently holds a `sk_test_…` key. Before taking real payments:

1. Create the same **13 Prices** (4 channels × 3 tiers + 4 add-ons + 1 bundle setup fee) in Stripe **Live** mode with the amounts from `web/src/lib/stripe.ts` `CHANNEL_CATALOG`.
2. Replace `STRIPE_SECRET_KEY` in Secret Manager with the live key.
3. Replace each `STRIPE_PRICE_*` secret with the live Price ID.
4. Register the production Stripe webhook at `https://pumai.com.au/api/webhooks/stripe`, copy the live `whsec_…` into `STRIPE_WEBHOOK_SECRET`, roll the Cloud Run service.

## 3. Meta webhook callback URLs

Meta Messenger and Instagram webhooks still point at whatever URL was registered during development. Update both to the production URL in the Meta App dashboard:

```
https://pumai.com.au/api/webhooks/meta
```

Verify token stays the value of `META_WEBHOOK_VERIFY_TOKEN` in Secret Manager.

## 4. Google OAuth — prod client

`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are empty. The "Continue with Google" button on `/login` will error out until filled.

1. Create a production OAuth 2.0 Client ID in Google Cloud → APIs & Services → Credentials.
2. Authorized JavaScript origins: `https://pumai.com.au`.
3. Authorized redirect URI: `https://pumai.com.au/api/auth/callback/google`.
4. Write both values into Secret Manager, roll the service.

## 5. `/contact` route wired to a real inbox

The landing `Pricing.tsx` Enterprise banner and the `Contact Sales` CTA on every Scale tile link to `/contact`. Verify that page exists, collects the visitor's details, and forwards them to a sales inbox (email, Slack webhook, Calendly, or a CRM — user's choice). Don't ship Enterprise as a public tier if that funnel drops messages.

## 6. Prisma `PlanTier` enum naming

Display label for the highest paid tier is now `Scale`, but the Prisma enum still reads `ENTERPRISE`. No functional bug — this is intentional to avoid a destructive schema migration. Consider renaming the enum value to `SCALE` in a dedicated migration later, and treating the contact-sales tier as pure marketing (no DB row).

## 7. Dependabot alerts / security updates

Dependabot is enabled for npm/actions/docker via `.github/dependabot.yml`, but GitHub's per-repo Dependabot **alerts** and **security updates** are separate toggles under Settings → Security. Flip both on once main is promoted so CVEs in production deps open PRs automatically.

## 8. Cloud Monitoring alert policies

None configured yet. Minimal set once real traffic arrives:
- Cloud Run 5xx rate > 1% over 5 min → email
- Cloud Run request latency p95 > 2 s over 10 min → email
- Cloud SQL CPU > 80% over 10 min → email
- Secret Manager access-denied events → email

## 9. Uptime check

Synthetic `GET https://pumai.com.au/api/health` every 5 min from 3 regions. Alert on 2 consecutive failures.

## 10. Run `prod-pumai-agent.ts` against prod DB after promotion

The PumAI landing-widget knowledge base now includes the new pricing tables (and the Enterprise contact tier). The agent in prod still has the old prices in its knowledge base until we re-run the script.

```bash
# After Secret Manager rotation in step 1
cloud-sql-proxy pumai-prod:asia-southeast1:pumai-db-sg --port=15433 &
DB_PWD=<from password manager>

cd web
DATABASE_URL="postgresql://pumai:${DB_PWD}@localhost:15433/pumai" \
ADMIN_EMAIL="admin@pumai.com.au" \
npx tsx prisma/prod-bootstrap.ts   # refreshes agents/business/widget

DATABASE_URL="postgresql://pumai:${DB_PWD}@localhost:15433/pumai" \
ADMIN_EMAIL="admin@pumai.com.au" \
npx tsx prisma/prod-pumai-agent.ts  # re-writes PumAI Assistant knowledge base
```

---

## Promotion ritual (when ready)

```bash
git checkout main
git merge --ff-only dev
git push origin main     # triggers CI + Cloud Run auto-deploy via WIF
```

Then run step 1 (secrets) immediately after deploy so the new pricing actually works at checkout.
