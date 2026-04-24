import { z } from "zod";

export const onboardingSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(100),
  industry: z.string().min(1, "Industry is required"),
  website: z.string().url().or(z.literal("")).optional().default(""),
  agentName: z.string().max(50).optional().default(""),
  agentTone: z.string().optional().default("professional"),
  phone: z.string().max(20).optional().default(""),
});

export const agentSchema = z.object({
  name: z.string().min(1, "Agent name is required").max(50),
  tone: z.enum(["PROFESSIONAL", "FRIENDLY", "CASUAL"]).default("PROFESSIONAL"),
  industry: z.string().max(50).nullable().optional(),
  systemPrompt: z.string().max(10000).nullable().optional(),
  knowledgeBase: z.string().max(50000).nullable().optional(),
});

export const settingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required").max(100),
  timezone: z.string().min(1),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(12, "Minimum 12 characters"),
});

export const tenantSchema = z.object({
  name: z.string().min(1, "Business name is required").max(100),
  industry: z.string().min(1, "Industry is required"),
  plan: z.enum(["STARTER", "GROWTH", "ENTERPRISE"]).default("STARTER"),
  ownerName: z.string().min(1, "Owner name is required").max(100),
  ownerEmail: z.string().email("Valid email required"),
});

export const addUserSchema = z.object({
  businessId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Valid email required"),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]).default("MEMBER"),
});

export const channelConfigSchema = z.object({
  channel: z.enum(["MESSENGER", "INSTAGRAM", "WEBCHAT", "WHATSAPP"]),
  externalId: z.string().min(1, "External ID is required"),
  credentials: z.string().min(1, "Credentials are required"),
  agentId: z.string().min(1, "Agent is required"),
});

export const webchatConfigSchema = z.object({
  agentId: z.string().min(1, "Agent is required"),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Hex color like #8B5CF6").default("#8B5CF6"),
  title: z.string().min(1).max(40).default("Chat"),
  welcomeMessage: z.string().min(1).max(200).default("Hi! How can we help?"),
  position: z.enum(["left", "right"]).default("right"),
  collectVisitor: z.enum(["off", "optional", "required"]).default("off"),
  offlineMode: z.enum(["off", "always"]).default("off"),
  allowedOrigins: z.array(z.string().url()).min(1, "At least one allowed origin is required"),
});

export const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.string(),
    content: z.string().max(5000),
  })).max(50),
  systemPrompt: z.string().max(10000).optional().default(""),
  knowledgeBase: z.string().max(50000).optional().default(""),
  agentName: z.string().max(50).optional().default(""),
  tone: z.string().optional().default("PROFESSIONAL"),
});
