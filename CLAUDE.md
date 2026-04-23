# PumAI — Project Rules & Architecture

## Code Principles

- **Quality over speed** — Clean, readable, well-structured code always wins
- **Modular architecture** — Each module has a single responsibility and clear boundaries
- **No over-engineering** — Solve what's needed, not what might be needed
- **Read first, write complete** — Understand existing code before changing it
- **No dead code** — Delete it, don't comment it out

## Project Structure

```
AUSTRALIAN_DREAM/
  web/                       # Next.js 16 fullstack app (frontend + API routes)
    src/
      app/                   # Pages + API routes
        (app)/dashboard/     # Main app UI (conversations, agents, settings)
        (auth)/              # Login, register, forgot-password
        api/                 # API routes (chat, webhooks, auth, billing)
      server/                # Server-side shared logic (consumed by API + actions)
        channels/            # Multi-channel adapter layer
        ai.ts                # OpenAI integration
        actions.ts           # Server actions
        queries.ts           # Data queries
        auth-utils.ts        # Session/tenant resolution
        prisma.ts            # Prisma client singleton
        redis.ts             # Redis client singleton
        rate-limit.ts        # Redis-backed rate limiting
        logger.ts            # Pino structured logging
      components/            # React components
      generated/prisma/      # Prisma client (auto-generated)
      lib/                   # Client-safe helpers
    prisma/                  # schema.prisma + seed.ts + migrations
    prisma.config.ts
    package.json
    Dockerfile
  marketing/                 # Marketing site + Remotion videos (separate, gitignored)
  docs/                      # Operational runbooks
  docker-compose.yml         # Postgres + Redis + app (app behind --profile full)
  .env                       # Single source of truth (gitignored)
  .env.example               # Template (committed)
```

`web/.env.local` is a symlink to `../.env` — one source of truth for secrets.

## Tech Stack

- **Runtime:** Node.js 22 + TypeScript (strict)
- **Framework:** Next.js 16 (App Router, Turbopack in dev)
- **Auth:** NextAuth.js v5 (Credentials + Google OAuth + TOTP 2FA)
- **Database:** PostgreSQL 16 + Prisma v7 (with @prisma/adapter-pg)
- **Cache / Rate limit:** Redis 7 (ioredis)
- **AI:** OpenAI GPT-4o-mini
- **Deploy:** Docker multi-stage build + docker-compose

## Architecture Decisions

### Next.js fullstack (not a separate backend process)

Next.js runs UI, API routes, and server actions in one process. Code under `web/src/server/` is shared server-side logic imported by API routes and server actions — not a separate server.

### Multi-Channel (Phase 7+)

Adapter + Unified Pipeline pattern:

1. **Adapter** (`web/src/server/channels/<channel>.ts`) — only two methods:
   - `parseInbound(body)` — normalize webhook payload
   - `sendMessage(config, msg)` — send via channel API
   - No DB or AI access
2. **Pipeline** (`web/src/server/channels/pipeline.ts`) — `handleInbound()`:
   - Lookup ChannelConfig → dedupe → upsert Conversation → save inbound → AI response → send outbound → save outbound → async sentiment
3. **Registry** (`web/src/server/channels/registry.ts`) — Channel enum → adapter
4. **Webhook routes** (`web/src/app/api/webhooks/`) — verify signature, dispatch to pipeline

### Schema

- **Channel enum:** MESSENGER, INSTAGRAM, WEBCHAT, WHATSAPP
- **ChannelConfig:** per-business, per-channel credentials + default agent. `@@unique([businessId, channel])`
- **Conversation:** `@@unique([businessId, channel, contactExternalId])`
- **Message.externalMsgId:** platform message ID for deduplication
- One default agent per channel per business via `ChannelConfig.agentId`

### Meta webhook

- Single endpoint `/api/webhooks/meta` for Messenger + Instagram
- `body.object === "page"` → Messenger, `"instagram"` → Instagram
- HMAC-SHA256 verification: `META_APP_SECRET` (page) / `META_APP_SECRET_IG` (IG)
- Per-business tokens stored encrypted in `ChannelConfig.credentials`

### AI Engine

- `buildSystemPrompt()` — tone + agent instructions + knowledge base
- `streamChatResponse()` — streaming for browser chat
- `getChatResponse()` — non-streaming for webhooks
- `analyzeConversation()` — sentiment, escalation, language

### Multi-Tenancy

- 1:1 User → Business (owner)
- BusinessMember for team access (OWNER, ADMIN, MEMBER)
- Active business resolved via: cookie → session → DB fallback
- Every query scoped by `businessId`

## Coding Conventions

- **Imports:** `@/*` → `web/src/*`. Server code under `@/server/*`.
- **Server actions:** `"use server"` + Zod validation
- **Errors:** validate at boundaries (API routes, webhooks), trust internal code
- **Naming:** camelCase (vars), PascalCase (types/components), UPPER_SNAKE (enums)
- **Files:** kebab-case, one module per file
- **No comments** unless the WHY is non-obvious

## Commands

```bash
# Primary flow — full stack in docker
docker compose up --build             # postgres + redis + app → http://localhost:3002
docker compose down                   # stop (volumes persist)
docker compose down -v                # stop + wipe DB/redis data

# DB operations
docker compose exec app npm run db:push    # apply schema changes
docker compose exec app npm run db:seed    # reseed (idempotent; also runs automatically on container start)
docker compose exec app npm run db:studio  # Prisma Studio → http://localhost:5555

# Optional: dev-local mode (hot reload faster than docker rebuild)
docker compose up -d postgres redis   # only services
cd web && npm run dev                 # Next.js on port 3000

# Demo login
# admin@pumai.com.au / password123456
# demo@pumai.com.au  / password123456
```

## Env management

All secrets live in a single `.env` at the repo root (gitignored). `web/.env.local` is a symlink to it. `docker-compose.yml` reads the same file via `env_file: .env`.
