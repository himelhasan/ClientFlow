import { prisma } from "../db";
import { MessageChannel, MessageType } from "@prisma/client";

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  remaining?: number;
  totalQuota?: number;
  totalUsed?: number;
}

/**
 * Verifies if a business has remaining lead capacity in their billing cycle.
 */
export async function checkLeadQuota(tenantId: string): Promise<QuotaCheckResult> {
  const business = await prisma.business.findUnique({
    where: { id: tenantId },
    select: { leadQuota: true, leadsUsed: true, status: true },
  });

  if (!business) return { allowed: false, reason: "Business tenant not found" };
  if (business.status !== "ACTIVE") return { allowed: false, reason: "Business account is inactive or suspended" };

  const remaining = business.leadQuota - business.leadsUsed;
  if (remaining <= 0) {
    return {
      allowed: false,
      reason: `Lead monthly limit reached (${business.leadsUsed}/${business.leadQuota}). Please upgrade plan.`,
      remaining: 0,
      totalQuota: business.leadQuota,
      totalUsed: business.leadsUsed,
    };
  }

  return {
    allowed: true,
    remaining,
    totalQuota: business.leadQuota,
    totalUsed: business.leadsUsed,
  };
}

/**
 * Checks if an outbound message can be sent for a specific lead without exceeding
 * either the tenant's overall quota or the lead's per-lead allowance (Section 68).
 */
export async function checkMessageQuota(params: {
  tenantId: string;
  leadId?: string;
  channel: MessageChannel;
  messageType: MessageType;
}): Promise<QuotaCheckResult> {
  const { tenantId, leadId, channel } = params;

  const business = await prisma.business.findUnique({
    where: { id: tenantId },
  });

  if (!business) return { allowed: false, reason: "Business tenant not found" };

  // 1. Check tenant channel quota
  let tenantQuota = 0;
  let tenantUsed = 0;

  if (channel === MessageChannel.WHATSAPP) {
    tenantQuota = business.whatsappQuota;
    tenantUsed = business.whatsappUsed;
  } else if (channel === MessageChannel.SMS) {
    tenantQuota = business.smsQuota;
    tenantUsed = business.smsUsed;
  } else if (channel === MessageChannel.EMAIL) {
    tenantQuota = business.emailQuota;
    tenantUsed = business.emailUsed;
  }

  if (tenantUsed >= tenantQuota) {
    return {
      allowed: false,
      reason: `Monthly ${channel} quota exhausted (${tenantUsed}/${tenantQuota}). Upgrade plan to send more messages.`,
      remaining: 0,
      totalQuota: tenantQuota,
      totalUsed: tenantUsed,
    };
  }

  // 2. If message is attached to a specific lead, check per-lead quota limit
  if (leadId) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId },
    });

    if (lead) {
      // Starter defaults: 3 WhatsApp, 2 SMS, 3 Emails per lead
      const maxPerLead =
        channel === MessageChannel.WHATSAPP ? 3 : channel === MessageChannel.SMS ? 2 : 3;
      const sentOnLead =
        channel === MessageChannel.WHATSAPP
          ? lead.whatsappSent
          : channel === MessageChannel.SMS
          ? lead.smsSent
          : lead.emailsSent;

      if (sentOnLead >= maxPerLead) {
        return {
          allowed: false,
          reason: `Lead ${channel} communication allowance reached (${sentOnLead}/${maxPerLead} messages).`,
          remaining: 0,
        };
      }
    }
  }

  return {
    allowed: true,
    remaining: tenantQuota - tenantUsed,
    totalQuota: tenantQuota,
    totalUsed: tenantUsed,
  };
}

/**
 * Atomically records message dispatch in the usage ledger and increments tenant usage.
 */
export async function recordMessageUsage(params: {
  tenantId: string;
  leadId?: string;
  channel: MessageChannel;
  messageType: MessageType;
  provider: string;
  providerCost?: number;
  metadata?: any;
}) {
  const { tenantId, leadId, channel, messageType, provider, providerCost = 0, metadata } = params;

  // Use a transaction for atomic recording
  return prisma.$transaction(async (tx) => {
    // 1. Create audit usage ledger record
    await tx.usageRecord.create({
      data: {
        tenantId,
        leadId,
        channel,
        messageType,
        provider,
        providerCost,
        metadata: metadata || {},
      },
    });

    // 2. Increment tenant usage
    const updateData: any = {};
    if (channel === MessageChannel.WHATSAPP) updateData.whatsappUsed = { increment: 1 };
    if (channel === MessageChannel.SMS) updateData.smsUsed = { increment: 1 };
    if (channel === MessageChannel.EMAIL) updateData.emailUsed = { increment: 1 };

    await tx.business.update({
      where: { id: tenantId },
      data: updateData,
    });

    // 3. Increment lead counter if lead exists
    if (leadId) {
      const leadUpdate: any = {};
      if (channel === MessageChannel.WHATSAPP) leadUpdate.whatsappSent = { increment: 1 };
      if (channel === MessageChannel.SMS) leadUpdate.smsSent = { increment: 1 };
      if (channel === MessageChannel.EMAIL) leadUpdate.emailsSent = { increment: 1 };

      await tx.lead.update({
        where: { id: leadId },
        data: leadUpdate,
      });
    }
  });
}
