# Secrets management — runbook

## Summary

| Environment | Mechanism |
|-------------|-----------|
| Local dev   | `.env` file (gitignored) |
| CI          | GitHub Encrypted Secrets (`ci.yml` reads via `${{ secrets.* }}`) |
| Production  | Managed secret provider → injected as env vars at container start |

The `.env` file is **never** committed and **never** used in production. A placeholder `.env.example` lives at the repository root and lists every required variable.

---

## Local development

1. Copy the template: `cp .env.example .env`
2. Fill in each variable with real values generated via the commands documented in-line.
3. `docker compose up --build`.

Because `.env` holds live API keys (OpenAI, Stripe, Meta, etc.) treat the developer machine as a secrets boundary:

- Disable cloud sync for the project directory (Time Machine exclusions, iCloud Drive "Desktop & Documents" opt-out, OneDrive selective sync).
- Do not paste `.env` contents into chat, screenshots or AI assistants.
- Rotate any key you believe was exposed.

---

## Production

Use one of:

### Option 1 — Doppler (recommended for small teams)
```bash
doppler login
doppler setup --project pumai --config prd
doppler run -- docker compose up -d
```

### Option 2 — AWS Secrets Manager
Create a secret with all key/value pairs, then in ECS / EKS task definition reference:
```json
"secrets": [
  { "name": "AUTH_SECRET", "valueFrom": "arn:aws:secretsmanager:...:secret:pumai/prd:AUTH_SECRET::" },
  { "name": "STRIPE_SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:...:secret:pumai/prd:STRIPE_SECRET_KEY::" }
]
```

### Option 3 — Sops with age (file-based encryption, committed to repo)
```bash
age-keygen -o ~/.config/sops/age/keys.txt
export SOPS_AGE_RECIPIENTS=$(grep 'public key:' ~/.config/sops/age/keys.txt | cut -d: -f2 | xargs)
sops --encrypt --age "$SOPS_AGE_RECIPIENTS" .env > .env.enc
# commit .env.enc; decrypt at deploy time
sops --decrypt .env.enc > .env
```

---

## Key rotation

Master/signing keys that rotate via simple replacement:

| Variable              | Rotation procedure                                               |
|-----------------------|------------------------------------------------------------------|
| `AUTH_SECRET`         | Generate new value, redeploy. All active JWT sessions invalidate.|
| `WHATSAPP_WEBHOOK_TOKEN` | Generate new value, update Whapi webhook URL, redeploy.      |
| `UPLOAD_SIGNING_KEY`  | Generate new value. All outstanding signed upload URLs 403.      |
| `META_WEBHOOK_VERIFY_TOKEN` | Update in Meta Developer Console, then redeploy.           |
| Stripe, OpenAI, Meta API keys | Rotate at the provider, update env, redeploy.            |

Envelope-encrypted data (`CHANNEL_CRED_KEY`) requires overlapping keys:

1. Generate `CHANNEL_CRED_KEY_NEW`.
2. Set `CHANNEL_CRED_KEY=<new>` and `CHANNEL_CRED_KEYS=<old>` (comma-separated supports multiple retired keys). Redeploy.
3. Run a one-off script that iterates `ChannelConfig` rows and calls `rotateCiphertext(row.credentials)`:
   ```ts
   import { prisma } from "@/backend/prisma";
   import { rotateCiphertext } from "@/backend/crypto";
   const rows = await prisma.channelConfig.findMany();
   for (const row of rows) {
     await prisma.channelConfig.update({
       where: { id: row.id },
       data: { credentials: rotateCiphertext(row.credentials) },
     });
   }
   ```
4. Once all rows decrypt with the new key, remove the old key from `CHANNEL_CRED_KEYS` and redeploy.

---

## Incident response — leaked secret

1. Rotate the affected secret immediately at the provider (Stripe / OpenAI / Meta dashboard).
2. Update the corresponding env var in prod.
3. Redeploy.
4. Review audit logs and provider dashboards for unauthorised use during the exposure window.
5. If the leak was via git history, scrub with `git filter-repo` or BFG, force-push, and rotate even more aggressively (secrets may already be indexed by mirrors).
6. File a notifiable data breach assessment if personal information is in scope (see `COMPLIANCE.md` §3).
