// ─── Create/update the PumAI self-agent and point wk_pumai_landing at it ───
// Idempotent. Run with cloud-sql-proxy:
//
//   DATABASE_URL="postgresql://pumai:$DB_PWD@localhost:15433/pumai" \
//   ADMIN_EMAIL="admin@pumai.com.au" \
//   npx tsx prisma/prod-pumai-agent.ts

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const AGENT_NAME = "PumAI Assistant";

const SYSTEM_PROMPT = `You are PumAI Assistant, the virtual sales & support agent for PumAI — the company whose website you are embedded on (https://pumai.com.au).

PumAI sells AI-powered conversational agents to Australian SMBs. Agents handle sales, support, lead qualification, bookings, and FAQs across WhatsApp, Webchat, Instagram DMs, and Facebook Messenger, 24/7, in Australian English.

ROLE & RESPONSIBILITIES:
- Explain what PumAI does, the channels it supports, and typical use cases
- Walk prospects through pricing (Starter / Growth / Enterprise, per channel)
- Answer questions about setup fees, conversation limits, add-on pricing, and the omnichannel bundle
- Qualify leads: business name, industry, website, which channel(s) they want, expected volume
- Help them get started: direct them to /register to create an account, or to book a demo via the Contact page
- Escalate to a human (say "I'll pass this on to someone who can help") when the question is outside scope

BEHAVIOUR RULES:
- Always warm, professional, concise — 1 to 3 sentences per reply, chat style
- Use Australian English (organisation, optimise, colour)
- Prices in AUD, tax inclusive (GST)
- NEVER invent features or integrations that aren't listed below
- NEVER promise specific ROI numbers, uptime, or contractual terms — defer to sales/legal
- If the user asks something you don't know, say so honestly and offer to connect them with the team

ESCALATION TRIGGERS (hand off to a human):
- Negotiation on pricing, contracts, custom enterprise deals
- Data residency / compliance questions beyond what's published
- Integration requests for platforms not on the supported list
- Complaints, refund requests, legal enquiries
- Multi-brand or multi-tenant agency setups`;

const KNOWLEDGE_BASE = `# PumAI — Product Knowledge Base

## What PumAI is
PumAI is an omnichannel AI agent platform for Australian SMBs. Each agent is configured once and can answer messages across WhatsApp Business, website chat (our embeddable widget), Instagram Direct, and Facebook Messenger.

Every agent has a name, a tone (Professional / Friendly / Casual), a system prompt, and a knowledge base — the business edits these from the dashboard. Conversations, visitor info, AI-handoff state, and escalation flags are stored per-business; there is no cross-tenant visibility.

## Supported channels
- **Webchat** — embeddable widget, one line of JavaScript
- **WhatsApp Business** — via the official Cloud API (we handle onboarding)
- **Instagram Direct Messages** — for Meta-verified business pages
- **Facebook Messenger** — for business pages

## Pricing (AUD, monthly, GST included)

### Webchat
| Tier | Monthly | Conversations / month | Setup fee |
|---|---|---|---|
| Starter | $99 | 500 | Free |
| Growth | $299 | 2,000 | $300 |
| Scale | $599 | 10,000 | Custom |

### WhatsApp Business
| Tier | Monthly | Conversations / month | Setup fee |
|---|---|---|---|
| Starter | $199 | 500 | $500 |
| Growth | $499 | 2,000 | $900 |
| Scale | $899 | 10,000 | Custom |

### Instagram DMs
| Tier | Monthly | Conversations / month | Setup fee |
|---|---|---|---|
| Starter | $129 | 500 | $300 |
| Growth | $349 | 2,000 | $600 |
| Scale | $699 | 10,000 | Custom |

### Messenger
| Tier | Monthly | Conversations / month | Setup fee |
|---|---|---|---|
| Starter | $129 | 500 | $300 |
| Growth | $349 | 2,000 | $600 |
| Scale | $699 | 10,000 | Custom |

### Enterprise (contact sales)
For volumes above 10,000 conversations/month, multi-brand portfolios, custom SLAs, dedicated account manager, and compliance needs (SOC 2, ISO 27001, data residency). Priced per engagement. Direct prospects to the Contact page or offer to connect them with the PumAI team.

### Omnichannel bundle
Add WhatsApp + Webchat + Instagram + Messenger on top of any plan for **+$300/month**, with a single $350 one-off bundle setup fee (replaces the per-channel setup fees). Best value for businesses that already want the full coverage.

### Add-on channel (existing customers)
$350/month per extra channel on top of an existing subscription, 2,000 conversations each.

## Features (included on all paid tiers)
- Unlimited AI agents per business (limited only by plan quota for ACTIVE agents)
- Per-business knowledge base you control, no external training data required
- Real-time conversation streaming (server-sent events) in the dashboard
- Automatic sentiment + escalation detection, with configurable triggers
- Handoff to a human: pause the AI per-conversation, reply from the dashboard
- Webhook signature verification (Meta HMAC, Stripe) — no forged messages can reach you
- TOTP two-factor auth on operator logins, recovery codes, login rate-limiting
- Uploaded images delivered via short-lived HMAC-signed URLs
- AES-256-GCM envelope encryption of third-party channel credentials at rest
- Stripe-powered billing with self-serve portal for card / plan changes

## Typical use cases we sell into
- GP clinics and allied health — 24/7 appointment booking, triage
- Real-estate agencies — inspection scheduling, lead capture
- Car dealerships — test drive booking, trade-in enquiries
- E-commerce / retail — order tracking, returns, product questions
- Hospitality — reservations, menus, private events

## Getting started
1. Prospect visits https://pumai.com.au
2. Creates an account at /register (email + password, or Google OAuth)
3. 2FA setup is strongly recommended at first login
4. Picks a channel + tier, pays via Stripe Checkout
5. We connect the channel (for WhatsApp / Meta channels we help with the Meta / WhatsApp Business verification)
6. They configure their first agent in the dashboard — system prompt, knowledge base, tone
7. They paste the widget snippet on their site (webchat) or link the social pages

Typical onboarding: 24-72 hours for webchat, 3-5 business days for WhatsApp (depends on Meta review).

## What to say when you don't know
"Good question — I don't have that detail in my playbook. Want me to pass it to the PumAI team? They usually reply within a business day."

## Contact
- Website: https://pumai.com.au
- Sales & support: via the Contact page on the website
- Business location: Australia (Sydney focus, servicing nationwide)
`;

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) throw new Error("ADMIN_EMAIL is not set");

  const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!admin) throw new Error(`Admin ${adminEmail} not found`);

  const business = await prisma.business.findUnique({ where: { userId: admin.id } });
  if (!business) throw new Error("PumAI business not found — run prod-bootstrap first");

  // Upsert the PumAI agent (unique by (businessId, name))
  const existing = await prisma.agent.findFirst({
    where: { businessId: business.id, name: AGENT_NAME },
  });

  const agentData = {
    name: AGENT_NAME,
    tone: "FRIENDLY" as const,
    status: "ACTIVE" as const,
    industry: "Technology",
    systemPrompt: SYSTEM_PROMPT,
    knowledgeBase: KNOWLEDGE_BASE,
    businessId: business.id,
  };

  let agent;
  if (existing) {
    agent = await prisma.agent.update({
      where: { id: existing.id },
      data: {
        tone: agentData.tone,
        status: agentData.status,
        industry: agentData.industry,
        systemPrompt: agentData.systemPrompt,
        knowledgeBase: agentData.knowledgeBase,
      },
    });
    console.log(`  ✓ Agent updated: ${agent.name} (${agent.id})`);
  } else {
    agent = await prisma.agent.create({ data: agentData });
    console.log(`  ✓ Agent created: ${agent.name} (${agent.id})`);
  }

  // Point the landing widget at the PumAI agent
  const updated = await prisma.channelConfig.updateMany({
    where: { businessId: business.id, channel: "WEBCHAT", externalId: "wk_pumai_landing" },
    data: { agentId: agent.id },
  });
  console.log(`  ✓ Widget wk_pumai_landing → ${agent.name} (rows affected: ${updated.count})`);

  console.log("\n✅ Done.");
}

main()
  .catch((e) => {
    console.error("❌ Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
