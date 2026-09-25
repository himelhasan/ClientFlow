import { MessageChannel, MessageType } from "@prisma/client";

export interface SendMessagePayload {
  tenantId: string;
  leadId?: string;
  bookingId?: string;
  to: string; // Phone (+880...) or Email
  content: string;
  templateId?: string;
  templateVariables?: Record<string, string>;
  messageType?: MessageType;
}

export interface SendMessageResult {
  success: boolean;
  provider: string;
  providerMessageId?: string;
  error?: string;
  cost?: number;
  currency?: string;
}

export interface IMessagingAdapter {
  channel: MessageChannel;
  send(payload: SendMessagePayload): Promise<SendMessageResult>;
}
