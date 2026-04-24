import bcrypt from "bcryptjs";
import { createCipheriv, randomBytes } from "crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function encryptSecret(plaintext: string): string {
  const raw = process.env.CHANNEL_CRED_KEY;
  if (!raw) throw new Error("CHANNEL_CRED_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("CHANNEL_CRED_KEY must decode to 32 bytes");
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `enc:v1:${Buffer.concat([iv, tag, enc]).toString("base64")}`;
}

async function main() {
  if (process.env.SEED_ALLOW !== "1") {
    console.log("⚠️  Seed refusing to run. Set SEED_ALLOW=1 to enable (dev only).");
    return;
  }
  const dbUrl = process.env.DATABASE_URL ?? "";
  const isLocalDb = /@(localhost|127\.0\.0\.1|postgres):/.test(dbUrl);
  if (!isLocalDb) {
    console.log("⚠️  Seed requires a local DATABASE_URL. Refusing.");
    return;
  }

  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("password123456", 12);

  // ─── Superadmin ───
  const admin = await prisma.user.upsert({
    where: { email: "admin@pumai.com.au" },
    update: { role: "SUPERADMIN" },
    create: {
      name: "Super Admin",
      email: "admin@pumai.com.au",
      password,
      onboarded: true,
      role: "SUPERADMIN",
    },
  });

  console.log("  ✓ Superadmin created (admin@pumai.com.au)");

  // ─── Demo User ───
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@pumai.com.au" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@pumai.com.au",
      password,
      onboarded: true,
    },
  });

  console.log("  ✓ Demo user created");

  // ─── PumAI Demo Business ───
  const business = await prisma.business.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: {
      name: "PumAI Demo",
      website: "https://pumai.com.au",
      industry: "Healthcare",
      phone: "+61 400 000 000",
      userId: demoUser.id,
    },
  });

  console.log("  ✓ Business created (PumAI Demo)");

  // ─── Demo subscriptions — all 4 channels at GROWTH, active ───
  const channels = ["WEBCHAT", "MESSENGER", "INSTAGRAM", "WHATSAPP"] as const;
  for (const channel of channels) {
    await prisma.subscription.upsert({
      where: { businessId_channel: { businessId: business.id, channel } },
      update: { tier: "GROWTH", stripeStatus: "active" },
      create: { businessId: business.id, channel, tier: "GROWTH", stripeStatus: "active" },
    });
  }
  console.log("  ✓ Demo subscriptions active (GROWTH × 4 channels)");

  // ─── Members ───
  for (const m of [
    { userId: demoUser.id, businessId: business.id, role: "OWNER" as const },
    { userId: admin.id, businessId: business.id, role: "ADMIN" as const },
  ]) {
    await prisma.businessMember.upsert({
      where: { userId_businessId: { userId: m.userId, businessId: m.businessId } },
      update: {},
      create: m,
    });
  }

  console.log("  ✓ Members created");

  // ─── Agents ───
  const agentData = [
    {
      name: "Sam",
      tone: "PROFESSIONAL" as const,
      status: "ACTIVE" as const,
      industry: "Healthcare",
      systemPrompt: `You are Sam, the virtual receptionist for Sydney Harbour Medical Centre, a multi-disciplinary GP clinic in Circular Quay, Sydney.

ROLE & RESPONSIBILITIES:
- Book, reschedule, and cancel patient appointments
- Answer questions about clinic services, opening hours, and location
- Provide pre-appointment instructions (fasting, what to bring)
- Triage urgency: redirect emergencies to 000, after-hours to 13SICK (13 7425)
- Collect patient details (name, DOB, Medicare number, reason for visit)

BEHAVIOUR RULES:
- Always be empathetic, professional, and concise (chat format: 1-3 sentences)
- NEVER provide medical diagnoses, medication advice, or interpret test results
- If the patient describes an emergency (chest pain, difficulty breathing, severe bleeding), immediately say: "This sounds like an emergency. Please call 000 right away."
- For after-hours queries, direct to 13SICK or nearest emergency department
- If you cannot help, offer to transfer to a human staff member
- Use Australian English (organisation, colour, favour)
- Confirm all bookings with: date, time, doctor name, and "please arrive 10 min early"

ESCALATION TRIGGERS (transfer to human):
- Patient is upset or requests to speak to a person
- Billing disputes or insurance claims
- Complex medical questions beyond scheduling
- Complaints about care received`,
      knowledgeBase: `# Sydney Harbour Medical Centre

## Contact & Location
- Address: Level 3, 55 George Street, Circular Quay NSW 2000
- Phone: (02) 9251 0000
- Email: reception@sydneyharbourmedical.com.au

## Opening Hours
- Monday to Friday: 8:00 AM - 6:00 PM
- Saturday: 9:00 AM - 1:00 PM
- Sunday & Public Holidays: Closed
- After-hours: Call 13SICK (13 7425) or visit nearest ED

## Doctors & Availability
- Dr. Emily Chen (GP, Women's Health) — Mon, Wed, Fri
- Dr. Rajesh Patel (GP, Chronic Disease Management) — Mon to Fri
- Dr. Sarah O'Brien (GP, Paediatrics, Skin Checks) — Tue, Thu, Sat
- Dr. James Wong (GP, Mental Health, Men's Health) — Mon, Wed, Thu

## Services & Fees
- Standard GP Consult (15 min): $85 | Medicare rebate: $41.40
- Long Consult (30 min): $160 | Medicare rebate: $80.10
- Skin Check (full body): $120 | Medicare rebate: $41.40
- Mental Health Care Plan: $160 (bulk-billed for concession card holders)
- Vaccination (excl. vaccine cost): $30 administration fee

## Cancellation Policy
- 24 hours notice required
- Less than 4 hours notice or no-show: $50 fee applies`,
    },
    {
      name: "Alex",
      tone: "FRIENDLY" as const,
      status: "ACTIVE" as const,
      industry: "Real Estate",
      systemPrompt: `You are Alex, a virtual property assistant for Harbour View Realty, a boutique real estate agency specialising in Sydney's Eastern Suburbs and Inner West.

ROLE & RESPONSIBILITIES:
- Help buyers and renters find properties that match their criteria
- Answer questions about listings, suburbs, pricing, and market conditions
- Schedule property inspections and open home visits
- Qualify leads by collecting: budget, preferred suburbs, bedrooms, timeline

BEHAVIOUR RULES:
- Be warm, enthusiastic, and genuinely helpful
- Keep responses concise for chat (1-3 sentences)
- NEVER guarantee property values, investment returns, or auction outcomes
- If asked for legal or financial advice, direct to their solicitor or mortgage broker

ESCALATION TRIGGERS (transfer to human):
- Buyer wants to make a formal offer or bid at auction
- Contract or settlement questions
- Complaints about a property or inspection experience`,
      knowledgeBase: `# Harbour View Realty

## Current Listings — For Sale
- 12/88 Campbell Parade, Bondi Beach — 3 Bed, $2,150,000
- 45 Bourke Street, Surry Hills — 2 Bed Terrace, $1,480,000
- 18 Glenmore Road, Paddington — 4 Bed Victorian, $3,200,000 (Auction)
- 7/22 Illawarra Road, Marrickville — 2 Bed Unit, $820,000
- 91 Avoca Street, Randwick — 3 Bed House, $2,400,000

## Current Listings — For Rent
- 5/110 King Street, Newtown — 2 Bed, $650/week
- 3/8 Ashmore Street, Erskineville — 1 Bed, $520/week

## Suburb Guide (Median Prices 2024)
| Suburb | House | Unit |
|--------|-------|------|
| Bondi Beach | $3.5M | $1.4M |
| Surry Hills | $2.2M | $1.0M |
| Paddington | $3.0M | $1.1M |
| Marrickville | $1.8M | $780K |
| Newtown | $1.9M | $820K |`,
    },
    {
      name: "Jordan",
      tone: "CASUAL" as const,
      status: "ACTIVE" as const,
      industry: "Automotive",
      systemPrompt: `You are Jordan, the virtual assistant for Prestige Motors Sydney, a multi-brand car dealership in Parramatta, Western Sydney.

ROLE & RESPONSIBILITIES:
- Help customers book test drives and service appointments
- Answer questions about vehicle inventory, pricing, and features
- Provide trade-in estimates (ballpark ranges, not binding quotes)
- Explain finance and warranty options at a high level

BEHAVIOUR RULES:
- Be relaxed, approachable, and down-to-earth — like a mate who knows cars
- Keep it short for chat (1-3 sentences), use casual Australian slang where natural
- Always recommend the customer comes in for final pricing and trade-in valuation
- NEVER lock in exact prices or finance rates via chat

ESCALATION TRIGGERS (transfer to human):
- Customer wants to negotiate final price or sign finance docs
- Warranty or lemon law claims
- Complaints about service quality`,
      knowledgeBase: `# Prestige Motors Sydney

## Current Inventory
| Model | Price (drive-away) |
|-------|--------------------|
| Toyota Camry Ascent | $38,990 |
| Toyota RAV4 GXL Hybrid | $47,500 |
| Mazda CX-5 Touring | $42,990 |
| Hyundai Tucson Elite | $46,500 |
| BYD Atto 3 Extended | $47,381 |

## Trade-In Guide (Ballpark)
- 2020-2023 Toyota Corolla: $18,000 - $26,000
- 2020-2023 Hilux: $35,000 - $55,000
- 2020-2023 Mazda 3: $17,000 - $25,000

## Service Pricing
- Logbook Service (minor): $299 - $399
- Logbook Service (major): $499 - $699
- Brake Pad Replacement: $350 - $450
- Loan Car: Free with major service`,
    },
    {
      name: "Support Bot",
      tone: "PROFESSIONAL" as const,
      status: "PAUSED" as const,
      industry: "E-commerce & Retail",
      systemPrompt: `You are the customer support assistant for Koala & Co, an Australian online retailer specialising in premium homewares and gifts.

ROLE & RESPONSIBILITIES:
- Help customers track orders and delivery status
- Process return and exchange requests
- Answer product questions (sizing, materials, availability)
- Resolve common issues (wrong item, damaged delivery, discount codes)

BEHAVIOUR RULES:
- Be polite, efficient, and solution-oriented
- Keep responses concise (chat format, 1-3 sentences)
- For returns: confirm order number, reason, and preferred resolution
- NEVER share customer data or process payments via chat

ESCALATION TRIGGERS (transfer to human):
- Refund over $200
- Third attempt to resolve same issue
- Legal threats or chargeback mentions`,
      knowledgeBase: `# Koala & Co

## Shipping
- Standard: 3-5 business days, FREE on orders over $80
- Express: 1-2 business days, $14.95

## Returns
- 30-day returns from delivery date
- Items must be unused, in original packaging
- Refunds processed within 5 business days
- Sale items: exchange or store credit only`,
    },
    {
      name: "Bookings",
      tone: "FRIENDLY" as const,
      status: "DRAFT" as const,
      industry: "Hospitality",
      systemPrompt: `You are the booking assistant for The Rocks Kitchen & Bar, a modern Australian restaurant and cocktail bar in The Rocks, Sydney.

ROLE & RESPONSIBILITIES:
- Take and modify table reservations
- Answer questions about the menu, dietary options, and specials
- Assist with private event and function enquiries

BEHAVIOUR RULES:
- Be warm, welcoming, and enthusiastic
- When booking, collect: name, date, time, number of guests, special requests
- For groups over 10, direct to events team
- NEVER guarantee specific table locations — note as "request"

ESCALATION TRIGGERS (transfer to human):
- Function/event bookings over 10 guests
- Complaints about dining experience
- Gift voucher disputes`,
      knowledgeBase: `# The Rocks Kitchen & Bar

## Opening Hours
- Lunch: Wed-Sun 12:00 PM - 3:00 PM
- Dinner: Tue-Sat 5:30 PM - 10:00 PM
- Bar: Tue-Sat 4:00 PM - 12:00 AM
- Closed: Monday

## Menu Highlights
- Sydney Rock Oysters (6 pcs) — $28
- Grilled Wagyu Scotch Fillet (300g) — $59
- Pan-seared Barramundi — $42
- Mushroom & Truffle Risotto (V) — $34
- Sticky Date Pudding — $18

## Specials
- Tuesday: $1 oysters with any main
- Wednesday Lunch: 2-course set menu $45pp
- Thursday: Half-price selected wines

## Private Events
- Private dining room: 10-20 guests
- Set menu: 3-course $89pp or 4-course $109pp
- Drinks packages: from $59pp`,
    },
  ];

  const existingAgents = await prisma.agent.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "asc" },
  });

  let agents = existingAgents;

  if (existingAgents.length === 0) {
    agents = await Promise.all(
      agentData.map((a) =>
        prisma.agent.create({
          data: { ...a, businessId: business.id },
        }),
      ),
    );
    console.log("  ✓ Agents created");
  } else {
    for (let i = 0; i < Math.min(existingAgents.length, agentData.length); i++) {
      await prisma.agent.update({
        where: { id: existingAgents[i].id },
        data: {
          systemPrompt: agentData[i].systemPrompt,
          knowledgeBase: agentData[i].knowledgeBase,
        },
      });
    }
    console.log("  ✓ Agents updated");
  }

  // ─── Demo webchat widget for landing page ───
  const webchatCredentials = encryptSecret(
    JSON.stringify({
      branding: {
        primaryColor: "#8B5CF6",
        title: "PumAI",
        welcomeMessage: "Hi! Ask me anything about PumAI.",
        position: "right",
        collectVisitor: "off",
        offlineMode: "off",
      },
      allowedOrigins: [
        "http://localhost:3000",
        "http://localhost:3002",
        "https://pumai.com.au",
      ],
    }),
  );
  await prisma.channelConfig.upsert({
    where: { businessId_channel: { businessId: business.id, channel: "WEBCHAT" } },
    create: {
      businessId: business.id,
      channel: "WEBCHAT",
      externalId: "wk_pumai_landing",
      credentials: webchatCredentials,
      agentId: agents[0].id,
      active: true,
    },
    update: {
      externalId: "wk_pumai_landing",
      credentials: webchatCredentials,
      agentId: agents[0].id,
      active: true,
    },
  });
  console.log("  ✓ Webchat widget created (wk_pumai_landing)");

  console.log("\n✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
