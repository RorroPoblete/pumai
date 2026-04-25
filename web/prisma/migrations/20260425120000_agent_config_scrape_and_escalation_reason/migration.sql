-- AlterTable: lifetime auto-fill credit counter (3 per business, admin bypass).
ALTER TABLE "Business" ADD COLUMN "scrapeCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable: structured form state for agent System Prompt + Knowledge Base.
ALTER TABLE "Agent" ADD COLUMN "config" JSONB;

-- CreateEnum: classifies why a conversation was escalated to a human.
CREATE TYPE "EscalationReason" AS ENUM ('USER_REQUEST', 'AI_RULE', 'SENTIMENT', 'MANUAL');

-- AlterTable: which signal triggered the escalation.
ALTER TABLE "Conversation" ADD COLUMN "escalationReason" "EscalationReason";
