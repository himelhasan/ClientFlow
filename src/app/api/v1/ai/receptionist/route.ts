import { NextResponse } from "next/server";
import { requireTenant } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatBDT } from "@/lib/utils/bangladesh";

export async function POST(req: Request) {
  try {
    const session = await requireTenant();
    const tenantId = session.tenantId;
    const { message } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message text is required" },
        { status: 400 }
      );
    }

    // Load tenant business context, active services, and availability
    const [business, services, availability] = await Promise.all([
      prisma.business.findUnique({ where: { id: tenantId } }),
      prisma.service.findMany({
        where: { tenantId, isActive: true },
        take: 8,
      }),
      prisma.availability.findMany({
        where: { tenantId, isWorkingDay: true },
        orderBy: { dayOfWeek: "asc" },
      }),
    ]);

    const lower = message.toLowerCase();
    const isBanglaScript = /[\u0980-\u09FF]/.test(message);
    const isBanglish =
      /\b(koto|taka|kokhon|kothay|appointment|serial|doctor|ache|ashbo|boshben|ki|bhai|apu)\b/i.test(
        message
      );

    const detectedLanguage = isBanglaScript
      ? "Bangla (বাংলা)"
      : isBanglish
      ? "Banglish (Romanized Bangla)"
      : "English";

    const serviceSummary =
      services.length > 0
        ? services
            .map(
              (s) => `${s.name} (${formatBDT(s.price)}, ${s.durationMinutes}m)`
            )
            .join(", ")
        : "General Consultation (৳800)";

    // Intent classification
    let intent = "GENERAL_INQUIRY";
    let confidence = 0.92;
    let reply = "";

    if (
      /price|cost|fee|charge|rate|koto|taka|দাম|কত|টাকা|ফি/.test(lower)
    ) {
      intent = "PRICE_INQUIRY";
      confidence = 0.96;
      reply = isBanglaScript
        ? `আসসালামু আলাইকুম! ${business?.name}-এ আমাদের সেবাসমূহের মূল্য তালিকা: ${serviceSummary}। আপনি কি কোনো নির্দিষ্ট সেবার জন্য অ্যাপয়েন্টমেন্ট বুক করতে চান?`
        : `Hello! Here are the current service fees at ${business?.name}: ${serviceSummary}. Would you like to book a time slot?`;
    } else if (
      /book|appointment|slot|schedule|serial|tomorrow|today|সিরিয়াল|বুকিং|অ্যাপয়েন্টমেন্ট|ডাক্তার/.test(
        lower
      )
    ) {
      intent = "BOOKING_REQUEST";
      confidence = 0.95;
      reply = isBanglaScript
        ? `নিশ্চয়ই! ${business?.name}-এ আপনার অ্যাপয়েন্টমেন্ট নিশ্চিত করতে আপনার পছন্দের সেবা এবং তারিখ জানান, অথবা আমাদের অনলাইন বুকিং ফর্ম ব্যবহার করুন। উপলব্ধ সেবা: ${serviceSummary}।`
        : `Certainly! We can schedule your appointment at ${business?.name}. Available services include: ${serviceSummary}. Please let us know your preferred date and time!`;
    } else if (
      /where|address|location|branch|city|kothay|ঠিকানা|কোথায়|লোকেশন/.test(
        lower
      )
    ) {
      intent = "LOCATION_ADDRESS";
      confidence = 0.94;
      const addr = business?.address
        ? `${business.address}, ${business.city || "Dhaka"}`
        : business?.city || "Dhaka, Bangladesh";
      reply = isBanglaScript
        ? `আমাদের ঠিকানা: ${addr}। যেকোনো প্রয়োজনে কল করুন: ${business?.phone || "আমাদের হটলাইনে"}।`
        : `We are located at ${addr}. You can also reach our front desk at ${business?.phone || "our contact number"}.`;
    } else if (
      /hour|open|close|time|friday|kokhon|খোলা|বন্ধ|কখন|সময়/.test(lower)
    ) {
      intent = "WORKING_HOURS";
      confidence = 0.93;
      const openHours =
        availability.length > 0
          ? `${availability[0].startTime} – ${availability[0].endTime}`
          : "09:00 – 18:00";
      reply = isBanglaScript
        ? `${business?.name} প্রতিদিন ${openHours} পর্যন্ত খোলা থাকে (শুক্রবার জুম্মার বিরতি প্রযোজ্য)।`
        : `${business?.name} is open from ${openHours} (Asia/Dhaka time).`;
    } else if (/human|agent|manager|complain|talk|কল|কথা বলতে/.test(lower)) {
      intent = "HUMAN_HANDOFF";
      confidence = 0.97;
      reply = isBanglaScript
        ? `আমি আপনার মেসেজটি আমাদের প্রতিনিধির কাছে হস্তান্তর করছি। খুব শীঘ্রই আমাদের একজন টিম মেম্বার আপনার সাথে যোগাযোগ করবেন।`
        : `I have flagged your conversation for a human specialist at ${business?.name}. A team member will reply to you shortly.`;
    } else {
      reply = isBanglaScript
        ? `আসসালামু আলাইকুম! ${business?.name}-এ স্বাগতম। আমাদের সেবাসমূহ: ${serviceSummary}। আমি আপনাকে অ্যাপয়েন্টমেন্ট বুকিং বা তথ্যের জন্য কীভাবে সাহায্য করতে পারি?`
        : `Welcome to ${business?.name}! We offer ${serviceSummary}. How can I help you book an appointment today?`;
    }

    return NextResponse.json({
      intent,
      confidence,
      detectedLanguage,
      reply,
      businessContext: {
        name: business?.name,
        servicesCount: services.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "AI Receptionist failed" },
      { status: 500 }
    );
  }
}
