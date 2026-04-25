export const PDF_LIMITS = {
  MAX_PDFS: 3,
  MAX_PDF_BYTES: 10 * 1024 * 1024,
  MAX_TOTAL_BYTES: 25 * 1024 * 1024,
} as const;

export type LimitThresholds = { green: number; amber: number; red: number; block: number };
export type LimitState = "green" | "amber" | "red" | "block";

// Hard caps mirror Zod limits in src/server/validation.ts.
// `block` sits below the Zod max so a save never fails on the boundary.
export const LIMITS: { systemPrompt: LimitThresholds; knowledgeBase: LimitThresholds } = {
  systemPrompt: { green: 5_000, amber: 12_000, red: 18_000, block: 19_500 },
  knowledgeBase: { green: 20_000, amber: 40_000, red: 80_000, block: 95_000 },
};

export function limitState(chars: number, t: LimitThresholds): LimitState {
  if (chars >= t.block) return "block";
  if (chars >= t.red) return "red";
  if (chars >= t.amber) return "amber";
  return "green";
}

export const industries = [
  "Healthcare",
  "Automotive",
  "Real Estate",
  "E-commerce & Retail",
  "Trades & Services",
  "Hospitality",
  "Education",
  "Course / Program",
  "Other",
] as const;

export type Industry = (typeof industries)[number];

export type Pair = { key: string; value: string };

export type FormValue = string | string[] | Pair[];

export type FormState = Record<string, FormValue>;

export type FieldType = "text" | "textarea" | "list" | "kvList";

export type FormField = {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  rows?: number;
  hint?: string;
  keyLabel?: string;
  valueLabel?: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  renderStyle?: "labeled" | "qa" | "bullets" | "named-bullets" | "plain";
};

export type FormSection = {
  title: string;
  description?: string;
  fields: FormField[];
};

export type FormSchema = {
  systemPrompt: FormSection[];
  knowledgeBase: FormSection[];
};

// ─── Field builders ───

const baseIdentity = (industryLabel: string, defaultRole: string): FormSection => ({
  title: "Identity",
  description: "Who the agent is and what it does.",
  fields: [
    {
      key: "businessName",
      label: "Business Name",
      type: "text",
      placeholder: "e.g. Smith Family Medical Centre",
    },
    {
      key: "role",
      label: "Role",
      type: "textarea",
      rows: 3,
      placeholder: defaultRole,
      hint: `One paragraph describing the agent's purpose for this ${industryLabel} business.`,
    },
  ],
});

const baseBehaviour: FormSection = {
  title: "Behaviour Rules",
  description: "Rules the agent must follow on every reply.",
  fields: [
    {
      key: "rules",
      label: "Rules",
      type: "list",
      placeholder: "e.g. Keep replies to 1-3 sentences",
      renderStyle: "bullets",
    },
    {
      key: "forbidden",
      label: "Never Do",
      type: "list",
      placeholder: "e.g. Never share customer data via chat",
      renderStyle: "bullets",
    },
  ],
};

const baseEscalation: FormSection = {
  title: "Escalation",
  description: "When the agent should hand off to a human.",
  fields: [
    {
      key: "escalation",
      label: "Escalation Triggers",
      type: "list",
      placeholder: "e.g. Customer requests refund over $200",
      renderStyle: "bullets",
    },
  ],
};

const baseExtras: FormSection = {
  title: "Extra Instructions",
  description: "Anything else specific to your business (optional).",
  fields: [
    {
      key: "extraInstructions",
      label: "Extra Instructions",
      type: "textarea",
      rows: 4,
      placeholder: "Anything else the agent should know...",
      renderStyle: "plain",
    },
  ],
};

const baseContact: FormSection = {
  title: "Business Info",
  fields: [
    { key: "kbBusinessName", label: "Business Name", type: "text", placeholder: "e.g. Smith Family Medical Centre" },
    { key: "address", label: "Address", type: "textarea", rows: 2, placeholder: "Street, Suburb, State, Postcode" },
    { key: "phone", label: "Phone", type: "text", placeholder: "(0X) XXXX XXXX" },
    { key: "email", label: "Email", type: "text", placeholder: "hello@business.com.au" },
    { key: "website", label: "Website", type: "text", placeholder: "www.business.com.au" },
  ],
};

const baseHours: FormSection = {
  title: "Hours",
  fields: [
    {
      key: "hours",
      label: "Opening Hours",
      type: "textarea",
      rows: 4,
      placeholder: "Mon-Fri: 9:00am - 5:00pm AEST\nSat: 9:00am - 1:00pm\nSun & Public Holidays: Closed",
      renderStyle: "plain",
    },
  ],
};

const basePolicies: FormSection = {
  title: "Policies",
  fields: [
    {
      key: "policies",
      label: "Policies",
      type: "list",
      placeholder: "e.g. 24 hours notice required for cancellations",
      renderStyle: "bullets",
    },
  ],
};

const baseExtraInformation: FormSection = {
  title: "Extra Information",
  description:
    "Catch-all for anything important from your source material (PDF, brochure, website) that doesn't fit a specific field above. The auto-fill agent will drop here anything material it finds that wasn't covered by another field.",
  fields: [
    {
      key: "extraInformation",
      label: "Extra Information",
      type: "textarea",
      rows: 10,
      placeholder:
        "Anything else worth knowing — unique policies, cohort notes, partnership details, awards, quotes, fine-print, regional differences, etc.",
      renderStyle: "plain",
    },
  ],
};

const baseFaqs: FormSection = {
  title: "FAQs",
  description: "Common questions customers ask and the answers your agent should give.",
  fields: [
    {
      key: "faqs",
      label: "FAQs",
      type: "kvList",
      keyLabel: "Question",
      valueLabel: "Answer",
      keyPlaceholder: "What are your opening hours?",
      valuePlaceholder: "We're open Mon-Fri, 9am-5pm AEST.",
      renderStyle: "qa",
    },
  ],
};

const baseServices = (label = "Services"): FormSection => ({
  title: label,
  description: "List with name + short description.",
  fields: [
    {
      key: "services",
      label,
      type: "kvList",
      keyLabel: "Name",
      valueLabel: "Description",
      keyPlaceholder: "Standard consultation",
      valuePlaceholder: "15 min, $XX bulk-billed for concession",
      renderStyle: "named-bullets",
    },
  ],
});

// ─── Industry schemas ───

function makeSchema(
  industryLabel: string,
  defaultRole: string,
  options: {
    systemExtras?: FormSection[];
    knowledgeExtras?: FormSection[];
    servicesLabel?: string;
  } = {},
): FormSchema {
  return {
    systemPrompt: [
      baseIdentity(industryLabel, defaultRole),
      baseBehaviour,
      baseEscalation,
      ...(options.systemExtras ?? []),
      baseExtras,
    ],
    knowledgeBase: [
      baseContact,
      baseHours,
      baseServices(options.servicesLabel),
      basePolicies,
      baseFaqs,
      ...(options.knowledgeExtras ?? []),
      baseExtraInformation,
    ],
  };
}

const schemas: Record<string, FormSchema> = {
  Healthcare: makeSchema(
    "Australian medical clinic",
    "Virtual receptionist for an Australian medical clinic. Books appointments, answers clinic questions, provides pre-appointment instructions.",
    {
      systemExtras: [
        {
          title: "Clinical Safety",
          description: "Never replace a doctor. Triage urgency only.",
          fields: [
            {
              key: "emergencyDirective",
              label: "Emergency Directive",
              type: "textarea",
              rows: 3,
              placeholder: "Chest pain, breathing difficulty, severe bleeding, suicidal ideation: direct to 000 immediately. After-hours: 13SICK (13 7425) or nearest ED.",
              renderStyle: "plain",
            },
          ],
        },
      ],
      knowledgeExtras: [
        {
          title: "Practitioners",
          fields: [
            {
              key: "practitioners",
              label: "Practitioners",
              type: "kvList",
              keyLabel: "Name & Role",
              valueLabel: "Days / Special interests",
              keyPlaceholder: "Dr Jane Smith, GP",
              valuePlaceholder: "Mon-Wed, women's health & paediatrics",
              renderStyle: "named-bullets",
            },
            {
              key: "languagesSpoken",
              label: "Languages Spoken",
              type: "list",
              placeholder: "Mandarin",
              renderStyle: "bullets",
            },
          ],
        },
        {
          title: "Billing & Medicare",
          fields: [
            {
              key: "billing",
              label: "Billing Summary",
              type: "textarea",
              rows: 4,
              placeholder: "Bulk-billed for children under 16, pensioners, healthcare card holders. Standard consult $XX with $XX Medicare rebate.",
              renderStyle: "plain",
            },
            {
              key: "feeSchedule",
              label: "Fee Schedule",
              type: "kvList",
              keyLabel: "Item",
              valueLabel: "Fee / Rebate",
              keyPlaceholder: "Long consult (Level C)",
              valuePlaceholder: "$120, Medicare rebate $80",
              renderStyle: "named-bullets",
            },
            {
              key: "concessions",
              label: "Concessions Accepted",
              type: "list",
              placeholder: "DVA Gold Card",
              renderStyle: "bullets",
            },
          ],
        },
        {
          title: "Telehealth & Online Booking",
          fields: [
            {
              key: "telehealth",
              label: "Telehealth Availability",
              type: "textarea",
              rows: 3,
              placeholder: "Available for existing patients. Bulk-billed for eligible patients per MBS rules. Phone or video via [HotDoc / HealthEngine].",
              renderStyle: "plain",
            },
            {
              key: "onlineBookingUrl",
              label: "Online Booking URL",
              type: "text",
              placeholder: "https://www.hotdoc.com.au/medical-centres/...",
            },
            {
              key: "myHealthRecord",
              label: "My Health Record",
              type: "text",
              placeholder: "Upload to My Health Record by default unless patient opts out",
            },
          ],
        },
        {
          title: "Partners & Referrals",
          fields: [
            {
              key: "pathologyPartners",
              label: "Pathology / Imaging Partners",
              type: "list",
              placeholder: "Douglass Hanly Moir on-site",
              renderStyle: "bullets",
            },
            {
              key: "afterHoursPartner",
              label: "After-Hours Partner",
              type: "text",
              placeholder: "13SICK (13 7425) — National Home Doctor Service",
            },
          ],
        },
      ],
      servicesLabel: "Services & Procedures",
    },
  ),

  Automotive: makeSchema(
    "Australian car dealership",
    "Virtual assistant for an Australian car dealership. Helps with test drives, service bookings, vehicle enquiries, trade-ins, finance overview.",
    {
      knowledgeExtras: [
        {
          title: "Dealership Details",
          fields: [
            { key: "brands", label: "Brands Sold", type: "list", placeholder: "Toyota", renderStyle: "bullets" },
            { key: "lmct", label: "LMCT/MD Licence", type: "text", placeholder: "12345" },
            {
              key: "departments",
              label: "Departments",
              type: "kvList",
              keyLabel: "Dept",
              valueLabel: "Hours / Contact",
              keyPlaceholder: "Service",
              valuePlaceholder: "Mon-Fri 7:30am-5:30pm, service@dealer.com.au",
              renderStyle: "named-bullets",
            },
          ],
        },
        {
          title: "Service & Maintenance",
          fields: [
            {
              key: "serviceIntervals",
              label: "Service Intervals & Capped Pricing",
              type: "textarea",
              rows: 4,
              placeholder: "Capped-price service for first 5 years / 75,000km. Logbook minor $XXX, major $XXX. Includes oil, filter, multi-point inspection.",
              renderStyle: "plain",
            },
            {
              key: "loanCarPolicy",
              label: "Loan / Courtesy Car Policy",
              type: "textarea",
              rows: 2,
              placeholder: "Courtesy car or shuttle available — book in advance, full driver's licence required.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Finance, Insurance & Trade-In",
          fields: [
            {
              key: "financePartners",
              label: "Finance Partners",
              type: "list",
              placeholder: "Toyota Finance",
              renderStyle: "bullets",
            },
            {
              key: "finance",
              label: "Finance & Warranty Notes",
              type: "textarea",
              rows: 4,
              placeholder: "Consumer and chattel mortgage / novated lease available. New vehicles 5-7 yr warranty. Used cars: statutory warranty (state-dependent) + remaining factory warranty. Comparison rate disclosed in writing.",
              renderStyle: "plain",
            },
            {
              key: "tradeInProcess",
              label: "Trade-In Process",
              type: "textarea",
              rows: 3,
              placeholder: "Free 30-min appraisal. Bring rego papers, service history, finance payout letter if applicable. Offer valid 7 days.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "EV & Fleet",
          fields: [
            {
              key: "evCharging",
              label: "EV / PHEV Notes",
              type: "textarea",
              rows: 3,
              placeholder: "On-site DC fast charging for buyers. Home charger install partners. Govt EV rebate guidance — state-by-state.",
              renderStyle: "plain",
            },
            {
              key: "fleetEnquiries",
              label: "Fleet & Business",
              type: "textarea",
              rows: 2,
              placeholder: "Dedicated fleet manager. ABN-only quotes available. Salary packaging via [novated lease provider].",
              renderStyle: "plain",
            },
          ],
        },
      ],
      servicesLabel: "Vehicles & Services",
    },
  ),

  "Real Estate": makeSchema(
    "Australian real estate agency",
    "Virtual property assistant for an Australian real estate agency. Helps buyers and renters find properties, answers listing questions, schedules inspections, qualifies leads.",
    {
      knowledgeExtras: [
        {
          title: "Agency Details",
          fields: [
            { key: "licence", label: "Real Estate Licence", type: "text", placeholder: "NSW Lic 12345" },
            { key: "serviceAreas", label: "Service Suburbs / LGAs", type: "list", placeholder: "Surry Hills", renderStyle: "bullets" },
            {
              key: "team",
              label: "Sales & PM Team",
              type: "kvList",
              keyLabel: "Name",
              valueLabel: "Role / Specialty",
              keyPlaceholder: "Jane Smith",
              valuePlaceholder: "Director, residential sales — Eastern Suburbs",
              renderStyle: "named-bullets",
            },
          ],
        },
        {
          title: "Inspections & Auctions",
          fields: [
            {
              key: "ofiSchedule",
              label: "Open-for-Inspection Schedule",
              type: "textarea",
              rows: 3,
              placeholder: "Saturdays 10am-12pm during campaign. Mid-week twilight inspections by appointment.",
              renderStyle: "plain",
            },
            {
              key: "auctionInfo",
              label: "Auctions",
              type: "textarea",
              rows: 3,
              placeholder: "On-site auctions Saturdays. No cooling-off after auction. Registered bidders only — bring 100 pts ID.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Buying / Renting Process",
          fields: [
            {
              key: "buyingProcess",
              label: "Buying Process",
              type: "textarea",
              rows: 5,
              placeholder: "1. Pre-approval 2. Inspections 3. Offer 4. Cooling-off (5 business days NSW for private treaty) 5. Exchange + 10% deposit 6. Settlement (~6 weeks)",
              renderStyle: "plain",
            },
            {
              key: "rentingProcess",
              label: "Renting Process",
              type: "textarea",
              rows: 5,
              placeholder: "1. Inspect 2. Apply (100 pts ID, payslips, references) 3. Approval 24-48h 4. Sign lease + 4 wks bond + 2 wks rent 5. Bond lodged with state authority",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Property Management",
          fields: [
            {
              key: "pmFees",
              label: "PM Fees",
              type: "textarea",
              rows: 3,
              placeholder: "Letting fee 1-2 wks rent + GST. Management 5.5%-8.8% inc. GST. Routine inspections every 3-6 months. 24/7 maintenance line.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Investors & Foreign Buyers",
          fields: [
            {
              key: "firbInfo",
              label: "FIRB / Foreign Buyers",
              type: "textarea",
              rows: 3,
              placeholder: "Non-residents and temporary residents need FIRB approval before exchange. Surcharge stamp duty applies — varies by state.",
              renderStyle: "plain",
            },
            {
              key: "buyersAgent",
              label: "Buyers' Agent / Off-Market",
              type: "textarea",
              rows: 2,
              placeholder: "Off-market opportunities shared with registered buyers' agents. Buyer alerts available — register on the website.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Compliance",
          fields: [
            {
              key: "complianceNotes",
              label: "Compliance Notes",
              type: "textarea",
              rows: 3,
              placeholder: "Underquoting laws apply (NSW/VIC). Statement of Information (VIC) / Section 32 / Form 1 (SA) / Contract of Sale (NSW) provided on request.",
              renderStyle: "plain",
            },
          ],
        },
      ],
      servicesLabel: "Property Types",
    },
  ),

  "E-commerce & Retail": makeSchema(
    "Australian online retailer",
    "Customer support assistant for an Australian online retailer. Tracks orders, processes returns/exchanges, answers product questions, resolves delivery issues.",
    {
      knowledgeExtras: [
        {
          title: "Shipping",
          fields: [
            {
              key: "shippingOptions",
              label: "Shipping Options",
              type: "kvList",
              keyLabel: "Option",
              valueLabel: "Cost / ETA",
              keyPlaceholder: "Standard Australia-wide",
              valuePlaceholder: "$9.95, 3-7 business days, free over $100",
              renderStyle: "named-bullets",
            },
          ],
        },
        {
          title: "Returns",
          fields: [
            {
              key: "returns",
              label: "Returns Policy",
              type: "textarea",
              rows: 5,
              placeholder: "30-day change-of-mind on unworn items with tags. Free return shipping for faulty items. ACL: refund/replace/repair for major faults.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Payment & BNPL",
          fields: [
            { key: "payment", label: "Payment Methods", type: "list", placeholder: "Visa / Mastercard / Amex", renderStyle: "bullets" },
            {
              key: "bnpl",
              label: "Buy Now Pay Later",
              type: "textarea",
              rows: 3,
              placeholder: "Afterpay (4 fortnightly instalments, no interest), Zip Pay & Zip Money. Subject to approval. Min order $XX, max $X,XXX.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Click & Collect / Pre-orders / Gift Cards",
          fields: [
            {
              key: "clickAndCollect",
              label: "Click & Collect (BOPIS)",
              type: "textarea",
              rows: 2,
              placeholder: "Available at [stores]. Order ready in 2 business hours, hold for 7 days. Bring ID + order confirmation.",
              renderStyle: "plain",
            },
            {
              key: "preOrders",
              label: "Pre-orders / Backorders",
              type: "textarea",
              rows: 2,
              placeholder: "Pre-order items ship by [date]. Card charged at order. Cancel any time before dispatch.",
              renderStyle: "plain",
            },
            {
              key: "giftCards",
              label: "Gift Cards",
              type: "textarea",
              rows: 2,
              placeholder: "Digital gift cards from $25, valid 3 years from purchase, redeem online or in-store.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Loyalty & Wholesale",
          fields: [
            {
              key: "loyaltyProgram",
              label: "Loyalty / Rewards",
              type: "textarea",
              rows: 2,
              placeholder: "Earn 1 point per $1, redeem 100 points = $5 off. Birthday bonus. Free signup at [link].",
              renderStyle: "plain",
            },
            {
              key: "wholesale",
              label: "Wholesale / B2B",
              type: "textarea",
              rows: 2,
              placeholder: "ABN customers — apply via wholesale@store.com.au. Min order $X,XXX. Net 30 terms after first order.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "International & Sizing",
          fields: [
            {
              key: "intlShipping",
              label: "International Shipping",
              type: "list",
              placeholder: "New Zealand",
              renderStyle: "bullets",
            },
            {
              key: "sizingGuideUrl",
              label: "Size / Fit Guide URL",
              type: "text",
              placeholder: "https://store.com.au/size-guide",
            },
            {
              key: "stockNotes",
              label: "Stock Notes",
              type: "textarea",
              rows: 2,
              placeholder: "Stock updated in real time. Out-of-stock notifications via 'Notify me' button on product page.",
              renderStyle: "plain",
            },
          ],
        },
      ],
      servicesLabel: "Products & Categories",
    },
  ),

  "Trades & Services": makeSchema(
    "Australian trades business",
    "Booking assistant for an Australian trades business. Schedules jobs, gives rough quotes, confirms appointments, follows up on completed work.",
    {
      knowledgeExtras: [
        {
          title: "Licensing",
          fields: [
            { key: "tradeType", label: "Trade", type: "text", placeholder: "Plumber" },
            { key: "licence", label: "State Licence #", type: "text", placeholder: "VIC 12345" },
            { key: "insurance", label: "Public Liability", type: "text", placeholder: "$20M" },
            { key: "serviceArea", label: "Service Area", type: "text", placeholder: "Inner West Sydney, 25km radius" },
          ],
        },
        {
          title: "Callout Pricing",
          fields: [
            {
              key: "calloutPricing",
              label: "Callout & Hourly Rates",
              type: "textarea",
              rows: 4,
              placeholder: "Service call (1st hour): $XXX inc. GST\nSubsequent hours: $XX/hr\nAfter-hours / weekend callout: $XXX",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Warranty, Safety & Compliance",
          fields: [
            {
              key: "warranty",
              label: "Workmanship Warranty",
              type: "textarea",
              rows: 3,
              placeholder: "12 months workmanship warranty on labour. Manufacturer warranty applies on parts. All work to AS/NZS standards. Compliance / certificate of electrical safety / CCEW issued where required.",
              renderStyle: "plain",
            },
            {
              key: "whsPolicy",
              label: "WHS / Safety Policy",
              type: "textarea",
              rows: 2,
              placeholder: "All technicians hold White Card. SWMS provided on commercial sites. PPE worn at all times. Confined-space and working-at-heights tickets where applicable.",
              renderStyle: "plain",
            },
            {
              key: "publicLiabilityUrl",
              label: "Public Liability Certificate URL",
              type: "text",
              placeholder: "https://business.com.au/insurance.pdf",
            },
          ],
        },
        {
          title: "Emergency Response",
          fields: [
            {
              key: "emergencySla",
              label: "Emergency Response SLA",
              type: "textarea",
              rows: 3,
              placeholder: "Same-day response within metro area. Genuine 24/7 emergency line for burst pipes, gas leaks, no-power situations. ETA confirmed by SMS on dispatch.",
              renderStyle: "plain",
            },
            {
              key: "depositPolicy",
              label: "Deposit & Payment Terms",
              type: "textarea",
              rows: 3,
              placeholder: "No deposit on jobs under $2,000. 30% deposit on larger jobs, progress payments at agreed milestones. Final payment due on completion. Card, EFT, cash. ABN on every invoice.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Materials & Quality",
          fields: [
            {
              key: "materialsSourcing",
              label: "Materials & Suppliers",
              type: "textarea",
              rows: 2,
              placeholder: "Reece Plumbing trade account. Caroma / Methven / Rinnai installer. Genuine OEM parts only.",
              renderStyle: "plain",
            },
            {
              key: "galleryUrl",
              label: "Before / After Gallery URL",
              type: "text",
              placeholder: "https://business.com.au/recent-jobs",
            },
          ],
        },
      ],
      servicesLabel: "Services & Indicative Pricing",
    },
  ),

  Hospitality: makeSchema(
    "Australian restaurant or bar",
    "Booking assistant for an Australian restaurant/bar. Takes and modifies reservations, answers menu and dietary questions, helps with event enquiries.",
    {
      knowledgeExtras: [
        {
          title: "Venue Details",
          fields: [
            { key: "cuisine", label: "Cuisine", type: "text", placeholder: "Modern Australian" },
            { key: "liquorLicence", label: "Liquor Licence", type: "text", placeholder: "LIQO123456" },
            {
              key: "menuHighlights",
              label: "Menu Highlights",
              type: "list",
              placeholder: "Signature dish or chef's special",
              renderStyle: "bullets",
            },
            {
              key: "dietary",
              label: "Dietary Options",
              type: "textarea",
              rows: 3,
              placeholder: "Vegetarian and vegan options clearly marked. GF menu available — flag on booking. Severe allergies: confirm with floor manager on arrival.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Bookings & Surcharges",
          fields: [
            {
              key: "bookingsInfo",
              label: "Bookings & Surcharges",
              type: "textarea",
              rows: 4,
              placeholder: "Online up to 10 guests; larger via events team. Public holiday 15% surcharge. Hold time 15 mins. Group deposits $50pp for 8+.",
              renderStyle: "plain",
            },
            {
              key: "bookingPlatform",
              label: "Booking Platform / URL",
              type: "text",
              placeholder: "https://now.tab.com.au/restaurant/...",
            },
            {
              key: "corkagePolicy",
              label: "BYO / Corkage",
              type: "text",
              placeholder: "BYO wine only — $10 corkage per bottle. No BYO Friday & Saturday after 6pm.",
            },
            {
              key: "dressCode",
              label: "Dress Code",
              type: "text",
              placeholder: "Smart casual. No singlets, thongs, or active wear after 6pm.",
            },
          ],
        },
        {
          title: "Functions & Events",
          fields: [
            {
              key: "privateDining",
              label: "Private Dining / Function Rooms",
              type: "textarea",
              rows: 3,
              placeholder: "Private dining room: up to 30 seated / 50 cocktail. Set menus from $XX pp. Beverage packages from $XX pp / 3 hrs. Min spend Fri/Sat $X,XXX.",
              renderStyle: "plain",
            },
            {
              key: "setMenus",
              label: "Set Menus",
              type: "kvList",
              keyLabel: "Menu",
              valueLabel: "Inclusions / Price",
              keyPlaceholder: "Sunday Lunch Set",
              valuePlaceholder: "3 courses + glass of wine, $89 pp",
              renderStyle: "named-bullets",
            },
            {
              key: "functionsContact",
              label: "Functions Contact",
              type: "text",
              placeholder: "events@venue.com.au",
            },
          ],
        },
        {
          title: "Accessibility & Logistics",
          fields: [
            {
              key: "accessibility",
              label: "Accessibility",
              type: "textarea",
              rows: 3,
              placeholder: "Step-free entry from [street]. Accessible WC on ground floor. Highchairs and prams welcome. Hearing loop installed. Service dogs welcome.",
              renderStyle: "plain",
            },
            {
              key: "parkingTransport",
              label: "Parking & Transport",
              type: "textarea",
              rows: 2,
              placeholder: "Street parking + Wilson car park 2 min walk. Closest station: [name], 5 min walk. Bike racks at [location].",
              renderStyle: "plain",
            },
          ],
        },
      ],
      servicesLabel: "Dining Experiences",
    },
  ),

  Education: makeSchema(
    "Australian education provider",
    "Virtual assistant for an Australian education provider. Answers enrolment questions, shares program info, schedules tours and interviews, supports student admin.",
    {
      knowledgeExtras: [
        {
          title: "Provider Details",
          fields: [
            { key: "providerType", label: "Provider Type", type: "text", placeholder: "RTO / TAFE / University / Tutoring" },
          ],
        },
        {
          title: "Programs",
          fields: [
            {
              key: "programs",
              label: "Programs / Courses",
              type: "kvList",
              keyLabel: "Program",
              valueLabel: "AQF / Duration / Intake",
              keyPlaceholder: "Diploma of Business",
              valuePlaceholder: "AQF 5, 12 months, Feb & Jul intake",
              renderStyle: "named-bullets",
            },
          ],
        },
        {
          title: "Fees, Funding & Scholarships",
          fields: [
            {
              key: "feesAndFunding",
              label: "Fees & Funding",
              type: "textarea",
              rows: 4,
              placeholder: "Domestic: $X,XXX/year. International: $XX,XXX/year inc. OSHC. FEE-HELP / VET Student Loans available for eligible courses.",
              renderStyle: "plain",
            },
            {
              key: "scholarships",
              label: "Scholarships",
              type: "kvList",
              keyLabel: "Scholarship",
              valueLabel: "Eligibility / Amount",
              keyPlaceholder: "Academic Excellence Scholarship",
              valuePlaceholder: "ATAR 95+, $5,000 first-year tuition",
              renderStyle: "named-bullets",
            },
            {
              key: "paymentPlans",
              label: "Payment Plans",
              type: "textarea",
              rows: 2,
              placeholder: "Pay per semester or set up monthly direct debit. Late fees apply after due date — contact accounts to vary.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Admission & Pathways",
          fields: [
            {
              key: "englishRequirements",
              label: "English Requirements (per visa subclass / program)",
              type: "textarea",
              rows: 3,
              placeholder: "Diploma: IELTS 5.5 (no band <5.0). Bachelor: IELTS 6.0 (no band <5.5). PTE / TOEFL / Cambridge accepted at equivalent levels.",
              renderStyle: "plain",
            },
            {
              key: "pathways",
              label: "Pathways / Articulation",
              type: "textarea",
              rows: 3,
              placeholder: "Diploma graduates can articulate into 2nd year of a Bachelor with up to 8 units credit. RPL available for industry experience.",
              renderStyle: "plain",
            },
            {
              key: "courseAdvisorUrl",
              label: "Course Advisor Booking URL",
              type: "text",
              placeholder: "https://provider.edu.au/book-an-advisor",
            },
          ],
        },
        {
          title: "Student Experience",
          fields: [
            {
              key: "campusFacilities",
              label: "Campus Facilities",
              type: "list",
              placeholder: "Library with extended hours",
              renderStyle: "bullets",
            },
            {
              key: "wil",
              label: "Work-Integrated Learning / Placements",
              type: "textarea",
              rows: 3,
              placeholder: "Compulsory 240-hour industry placement in final semester. Industry partners include [companies]. Careers team coordinates placements.",
              renderStyle: "plain",
            },
            {
              key: "careersAndEmployability",
              label: "Careers & Employability",
              type: "textarea",
              rows: 2,
              placeholder: "Graduate employment rate 92% (2024). 1:1 careers coaching, employer mock interviews, on-campus career fair.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "International Students",
          fields: [
            {
              key: "intlSupport",
              label: "International Student Support",
              type: "textarea",
              rows: 3,
              placeholder: "Free airport pickup. OSHC enrolment assistance. Welcome week + orientation. Visa info via registered migration agent only — we do not give migration advice.",
              renderStyle: "plain",
            },
          ],
        },
      ],
      servicesLabel: "Programs Offered",
    },
  ),

  "Course / Program": makeSchema(
    "Australian course or training program",
    "Information-only agent for a single course or program (university, TAFE / RTO, bootcamp, online platform, professional training, language school, or continuing education). Answers prospective student questions ABOUT this specific offering and points to the next step (info session, advisor call, application, or enrolment).",
    {
      systemExtras: [
        {
          title: "Scope of the Agent",
          description: "Information-only. Not a support, troubleshooting, or admin agent.",
          fields: [
            {
              key: "scopeDirective",
              label: "Scope Directive",
              type: "textarea",
              rows: 4,
              placeholder:
                "You are an INFORMATION agent for this course only. You answer factual questions about content, structure, fees, intakes, entry requirements, outcomes and next steps. You do NOT troubleshoot, take ownership of issues, change enrolments, process refunds, recover passwords, or act as student support. For anything that requires action on a student's account or that goes beyond information, hand off to a human team.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Course Compliance",
          description: "Stay within scope of this course; defer admission, accreditation, and visa decisions.",
          fields: [
            {
              key: "courseComplianceDirective",
              label: "Compliance Directive",
              type: "textarea",
              rows: 4,
              placeholder:
                "Never promise admission, scholarship, credit transfer, accreditation outcomes, or visa outcomes. Refer admission decisions to the admissions team. Refer visa or migration questions to a registered migration agent (MARA). Do not advise on offerings outside this knowledge base — offer to connect to the broader sales / admissions team.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Lead Qualification",
          description: "What to collect from prospects, in order, when natural.",
          fields: [
            {
              key: "leadQualification",
              label: "Lead Qualification Checklist",
              type: "list",
              placeholder: "Domestic / international / onshore-international",
              renderStyle: "bullets",
            },
            {
              key: "ctaGuidance",
              label: "Next-Step Guidance",
              type: "textarea",
              rows: 3,
              placeholder:
                "After 2-3 substantive questions, suggest one next step matched to the prospect's stage: download the course brochure / syllabus, register for the next info session or webinar, book a 1:1 advisor call, or start the application / enrolment.",
              renderStyle: "plain",
            },
          ],
        },
      ],
      knowledgeExtras: [
        {
          title: "Provider",
          fields: [
            {
              key: "providerName",
              label: "Provider Name",
              type: "text",
              placeholder: "University of Sydney / General Assembly / Le Wagon / TAFE NSW",
            },
            {
              key: "providerType",
              label: "Provider Type",
              type: "text",
              placeholder: "University / TAFE / RTO / Bootcamp / Online platform / Private trainer",
            },
            {
              key: "departmentOrTrack",
              label: "Department / Faculty / Track",
              type: "text",
              placeholder: "Business School / Data Engineering Track / Hospitality Faculty",
            },
            { key: "campusLocations", label: "Locations / Delivery Sites", type: "list", placeholder: "Sydney CBD", renderStyle: "bullets" },
          ],
        },
        {
          title: "Course Snapshot",
          fields: [
            { key: "courseName", label: "Course / Program Name", type: "text", placeholder: "Bachelor of Business / Data Science Bootcamp / Cert IV in Hospitality" },
            { key: "courseCode", label: "Course Code", type: "text", placeholder: "BUSS1000 / DS-FT-2026" },
            { key: "aqfLevel", label: "AQF / Accreditation Level", type: "text", placeholder: "AQF 7 (Bachelor) / Non-accredited / Cert IV / Microcredential" },
            { key: "duration", label: "Duration", type: "text", placeholder: "3 years full-time / 12-week intensive / 40 hours self-paced" },
            {
              key: "studyModes",
              label: "Study Modes",
              type: "list",
              placeholder: "On-campus full-time",
              renderStyle: "bullets",
            },
            {
              key: "intakes",
              label: "Intakes / Cohorts",
              type: "kvList",
              keyLabel: "Intake",
              valueLabel: "Start Date / Application or Enrolment Deadline",
              keyPlaceholder: "March 2026 cohort",
              valuePlaceholder: "Starts 9 Mar 2026, enrol by 1 Mar",
              renderStyle: "named-bullets",
            },
            {
              key: "languageOfDelivery",
              label: "Language of Delivery",
              type: "text",
              placeholder: "English",
            },
          ],
        },
        {
          title: "Curriculum",
          description: "Modules, units, specialisations, electives — the structure of the course.",
          fields: [
            {
              key: "majors",
              label: "Specialisations / Tracks / Majors",
              type: "kvList",
              keyLabel: "Specialisation",
              valueLabel: "Description",
              keyPlaceholder: "Backend Engineering",
              valuePlaceholder: "APIs, databases, deployment — Python / Django focus",
              renderStyle: "named-bullets",
            },
            {
              key: "coreUnits",
              label: "Core Modules / Units",
              type: "kvList",
              keyLabel: "Module / Unit",
              valueLabel: "Summary",
              keyPlaceholder: "Week 1-3: Python Fundamentals",
              valuePlaceholder: "Variables, control flow, functions, debugging — daily exercises + capstone",
              renderStyle: "named-bullets",
            },
            {
              key: "electives",
              label: "Electives / Optional Modules",
              type: "list",
              placeholder: "Cloud Deployment with AWS",
              renderStyle: "bullets",
            },
            {
              key: "creditPoints",
              label: "Structure / Hours / Credit Points",
              type: "textarea",
              rows: 2,
              placeholder: "144 credit points (uni) / 480 contact hours (bootcamp) / 40 hours self-paced (microcredential). Standard load and pacing notes.",
              renderStyle: "plain",
            },
            {
              key: "assessments",
              label: "Assessments",
              type: "textarea",
              rows: 2,
              placeholder: "Weekly coding challenges, 2 group projects, final capstone presented to industry panel. No exam.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Course Schedule",
          description: "Week-by-week (or session-by-session) plan: topics, activities, and assessment due dates.",
          fields: [
            {
              key: "courseSchedule",
              label: "Course Schedule",
              type: "kvList",
              keyLabel: "Week / Session / Date",
              valueLabel: "Topic / Activities / Assessment Due",
              keyPlaceholder: "Week 1 (24-28 Feb 2026)",
              valuePlaceholder:
                "Intro to Circuits — KVL & KCL. Lab 1 (resistors). Quiz 1 due Sun 11pm.",
              renderStyle: "named-bullets",
            },
            {
              key: "scheduleNotes",
              label: "Schedule Notes",
              type: "textarea",
              rows: 3,
              placeholder:
                "Mid-term break Week 6 — no classes. Public holidays observed (no class on ANZAC Day). Schedule subject to change — confirmed weekly via the LMS announcements.",
              renderStyle: "plain",
            },
            {
              key: "keyDates",
              label: "Key Dates",
              type: "kvList",
              keyLabel: "Event",
              valueLabel: "Date",
              keyPlaceholder: "Census date",
              valuePlaceholder: "31 Mar 2026",
              renderStyle: "named-bullets",
            },
          ],
        },
        {
          title: "Learning & Career Outcomes",
          fields: [
            {
              key: "learningOutcomes",
              label: "Learning Outcomes",
              type: "list",
              placeholder: "Apply quantitative and qualitative methods to solve business problems",
              renderStyle: "bullets",
            },
            {
              key: "careerOutcomes",
              label: "Typical Graduate Roles",
              type: "kvList",
              keyLabel: "Role",
              valueLabel: "Industry / Employer Examples",
              keyPlaceholder: "Financial Analyst",
              valuePlaceholder: "Big-4 banks, consulting (Deloitte, EY, KPMG), fintech",
              renderStyle: "named-bullets",
            },
            {
              key: "graduateOutcomeStats",
              label: "Graduate / Completion Outcome Stats",
              type: "textarea",
              rows: 2,
              placeholder:
                "92% employment within 4 months of completion (QILT 2024 / internal cohort survey). Median starting salary $72,000. Completion rate 87%.",
              renderStyle: "plain",
            },
            {
              key: "certificationOnCompletion",
              label: "Certificate / Credential Awarded",
              type: "textarea",
              rows: 2,
              placeholder:
                "Bachelor of Business (testamur). / Statement of Attainment for nationally recognised units. / Provider-issued certificate of completion + LinkedIn-shareable digital badge.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Entry Requirements",
          fields: [
            {
              key: "domesticEntry",
              label: "Domestic / General Entry",
              type: "textarea",
              rows: 4,
              placeholder:
                "Higher ed example: ATAR 85 (2025), Math Advanced Band 4 recommended; non-recent leavers via STAT / VET pathway.\nBootcamp example: open to all backgrounds; no prior coding required; basic numeracy + English.\nVET example: completed Year 10 OR equivalent work experience; LLN test on enrolment.",
              renderStyle: "plain",
            },
            {
              key: "internationalEntry",
              label: "International Entry",
              type: "textarea",
              rows: 4,
              placeholder:
                "Equivalent of Australian Year 12 / relevant work experience. Country-specific equivalents at [link]. Foundation pathway available.",
              renderStyle: "plain",
            },
            {
              key: "englishRequirements",
              label: "English Requirements",
              type: "textarea",
              rows: 3,
              placeholder:
                "IELTS Academic 6.5 (no band <6.0). PTE Academic 58 (no <50). TOEFL iBT 85. Cambridge C1 Advanced 176. Bootcamps: business-fluent English, demonstrated in interview.",
              renderStyle: "plain",
            },
            {
              key: "additionalRequirements",
              label: "Additional Requirements",
              type: "list",
              placeholder: "Personal statement / portfolio / interview / coding challenge",
              renderStyle: "bullets",
            },
            {
              key: "rplCreditTransfer",
              label: "RPL / Credit Transfer / Advanced Standing",
              type: "textarea",
              rows: 2,
              placeholder:
                "Up to 1 year credit for prior tertiary study, recognised diploma, or industry experience. Assessed individually after application — no commitments via chat.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Fees, Funding & Scholarships",
          fields: [
            {
              key: "domesticFees",
              label: "Domestic / Standard Fees",
              type: "textarea",
              rows: 4,
              placeholder:
                "Higher ed: CSP $X,XXX/yr (Band 4) + HECS-HELP. Full-fee $XX,XXX/yr.\nBootcamp: $14,990 inc. GST (full-time, 12 weeks). Early-bird $1,500 off.\nMicrocredential: $499 self-paced. Cohort version $999 inc. live workshops.",
              renderStyle: "plain",
            },
            {
              key: "internationalFees",
              label: "International Fees",
              type: "textarea",
              rows: 4,
              placeholder:
                "Indicative tuition $XX,XXX per year (2026). Total program $XXX,XXX. Plus OSHC ~$700/yr, SSAF ~$330. Fees increase ~3-5% annually.",
              renderStyle: "plain",
            },
            {
              key: "fundingOptions",
              label: "Funding / Loans / Subsidies",
              type: "list",
              placeholder: "HECS-HELP (CSP students)",
              hint: "List the schemes available for this specific course (e.g. FEE-HELP, VET Student Loans, Smart and Skilled NSW, Skills First VIC, Free TAFE, Skills Checkpoint, employer reimbursement, ISA).",
              renderStyle: "bullets",
            },
            {
              key: "courseScholarships",
              label: "Scholarships / Discounts for This Course",
              type: "kvList",
              keyLabel: "Scholarship / Discount",
              valueLabel: "Eligibility / Amount",
              keyPlaceholder: "Women in Tech Scholarship",
              valuePlaceholder: "Identifying women, $2,500 off bootcamp tuition",
              renderStyle: "named-bullets",
            },
            {
              key: "paymentOptions",
              label: "Payment Options",
              type: "textarea",
              rows: 3,
              placeholder:
                "Pay upfront (5% off), per semester / per module, or monthly direct debit. Domestic: HECS-HELP / FEE-HELP / VET Student Loans for eligible students. International: pay before census date each semester. BNPL (Zip / Afterpay) available for short courses under $2k.",
              renderStyle: "plain",
            },
            {
              key: "refundPolicy",
              label: "Refund / Withdrawal Policy",
              type: "textarea",
              rows: 3,
              placeholder:
                "Cooling-off period 7 days from enrolment for full refund. Pro-rata refund before census date. After census date: per provider Refund Policy (link). International students: per CRICOS Standards.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Differentiators & Accreditation",
          fields: [
            {
              key: "rankings",
              label: "Rankings & Recognition",
              type: "list",
              placeholder: "Ranked #1 in Australia for Accounting & Finance — QS 2025",
              renderStyle: "bullets",
            },
            {
              key: "professionalAccreditation",
              label: "Professional Accreditation",
              type: "list",
              placeholder: "CPA Australia (accredited)",
              renderStyle: "bullets",
            },
            {
              key: "industryPartners",
              label: "Industry Partners",
              type: "list",
              placeholder: "Deloitte",
              renderStyle: "bullets",
            },
            {
              key: "alumniHighlights",
              label: "Alumni / Graduate Highlights",
              type: "textarea",
              rows: 2,
              placeholder:
                "Alumni hold senior roles at ASX 200 / FAANG / leading startups. Recent grads placed at [companies]. Network of 5,000+ across cohorts.",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Practical Experience & Pathways",
          fields: [
            {
              key: "wilPlacements",
              label: "Internships / WIL / Capstone",
              type: "textarea",
              rows: 3,
              placeholder:
                "Higher ed: 240-hour industry placement in final year, partner firms include [list].\nBootcamp: client capstone project on a real brief from a partner company.\nVET: workplace-based assessment in a host business.",
              renderStyle: "plain",
            },
            {
              key: "honoursPathway",
              label: "Articulation / Next Step",
              type: "textarea",
              rows: 2,
              placeholder:
                "Pathway into Master's / Honours / advanced bootcamp / professional certification (CPA, ACS, AWS Certified, etc.).",
              renderStyle: "plain",
            },
            {
              key: "exchangeOptions",
              label: "Exchange / Study Abroad / Global Cohort",
              type: "textarea",
              rows: 2,
              placeholder:
                "Semester or year-long exchange at 200+ partner unis (higher ed). Online cohort spans 30+ countries (bootcamp / online).",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "Application / Enrolment & Next Steps",
          fields: [
            {
              key: "applicationProcess",
              label: "Application or Enrolment Process",
              type: "textarea",
              rows: 5,
              placeholder:
                "Higher ed (domestic recent leavers): apply via UAC.\nHigher ed (other): direct online application + transcripts + ID + English test (intl) + personal statement.\nBootcamp / short course: online enrolment form + payment / deposit; interview for selective programs.\nVET: enrolment form + USI + LLN test.",
              renderStyle: "plain",
            },
            {
              key: "applicationDeadlines",
              label: "Deadlines",
              type: "kvList",
              keyLabel: "Intake / Cohort",
              valueLabel: "Domestic / International Deadline",
              keyPlaceholder: "March 2026",
              valuePlaceholder: "Domestic 1 Mar / International 1 Feb",
              renderStyle: "named-bullets",
            },
            {
              key: "applicationUrl",
              label: "Application / Enrolment URL",
              type: "text",
              placeholder: "https://provider.edu.au/apply",
            },
            {
              key: "brochureUrl",
              label: "Course Brochure / Syllabus URL",
              type: "text",
              placeholder: "https://provider.edu.au/courses/.../brochure.pdf",
            },
          ],
        },
        {
          title: "Advisors & Info Sessions",
          fields: [
            {
              key: "courseAdvisor",
              label: "Course Advisor Contact",
              type: "textarea",
              rows: 2,
              placeholder:
                "Sarah Chen — Senior Course Advisor. Book a 15-min call: https://provider.edu.au/advisor. Response time 1 business day.",
              renderStyle: "plain",
            },
            {
              key: "infoSessions",
              label: "Info Sessions / Open Days / Webinars",
              type: "kvList",
              keyLabel: "Event",
              valueLabel: "Date / Format / Registration",
              keyPlaceholder: "Live webinar — Meet the Instructors",
              valuePlaceholder: "Wed 12 Mar 2026 6pm AEDT, Zoom — register at [link]",
              renderStyle: "named-bullets",
            },
            {
              key: "campusTours",
              label: "Campus Tours / Try-a-Lesson",
              type: "textarea",
              rows: 2,
              placeholder:
                "Free guided campus tours every Friday 11am (higher ed). Free trial lesson / sample module (bootcamp / online). Self-guided tour app at [link].",
              renderStyle: "plain",
            },
          ],
        },
        {
          title: "International / Remote Student Support",
          fields: [
            {
              key: "intlStudentSupport",
              label: "Onshore / Remote Support",
              type: "textarea",
              rows: 3,
              placeholder:
                "Higher ed: airport pickup, OSHC enrolment, accommodation referral, orientation week.\nOnline / bootcamp: timezone-friendly cohort options, recorded sessions, async support, Slack community 24/7.\nMigration advice ONLY via registered MARA agents.",
              renderStyle: "plain",
            },
            {
              key: "agentNetwork",
              label: "Education Agents / Referral Partners",
              type: "textarea",
              rows: 2,
              placeholder:
                "Approved education / referral agents in 40+ countries. Find one: https://provider.edu.au/agents. Working with an agent does not affect application outcome.",
              renderStyle: "plain",
            },
          ],
        },
      ],
      servicesLabel: "Course at a Glance",
    },
  ),

  Other: makeSchema(
    "Australian small business",
    "Customer service assistant for an Australian small business. Answers common questions, qualifies enquiries, books appointments or callbacks, routes requests to the right team.",
    {
      knowledgeExtras: [
        {
          title: "Trading & Compliance",
          fields: [
            { key: "publicLiability", label: "Public Liability", type: "text", placeholder: "$20M" },
            { key: "paymentTerms", label: "Payment Terms", type: "text", placeholder: "Net 14 from invoice date" },
            {
              key: "industriesServed",
              label: "Industries / Clients Served",
              type: "list",
              placeholder: "Construction",
              renderStyle: "bullets",
            },
          ],
        },
        {
          title: "Engagement",
          fields: [
            {
              key: "bookingUrl",
              label: "Consultation / Booking URL",
              type: "text",
              placeholder: "https://business.com.au/book",
            },
            {
              key: "process",
              label: "How We Work",
              type: "textarea",
              rows: 4,
              placeholder: "1. Enquiry → reply within 1 business day. 2. Free 15-min discovery call. 3. Written proposal. 4. Booking + 30% deposit. 5. Delivery. 6. Follow-up.",
              renderStyle: "plain",
            },
            {
              key: "testimonialsNotes",
              label: "Testimonials / Case Studies",
              type: "textarea",
              rows: 3,
              placeholder: "Featured on Google (4.9★ from 120 reviews). Case studies at /case-studies. Refer-a-friend $XX credit.",
              renderStyle: "plain",
            },
          ],
        },
      ],
    },
  ),
};

export function getFormSchema(industry: string): FormSchema | null {
  return schemas[industry] ?? null;
}

// ─── Default values ───

function emptyConfig(industry: string): FormState {
  const schema = getFormSchema(industry);
  if (!schema) return {};
  const state: FormState = {};
  for (const section of [...schema.systemPrompt, ...schema.knowledgeBase]) {
    for (const f of section.fields) {
      if (f.type === "list") state[f.key] = [];
      else if (f.type === "kvList") state[f.key] = [];
      else state[f.key] = "";
    }
  }
  return state;
}

export function defaultConfig(industry: string): FormState {
  const state = emptyConfig(industry);
  const seed = defaultSeeds[industry];
  if (seed) Object.assign(state, seed);
  return state;
}

const defaultSeeds: Record<string, Partial<FormState>> = {
  Healthcare: {
    role: "Virtual receptionist for an Australian medical clinic. Books, reschedules, and cancels appointments; answers clinic questions; provides pre-appointment instructions; triages urgency.",
    rules: [
      "Be empathetic, professional, and concise (1-3 sentences for chat)",
      "Verify identity (full name + DOB) before sharing appointment details",
      "Confirm bookings with date, time, doctor, and ask the patient to arrive 10 min early with their Medicare card",
      "Use Australian English and AEST/AEDT for times",
    ],
    forbidden: [
      "Never provide medical diagnoses, prescriptions, or medication advice",
      "Never disclose another patient's information",
      "Never guarantee a specific clinical outcome",
    ],
    escalation: [
      "Distressed patient or mental health crisis",
      "Billing or Medicare disputes",
      "Complex clinical questions",
      "Complaints",
      "Requests for medical certificates",
    ],
    emergencyDirective:
      "If the patient describes chest pain, breathing difficulty, severe bleeding, or suicidal thoughts: direct to 000 immediately. After-hours non-emergencies: 13SICK (13 7425) or nearest ED.",
  },
  Automotive: {
    role: "Virtual assistant for an Australian car dealership. Helps with test drives, service bookings, vehicle enquiries, trade-in estimates, and finance overview.",
    rules: [
      "Be professional, courteous, and clear — you represent the dealership",
      "Keep replies short for chat (1-3 sentences)",
      "Use Australian English. No slang or familiar address — this is a service interaction, not a friendly chat",
      "Give ballpark prices only and recommend visiting for the final drive-away figure",
      "Confirm rego state for service bookings",
    ],
    forbidden: [
      "Never lock in exact prices, finance rates, or trade-in values via chat",
      "Never diagnose mechanical issues remotely — book a service",
    ],
    escalation: [
      "Price negotiation",
      "Finance / loan paperwork",
      "Warranty or Australian Consumer Law claims",
      "Accident damage",
    ],
  },
  "Real Estate": {
    role: "Virtual property assistant for an Australian real estate agency. Helps buyers and renters find properties, answers listing questions, schedules inspections, qualifies leads.",
    rules: [
      "Be warm, enthusiastic, and genuinely helpful",
      "Keep concise for chat (1-3 sentences); offer email for detailed info",
      "Use AUD with commas ($1,250,000) and 'pw' for rentals",
      "Collect from buyers: budget, suburbs, bedrooms, timeline, finance pre-approval",
      "Collect from renters: weekly budget, move-in date, household, pets, employment",
    ],
    forbidden: [
      "Never guarantee property values, capital growth, or rental yields",
      "Never share vendor or landlord personal details",
    ],
    escalation: [
      "Formal offers and contracts (Section 32 / Form 1)",
      "Settlement questions",
      "Tenancy disputes",
      "Vendor enquiries",
      "Complaints",
    ],
  },
  "E-commerce & Retail": {
    role: "Customer support assistant for an Australian online retailer. Tracks orders, processes returns and exchanges, answers product questions, resolves delivery issues, handles discount codes.",
    rules: [
      "Be polite, efficient, and solution-oriented",
      "Keep concise for chat (1-3 sentences) and always provide the next actionable step",
      "For returns: confirm order number, reason, preferred resolution",
      "Apologise sincerely for mistakes — don't blame carriers",
      "Set clear expectations: 'I'll investigate and get back to you within 24 hours (business days).'",
    ],
    forbidden: [
      "Never share customer PII via chat",
      "Never process card payments via chat",
    ],
    escalation: [
      "Refunds over $200",
      "Third attempt on the same issue",
      "Manager request",
      "ACCC or legal threats",
      "Chargebacks",
    ],
  },
  "Trades & Services": {
    role: "Booking assistant for an Australian trades business. Schedules jobs, gives rough quotes, confirms appointments, follows up on completed work.",
    rules: [
      "Be practical, straightforward, and reliable",
      "Keep concise for chat (1-3 sentences)",
      "Collect: full name, site address, issue description, access details, preferred date/time",
      "Give price ranges only — final quote after on-site inspection",
      "Confirm licence and insurance on request",
    ],
    forbidden: [
      "Never lock in a fixed price without on-site inspection",
      "Never give DIY safety advice for gas or electrical hazards — advise to isolate supply and book urgent attendance",
    ],
    escalation: [
      "Quotes over $5,000",
      "Complaints",
      "Insurance or warranty claims",
      "Safety incidents",
      "Builder licensing disputes",
    ],
  },
  Hospitality: {
    role: "Booking assistant for an Australian restaurant / bar. Takes and modifies reservations, answers menu and dietary questions, helps with event enquiries.",
    rules: [
      "Be warm, welcoming, and enthusiastic about the dining experience",
      "Keep concise for chat (1-3 sentences)",
      "Collect for bookings: name, date, time, guests, special requests, contact number",
      "Confirm: 'Booked! [Name], [date] at [time] for [X] guests.'",
      "Note dietary requirements and ID-on-arrival rules per RSA",
    ],
    forbidden: [
      "Never guarantee specific table locations — note as 'request'",
      "Never promote alcohol to anyone who appears underage",
    ],
    escalation: [
      "Group bookings of 10+",
      "Dining complaints",
      "Gift voucher disputes",
      "Large cancellations",
      "Lost property",
    ],
  },
  Education: {
    role: "Virtual assistant for an Australian education provider. Answers enrolment questions, shares program info, schedules tours and interviews, supports student admin.",
    rules: [
      "Be patient, encouraging, and clear",
      "Keep concise for chat (1-3 sentences); offer email or call-back for detailed info",
      "Use Australian English and local terms (ATAR, AQF, TAFE, RTO, CRICOS)",
      "For international students, mention CRICOS code, GTE/Genuine Student requirements, OSHC",
      "Quote fees in AUD and clarify GST status",
    ],
    forbidden: [
      "Never promise admission, scholarships, or visa outcomes",
      "Never give migration advice — refer to a registered migration agent",
    ],
    escalation: [
      "Complaints",
      "Special consideration / academic appeals",
      "Refund requests",
      "Welfare or safeguarding concerns",
      "Visa / CoE issues",
    ],
  },
  "Course / Program": {
    role: "Information-only agent for a single Australian course or program. Answers prospective student questions ABOUT this specific offering and points to the next step (info session, webinar, advisor call, application or enrolment). This is not a support agent, not a troubleshooting agent, and not a student-admin agent.",
    rules: [
      "You are an INFORMATION agent — answer factual questions about THIS course (content, structure, fees, intakes, entry, outcomes, next steps). For anything beyond information, hand off to a human.",
      "Stay on this course only — if asked about another program, offer to connect to the broader admissions / sales team",
      "Be encouraging and clear. Keep replies concise (2-4 sentences for chat); offer email follow-up for detailed comparisons",
      "Use Australian English and the right local terms for the provider type (ATAR, AQF, CRICOS, HECS-HELP, FEE-HELP, VET Student Loans, OSHC, census date, USI, RPL)",
      "Quote tuition in AUD with the year and intake (e.g. 'indicative for March 2026 cohort') and clarify domestic vs international when relevant",
      "If a question can't be answered from this course's information, say so plainly and offer the right human contact",
      "When the prospect has shared 2-3 substantive details, offer one concrete next step matched to their stage",
      "For international prospects, mention CRICOS code, English requirements, and OSHC up front when applicable",
    ],
    forbidden: [
      "Never act as student support — no troubleshooting LMS, login, payment portal, exam access, timetable, or technical issues",
      "Never take action on a student's account (no enrolment changes, withdrawals, refunds, deferrals, special consideration, transcript requests)",
      "Never solve problems or give workarounds — escalate every issue to the right human team",
      "Never promise admission, scholarship outcomes, credit transfer amounts, accreditation, or visa approval",
      "Never give migration advice — refer to a registered MARA migration agent",
      "Never disparage other providers or courses",
      "Never quote a fee without flagging it as indicative and tied to a specific intake year",
      "Never claim guaranteed employment or salary outcomes",
    ],
    escalation: [
      "Special consideration, equity, or disability adjustment requests",
      "Complaints or academic appeals",
      "Refund requests or fee disputes",
      "Welfare or safeguarding concerns (mental health, harassment, financial hardship)",
      "Visa, CoE, or immigration questions",
      "Complex credit-transfer / RPL assessments",
      "Group / corporate / sponsored-cohort or B2B training enrolments",
    ],
    scopeDirective:
      "You are an INFORMATION agent for this course only. You answer factual questions about content, structure, fees, intakes, entry requirements, outcomes and next steps. You do NOT troubleshoot, take ownership of issues, change enrolments, process refunds, recover passwords, or act as student support. For anything that requires action on a student's account or that goes beyond information, hand off to a human team.",
    courseComplianceDirective:
      "Never promise admission, scholarship, credit transfer, accreditation, or visa outcomes. Refer admission decisions to the admissions team. Refer visa or migration questions to a registered migration agent (MARA). Do not advise on offerings outside this knowledge base — offer to connect to the broader sales / admissions team.",
    leadQualification: [
      "Domestic, international (offshore), or international (onshore)?",
      "Target intake / cohort start date",
      "Highest qualification completed and / or relevant work experience",
      "ATAR / equivalent (domestic higher ed) or country + qualification (international)",
      "English test taken / planned (international)",
      "Preferred study mode (on-campus / online / blended / self-paced)",
      "Decision timeline (researching / shortlisted / ready to enrol)",
      "Funding / payment intent (self-pay / HECS-HELP / VET Student Loans / employer-funded)",
    ],
    ctaGuidance:
      "Match the next step to the prospect's stage:\n- Researching → 'Download the course brochure / syllabus' or 'Register for the next info session / webinar'\n- Shortlisted → 'Book a 15-min call with our course advisor' or 'Try a free sample module / lesson'\n- Ready → 'Start your application / enrolment' (link to the right pathway: UAC for domestic recent leavers in higher ed, direct online enrolment for short courses / bootcamps, agent network for international)",
  },
  Other: {
    role: "Customer service assistant for an Australian small business. Answers common questions, qualifies enquiries, books appointments or callbacks, routes requests to the right team.",
    rules: [
      "Match the business's tone (warm, professional, helpful)",
      "Keep concise for chat (1-3 sentences)",
      "Use Australian English, AUD for pricing, AEST/AEDT for times",
      "Collect: name, contact, reason for enquiry, preferred follow-up time",
      "Set clear expectations: 'Someone from the team will be in touch within one business day.'",
    ],
    forbidden: [
      "Never share customer data via chat",
      "Never process payments or commit to pricing without confirmation",
    ],
    escalation: [
      "Complaints",
      "Refunds",
      "Legal or compliance questions",
      "Anything urgent or sensitive",
      "Repeat unresolved issues",
    ],
  },
};

// ─── Compose markdown from form state ───

function trimStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function listItems(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === "string" ? x.trim() : "")).filter(Boolean);
}

function pairItems(v: unknown): Pair[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => ({
      key: typeof x?.key === "string" ? x.key.trim() : "",
      value: typeof x?.value === "string" ? x.value.trim() : "",
    }))
    .filter((p) => p.key || p.value);
}

function renderField(field: FormField, value: FormValue): string {
  if (field.type === "text" || field.type === "textarea") {
    const v = trimStr(value);
    if (!v) return "";
    if (field.renderStyle === "plain") return v;
    return `**${field.label}:** ${v}`;
  }
  if (field.type === "list") {
    const items = listItems(value);
    if (items.length === 0) return "";
    const bullets = items.map((i) => `- ${i}`).join("\n");
    return `**${field.label}:**\n${bullets}`;
  }
  if (field.type === "kvList") {
    const items = pairItems(value);
    if (items.length === 0) return "";
    if (field.renderStyle === "qa") {
      return items.map(({ key, value }) => `Q: ${key}\nA: ${value}`).join("\n\n");
    }
    if (field.renderStyle === "named-bullets") {
      return items.map(({ key, value }) => (value ? `- **${key}** — ${value}` : `- **${key}**`)).join("\n");
    }
    return items.map(({ key, value }) => `- ${key}: ${value}`).join("\n");
  }
  return "";
}

function renderSection(section: FormSection, state: FormState): string {
  const blocks = section.fields.map((f) => renderField(f, state[f.key])).filter(Boolean);
  if (blocks.length === 0) return "";
  return `## ${section.title}\n\n${blocks.join("\n\n")}`;
}

export function composeSystemPrompt(industry: string, state: FormState): string {
  const schema = getFormSchema(industry);
  if (!schema) return "";
  const businessName = trimStr(state.businessName);
  const opener = businessName ? `You are the AI assistant for ${businessName}.` : "You are an AI customer service assistant.";
  const sections = schema.systemPrompt.map((s) => renderSection(s, state)).filter(Boolean);
  return [opener, ...sections].join("\n\n");
}

export function composeKnowledgeBase(industry: string, state: FormState): string {
  const schema = getFormSchema(industry);
  if (!schema) return "";
  return schema.knowledgeBase.map((s) => renderSection(s, state)).filter(Boolean).join("\n\n");
}
