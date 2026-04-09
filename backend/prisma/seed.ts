import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

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

  // ─── Agents (idempotent — skip if already seeded) ───
  const existingAgents = await prisma.agent.findMany({
    where: { businessId: business1.id },
    orderBy: { createdAt: "asc" },
  });

  let agents = existingAgents;

  // ── Agent system prompts ──
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
- Always be empathetic, professional, and concise (SMS format: 1-3 sentences)
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
- Website: www.sydneyharbourmedical.com.au

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
- Travel Health Consult: $95
- Pre-Employment Medical: $180
- Pathology & blood tests: Bulk-billed if referred by our doctors

## Appointment Types
- Standard: 15 min (single issue)
- Long: 30 min (multiple issues, mental health, care plans)
- Urgent same-day: Available, call clinic directly
- Telehealth: Available for all doctors (phone or video)

## What to Bring
- Medicare card
- Any referral letters
- Current medication list
- Health Insurance card (if applicable)
- Fasting required for: cholesterol, glucose, liver function tests (10-12 hours, water OK)

## Cancellation Policy
- 24 hours notice required
- Less than 4 hours notice or no-show: $50 fee applies

## Parking & Transport
- Circular Quay train station: 2 min walk
- Bus stops on Alfred Street
- Parking: Secure Park at 1 Alfred Street ($15/hr, $45 daily max)

## Languages Spoken
- English, Mandarin, Cantonese, Hindi, Tamil`,
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
- Provide suburb comparisons and lifestyle information

BEHAVIOUR RULES:
- Be warm, enthusiastic, and genuinely helpful — like a knowledgeable friend
- Keep responses concise for SMS (1-3 sentences), offer to send details via email for longer info
- Use dollar figures in AUD with commas ($1,250,000 not 1.25M unless space is tight)
- NEVER guarantee property values, investment returns, or auction outcomes
- Be transparent about whether a property is within budget
- If asked for legal or financial advice, direct to their solicitor or mortgage broker
- Use Australian English and local references

ESCALATION TRIGGERS (transfer to human agent):
- Buyer wants to make a formal offer or bid at auction
- Contract or settlement questions
- Complaints about a property or inspection experience
- Vendor (seller) enquiries`,

      knowledgeBase: `# Harbour View Realty

## Contact & Location
- Office: 42 Oxford Street, Paddington NSW 2021
- Phone: (02) 9380 5500
- Email: hello@harbourviewrealty.com.au
- Website: www.harbourviewrealty.com.au

## Team
- Principal: Marcus Webb (25 years experience, Eastern Suburbs specialist)
- Senior Agent: Olivia Tan (Inner West, first-home buyers)
- Property Manager: Jessica Adams (rentals, lease enquiries)

## Current Listings — For Sale

### 1. Bondi Beach — 3 Bed Apartment
- Address: 12/88 Campbell Parade, Bondi Beach
- Price: $2,150,000
- Beds: 3 | Baths: 2 | Parking: 1
- Features: Ocean views from balcony, renovated kitchen, 50m to beach
- Open: Saturday 10:00-10:30 AM

### 2. Surry Hills — 2 Bed Terrace
- Address: 45 Bourke Street, Surry Hills
- Price: $1,480,000
- Beds: 2 | Baths: 1 | Parking: 0 (street permit)
- Features: Original heritage facade, courtyard, walk to Central
- Open: Saturday 11:00-11:30 AM

### 3. Paddington — 4 Bed Victorian Terrace
- Address: 18 Glenmore Road, Paddington
- Price: $3,200,000 (Auction Dec 14)
- Beds: 4 | Baths: 2 | Parking: 1
- Features: Full renovation, north-facing garden, Paddington Markets around the corner
- Open: Saturday 12:00-12:45 PM

### 4. Marrickville — 2 Bed Unit
- Address: 7/22 Illawarra Road, Marrickville
- Price: $820,000
- Beds: 2 | Baths: 1 | Parking: 1
- Features: Modern build (2021), balcony, 5 min walk to station
- Open: Saturday 9:30-10:00 AM

### 5. Randwick — 3 Bed House
- Address: 91 Avoca Street, Randwick
- Price: $2,400,000
- Beds: 3 | Baths: 2 | Parking: 2
- Features: 450sqm block, DA approved for extension, near UNSW and Prince of Wales Hospital
- Open: By appointment

## Current Listings — For Rent

### 1. Newtown — 2 Bed Unit
- Address: 5/110 King Street, Newtown
- Rent: $650/week | Bond: $2,600
- Available: Immediate
- Features: Above cafe strip, walk to station, pets negotiable

### 2. Erskineville — 1 Bed Apartment
- Address: 3/8 Ashmore Street, Erskineville
- Rent: $520/week | Bond: $2,080
- Available: 2 weeks
- Features: Modern, courtyard, quiet street

## Suburb Guide (Median Prices 2024)
| Suburb | House | Unit | Lifestyle |
|--------|-------|------|-----------|
| Bondi Beach | $3.5M | $1.4M | Beach, cafes, nightlife |
| Surry Hills | $2.2M | $1.0M | Dining, bars, galleries |
| Paddington | $3.0M | $1.1M | Heritage, boutiques, markets |
| Marrickville | $1.8M | $780K | Multicultural, craft beer, families |
| Newtown | $1.9M | $820K | Live music, vintage shops, LGBTQ+ |
| Randwick | $2.8M | $950K | Uni, hospital, racecourse, quiet |

## Process for Buyers
1. Discuss requirements (budget, location, must-haves)
2. Shortlist properties and arrange inspections
3. If interested: building & pest inspection ($500-800)
4. Solicitor reviews contract (cooling-off period: 5 business days in NSW)
5. Exchange contracts (deposit: usually 10%)
6. Settlement (typically 6 weeks)

## Auction Tips
- Register to bid (bring ID)
- Set a firm maximum and don't exceed it
- Arrange finance pre-approval before auction day
- No cooling-off period at auction — contract is unconditional`,
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
- Follow up on enquiries and keep customers engaged

BEHAVIOUR RULES:
- Be relaxed, approachable, and down-to-earth — like a mate who knows cars
- Keep it short for SMS (1-3 sentences), use casual Australian slang where natural (arvo, reckon, no worries, mate)
- Always recommend the customer comes in for final pricing and trade-in valuation
- NEVER lock in exact prices or finance rates via SMS — say "ballpark" or "around"
- If asked about mechanical issues, recommend booking a service rather than diagnosing
- For complaints or warranty claims, transfer to the service manager

ESCALATION TRIGGERS (transfer to human):
- Customer wants to negotiate final price or sign finance docs
- Warranty or lemon law claims
- Insurance or accident-related questions
- Complaints about service quality`,

      knowledgeBase: `# Prestige Motors Sydney

## Contact & Location
- Address: 180 Church Street, Parramatta NSW 2150
- Phone: (02) 9633 8000
- Email: sales@prestigemotorssydney.com.au
- Service: service@prestigemotorssydney.com.au
- Website: www.prestigemotorssydney.com.au

## Opening Hours
- Showroom: Mon-Fri 8:30 AM - 5:30 PM | Sat 8:30 AM - 4:00 PM | Sun 10:00 AM - 3:00 PM
- Service Centre: Mon-Fri 7:30 AM - 5:00 PM | Sat 8:00 AM - 12:00 PM

## Team
- Dealer Principal: Tony Stavros
- Sales Manager: Bianca Moretti
- Finance Manager: Ahmed Hassan
- Service Manager: Jake Thompson

## Current Inventory Highlights

### New Vehicles
| Model | Drive | Price (drive-away) | Stock |
|-------|-------|--------------------|-------|
| Toyota Camry Ascent | Sedan | $38,990 | 3 |
| Toyota RAV4 GXL Hybrid | SUV | $47,500 | 2 |
| Mazda CX-5 Touring | SUV | $42,990 | 4 |
| Hyundai Tucson Elite | SUV | $46,500 | 2 |
| Kia Cerato GT | Hatch | $36,490 | 3 |
| MG HS Excite | SUV | $32,990 | 5 |
| BYD Atto 3 Extended | EV SUV | $47,381 | 2 |

### Used Vehicles (Certified Pre-Owned)
| Model | Year | Kms | Price |
|-------|------|-----|-------|
| Toyota Hilux SR5 | 2022 | 38,000 | $52,990 |
| Mazda 3 G25 Evolve | 2021 | 45,000 | $27,990 |
| Hyundai i30 Active | 2020 | 62,000 | $22,490 |
| Tesla Model 3 RWD | 2023 | 15,000 | $48,990 |
| Ford Ranger XLT | 2021 | 55,000 | $47,990 |

## Trade-In Guide (Ballpark Ranges)
- 2020-2023 Toyota Corolla: $18,000 - $26,000
- 2020-2023 Mazda 3: $17,000 - $25,000
- 2019-2022 Toyota RAV4: $28,000 - $42,000
- 2020-2023 Hilux: $35,000 - $55,000
- 2018-2021 Hyundai i30: $14,000 - $22,000
Note: Final value depends on condition, service history, kms. Must inspect in person.

## Service Pricing
| Service | Price |
|---------|-------|
| Logbook Service (minor) | $299 - $399 |
| Logbook Service (major) | $499 - $699 |
| Brake Pad Replacement (front) | $350 - $450 |
| Tyre Rotation & Balance | $80 |
| Air Con Re-gas | $180 |
| Wheel Alignment | $99 |
| Pre-Purchase Inspection | $220 |
| Loan Car | Free with major service (book ahead) |

## Finance Options
- Dealer finance from 5.99% p.a. (comparison rate 6.45%)
- Terms: 1 to 7 years
- No deposit options available (subject to approval)
- Balloon / residual payments available
- All applications subject to credit approval
- Recommend: get pre-approval to know your budget before shopping

## Warranty
- New vehicles: Manufacturer warranty (3-7 years depending on brand)
- Used (Certified Pre-Owned): 1 year / 20,000 km dealer warranty
- Extended warranty available: from $1,200 for 3 years

## Test Drives
- Available 7 days a week during showroom hours
- Bring your driver's licence
- Duration: ~20-30 min on a set route (Parramatta to Olympic Park loop)
- Can test up to 3 vehicles per visit

## Parking & Getting Here
- On-site customer parking (enter from Marsden Street)
- Parramatta station: 8 min walk
- Free shuttle from station on Saturdays (call to arrange)`,
    },
    {
      name: "Support Bot",
      tone: "PROFESSIONAL" as const,
      status: "PAUSED" as const,
      industry: "E-commerce & Retail",
      systemPrompt: `You are the customer support assistant for Koala & Co, an Australian online retailer specialising in premium homewares, lifestyle products, and gifts.

ROLE & RESPONSIBILITIES:
- Help customers track orders and delivery status
- Process return and exchange requests
- Answer product questions (sizing, materials, availability)
- Resolve common issues (wrong item, damaged delivery, discount codes)
- Collect feedback and escalate unresolved complaints

BEHAVIOUR RULES:
- Be polite, efficient, and solution-oriented
- Keep responses concise (SMS format, 1-3 sentences)
- Always provide the next actionable step, not just information
- For returns: confirm order number, reason, and preferred resolution (refund/exchange)
- NEVER share customer data or process payments via SMS
- Apologise sincerely for mistakes — don't deflect or blame carriers
- If an issue requires investigation (missing parcel, payment dispute), set a clear expectation: "I'll investigate and get back to you within 24 hours"

ESCALATION TRIGGERS (transfer to human):
- Refund over $200
- Third attempt to resolve same issue
- Customer explicitly asks for a manager
- Legal threats or chargeback mentions
- Product safety or injury reports`,

      knowledgeBase: `# Koala & Co — Customer Support

## Contact
- Email: help@koalaandco.com.au
- SMS: Reply to this number
- Website: www.koalaandco.com.au
- Hours: Mon-Fri 9 AM - 5 PM AEST (SMS replies within 2 hours)

## Shipping
- Standard: 3-5 business days, FREE on orders over $80
- Standard (under $80): $9.95 flat rate
- Express: 1-2 business days, $14.95
- Regional/Remote: add 2-3 business days
- Carrier: Australia Post (standard), Aramex (express)
- Tracking: Sent via SMS and email once dispatched

## Returns & Exchanges
- 30-day returns from delivery date
- Items must be unused, in original packaging
- Customer pays return shipping ($8.95 prepaid label available)
- Refunds processed within 5 business days of receiving return
- Exchanges: free shipping on replacement item
- Sale items: exchange or store credit only (no refund)
- Personalised/engraved items: non-returnable

## Common Order Issues
| Issue | Resolution |
|-------|-----------|
| Wrong item received | Free return label + priority reship |
| Damaged in transit | Photo required, then immediate reship or refund |
| Missing parcel (tracking says delivered) | Lodge investigation with carrier (3-5 days), reship if not found |
| Discount code not applied | Can apply retroactively if order < 24 hours old |
| Want to cancel order | Can cancel within 1 hour of placing; after dispatch, must return |

## Active Promotions
- WELCOME15: 15% off first order (new customers, min $50)
- BUNDLE20: 20% off when buying 3+ items from the same collection
- Free gift wrapping on all orders (select at checkout)

## Best Sellers
1. Eucalyptus Soy Candle (350g) — $39.95
2. Merino Wool Throw — $149.95
3. Ceramic Planter Set (3 pcs) — $64.95
4. Linen Apron (4 colours) — $54.95
5. Native Botanical Print Set — $89.95

## Size Guide (Throws & Blankets)
- Single: 140 x 180 cm
- Double: 180 x 220 cm
- King: 220 x 240 cm

## Payment Methods
- Visa, Mastercard, Amex
- PayPal
- Afterpay (4 interest-free payments)
- Apple Pay / Google Pay
- Gift cards (purchased on site)`,
    },
    {
      name: "Bookings",
      tone: "FRIENDLY" as const,
      status: "DRAFT" as const,
      industry: "Hospitality",
      systemPrompt: `You are the booking assistant for The Rocks Kitchen & Bar, a modern Australian restaurant and cocktail bar located in The Rocks, Sydney.

ROLE & RESPONSIBILITIES:
- Take and modify table reservations
- Answer questions about the menu, dietary options, and specials
- Assist with private event and function enquiries
- Provide information about location, parking, and dress code
- Handle gift voucher questions

BEHAVIOUR RULES:
- Be warm, welcoming, and enthusiastic about the dining experience
- Keep responses concise for SMS (1-3 sentences)
- When booking, collect: name, date, time, number of guests, special requests
- Confirm all reservations with: "Booked! [Name], [date] at [time] for [X] guests"
- For groups over 10, direct to events team (events@therockskitchen.com.au)
- If fully booked, offer waitlist or suggest alternative dates/times
- NEVER guarantee specific table locations (window, terrace) — note as "request"
- For food allergies, reassure but recommend discussing with the chef on arrival

ESCALATION TRIGGERS (transfer to human):
- Function/event bookings over 10 guests
- Complaints about dining experience
- Gift voucher disputes
- Cancellation of large group booking`,

      knowledgeBase: `# The Rocks Kitchen & Bar

## Contact & Location
- Address: 78 George Street, The Rocks NSW 2000
- Phone: (02) 9241 1800
- Email: hello@therockskitchen.com.au
- Events: events@therockskitchen.com.au
- Website: www.therockskitchen.com.au
- Instagram: @therockskitchen

## Opening Hours
- Lunch: Wed-Sun 12:00 PM - 3:00 PM
- Dinner: Tue-Sat 5:30 PM - 10:00 PM
- Bar: Tue-Sat 4:00 PM - 12:00 AM
- Closed: Monday
- Kitchen closes 30 min before venue close

## Seating
- Main dining room: 60 seats
- Outdoor terrace (harbour views): 24 seats — weather dependent
- Private dining room: 10-20 guests
- Bar seating: 18 seats (walk-in only, no reservations)

## Menu Highlights

### Entrees
- Sydney Rock Oysters (6 pcs, lemon, mignonette) — $28
- Burrata, heirloom tomato, basil oil — $24
- Crispy Pork Belly Bao (2 pcs) — $19
- Kingfish Sashimi, yuzu, jalapeño — $26

### Mains
- Grilled Wagyu Scotch Fillet (300g, MBS 6+, café de Paris butter) — $59
- Pan-seared Barramundi (seasonal veg, lemon beurre blanc) — $42
- Duck Confit (lentils, cherry jus) — $44
- Mushroom & Truffle Risotto (V) — $34
- Lamb Rack (herb crust, smoked eggplant, jus) — $48

### Desserts
- Sticky Date Pudding (butterscotch, vanilla ice cream) — $18
- Pavlova (passionfruit, mango, Chantilly) — $19
- Cheese Board (3 Australian cheeses, lavosh, quince) — $28

### Kids Menu (under 12)
- Fish & Chips — $16
- Chicken Tenders & Fries — $14
- Pasta Napolitana — $14
- Ice cream (2 scoops) — $8

## Dietary Options
- Vegetarian: 4 mains, 3 entrees marked (V)
- Vegan: Available on request (chef can modify most dishes)
- Gluten-free: All proteins served with GF sides on request
- Allergies: Nut-free kitchen, dairy/shellfish — inform staff on arrival

## Drinks
- Cocktail list: 16 signature cocktails ($22-$26)
- Wine list: 80+ labels, focus on Australian regions (Hunter Valley, Barossa, Yarra Valley)
- Local craft beer: 8 taps rotating
- Non-alcoholic cocktails: 4 options ($14)

## Specials
- Tuesday: $1 oysters (min 6, with any main)
- Wednesday Lunch: 2-course set menu $45pp
- Thursday: Half-price bottles of wine (selected labels)
- Sunday: Extended brunch menu 11 AM - 3 PM

## Reservations
- Book up to 30 days in advance
- Maximum 10 guests per online/SMS booking
- Groups 10+: contact events team
- Deposit: Required for groups 6+ ($30pp, deducted from bill)
- Cancellation: 24 hours notice, or deposit forfeited
- No-show: May be charged $30pp

## Private Events
- Private dining room: 10-20 guests
- Set menu required: 3-course $89pp or 4-course $109pp
- Drinks packages: $59pp (3 hours), $79pp (4 hours)
- AV setup available (screen, microphone)
- Enquire: events@therockskitchen.com.au

## Gift Vouchers
- Available: $50, $100, $200, or custom amount
- Purchase online or in-venue
- Valid 3 years from purchase (Australian Consumer Law)
- Redeemable for food, drinks, and merchandise

## Getting Here
- Circular Quay station: 5 min walk
- Parking: Wilson Parking at 55 George St ($18/evening after 5 PM)
- Valet: Available Fri & Sat nights ($30)
- Ferry: Circular Quay wharf 4 min walk
- Dress code: Smart casual (no thongs, singlets, or activewear)`,
    },
  ];

  if (existingAgents.length === 0) {
    agents = await Promise.all(
      agentData.map((a) =>
        prisma.agent.create({
          data: {
            name: a.name,
            tone: a.tone,
            status: a.status,
            industry: a.industry,
            systemPrompt: a.systemPrompt,
            knowledgeBase: a.knowledgeBase,
            businessId: business1.id,
          },
        }),
      ),
    );
    console.log("  ✓ Agents created");
  } else {
    // Update existing agents with full prompts and knowledge bases
    for (let i = 0; i < Math.min(existingAgents.length, agentData.length); i++) {
      await prisma.agent.update({
        where: { id: existingAgents[i].id },
        data: {
          systemPrompt: agentData[i].systemPrompt,
          knowledgeBase: agentData[i].knowledgeBase,
        },
      });
    }
    console.log("  ✓ Agents updated with system prompts & knowledge bases");
  }

  // ─── Conversations (idempotent — skip if already seeded) ───
  const existingConvs = await prisma.conversation.count({ where: { businessId: business1.id } });
  if (existingConvs > 0) {
    console.log("  ✓ Conversations already exist, skipping");
    console.log("\n✅ Seed completed (idempotent run)!");
    console.log("📧 Demo login: demo@pumai.com.au / password123");
    return;
  }

  // Helper: create a date N days ago + offset hours
  const daysAgo = (days: number, hours = 0) =>
    new Date(Date.now() - days * 86400000 - hours * 3600000);

  const convos = [
    // ── Today ──
    { name: "Sarah Mitchell", phone: "+61412345678", status: "ACTIVE", sentiment: "POSITIVE", agent: 0, day: 0,
      msgs: [
        { c: "Hi, I'd like to book a dental check-up please.", r: "USER" },
        { c: "Hi Sarah! We have availability Thursday at 2pm or Friday at 10am. Which works?", r: "AGENT" },
        { c: "Thursday at 2pm works perfectly.", r: "USER" },
        { c: "Booked! You'll get a confirmation SMS shortly. Anything else?", r: "AGENT" },
        { c: "That's all, thanks!", r: "USER" },
      ],
    },
    { name: "James Cooper", phone: "+61423456789", status: "ACTIVE", sentiment: "POSITIVE", agent: 1, day: 0,
      msgs: [
        { c: "Hey, I saw your listing for the 3-bed in Bondi. Still available?", r: "USER" },
        { c: "Hi James! Yes, the 3-bedroom in Bondi is still available at $1.2M. Want to inspect?", r: "AGENT" },
        { c: "Can you send me photos of the 3-bedroom in Bondi?", r: "USER" },
        { c: "Of course! I've just sent 12 photos to your email. The property has ocean views from the balcony.", r: "AGENT" },
        { c: "Wow these look great. Can I come see it this Saturday?", r: "USER" },
        { c: "Saturday works! I have 10am or 1pm available. Which do you prefer?", r: "AGENT" },
      ],
    },
    { name: "Priya Sharma", phone: "+61412000111", status: "ACTIVE", sentiment: "NEUTRAL", agent: 0, day: 0,
      msgs: [
        { c: "Hi, I need to reschedule my appointment tomorrow. Is there anything next week?", r: "USER" },
        { c: "Hi Priya! Let me check availability for next week. Do you prefer morning or afternoon?", r: "AGENT" },
        { c: "Morning would be best, before 11am if possible.", r: "USER" },
      ],
    },
    { name: "Daniel Nguyen", phone: "+61423000222", status: "ACTIVE", sentiment: "POSITIVE", agent: 2, day: 0,
      msgs: [
        { c: "Hey, I want to trade in my 2019 Corolla. What's it worth?", r: "USER" },
        { c: "Hey Daniel! A 2019 Corolla in good condition typically goes for $18-22K depending on kms. How many on the clock?", r: "AGENT" },
        { c: "About 65,000 kms, full service history.", r: "USER" },
        { c: "Nice! With full service history and those kms, you're looking at the higher end. Want to bring it in for a valuation?", r: "AGENT" },
      ],
    },
    // ── 1 day ago ──
    { name: "Emily Watson", phone: "+61434567890", status: "RESOLVED", sentiment: "POSITIVE", agent: 2, day: 1,
      msgs: [
        { c: "Hi, I'm interested in test driving the new Camry.", r: "USER" },
        { c: "Hey Emily! Great choice. We've got slots Saturday morning or afternoon.", r: "AGENT" },
        { c: "Saturday morning works. What time?", r: "USER" },
        { c: "How about 10am? I'll have the car ready and warmed up for you.", r: "AGENT" },
        { c: "Perfect, see you then!", r: "USER" },
        { c: "Awesome! You'll get a reminder SMS Friday arvo. See you Saturday!", r: "AGENT" },
      ],
    },
    { name: "Michael Brown", phone: "+61445678901", status: "ESCALATED", sentiment: "NEGATIVE", agent: 0, day: 1,
      msgs: [
        { c: "I've been charged twice for my last visit. This is unacceptable.", r: "USER" },
        { c: "I'm sorry about the billing issue, Michael. Let me look into this right away.", r: "AGENT" },
        { c: "I can see the duplicate charge. I'll escalate this to our billing team immediately.", r: "AGENT" },
        { c: "I need to speak with a real person about this.", r: "USER" },
        { c: "Absolutely. I'm transferring you now to our billing manager, Karen. She'll sort this out.", r: "AGENT" },
      ],
    },
    { name: "Olivia Park", phone: "+61434000333", status: "RESOLVED", sentiment: "POSITIVE", agent: 1, day: 1,
      msgs: [
        { c: "Hi! We just got approved for our home loan. Looking for a 4-bed in the Eastern Suburbs.", r: "USER" },
        { c: "Congratulations Olivia! That's exciting. What's your budget range?", r: "AGENT" },
        { c: "Around $2M. We need good schools nearby.", r: "USER" },
        { c: "Great range for the Eastern Suburbs. I have 3 properties that match: Randwick, Coogee, and Maroubra. Shall I send details?", r: "AGENT" },
        { c: "Yes please! Especially the Randwick one.", r: "USER" },
        { c: "Sent! The Randwick property is a renovated 4-bed, 600m from the school. Open inspection this Saturday 11am-11:30am.", r: "AGENT" },
        { c: "We'll be there. Thank you so much!", r: "USER" },
      ],
    },
    // ── 2 days ago ──
    { name: "Lisa Chen", phone: "+61456789012", status: "RESOLVED", sentiment: "NEUTRAL", agent: 1, day: 2,
      msgs: [
        { c: "What's the price range for apartments in Surry Hills?", r: "USER" },
        { c: "In Surry Hills, 2-bed is $800K-$1.1M, 3-bed is $1.2M-$1.8M. Want listings?", r: "AGENT" },
        { c: "How about Darlinghurst? Comparing the two areas.", r: "USER" },
        { c: "Darlinghurst is slightly lower — 2-bed $750K-$1M, 3-bed $1.1M-$1.5M. Both have great cafe culture.", r: "AGENT" },
        { c: "Thanks, I'll think about it and get back to you.", r: "USER" },
        { c: "No worries, Lisa. Feel free to message anytime. I can set up alerts for new listings in both areas if you'd like.", r: "AGENT" },
      ],
    },
    { name: "Ryan McCarthy", phone: "+61445000444", status: "RESOLVED", sentiment: "POSITIVE", agent: 2, day: 2,
      msgs: [
        { c: "My car is due for its 80,000km service. How much will that cost?", r: "USER" },
        { c: "Hey Ryan! The 80K service for your model runs about $450-$550. Includes oil, filters, brake check, and fluid top-ups.", r: "AGENT" },
        { c: "That's reasonable. Can I book for next Tuesday?", r: "USER" },
        { c: "Tuesday's locked in for 8am. We'll have it done by 3pm. Need a loan car?", r: "AGENT" },
        { c: "Yes please, that'd be great.", r: "USER" },
        { c: "Done! Loan car reserved. Just bring your licence and keys Tuesday morning. Cheers!", r: "AGENT" },
      ],
    },
    { name: "Aisha Hassan", phone: "+61456000555", status: "ACTIVE", sentiment: "NEGATIVE", agent: 0, day: 2,
      msgs: [
        { c: "I've been waiting 40 minutes past my appointment time. What's going on?", r: "USER" },
        { c: "I'm really sorry about the wait, Aisha. The doctor is running behind due to an emergency. You should be seen within 10 minutes.", r: "AGENT" },
        { c: "This happens every time. Very frustrating.", r: "USER" },
        { c: "I completely understand your frustration. I've flagged this with management. Would you like to reschedule or continue waiting?", r: "AGENT" },
        { c: "I'll wait but this needs to improve.", r: "USER" },
      ],
    },
    // ── 3 days ago ──
    { name: "David Turner", phone: "+61467890123", status: "RESOLVED", sentiment: "POSITIVE", agent: 2, day: 3,
      msgs: [
        { c: "Got a reminder about my service. How do I book?", r: "USER" },
        { c: "Hey David! Book online or I can do it now. Tuesday or Wednesday?", r: "AGENT" },
        { c: "Wednesday works better for me.", r: "USER" },
        { c: "Wednesday at 9am it is! You'll get a confirmation email shortly.", r: "AGENT" },
        { c: "Got it, thanks.", r: "USER" },
      ],
    },
    { name: "Sophie Williams", phone: "+61467000666", status: "RESOLVED", sentiment: "POSITIVE", agent: 0, day: 3,
      msgs: [
        { c: "Hi, is Dr. Patel available for a skin check this week?", r: "USER" },
        { c: "Hi Sophie! Dr. Patel has Wednesday at 3pm and Friday at 9am. Which suits you?", r: "AGENT" },
        { c: "Friday at 9am please.", r: "USER" },
        { c: "All booked! Please arrive 10 minutes early to fill in the skin check form.", r: "AGENT" },
        { c: "Will do, thanks!", r: "USER" },
      ],
    },
    { name: "Ben Thorpe", phone: "+61478000777", status: "ESCALATED", sentiment: "NEGATIVE", agent: 1, day: 3,
      msgs: [
        { c: "The property you showed us had mould in the bathroom that wasn't disclosed. This is not acceptable.", r: "USER" },
        { c: "I'm very sorry to hear that, Ben. That should have been disclosed in the property report.", r: "AGENT" },
        { c: "We want to withdraw our offer and get our deposit back.", r: "USER" },
        { c: "I understand completely. I'm escalating this to our senior agent who can assist with the deposit return process.", r: "AGENT" },
        { c: "I also want to lodge a formal complaint.", r: "USER" },
        { c: "Of course. I'm connecting you with our complaints team now. Reference number: CMP-2024-0892.", r: "AGENT" },
      ],
    },
    // ── 4 days ago ──
    { name: "Rachel Kim", phone: "+61478901234", status: "RESOLVED", sentiment: "NEUTRAL", agent: 0, day: 4,
      msgs: [
        { c: "Do you have any availability this afternoon for a check-up?", r: "USER" },
        { c: "Hi Rachel! We have a 3:30pm slot available today. Shall I book it?", r: "AGENT" },
        { c: "Yes please!", r: "USER" },
        { c: "Done! See you at 3:30pm. Please bring your Medicare card.", r: "AGENT" },
      ],
    },
    { name: "Tom O'Brien", phone: "+61489012345", status: "RESOLVED", sentiment: "POSITIVE", agent: 1, day: 4,
      msgs: [
        { c: "I'd like to view the property on George St.", r: "USER" },
        { c: "Hi Tom! Inspection times Saturday at 11am and 2pm. Which works?", r: "AGENT" },
        { c: "11am works for me. Is parking available?", r: "USER" },
        { c: "There's street parking on George St and a car park on the corner of Pitt St. I'll meet you at the front entrance.", r: "AGENT" },
        { c: "Great, see you Saturday!", r: "USER" },
      ],
    },
    { name: "Maria Gonzalez", phone: "+61489000888", status: "RESOLVED", sentiment: "POSITIVE", agent: 2, day: 4,
      msgs: [
        { c: "Hi, I bought a car from you last month. The Bluetooth isn't connecting to my phone.", r: "USER" },
        { c: "Hey Maria! Sorry about that. Have you tried unpairing and re-pairing your phone?", r: "AGENT" },
        { c: "Yes, I've tried that twice already.", r: "USER" },
        { c: "No worries. It might need a firmware update. Can you swing by the dealership? We'll sort it out for free — it's covered under warranty.", r: "AGENT" },
        { c: "Thanks! I'll come by tomorrow afternoon.", r: "USER" },
        { c: "See you then! Ask for Jake at the service desk. He's our tech wizard.", r: "AGENT" },
      ],
    },
    // ── 5 days ago ──
    { name: "Chris Patel", phone: "+61490000999", status: "RESOLVED", sentiment: "POSITIVE", agent: 0, day: 5,
      msgs: [
        { c: "Hi, I need my blood test results. They should be ready by now.", r: "USER" },
        { c: "Hi Chris! Let me check. Yes, your results are in. The doctor has reviewed them and everything looks normal.", r: "AGENT" },
        { c: "That's a relief! Do I need a follow-up?", r: "USER" },
        { c: "No follow-up needed. Your next routine check is in 6 months. We'll send you a reminder.", r: "AGENT" },
        { c: "Perfect, thank you!", r: "USER" },
      ],
    },
    { name: "Natalie White", phone: "+61491001010", status: "ACTIVE", sentiment: "NEUTRAL", agent: 1, day: 5,
      msgs: [
        { c: "I'm looking to rent a 2-bed unit near public transport. Budget $550/week.", r: "USER" },
        { c: "Hi Natalie! For $550/week near transport, I'd suggest looking at Marrickville, Newtown, or Erskineville.", r: "AGENT" },
        { c: "I prefer Newtown. Any available?", r: "USER" },
        { c: "We have 2 units in Newtown right now: one on King St ($540/wk) and one on Enmore Rd ($560/wk). Both near the station.", r: "AGENT" },
        { c: "Can I inspect both this weekend?", r: "USER" },
        { c: "Saturday 10am for King St and 11am for Enmore Rd. Sound good?", r: "AGENT" },
        { c: "I'll be there!", r: "USER" },
      ],
    },
    // ── 6 days ago ──
    { name: "Andrew Leung", phone: "+61492002020", status: "RESOLVED", sentiment: "POSITIVE", agent: 2, day: 6,
      msgs: [
        { c: "Hey, just picked up my car from service. Drives like new! Thanks team.", r: "USER" },
        { c: "Awesome to hear, Andrew! Glad you're happy with it. Don't forget your next service is at 100K kms.", r: "AGENT" },
        { c: "Will do. Cheers!", r: "USER" },
      ],
    },
    { name: "Jessica Adams", phone: "+61493003030", status: "RESOLVED", sentiment: "POSITIVE", agent: 0, day: 6,
      msgs: [
        { c: "My daughter needs a vaccination for school. Which ones are required?", r: "USER" },
        { c: "Hi Jessica! For school entry, she'll need MMR and DTPa boosters. Does she have her immunisation record?", r: "AGENT" },
        { c: "Yes, I have it. She's up to date except the DTPa booster.", r: "USER" },
        { c: "Perfect. We can do the DTPa booster anytime. Would you like to book an appointment this week?", r: "AGENT" },
        { c: "Thursday after school — around 4pm?", r: "USER" },
        { c: "Thursday 4pm is booked! Please bring the immunisation record and Medicare card.", r: "AGENT" },
        { c: "Thanks so much!", r: "USER" },
      ],
    },
    { name: "Mark Sullivan", phone: "+61494004040", status: "ESCALATED", sentiment: "NEGATIVE", agent: 1, day: 6,
      msgs: [
        { c: "Your agent showed me a property and the listed price was wrong. The actual price is $200K more.", r: "USER" },
        { c: "I apologise for the confusion, Mark. Let me look into this.", r: "AGENT" },
        { c: "The listing has been updated but the old price was shown in error. I'm escalating this to our senior team.", r: "AGENT" },
        { c: "This is very misleading. I've wasted my whole Saturday.", r: "USER" },
        { c: "I completely understand your frustration. Our team leader will call you within the hour to discuss this.", r: "AGENT" },
      ],
    },
    // ── 7-10 days ago (older data for monthly metrics) ──
    { name: "Karen Douglas", phone: "+61495005050", status: "RESOLVED", sentiment: "POSITIVE", agent: 0, day: 8,
      msgs: [
        { c: "Hi, I need to refill my prescription for blood pressure medication.", r: "USER" },
        { c: "Hi Karen! I can see your prescription on file. Shall I send it to your usual pharmacy on Crown St?", r: "AGENT" },
        { c: "Yes please. Thank you!", r: "USER" },
        { c: "Done! It should be ready for pickup within 2 hours.", r: "AGENT" },
      ],
    },
    { name: "Jake Morrison", phone: "+61496006060", status: "RESOLVED", sentiment: "NEUTRAL", agent: 2, day: 9,
      msgs: [
        { c: "What's the trade-in value for a 2017 Mazda 3?", r: "USER" },
        { c: "Hey Jake! A 2017 Mazda 3 in good nick is around $14-17K depending on kms and condition.", r: "AGENT" },
        { c: "100K kms, a few scratches but mechanically sound.", r: "USER" },
        { c: "I'd estimate $14.5-15.5K for that. Want to bring it in for a proper valuation?", r: "AGENT" },
        { c: "I'll think about it. Thanks for the info.", r: "USER" },
      ],
    },
    { name: "Wendy Tan", phone: "+61497007070", status: "RESOLVED", sentiment: "POSITIVE", agent: 1, day: 10,
      msgs: [
        { c: "We loved the apartment in Paddington! Ready to make an offer.", r: "USER" },
        { c: "Wonderful news, Wendy! What figure were you thinking?", r: "AGENT" },
        { c: "$980,000. It's at the top of our budget.", r: "USER" },
        { c: "I'll present the offer to the vendor today. Given the interest level, I think that's competitive. I'll call you once I hear back.", r: "AGENT" },
        { c: "Fingers crossed! Thanks for all your help.", r: "USER" },
        { c: "My pleasure! I'll be in touch soon.", r: "AGENT" },
      ],
    },
    { name: "Peter Zhang", phone: "+61498008080", status: "RESOLVED", sentiment: "POSITIVE", agent: 0, day: 11,
      msgs: [
        { c: "Hi, I got my X-ray results and the doctor said I need a referral to a specialist.", r: "USER" },
        { c: "Hi Peter! I can see Dr. Lee has prepared your referral. Would you like it emailed or posted?", r: "AGENT" },
        { c: "Email please, it's faster.", r: "USER" },
        { c: "Sent to your email on file. The specialist is Dr. Huang at Royal Prince Alfred — they'll contact you for an appointment.", r: "AGENT" },
        { c: "Thank you so much for the quick turnaround!", r: "USER" },
      ],
    },
    { name: "Linda Foster", phone: "+61499009090", status: "RESOLVED", sentiment: "NEUTRAL", agent: 2, day: 12,
      msgs: [
        { c: "I need to cancel my test drive booking for this weekend.", r: "USER" },
        { c: "No worries, Linda. I've cancelled your Saturday booking. Want to reschedule?", r: "AGENT" },
        { c: "Not right now, I'll reach out when I'm ready.", r: "USER" },
        { c: "Sounds good! Just message us anytime. Have a great weekend.", r: "AGENT" },
      ],
    },
    { name: "Sam Romano", phone: "+61400010101", status: "RESOLVED", sentiment: "POSITIVE", agent: 1, day: 13,
      msgs: [
        { c: "Hi, we just signed the contract for the Newtown property. So excited!", r: "USER" },
        { c: "Congratulations Sam! That's amazing news. Welcome to the neighbourhood!", r: "AGENT" },
        { c: "Couldn't have done it without your help. The whole process was so smooth.", r: "USER" },
        { c: "That means a lot! Settlement is in 6 weeks. I'll keep you posted every step of the way.", r: "AGENT" },
        { c: "Thanks Alex, you've been brilliant.", r: "USER" },
      ],
    },
  ];

  for (const conv of convos) {
    const baseDate = daysAgo(conv.day);
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
        createdAt: baseDate,
        updatedAt: new Date(baseDate.getTime() + conv.msgs.length * 120000),
        messages: {
          create: conv.msgs.map((m, i) => ({
            content: m.c,
            role: m.r,
            createdAt: new Date(baseDate.getTime() + i * 120000),
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
