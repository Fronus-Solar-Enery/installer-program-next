/**
 * Shared phone number normalization for WhatsApp integration.
 *
 * All phone numbers are stored and compared in a consistent format:
 * digits only, international prefix, no leading +.
 * e.g. "0300-1234567" → "923001234567", "+923001234567" → "923001234567"
 */

/**
 * Normalize a Pakistani phone number to the canonical format used in the DB
 * and by the Meta WhatsApp Cloud API: digits only, international prefix, no +.
 *
 * Handles: "0300-1234567", "+923001234567", "923001234567", "03001234567"
 */
export function normalizePhone(phoneNumber: string): string {
  let digits = phoneNumber.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  return digits;
}

/**
 * Check if two phone numbers refer to the same WhatsApp number,
 * accounting for format variations (+ prefix, leading 0, dashes, etc.).
 */
export function phonesMatch(a: string, b: string): boolean {
  return normalizePhone(a) === normalizePhone(b);
}
