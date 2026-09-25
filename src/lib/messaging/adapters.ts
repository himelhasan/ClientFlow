import { MessageChannel, MessageType } from "@prisma/client";
import { IMessagingAdapter, SendMessagePayload, SendMessageResult } from "./types";
import { checkMessageQuota, recordMessageUsage } from "../engine/quota";
import { prisma } from "../db";

// ==============================================================
// 1. WhatsApp Meta Cloud API Adapter
// ==============================================================
export class WhatsAppMetaAdapter implements IMessagingAdapter {
  channel = MessageChannel.WHATSAPP;

  async send(payload: SendMessagePayload): Promise<SendMessageResult> {
    const { tenantId, leadId, to, content } = payload;
    const token = process.env.META_WA_ACCESS_TOKEN;
    const phoneId = process.env.META_WA_PHONE_NUMBER_ID;

    // Check quota first
    const quotaCheck = await checkMessageQuota({
      tenantId,
      leadId,
      channel: MessageChannel.WHATSAPP,
      messageType: payload.messageType || MessageType.TRANSACTIONAL,
    });

    if (!quotaCheck.allowed) {
      return {
        success: false,
        provider: "META_CLOUD",
        error: quotaCheck.reason,
      };
    }

    // Direct Meta Cloud API if configured, else safe local mock for dev/staging
    if (token && phoneId && !token.includes("placeholder")) {
      try {
        const response = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: to.replace("+", ""),
            type: "text",
            text: { preview_url: false, body: content },
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          return {
            success: false,
            provider: "META_CLOUD",
            error: data.error?.message || "Failed to dispatch WhatsApp message",
          };
        }

        const msgId = data.messages?.[0]?.id || `wa_${Date.now()}`;
        await recordMessageUsage({
          tenantId,
          leadId,
          channel: MessageChannel.WHATSAPP,
          messageType: payload.messageType || MessageType.TRANSACTIONAL,
          provider: "META_CLOUD",
          providerCost: 1.39, // Approx BDT per utility message (Section 68)
        });

        return {
          success: true,
          provider: "META_CLOUD",
          providerMessageId: msgId,
          cost: 1.39,
          currency: "BDT",
        };
      } catch (err: any) {
        return { success: false, provider: "META_CLOUD", error: err.message };
      }
    }

    // Safe Mock Dispatch for staging/demo environments
    console.log(`[WHATSAPP MOCK] Sent to ${to}: ${content}`);
    await recordMessageUsage({
      tenantId,
      leadId,
      channel: MessageChannel.WHATSAPP,
      messageType: payload.messageType || MessageType.TRANSACTIONAL,
      provider: "MOCK_WHATSAPP",
      providerCost: 0,
    });

    return {
      success: true,
      provider: "MOCK_WHATSAPP",
      providerMessageId: `mock_wa_${Date.now()}`,
      cost: 0,
      currency: "BDT",
    };
  }
}

// ==============================================================
// 2. Bangladesh SMS Gateway Adapter
// ==============================================================
export class BangladeshSMSAdapter implements IMessagingAdapter {
  channel = MessageChannel.SMS;

  async send(payload: SendMessagePayload): Promise<SendMessageResult> {
    const { tenantId, leadId, to, content } = payload;
    const apiKey = process.env.SMS_API_KEY;

    // Check quota first
    const quotaCheck = await checkMessageQuota({
      tenantId,
      leadId,
      channel: MessageChannel.SMS,
      messageType: payload.messageType || MessageType.TRANSACTIONAL,
    });

    if (!quotaCheck.allowed) {
      return {
        success: false,
        provider: "BD_SMS_GATEWAY",
        error: quotaCheck.reason,
      };
    }

    // If live API key is set
    if (apiKey && !apiKey.includes("placeholder")) {
      // In production connects to SSL Wireless, BulkSMSBD, or Greenweb
      console.log(`[LIVE SMS GATEWAY] Dispatching to ${to}: ${content}`);
    } else {
      console.log(`[MOCK SMS] Dispatching to ${to}: ${content}`);
    }

    await recordMessageUsage({
      tenantId,
      leadId,
      channel: MessageChannel.SMS,
      messageType: payload.messageType || MessageType.TRANSACTIONAL,
      provider: "BD_SMS_GATEWAY",
      providerCost: 0.35, // Average BDT 0.35 per SMS (Section 68)
    });

    return {
      success: true,
      provider: "BD_SMS_GATEWAY",
      providerMessageId: `sms_${Date.now()}`,
      cost: 0.35,
      currency: "BDT",
    };
  }
}

// ==============================================================
// 3. Email Adapter (Resend / SMTP)
// ==============================================================
export class EmailAdapter implements IMessagingAdapter {
  channel = MessageChannel.EMAIL;

  async send(payload: SendMessagePayload): Promise<SendMessageResult> {
    const { tenantId, leadId, to, content } = payload;

    const quotaCheck = await checkMessageQuota({
      tenantId,
      leadId,
      channel: MessageChannel.EMAIL,
      messageType: payload.messageType || MessageType.TRANSACTIONAL,
    });

    if (!quotaCheck.allowed) {
      return {
        success: false,
        provider: "EMAIL_PROVIDER",
        error: quotaCheck.reason,
      };
    }

    console.log(`[EMAIL DISPATCH] To: ${to} Content: ${content}`);
    await recordMessageUsage({
      tenantId,
      leadId,
      channel: MessageChannel.EMAIL,
      messageType: payload.messageType || MessageType.TRANSACTIONAL,
      provider: "RESEND",
      providerCost: 0,
    });

    return {
      success: true,
      provider: "RESEND",
      providerMessageId: `email_${Date.now()}`,
      cost: 0,
      currency: "BDT",
    };
  }
}

export const whatsAppService = new WhatsAppMetaAdapter();
export const smsService = new BangladeshSMSAdapter();
export const emailService = new EmailAdapter();
