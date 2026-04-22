import { prisma } from "./prisma";
import { scoped } from "./logger";

const log = scoped("audit");

export type AuditAction =
  // auth
  | "user.register"
  | "user.login"
  | "user.logout"
  | "user.password_changed"
  | "user.consent_updated"
  // admin
  | "admin.tenant_created"
  | "admin.tenant_deleted"
  | "admin.tenant_plan_changed"
  | "admin.user_added_to_tenant"
  | "admin.user_removed_from_tenant"
  | "admin.user_role_changed"
  | "admin.user_deleted"
  | "admin.platform_config_changed"
  | "admin.channel_connected"
  | "admin.channel_disconnected"
  | "admin.channel_toggled"
  // billing
  | "billing.checkout_started"
  | "billing.subscription_created"
  | "billing.subscription_updated"
  | "billing.subscription_canceled"
  | "billing.payment_failed"
  | "billing.portal_opened"
  // channels
  | "channel.connected"
  | "channel.disconnected"
  | "channel.toggled"
  | "channel.agent_changed"
  // agents
  | "agent.created"
  | "agent.updated"
  | "agent.deleted"
  | "agent.toggled"
  // compliance
  | "compliance.data_export"
  | "compliance.account_deleted"
  | "compliance.meta_deletion";

interface WriteOptions {
  actorId?: string | null;
  actorRole?: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string | null;
  userAgent?: string | null;
}

export async function auditWrite(action: AuditAction, opts: WriteOptions = {}): Promise<void> {
  try {
    await prisma.auditEvent.create({
      data: {
        action,
        actorId: opts.actorId ?? null,
        actorRole: opts.actorRole ?? null,
        targetType: opts.targetType ?? null,
        targetId: opts.targetId ?? null,
        metadata: opts.metadata ? (opts.metadata as object) : undefined,
        ip: opts.ip ?? null,
        userAgent: opts.userAgent ?? null,
      },
    });
  } catch (err) {
    log.error({ err, action, opts }, "audit_write_failed");
  }
}
