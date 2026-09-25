import { prisma } from "../db";
import { format, parse, addMinutes, isBefore, isAfter, isEqual } from "date-fns";

export interface TimeSlot {
  startTime: string; // "14:00"
  endTime: string;   // "14:30"
  isAvailable: boolean;
  reason?: string;
  staffId?: string;
}

export interface GetSlotsParams {
  tenantId: string;
  serviceId: string;
  dateStr: string; // "YYYY-MM-DD"
  staffId?: string; // Optional specific staff request
}

/**
 * Calculates bookable appointment time slots for a given tenant, service, and date.
 * Incorporates:
 * - Business & Staff working hours for that specific day of week
 * - Breaks (e.g. lunch, Friday prayer)
 * - Holidays and blocked dates
 * - Existing confirmed/pending bookings
 * - Service duration and buffer time
 */
export async function calculateAvailableSlots(params: GetSlotsParams): Promise<TimeSlot[]> {
  const { tenantId, serviceId, dateStr, staffId } = params;

  // 1. Fetch service details
  const service = await prisma.service.findFirst({
    where: { id: serviceId, tenantId, isActive: true },
  });

  if (!service) {
    throw new Error("Service not found or inactive");
  }

  const targetDate = new Date(`${dateStr}T00:00:00`);
  const dayOfWeek = targetDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday

  // 2. Check for Holidays on target date
  const holiday = await prisma.holiday.findFirst({
    where: {
      tenantId,
      startDate: { lte: targetDate },
      endDate: { gte: targetDate },
      ...(staffId ? { OR: [{ staffId: null }, { staffId }] } : {}),
    },
  });

  if (holiday) {
    return []; // Business/staff is on holiday
  }

  // 3. Fetch applicable availability schedules for this day
  const availabilityRules = await prisma.availability.findMany({
    where: {
      tenantId,
      dayOfWeek,
      isWorkingDay: true,
      ...(staffId ? { staffId } : {}),
    },
  });

  if (availabilityRules.length === 0) {
    return []; // Business closed on this day
  }

  // 4. Fetch existing non-cancelled bookings on this date
  const existingBookings = await prisma.booking.findMany({
    where: {
      tenantId,
      date: targetDate,
      status: { notIn: ["CANCELLED", "REJECTED"] },
      ...(staffId ? { staffId } : {}),
    },
  });

  const duration = service.durationMinutes;
  const buffer = service.bufferTimeMinutes || 0;
  const totalSlotDuration = duration + buffer;

  const slots: TimeSlot[] = [];

  for (const rule of availabilityRules) {
    const dayStart = parse(rule.startTime, "HH:mm", targetDate);
    const dayEnd = parse(rule.endTime, "HH:mm", targetDate);

    let currentPointer = dayStart;

    while (isBefore(addMinutes(currentPointer, duration), dayEnd) || isEqual(addMinutes(currentPointer, duration), dayEnd)) {
      const slotStartStr = format(currentPointer, "HH:mm");
      const slotEndPointer = addMinutes(currentPointer, duration);
      const slotEndStr = format(slotEndPointer, "HH:mm");

      let isAvailable = true;
      let reason: string | undefined = undefined;

      // Check break time
      if (rule.breakStart && rule.breakEnd) {
        const breakStart = parse(rule.breakStart, "HH:mm", targetDate);
        const breakEnd = parse(rule.breakEnd, "HH:mm", targetDate);

        if (
          (isAfter(slotEndPointer, breakStart) && isBefore(currentPointer, breakEnd)) ||
          isEqual(currentPointer, breakStart)
        ) {
          isAvailable = false;
          reason = "Break time";
        }
      }

      // Check collision with existing bookings
      if (isAvailable) {
        const hasConflict = existingBookings.some((booking) => {
          const bookingStart = parse(booking.startTime, "HH:mm", targetDate);
          const bookingEnd = parse(booking.endTime, "HH:mm", targetDate);

          return (
            (isAfter(slotEndPointer, bookingStart) && isBefore(currentPointer, bookingEnd)) ||
            isEqual(currentPointer, bookingStart)
          );
        });

        if (hasConflict) {
          isAvailable = false;
          reason = "Already booked";
        }
      }

      // If available, record the slot
      if (isAvailable) {
        slots.push({
          startTime: slotStartStr,
          endTime: slotEndStr,
          isAvailable: true,
          staffId: rule.staffId || undefined,
        });
      }

      currentPointer = addMinutes(currentPointer, totalSlotDuration);
    }
  }

  return slots;
}
