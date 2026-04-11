# PumAI — Omnichannel AI Agents for Australian Business

## Project Status

### Phase 1: Landing & Config ✅
- [x] Next.js 16 + TypeScript + Tailwind v4 setup
- [x] Design system (dark theme, violet #8B5CF6, glassmorphism, Inter font)
- [x] Landing page (Navbar, Hero w/ particles, Features, How It Works, Dual-Channel Pricing, Industries, CTA, Footer)
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
- [x] Onboarding wizard (4 steps: business info, industry, agent config, SMS number)
- [x] Middleware (protected routes, auth redirects)

### Phase 3: Dashboard ✅
- [x] Sidebar navigation (Overview, Conversations, Agents, Analytics, Settings)
- [x] Overview page (KPI cards, bar chart, sentiment breakdown, recent conversations table)
- [x] Conversations page (filterable list, search, status badges, sentiment dots)
- [x] AI Agents page (agent cards, status, tone, stats, hover actions)
- [x] Analytics page (KPIs, daily chart, donut chart, agent performance table)
- [x] Settings page (business info, SMS config, notification toggles, danger zone)
- [x] Seed data (5 agents, 8 conversations, metrics)

### Phase 4: Database & Docker ✅
- [x] Prisma v7 schema (User, Account, Session, Business, Agent, SmsNumber, Conversation, Message)
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

### Phase 8: Instagram DMs Integration ⬜
- [ ] Meta Graph API setup (Instagram Business Account)
- [ ] Inbound DM webhook handler (Instagram Messaging API)
- [ ] Auto-reply to story mentions and comments
- [ ] Rich media support (images, quick replies)
- [ ] Product tag integration (Instagram Shopping)
- [ ] 24-hour messaging window compliance
- [ ] Connect AI engine to Instagram inbound pipeline

### Phase 9: Webchat Integration ⬜
- [ ] Embeddable chat widget (JS snippet for any website)
- [ ] Custom branding (colours, logo, position, welcome message)
- [ ] Real-time WebSocket messaging
- [ ] Visitor identification (name, email capture form)
- [ ] File & image sharing
- [ ] Typing indicators and read receipts
- [ ] Offline mode (collect email, respond async)
- [ ] Connect AI engine to webchat pipeline

### Phase 10: WhatsApp Integration ⬜
- [ ] WhatsApp Business API setup (via 360dialog or Twilio)
- [ ] Inbound message webhook handler
- [ ] Rich media support (images, buttons, links, catalogues)
- [ ] Service conversations (user-initiated, free 24hr window)
- [ ] Marketing outbound (~US$0.04/msg, Rest of APAC rate)
- [ ] WhatsApp Business profile management
- [ ] Connect AI engine to WhatsApp inbound pipeline

### Phase 11: SMS Integration (Cellcast) ⬜
- [ ] Cellcast API integration (carrier directo: Telstra, Optus, Vodafone)
- [ ] Inbound SMS webhook handler
- [ ] Outbound SMS sending (2.8c AUD/SMS at 100K+ vol)
- [ ] Virtual number provisioning (AU dedicated numbers, A$15/mo)
- [ ] Delivery status tracking
- [ ] Conversation routing (agent selection)
- [ ] Connect AI engine to SMS inbound pipeline

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
- [ ] Per-channel plan management (SMS, WhatsApp, Webchat, Social)
- [ ] Omnichannel upsell (+A$350/mo for all 5 channels)
- [ ] Usage tracking (conversations per channel, agents, funnels)
- [ ] Overage billing (per-plan rates: A$0.60 to A$0.05/conv)
- [ ] Prepaid packs (SMS: 500 convs A$275, WA: 1,000 convs A$180)
- [ ] Invoice generation

### Phase 14: Compliance & Production ⬜
- [ ] Spam Act 2003 compliance (opt-in/opt-out, sender ID, multas hasta A$2.2M)
- [ ] Privacy Act 1988 (APPs, breach notification, data transparency)
- [ ] AI transparency disclosure (mandatory in AU)
- [ ] ACMA SMS Sender ID Register (mandatory before July 2026)
- [ ] Register as EMSP with ACMA (wholesale SMS ~1.5c via MTMO/Symbio)
- [ ] Cellcast compliance (ISO 27001, Industry Code C661:2022)
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
- **SMS:** Cellcast API (carrier directo AU, planned)
- **WhatsApp:** WhatsApp Business API via 360dialog/Twilio (planned)
- **Webchat:** Embeddable JS widget (planned)
- **Social:** Instagram DMs + Facebook Messenger via Meta Graph API (planned)
- **AI:** OpenAI GPT-4o Mini
- **Deploy:** Docker / docker-compose

## Pricing (5 Channels)

**SMS Plans** — Universal reach (98% open rate, 100% mobile coverage)
| Plan | Price | Setup | Conversations | Extra |
|------|-------|-------|---------------|-------|
| SMS Starter | A$299/mo | A$500 | 300/mo | A$0.60/conv |
| SMS Growth | A$649/mo | A$900 | 1,000/mo | A$0.55/conv |
| SMS Enterprise | A$1,499+/mo | Custom | 4,000/mo | A$0.45/conv |

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

**Instagram & Messenger Plans** — Social media engagement
| Plan | Price | Setup | Conversations | Extra |
|------|-------|-------|---------------|-------|
| Social Starter | A$149/mo | A$400 | 500/mo | A$0.20/conv |
| Social Growth | A$399/mo | A$700 | 2,000/mo | A$0.15/conv |
| Social Enterprise | A$899+/mo | Custom | Unlimited | A$0.10/conv |

**Omnichannel:** +A$350/mo on any plan for all 5 channels
