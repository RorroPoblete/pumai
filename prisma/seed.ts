import bcrypt from "bcryptjs";
import path from "path";

// Resolve generated client from project root
const clientPath = path.join(__dirname, "..", "src", "generated", "prisma");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = require(clientPath);

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("password123", 12);

  // ─── Users ───
  const user1 = await prisma.user.upsert({
    where: { email: "demo@pumai.com.au" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@pumai.com.au",
      password,
      onboarded: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "sarah@acmehealth.com.au" },
    update: {},
    create: {
      name: "Sarah Mitchell",
      email: "sarah@acmehealth.com.au",
      password,
      onboarded: true,
    },
  });

  console.log("  ✓ Users created");

  // ─── Businesses ───
  const business1 = await prisma.business.upsert({
    where: { userId: user1.id },
    update: {},
    create: {
      name: "PumAI Demo",
      website: "https://pumai.com.au",
      industry: "Healthcare",
      phone: "+61 400 000 000",
      plan: "GROWTH",
      userId: user1.id,
    },
  });

  await prisma.business.upsert({
    where: { userId: user2.id },
    update: {},
    create: {
      name: "Acme Health Pty Ltd",
      website: "https://acmehealth.com.au",
      industry: "Healthcare",
      phone: "+61 412 345 678",
      plan: "STARTER",
      userId: user2.id,
    },
  });

  console.log("  ✓ Businesses created");

  // ─── SMS Numbers ───
  const smsNumber1 = await prisma.smsNumber.upsert({
    where: { number: "+61280001234" },
    update: {},
    create: { number: "+61280001234", businessId: business1.id },
  });

  console.log("  ✓ SMS numbers created");

  // ─── Agents ───
  const agents = await Promise.all([
    prisma.agent.create({
      data: {
        name: "Sam", tone: "PROFESSIONAL", status: "ACTIVE", industry: "Healthcare",
        systemPrompt: "You are Sam, a professional medical receptionist AI for a healthcare clinic in Sydney.",
        businessId: business1.id,
      },
    }),
    prisma.agent.create({
      data: {
        name: "Alex", tone: "FRIENDLY", status: "ACTIVE", industry: "Real Estate",
        systemPrompt: "You are Alex, a friendly real estate assistant helping buyers find properties in Sydney.",
        businessId: business1.id,
      },
    }),
    prisma.agent.create({
      data: {
        name: "Jordan", tone: "CASUAL", status: "ACTIVE", industry: "Automotive",
        systemPrompt: "You are Jordan, a laid-back car dealership assistant helping customers with test drives.",
        businessId: business1.id,
      },
    }),
    prisma.agent.create({
      data: {
        name: "Support Bot", tone: "PROFESSIONAL", status: "PAUSED", industry: "E-commerce & Retail",
        systemPrompt: "You are a support assistant for an e-commerce store.",
        businessId: business1.id,
      },
    }),
    prisma.agent.create({
      data: {
        name: "Bookings", tone: "FRIENDLY", status: "DRAFT", industry: "Hospitality",
        businessId: business1.id,
      },
    }),
  ]);

  console.log("  ✓ Agents created");

  // ─── Conversations ───
  const convos = [
    { name: "Sarah Mitchell", phone: "+61412345678", status: "ACTIVE", sentiment: "POSITIVE", agent: 0,
      msgs: [
        { c: "Hi, I'd like to book a dental check-up please.", r: "USER" },
        { c: "Hi Sarah! We have availability Thursday at 2pm or Friday at 10am. Which works?", r: "AGENT" },
        { c: "Thursday at 2pm works perfectly.", r: "USER" },
      ],
    },
    { name: "James Cooper", phone: "+61423456789", status: "ACTIVE", sentiment: "POSITIVE", agent: 1,
      msgs: [
        { c: "Hey, I saw your listing for the 3-bed in Bondi. Still available?", r: "USER" },
        { c: "Hi James! Yes, the 3-bedroom in Bondi is still available at $1.2M. Want to inspect?", r: "AGENT" },
        { c: "Can you send me photos of the 3-bedroom in Bondi?", r: "USER" },
      ],
    },
    { name: "Emily Watson", phone: "+61434567890", status: "RESOLVED", sentiment: "POSITIVE", agent: 2,
      msgs: [
        { c: "Hi, I'm interested in test driving the new Camry.", r: "USER" },
        { c: "Hey Emily! Great choice. We've got slots Saturday morning or afternoon.", r: "AGENT" },
        { c: "Perfect, I'll come in Saturday for the test drive. Thanks!", r: "USER" },
      ],
    },
    { name: "Michael Brown", phone: "+61445678901", status: "ESCALATED", sentiment: "NEGATIVE", agent: 0,
      msgs: [
        { c: "I've been charged twice for my last visit. This is unacceptable.", r: "USER" },
        { c: "I'm sorry about the billing issue. Let me connect you with our billing team.", r: "AGENT" },
        { c: "I need to speak with a real person about my billing issue.", r: "USER" },
      ],
    },
    { name: "Lisa Chen", phone: "+61456789012", status: "ACTIVE", sentiment: "NEUTRAL", agent: 1,
      msgs: [
        { c: "What's the price range for apartments in Surry Hills?", r: "USER" },
        { c: "In Surry Hills, 2-bed is $800K-$1.1M, 3-bed is $1.2M-$1.8M. Want listings?", r: "AGENT" },
      ],
    },
    { name: "David Turner", phone: "+61467890123", status: "RESOLVED", sentiment: "POSITIVE", agent: 2,
      msgs: [
        { c: "Got a reminder about my service. How do I book?", r: "USER" },
        { c: "Hey David! Book online or I can do it now. Tuesday or Wednesday?", r: "AGENT" },
        { c: "Got it, thanks. I'll book online.", r: "USER" },
      ],
    },
    { name: "Rachel Kim", phone: "+61478901234", status: "ACTIVE", sentiment: "NEUTRAL", agent: 0,
      msgs: [
        { c: "Do you have any availability this afternoon for a check-up?", r: "USER" },
      ],
    },
    { name: "Tom O'Brien", phone: "+61489012345", status: "RESOLVED", sentiment: "POSITIVE", agent: 1,
      msgs: [
        { c: "I'd like to view the property on George St.", r: "USER" },
        { c: "Hi Tom! Inspection times Saturday at 11am and 2pm. Which works?", r: "AGENT" },
        { c: "Thanks, the inspection on Saturday works for me.", r: "USER" },
      ],
    },
  ];

  for (const conv of convos) {
    await prisma.conversation.create({
      data: {
        contactName: conv.name,
        contactPhone: conv.phone,
        status: conv.status,
        sentiment: conv.sentiment,
        messagesCount: conv.msgs.length,
        businessId: business1.id,
        agentId: agents[conv.agent].id,
        smsNumberId: smsNumber1.id,
        messages: {
          create: conv.msgs.map((m, i) => ({
            content: m.c,
            role: m.r,
            createdAt: new Date(Date.now() - (convos.length - i) * 60000),
          })),
        },
      },
    });
  }

  console.log("  ✓ Conversations & messages created");
  console.log("\n✅ Seed completed!");
  console.log("📧 Demo login: demo@pumai.com.au / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
