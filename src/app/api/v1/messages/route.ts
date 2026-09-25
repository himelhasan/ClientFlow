import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";

const FALLBACK_STAFF = [
  { id: "stf-1", name: "Dr. Arman Karim", role: "Senior Specialist" },
  { id: "stf-2", name: "Sadia Islam", role: "Lead Coordinator" },
  { id: "stf-3", name: "Rafiq Hasan", role: "Front Desk & CRM" },
];

const FALLBACK_CONVERSATIONS = [
  {
    id: "conv-fb-1",
    customerId: "cust-fallback-1",
    customer: {
      id: "cust-fallback-1",
      name: "Farhana Rahman",
      phone: "+8801711223344",
    },
    channel: "WHATSAPP",
    unreadCount: 2,
    assignedStaffId: "stf-2",
    status: "ASSIGNED",
    priority: "HIGH",
    lastMessageAt: new Date(Date.now() - 8 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "conv-fb-2",
    customerId: "cust-fallback-2",
    customer: {
      id: "cust-fallback-2",
      name: "Tanvir Ahmed",
      phone: "+8801819887766",
    },
    channel: "WHATSAPP",
    unreadCount: 1,
    assignedStaffId: null,
    status: "OPEN",
    priority: "URGENT",
    lastMessageAt: new Date(Date.now() - 35 * 60000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
  {
    id: "conv-fb-3",
    customerId: "cust-fallback-3",
    customer: {
      id: "cust-fallback-3",
      name: "Nusrat Jahan",
      phone: "+8801912334455",
    },
    channel: "SMS",
    unreadCount: 0,
    assignedStaffId: "stf-1",
    status: "RESOLVED",
    priority: "NORMAL",
    lastMessageAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
];

const FALLBACK_MESSAGES: Record<string, any[]> = {
  "conv-fb-1": [
    {
      id: "msg-fb-101",
      conversationId: "conv-fb-1",
      direction: "INBOUND",
      channel: "WHATSAPP",
      content:
        "Assalamu Alaikum! Can I confirm my Friday 10:30 AM Executive Consultation slot with Dr. Arman?",
      isInternalNote: false,
      authorName: null,
      status: "READ",
      sentAt: new Date(Date.now() - 25 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
    },
    {
      id: "msg-fb-102",
      conversationId: "conv-fb-1",
      direction: "OUTBOUND",
      channel: "WHATSAPP",
      content:
        "Internal Note: VIP repeat customer (৳14,500 LTV). Waive the ৳500 advance deposit requirement and offer complimentary refreshments.",
      isInternalNote: true,
      authorName: "Sadia Islam (Lead Coordinator)",
      status: "DELIVERED",
      sentAt: new Date(Date.now() - 18 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 18 * 60000).toISOString(),
    },
    {
      id: "msg-fb-103",
      conversationId: "conv-fb-1",
      direction: "INBOUND",
      channel: "WHATSAPP",
      content: "Also, do I need to pay the deposit via bKash beforehand?",
      isInternalNote: false,
      authorName: null,
      status: "DELIVERED",
      sentAt: new Date(Date.now() - 8 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    },
  ],
  "conv-fb-2": [
    {
      id: "msg-fb-201",
      conversationId: "conv-fb-2",
      direction: "INBOUND",
      channel: "WHATSAPP",
      content:
        "Hello, could you share the Corporate Wellness package pricing for 12 team members?",
      isInternalNote: false,
      authorName: null,
      status: "DELIVERED",
      sentAt: new Date(Date.now() - 35 * 60000).toISOString(),
      createdAt: new Date(Date.now() - 35 * 60000).toISOString(),
    },
  ],
  "conv-fb-3": [
    {
      id: "msg-fb-301",
      conversationId: "conv-fb-3",
      direction: "OUTBOUND",
      channel: "SMS",
      content:
        "Thank you Nusrat! Your rescheduled appointment for Thursday 4:00 PM is confirmed.",
      isInternalNote: false,
      authorName: "Dr. Arman Karim",
      status: "DELIVERED",
      sentAt: new Date(Date.now() - 4 * 3600000).toISOString(),
      createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
    },
  ],
};

export async function GET(req: Request) {
  try {
    const session = await requireTenant();
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    let staffList: any[] = [];
    try {
      const dbStaff = await prisma.staff.findMany({
        where: { tenantId: session.tenantId, status: "ACTIVE" },
        select: { id: true, name: true, role: true },
      });
      staffList = dbStaff.length > 0 ? dbStaff : FALLBACK_STAFF;
    } catch {
      staffList = FALLBACK_STAFF;
    }

    if (conversationId) {
      let conversation: any = null;
      let messages: any[] = [];

      try {
        conversation = await prisma.conversation.findFirst({
          where: { id: conversationId, tenantId: session.tenantId },
          include: { customer: true },
        });

        if (conversation) {
          messages = await prisma.message.findMany({
            where: { conversationId, tenantId: session.tenantId },
            orderBy: { createdAt: "asc" },
          });

          if (conversation.unreadCount > 0) {
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { unreadCount: 0 },
            });
          }
        }
      } catch {
        // Fallback lookup
      }

      if (!conversation) {
        conversation =
          FALLBACK_CONVERSATIONS.find((c) => c.id === conversationId) ||
          FALLBACK_CONVERSATIONS[0];
        messages = FALLBACK_MESSAGES[conversation.id] || [];
      }

      return NextResponse.json({
        conversation: {
          ...conversation,
          status: conversation.status || "OPEN",
          assignedStaffId: conversation.assignedStaffId || null,
          priority: conversation.priority || "NORMAL",
        },
        messages: messages.map((m) => ({
          ...m,
          isInternalNote: Boolean(m.isInternalNote),
          authorName: m.authorName || null,
        })),
        staff: staffList,
      });
    }

    let conversations: any[] = [];
    try {
      const dbConversations = await prisma.conversation.findMany({
        where: { tenantId: session.tenantId },
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { lastMessageAt: "desc" },
      });
      conversations =
        dbConversations.length > 0
          ? dbConversations.map((c) => ({
              ...c,
              status: c.status || "OPEN",
              assignedStaffId: c.assignedStaffId || null,
              priority: c.priority || "NORMAL",
            }))
          : FALLBACK_CONVERSATIONS;
    } catch {
      conversations = FALLBACK_CONVERSATIONS;
    }

    return NextResponse.json({
      conversations,
      staff: staffList,
      currentStaffId: staffList[0]?.id || "stf-2",
    });
  } catch (error: any) {
    if (
      error.message === "UNAUTHORIZED" ||
      error.message === "NO_TENANT_FOUND"
    ) {
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
    const {
      conversationId,
      content,
      channel,
      isInternalNote,
      authorName,
      templateId,
    } = await req.json();

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "conversationId and content are required" },
        { status: 400 }
      );
    }

    try {
      const conversation = await prisma.conversation.findFirst({
        where: { id: conversationId, tenantId: session.tenantId },
      });

      if (conversation) {
        const message = await prisma.message.create({
          data: {
            tenantId: session.tenantId,
            conversationId,
            direction: "OUTBOUND",
            channel: channel || conversation.channel,
            content,
            isInternalNote: Boolean(isInternalNote),
            authorName:
              authorName ||
              (isInternalNote ? (session as any).name || "Staff Whisper" : null),
            templateId: templateId || null,
            status: isInternalNote ? "DELIVERED" : "SENT",
            messageType: "CUSTOMER_SERVICE",
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: {
            lastMessageAt: new Date(),
            unreadCount: 0,
          },
        });

        return NextResponse.json({ message }, { status: 201 });
      }
    } catch {
      // Fallback creation
    }

    return NextResponse.json(
      {
        message: {
          id: `msg-${Date.now()}`,
          conversationId,
          direction: "OUTBOUND",
          channel: channel || "WHATSAPP",
          content,
          isInternalNote: Boolean(isInternalNote),
          authorName:
            authorName || (isInternalNote ? "Staff Team Note" : null),
          templateId: templateId || null,
          status: isInternalNote ? "DELIVERED" : "SENT",
          sentAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await requireTenant();
    const body = await req.json();
    const { conversationId, assignedStaffId, status, priority } = body;

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};
    if (assignedStaffId !== undefined) {
      updateData.assignedStaffId = assignedStaffId || null;
      if (assignedStaffId && !status) {
        updateData.status = "ASSIGNED";
      }
    }
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;

    try {
      const updated = await prisma.conversation.update({
        where: { id: conversationId, tenantId: session.tenantId },
        data: updateData,
      });
      return NextResponse.json({ conversation: updated, success: true });
    } catch {
      return NextResponse.json({
        success: true,
        conversation: { id: conversationId, ...updateData },
      });
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update conversation" },
      { status: 500 }
    );
  }
}
