// ─── Seed data for dashboard UI ───
// This will be replaced by real DB queries once Prisma is connected.

export interface Agent {
  id: string;
  name: string;
  tone: "professional" | "friendly" | "casual";
  status: "active" | "paused" | "draft";
  industry: string;
  conversationsToday: number;
  conversionRate: number;
}

export interface Conversation {
  id: string;
  contact: string;
  phone: string;
  agentId: string;
  agentName: string;
  status: "active" | "resolved" | "escalated";
  lastMessage: string;
  updatedAt: string;
  messages: number;
  sentiment: "positive" | "neutral" | "negative";
}

export interface DashboardMetrics {
  totalConversations: number;
  conversationsChange: number;
  activeAgents: number;
  responseTime: string;
  responseTimeChange: number;
  conversionRate: number;
  conversionChange: number;
  messagesThisMonth: number;
  messagesChange: number;
}

export const seedAgents: Agent[] = [
  {
    id: "agent-1",
    name: "Sam",
    tone: "professional",
    status: "active",
    industry: "Healthcare",
    conversationsToday: 47,
    conversionRate: 34,
  },
  {
    id: "agent-2",
    name: "Alex",
    tone: "friendly",
    status: "active",
    industry: "Real Estate",
    conversationsToday: 31,
    conversionRate: 28,
  },
  {
    id: "agent-3",
    name: "Jordan",
    tone: "casual",
    status: "active",
    industry: "Automotive",
    conversationsToday: 22,
    conversionRate: 41,
  },
  {
    id: "agent-4",
    name: "Support Bot",
    tone: "professional",
    status: "paused",
    industry: "E-commerce & Retail",
    conversationsToday: 0,
    conversionRate: 19,
  },
  {
    id: "agent-5",
    name: "Bookings",
    tone: "friendly",
    status: "draft",
    industry: "Hospitality",
    conversationsToday: 0,
    conversionRate: 0,
  },
];

export const seedConversations: Conversation[] = [
  {
    id: "conv-1",
    contact: "Sarah Mitchell",
    phone: "+61 412 345 678",
    agentId: "agent-1",
    agentName: "Sam",
    status: "active",
    lastMessage: "Yes, I'd like to book an appointment for next Thursday at 2pm please.",
    updatedAt: "2 min ago",
    messages: 8,
    sentiment: "positive",
  },
  {
    id: "conv-2",
    contact: "James Cooper",
    phone: "+61 423 456 789",
    agentId: "agent-2",
    agentName: "Alex",
    status: "active",
    lastMessage: "Can you send me photos of the 3-bedroom in Bondi?",
    updatedAt: "5 min ago",
    messages: 12,
    sentiment: "positive",
  },
  {
    id: "conv-3",
    contact: "Emily Watson",
    phone: "+61 434 567 890",
    agentId: "agent-3",
    agentName: "Jordan",
    status: "resolved",
    lastMessage: "Perfect, I'll come in Saturday for the test drive. Thanks!",
    updatedAt: "18 min ago",
    messages: 15,
    sentiment: "positive",
  },
  {
    id: "conv-4",
    contact: "Michael Brown",
    phone: "+61 445 678 901",
    agentId: "agent-1",
    agentName: "Sam",
    status: "escalated",
    lastMessage: "I need to speak with a real person about my billing issue.",
    updatedAt: "32 min ago",
    messages: 6,
    sentiment: "negative",
  },
  {
    id: "conv-5",
    contact: "Lisa Chen",
    phone: "+61 456 789 012",
    agentId: "agent-2",
    agentName: "Alex",
    status: "active",
    lastMessage: "What's the price range for apartments in Surry Hills?",
    updatedAt: "45 min ago",
    messages: 4,
    sentiment: "neutral",
  },
  {
    id: "conv-6",
    contact: "David Turner",
    phone: "+61 467 890 123",
    agentId: "agent-3",
    agentName: "Jordan",
    status: "resolved",
    lastMessage: "Got it, thanks for the service reminder. I'll book online.",
    updatedAt: "1 hr ago",
    messages: 9,
    sentiment: "positive",
  },
  {
    id: "conv-7",
    contact: "Rachel Kim",
    phone: "+61 478 901 234",
    agentId: "agent-1",
    agentName: "Sam",
    status: "active",
    lastMessage: "Do you have any availability this afternoon for a check-up?",
    updatedAt: "1 hr ago",
    messages: 3,
    sentiment: "neutral",
  },
  {
    id: "conv-8",
    contact: "Tom O'Brien",
    phone: "+61 489 012 345",
    agentId: "agent-2",
    agentName: "Alex",
    status: "resolved",
    lastMessage: "Thanks, the inspection on Saturday works for me.",
    updatedAt: "2 hr ago",
    messages: 11,
    sentiment: "positive",
  },
];

export const seedMetrics: DashboardMetrics = {
  totalConversations: 1247,
  conversationsChange: 12.5,
  activeAgents: 3,
  responseTime: "1.4s",
  responseTimeChange: -8.2,
  conversionRate: 34.2,
  conversionChange: 5.1,
  messagesThisMonth: 8432,
  messagesChange: 18.7,
};

export const seedChartData = {
  conversationsPerDay: [
    { day: "Mon", value: 42 },
    { day: "Tue", value: 58 },
    { day: "Wed", value: 51 },
    { day: "Thu", value: 67 },
    { day: "Fri", value: 73 },
    { day: "Sat", value: 35 },
    { day: "Sun", value: 28 },
  ],
  sentimentBreakdown: {
    positive: 64,
    neutral: 24,
    negative: 12,
  },
};
