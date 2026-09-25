import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      // Return a specific conversation thread with its messages
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, tenantId: session.tenantId },
        include: { customer: true },
      });

      if (!conversation) {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }

      const messages = await prisma.message.findMany({
        where: { conversationId, tenantId: session.tenantId },
        orderBy: { createdAt: "asc" },
      });

      // Reset unread count when the conversation is opened
      if (conversation.unreadCount > 0) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { unreadCount: 0 },
        });
      }

      return NextResponse.json({ conversation, messages });
    }

    // Return all conversations for the tenant, ordered by latest activity
    const conversations = await prisma.conversation.findMany({
      where: { tenantId: session.tenantId },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { lastMessageAt: "desc" },
    });

    return NextResponse.json({ conversations });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "NO_TENANT_FOUND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to load messages" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const { conversationId, content, channel } = await req.json();

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "conversationId and content are required" },
        { status: 400 }
      );
    }

    // Verify conversation belongs to tenant
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, tenantId: session.tenantId },
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    // Create the outbound message
    const message = await prisma.message.create({
      data: {
        tenantId: session.tenantId,
        conversationId,
        direction: "OUTBOUND",
        channel: channel || conversation.channel,
        content,
        status: "QUEUED",
        messageType: "CUSTOMER_SERVICE",
      },
    });

    // Update conversation: bump lastMessageAt and reset unread count
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        unreadCount: 0,
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error: any) {
    if (error.message === "UNAUTHORIZED" || error.message === "NO_TENANT_FOUND") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
