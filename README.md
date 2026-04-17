# PumAI — Omnichannel AI Agents for Australian Business

## Current state (2026-04-17)

- **Webchat** is production-ready: streaming SSE, agent push via Redis pub/sub, Shadow DOM widget, vision-enabled image attachments, rate limiting, offline mode, read receipts, unread badge + polling in dashboard.
- **Messenger** webhook + adapter + AI reply working end-to-end.
- **Instagram** stalled in Meta Dev mode — code is ready, but Meta won't fire webhooks until the app is published. See `docs/integrations/instagram-status-2026-04-16.md`.
- **WhatsApp** working end-to-end via Whapi.cloud — webhook, adapter, AI pipeline, dashboard channel config all live.
- SMS has been removed from the product — Webchat, WhatsApp, Instagram and Messenger are the four supported channels.
- See `TECHNICAL_DEBT.md` for outstanding items.

## Project Status

### Phase 1: Landing & Config ✅
- [x] Next.js 16 + TypeScript + Tailwind v4 setup
- [x] Design system (dark theme, violet #8B5CF6, glassmorphism, Inter font)
- [x] Landing page (Navbar, Hero w/ particles, Features, How It Works, Multi-Channel Pricing, Industries, CTA, Footer)
- [x] Scroll animations (Intersection Observer)
- [x] Logo/integration carousel
- [x] Smooth scroll + navbar scroll effect
- [x] Custom SVG industry icons
- [x] Brand: PumAI

### Phase 2: Auth & Onboarding ✅
- [x] NextAuth.js v5 (Credentials + Google OAuth)
- [x] Login page (email/password + Google)
- [x] Register page (auto sign-in after register)
- [x] Forgot password page
- [x] Auth layout (split-screen: branding left, form right)
- [x] Onboarding wizard (3 steps: business info, industry, agent config)
- [x] Middleware (protected routes, auth redirects)

### Phase 3: Dashboard ✅
- [x] Sidebar navigation (Overview, Conversations, Agents, Analytics, Settings)
- [x] Overview page (KPI cards, bar chart, sentiment breakdown, recent conversations table)
- [x] Conversations page (filterable list, search, status badges, sentiment dots)
- [x] AI Agents page (agent cards, status, tone, stats, hover actions)
- [x] Analytics page (KPIs, daily chart, donut chart, agent performance table)
- [x] Settings page (business info, notification toggles, danger zone)
- [x] Seed data (5 agents, 8 conversations, metrics)

### Phase 4: Database & Docker ✅
- [x] Prisma v7 schema (User, Account, Session, Business, Agent, Conversation, Message)
- [x] Seed script (2 users, 2 businesses, 5 agents, 8 conversations with messages)
- [x] Dockerfile (multi-stage build + tsconfig for tsx)
- [x] docker-compose.yml (PostgreSQL 16, Redis 7, Next.js app)
- [x] Seed auto-run in Docker (idempotent seed + `node --import tsx` loader + `--skip-generate`)
- [x] Dashboard connected to real DB (Prisma queries replace static seed data in all 5 pages + sidebar)

### Phase 5: Agent Builder ✅
- [x] No-code agent configuration UI (create/edit/delete agents, industry selector)
- [x] System prompt editor (monospace editor, per-industry templates, char counter)
- [x] Knowledge base editor (FAQ/docs text area with placeholder guide)
- [x] Conversation flow builder (funnels — agent CRUD with tone/industry config)
- [x] Agent testing with live AI chat
- [x] Tone & personality settings (Professional/Friendly/Casual selector)
- [x] Server actions (createAgent, updateAgent, deleteAgent, toggleAgentStatus)
- [x] Agents list wired up (New, Edit, Test, Pause/Activate buttons functional)

### Phase 6: AI Engine ✅
- [x] OpenAI GPT-4o Mini integration (128K context, US$0.15/M input, US$0.60/M output)
- [x] Context management per conversation (full chat history sent to model)
- [x] System prompt injection with business data + knowledge base
- [x] Streaming responses in agent test chat (real-time token rendering)
- [x] Tone-aware prompt construction (Professional/Friendly/Casual)
- [x] Escalation detection (AI flags `[ESCALATE]` + metadata analysis, visual banner in UI)
- [x] Sentiment analysis (real-time per-conversation: positive/neutral/negative badge)
- [x] Response generation pipeline (`lib/ai.ts`: buildSystemPrompt, streamChatResponse, analyzeConversation)
- [x] Multilingual support (auto-detects language, responds in same language, language badge in UI)

### Phase 7: Facebook Messenger Integration ✅
- [x] Meta Graph API setup (Facebook Page)
- [x] Inbound message webhook handler (Messenger Platform)
- [x] Multi-channel architecture (Adapter + Pipeline pattern)
- [x] ChannelConfig model (per-business, per-channel credentials + default agent)
- [x] Webhook endpoint with HMAC-SHA256 signature verification
- [x] Conversation upsert by contactExternalId (PSID)
- [x] Message deduplication by externalMsgId
- [x] Connect AI engine to Messenger inbound pipeline
- [x] Superadmin Platform Settings (Meta credentials + channel management)
- [x] Dashboard channel management UI + conversation channel badges
- [ ] Rich templates (buttons, carousels, receipts)
- [ ] Persistent menu configuration
- [ ] Sponsored messages / marketing outbound

### Phase 8: Instagram DMs Integration ⏸ (blocked on Meta App publish)
- [x] Adapter (parses `messaging[]` and `changes[]` payload formats)
- [x] Webhook verify + HMAC signature share with Messenger (`/api/webhooks/meta`)
- [x] Pipeline integration (same `handleInbound` as Messenger)
- [x] FB Login API flow (Page Access Token), graph.facebook.com v22.0 `/me/messages`
- [x] Dashboard channel config for Instagram Business Account ID + token
- [ ] Real DM deliveries fire webhook — **blocked until app is Live** (docs/integrations/instagram-status-2026-04-16.md)
- [ ] Auto-reply to story mentions and comments
- [ ] Product tag integration (Instagram Shopping)
- [ ] 24-hour messaging window compliance

### Phase 9: Webchat Integration ✅
- [x] Embeddable chat widget (`/widget.js`, isolated in Shadow DOM)
- [x] Custom branding (colour, title, welcome, position) + per-widget `widgetKey`
- [x] Real-time token streaming via SSE (`/api/webchat/:key/stream`)
- [x] Agent → visitor push via Redis pub/sub + EventSource (`/events` endpoint)
- [x] Visitor name capture form (off / optional / required)
- [x] File & image uploads (PNG/JPEG/WEBP/GIF, ≤2 MB, Docker volume storage)
- [x] Typing indicators + read receipts (`Message.readAt`)
- [x] Offline mode (name + message, creates conversation with `aiEnabled=false`)
- [x] Connect AI engine via shared pipeline + buildSystemPrompt
- [x] Vision model — `gpt-4o-mini` sees uploaded images via base64 data URLs
- [x] Origin allowlist + per-key + per-IP rate limiting (Redis)
- [x] Dashboard: branding form, embed snippet copy, conversation polling, unread badge, mark-read on click

### Phase 10: WhatsApp Integration ✅
- [x] WhatsApp Business API setup via Whapi.cloud (QR-based session, no BSP approval needed)
- [x] Inbound message webhook handler (`/api/webhooks/whatsapp`)
- [x] Adapter: parses Whapi payload, sends via `gate.whapi.cloud/messages/text`
- [x] Connect AI engine via shared pipeline (same `handleInbound` as Messenger/Instagram)
- [x] Dashboard channel management UI (Channel ID + API Token)
- [ ] Rich media support (images, buttons, catalogues)
- [ ] Marketing outbound campaigns
- [ ] See `WHATSAPP.md` for integration guide

### Phase 12: Integrations ⬜
- [ ] HubSpot CRM sync
- [ ] Shopify order/customer data
- [ ] Xero invoicing
- [ ] Stripe billing
- [ ] Calendly booking
- [ ] Google Calendar
- [ ] Zapier webhooks

### Phase 13: Billing & Plans ⬜
- [ ] Stripe subscription integration
- [ ] Per-channel plan management (WhatsApp, Webchat, Social)
- [ ] Omnichannel upsell (+A$300/mo for all 4 channels)
- [ ] Usage tracking (conversations per channel, agents, funnels)
- [ ] Overage billing (per-plan rates: A$0.25 to A$0.05/conv)
- [ ] Prepaid packs (WA: 1,000 convs A$180)
- [ ] Invoice generation

### Phase 14: Compliance & Production ⬜
- [ ] Privacy Act 1988 (APPs, breach notification, data transparency)
- [ ] AI transparency disclosure (mandatory in AU)
- [ ] Meta Platform compliance (Instagram + Messenger API policies)
- [ ] Rate limiting
- [ ] Monitoring & logging
- [ ] Production deployment (Vercel / AWS)

---

## Quick Start

### Development
```bash
cd app
npm install
npm run dev
# Open http://localhost:3000
```

### Docker (full stack)
```bash
docker compose up --build
# App: http://localhost:3000
# DB: localhost:5432 (pumai/pumai_secret/pumai_db)
# Redis: localhost:6379
```

### Database
```bash
cd app
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to DB
npm run db:seed       # Seed sample data
npm run db:studio     # Open Prisma Studio
```

### Demo Login
- Email: `demo@pumai.com.au`
- Password: `password123`

---

## Tech Stack
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS v4
- **Auth:** NextAuth.js v5 (Credentials + Google)
- **Database:** PostgreSQL 16 + Prisma v7
- **Cache:** Redis 7
- **WhatsApp:** WhatsApp Business API via 360dialog/Twilio (planned)
- **Webchat:** Embeddable JS widget (live)
- **Social:** Instagram DMs + Facebook Messenger via Meta Graph API (live)
- **AI:** OpenAI GPT-4o Mini (vision-enabled for image attachments)
- **Deploy:** Docker / docker-compose

## Pricing (4 Channels)

**WhatsApp Plans** — Rich conversations (buttons, images, catalogues)
| Plan | Price | Setup | Conversations | Extra |
|------|-------|-------|---------------|-------|
| WA Starter | A$199/mo | A$500 | 500/mo | A$0.25/conv |
| WA Growth | A$449/mo | A$900 | 2,000/mo | A$0.20/conv |
| WA Enterprise | A$999+/mo | Custom | Unlimited | A$0.15/conv |

**Webchat Plans** — Instant support on your website
| Plan | Price | Setup | Sessions | Extra |
|------|-------|-------|----------|-------|
| Webchat Starter | A$99/mo | Free | 500/mo | A$0.10/session |
| Webchat Growth | A$249/mo | A$300 | 2,000/mo | A$0.08/session |
| Webchat Enterprise | A$599+/mo | Custom | Unlimited | A$0.05/session |

**Instagram Plans** — DMs, story mentions, comment-to-DM, product tags
| Plan | Price | Setup | Conversations | Extra |
|------|-------|-------|---------------|-------|
| Instagram Starter | A$129/mo | A$300 | 500/mo | A$0.20/conv |
| Instagram Growth | A$349/mo | A$600 | 2,000/mo | A$0.15/conv |
| Instagram Enterprise | A$799+/mo | Custom | Unlimited | A$0.10/conv |

**Messenger Plans** — Facebook Page messaging + sponsored campaigns
| Plan | Price | Setup | Conversations | Extra |
|------|-------|-------|---------------|-------|
| Messenger Starter | A$119/mo | A$300 | 500/mo | A$0.20/conv |
| Messenger Growth | A$329/mo | A$600 | 2,000/mo | A$0.15/conv |
| Messenger Enterprise | A$749+/mo | Custom | Unlimited | A$0.10/conv |

**Omnichannel:** +A$300/mo on any plan for all 4 channels

---

## Docs

- `WEBCHAT.md` — full webchat integration guide (config, embed, API, troubleshooting)
- `FACEBOOK_MESSENGER.md` — Messenger integration guide
- `WHATSAPP.md` — WhatsApp integration guide (via Whapi.cloud)
- `docs/integrations/instagram-status-2026-04-16.md` — Instagram status & blockers
- `TECHNICAL_DEBT.md` — live list of pending work across infra, product, security, compliance
