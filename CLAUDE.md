# PumAI — Project Rules & Architecture Decisions

## Code Principles

- **Quality over speed** — Clean, readable, well-structured code always wins
- **Modular architecture** — Each module has a single responsibility and clear boundaries
- **Easy maintainability** — Any developer should understand the code without tribal knowledge
- **No over-engineering** — Solve what's needed, not what might be needed someday
- **Read first, write complete** — Understand existing code before changing it. Deliver full solutions.

## Project Structure

```
AUSTRALIAN_DREAM/
  backend/           # Prisma schema, server logic, AI engine, channels
    prisma/          # schema.prisma, seed.ts
    src/
      generated/     # Prisma client (auto-generated, do NOT edit)
      channels/      # Multi-channel adapter layer
      ai.ts          # OpenAI integration
      actions.ts     # Server actions (agent CRUD, settings)
      queries.ts     # Data queries (dashboard, conversations)
      auth-utils.ts  # Session/tenant resolution
      prisma.ts      # Prisma client singleton
      rate-limit.ts  # Redis-backed rate limiting
      validation.ts  # Zod schemas
  frontend/          # Next.js 16 app
    src/app/api/     # API routes (chat, webhooks, auth)
    src/app/(app)/   # Dashboard pages
    src/components/  # React components
  marketing/         # Marketing site (separate)
```

## Tech Stack

- **Runtime:** Node.js + TypeScript (strict)
- **Frontend:** Next.js 16, Tailwind CSS v4, React
- **Auth:** NextAuth.js v5 (Credentials + Google OAuth)
- **Database:** PostgreSQL 16 + Prisma v7
- **Cache:** Redis 7 (ioredis)
- **AI:** OpenAI GPT-4o-mini (128K context)
- **Deploy:** Docker + docker-compose

## Architecture Decisions

### Multi-Channel Architecture (Phase 7+)

**Pattern:** Adapter + Unified Pipeline

Each messaging channel (Messenger, Instagram, Webchat, WhatsApp, SMS) follows the same pattern:

1. **Adapter** (`backend/src/channels/<channel>.ts`) — Does only 2 things:
   - `parseInbound(body)` — Parses raw webhook payload into normalized `InboundMessage`
   - `sendMessage(config, msg)` — Sends a message via the channel's API
   - Adapters do NOT touch the database or AI engine

2. **Pipeline** (`backend/src/channels/pipeline.ts`) — Single `handleInbound()` function:
   - Find ChannelConfig (identify business)
   - Deduplicate by externalMsgId
   - Upsert Conversation
   - Save inbound message
   - Generate AI response via `getChatResponse()`
   - Send outbound via adapter
   - Save outbound message
   - Async sentiment analysis

3. **Registry** (`backend/src/channels/registry.ts`) — Maps Channel enum to adapter instance

4. **Webhook routes** (`frontend/src/app/api/webhooks/`) — Verify signatures, parse body, dispatch to pipeline

### Key Schema Decisions

- **Channel enum:** MESSENGER, INSTAGRAM, WEBCHAT, WHATSAPP, SMS
- **ChannelConfig model:** Per-business, per-channel credentials + default agent. `@@unique([businessId, channel])`
- **Conversation.contactExternalId:** Platform-specific user ID (PSID for Messenger, IGSID for Instagram, phone for WhatsApp/SMS, session ID for Webchat)
- **Conversation lookup key:** `@@unique([businessId, channel, contactExternalId])`
- **Message.externalMsgId:** Platform message ID for deduplication (replaces old `smsId`)
- **Agent routing:** One default agent per channel per business via `ChannelConfig.agentId`

### Meta (Facebook + Instagram) Webhook

- Single endpoint `/api/webhooks/meta` handles both Messenger and Instagram
- `body.object === "page"` for Messenger, `"instagram"` for Instagram
- HMAC-SHA256 signature verification using `META_APP_SECRET`
- App-level env vars: `META_APP_SECRET`, `META_WEBHOOK_VERIFY_TOKEN`
- Per-business tokens stored in `ChannelConfig.credentials` (DB, not env vars)

### AI Engine

- `buildSystemPrompt()` — Tone-aware system prompt with agent instructions + knowledge base
- `streamChatResponse()` — Streaming for browser-facing chat (agent test)
- `getChatResponse()` — Non-streaming for webhook pipeline (response goes to channel API)
- `analyzeConversation()` — Sentiment, escalation, language detection

### Multi-Tenancy

- 1:1 User → Business (owner)
- BusinessMember for team access (OWNER, ADMIN, MEMBER roles)
- Active business resolved via: cookie → session → DB fallback
- All queries scoped by `businessId`

## Coding Conventions

- **Imports:** Use `@/` alias for backend imports from `backend/src/`
- **Server actions:** Marked with `"use server"`, validated with Zod
- **Error handling:** Validate at boundaries (API routes, webhooks), trust internal code
- **Naming:** camelCase for functions/variables, PascalCase for types/components, UPPER_SNAKE for enums
- **Files:** kebab-case for file names, one module per file
- **No comments** unless logic is non-obvious. Code should be self-documenting.
- **No unused code** — Delete it, don't comment it out

## Channel Integration Order

1. Facebook Messenger (Phase 7) — First channel, establishes the multi-channel architecture
2. Instagram DMs (Phase 8) — Reuses Meta webhook, similar adapter
3. Webchat (Phase 9) — Embeddable widget, supports streaming
4. WhatsApp (Phase 10) — Cloud API, different payload shape
5. SMS (Phase 11) — Cellcast/160.com.au integration

## Environment Variables

```
# Database
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# AI
OPENAI_API_KEY=...

# Redis
REDIS_URL=redis://...

# Meta (Facebook/Instagram)
META_APP_SECRET=<from Meta developer console>
META_WEBHOOK_VERIFY_TOKEN=<arbitrary string for webhook verification>
```

## Commands

```bash
# Development
cd frontend && npm run dev

# Database
cd backend && npx prisma db push      # Apply schema
cd backend && npx prisma db seed      # Seed data
cd backend && npx prisma studio       # GUI

# Docker
docker compose up --build

# Demo login
# Email: demo@pumai.com.au
# Password: password123
```
