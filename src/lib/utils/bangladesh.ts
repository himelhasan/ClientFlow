/**
 * Bangladesh-First Utilities
 * Standardizes phone numbers, currency, and timezones for Bangladesh operations.
 */

/**
 * Normalizes any Bangladeshi phone number format into E.164 (+8801XXXXXXXXX).
 * Handles:
 * - "01712345678" -> "+8801712345678"
 * - "+8801712345678" -> "+8801712345678"
 * - "8801712345678" -> "+8801712345678"
 * - "01712-345678" (with dashes/spaces) -> "+8801712345678"
 */
export function normalizeBdPhone(phone: string): string {
  if (!phone) return "";
  
  // Strip non-digit characters except leading plus
  let cleaned = phone.trim().replace(/[\s\-\(\)]/g, "");

  if (cleaned.startsWith("+880")) {
    return cleaned;
  }
  if (cleaned.startsWith("880")) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith("01")) {
    return `+88${cleaned}`;
  }
  if (cleaned.startsWith("1") && cleaned.length === 10) {
    return `+880${cleaned}`;
  }

  return cleaned;
}

/**
 * Validates whether a phone number is a valid Bangladeshi mobile number.
 * Valid prefixes: 013, 014, 015, 016, 017, 018, 019 (Grameenphone, Banglalink, Teletalk, Robi/Airtel)
 */
export function isValidBdPhone(phone: string): boolean {
  const normalized = normalizeBdPhone(phone);
  // Must match +8801[3-9]XXXXXXXX (14 characters total: +880 followed by 1 and 9 digits)
  const bdPhoneRegex = /^\+8801[3-9]\d{8}$/;
  return bdPhoneRegex.test(normalized);
}

/**
 * Formats a number to Bangladesh Taka (BDT / ৳)
 * Example: 1500 -> "৳1,500"
 */
export function formatBDT(amount: number | string | { toString(): string }): string {
  const numeric = typeof amount === "number" ? amount : parseFloat(amount.toString());
  if (isNaN(numeric)) return "৳0";
  return `৳${numeric.toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

/**
 * Default platform timezone (Asia/Dhaka)
 */
export const BD_TIMEZONE = "Asia/Dhaka";

/**
 * Formats a Date into Bangladesh local time string
 */
export function formatBdDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-GB", {
    timeZone: BD_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatBdDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    timeZone: BD_TIMEZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
