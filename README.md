# PumAI — SMS & WhatsApp AI Agents for Australian Businesses

AI-powered conversational agents that automate sales, support, and marketing for Australian SMEs via SMS (Cellcast) and WhatsApp Business API, powered by GPT-4o Mini.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **Database:** PostgreSQL + Prisma 7
- **Auth:** NextAuth v5 (Credentials + Google)
- **Runtime:** Node.js / React 19

## Project Structure

```
app/
├── prisma/
│   ├── schema.prisma        # Data models (User, Business, Agent, Conversation, Message, SmsNumber)
│   └── seed.ts              # Seed data for development
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing page (public)
│   │   ├── layout.tsx        # Root layout
│   │   ├── (auth)/           # Auth pages (login, register, forgot-password)
│   │   ├── (app)/
│   │   │   ├── onboarding/   # 4-step onboarding flow
│   │   │   └── dashboard/    # Main app (overview, conversations, agents, analytics, settings)
│   │   └── api/auth/         # NextAuth API routes + registration endpoint
│   ├── components/
│   │   ├── Navbar.tsx        # Fixed navbar with smooth scroll
│   │   ├── Hero.tsx          # Landing hero with particles
│   │   ├── Features.tsx      # 6 feature cards (dual-channel, AI, integrations, etc.)
│   │   ├── HowItWorks.tsx    # 4-step timeline
│   │   ├── Pricing.tsx       # Dual-channel pricing (SMS + WhatsApp tabs, 6 plans)
│   │   ├── Industries.tsx    # 6 target verticals with priority badges
│   │   ├── LogoCarousel.tsx  # Infinite scroll integration logos
│   │   ├── CTA.tsx           # Final call-to-action
│   │   ├── Footer.tsx        # Links + compliance info
│   │   ├── Particles.tsx     # Canvas particle animation
│   │   ├── ScrollReveal.tsx  # Intersection Observer fade-in wrapper
│   │   └── dashboard/        # Sidebar + TopBar for the dashboard
│   ├── auth.ts               # NextAuth config (JWT, credentials, Google)
│   ├── middleware.ts          # Route protection (dashboard, onboarding)
│   ├── lib/
│   │   ├── prisma.ts         # Prisma client singleton
│   │   └── seed.ts           # Mock data for dashboard UI
│   └── generated/prisma/     # Prisma generated client
├── public/
│   └── logo.png              # App logo
└── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Setup

```bash
# 1. Install dependencies
cd app
npm install

# 2. Configure environment
cp .env .env.local
# Edit .env.local with your values:
#   DATABASE_URL="postgresql://user:pass@localhost:5432/pumai"
#   AUTH_SECRET="your-secret-key"
#   GOOGLE_CLIENT_ID="..."       (optional, for Google OAuth)
#   GOOGLE_CLIENT_SECRET="..."   (optional)

# 3. Generate Prisma client & push schema
npm run db:generate
npm run db:push

# 4. (Optional) Seed the database
npm run db:seed

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio (visual DB editor) |

## Data Models

- **User** — Auth, profile, onboarding state
- **Business** — Company info, plan (Starter/Growth/Enterprise), timezone
- **Agent** — AI agent config (name, tone, system prompt, knowledge base, status)
- **SmsNumber** — Dedicated Australian virtual numbers
- **Conversation** — Contact threads with status + sentiment tracking
- **Message** — Individual messages (user/agent/system roles)

## Pricing Model (Dual-Channel)

**SMS Plans** (universal reach, 98% open rate):
- Starter: A$299/mo (300 convs)
- Growth: A$649/mo (1,000 convs)
- Enterprise: A$1,499+/mo (4,000 convs)

**WhatsApp Plans** (rich media, buttons, catalogues):
- Starter: A$199/mo (500 convs)
- Growth: A$449/mo (2,000 convs)
- Enterprise: A$999+/mo (unlimited)

**Omnichannel upgrade:** +A$200/mo for both channels.

## App Flow

1. **Landing page** (`/`) — Public marketing site with features, pricing, industries
2. **Register** (`/register`) — Create account with email/password or Google
3. **Onboarding** (`/onboarding`) — 4 steps: business info, industry, agent config, SMS number
4. **Dashboard** (`/dashboard`) — KPIs, conversation chart, sentiment, recent conversations
   - `/dashboard/conversations` — All conversation threads
   - `/dashboard/agents` — Manage AI agents
   - `/dashboard/analytics` — Performance metrics
   - `/dashboard/settings` — Account & business settings

## Compliance

- Spam Act 2003 (consent, opt-out, sender ID)
- Privacy Act 1988 (APPs, breach notification)
- ACMA SMS Sender ID Register
- AI disclosure to end users
