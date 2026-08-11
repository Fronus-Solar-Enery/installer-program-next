/**
 * Shared helpers for bulk-upload validation routes (installers, rewards, and
 * future entities). The per-entity validation rules differ, but the in-batch
 * duplicate-detection semantics must not: same tracking, same message, same
 * 1-based "first occurrence at row N" wording everywhere.
 */
export class BatchDuplicateTracker {
  private seen = new Map<string, number>();

  /**
   * Record `key` at 0-based `index`. If the key was already seen, returns a
   * standardized duplicate-issue message referencing the first occurrence's
   * 1-based row; otherwise records it and returns null.
   *
   * `label` names the field for the message, e.g. "serial number",
   * "installer code", "CNIC".
   */
  check(key: string, index: number, label: string): string | null {
    if (this.seen.has(key)) {
      const firstOccurrence = this.seen.get(key)! + 1;
      return `Duplicate ${label} in upload (first occurrence at row ${firstOccurrence})`;
    }
    this.seen.set(key, index);
    return null;
  }

  /** 0-based index of the first row that used `key`, or undefined if unseen. */
  indexOf(key: string): number | undefined {
    return this.seen.get(key);
  }
}

/**
 * Comparison key for free-text identity fields (installer code, account title)
 * pasted back from Excel: trim, collapse inner whitespace, uppercase. Catches
 * real mismatches without failing on spreadsheet formatting noise.
 */
export function normalizeIdentity(value: unknown): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();
}

/**
 * Comparison key for account numbers: digits only, and for mobile-wallet
 * accounts (which are phone numbers) reduced to the national 03XXXXXXXXX form
 * so `+92 300 1234567`, `923001234567` and `03001234567` all compare equal.
 */
export function normalizeAccountNumber(value: unknown, isMobile = false): string {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!isMobile || !digits) return digits;
  const local = digits.startsWith("92") ? digits.slice(2) : digits;
  return local.startsWith("0") ? local : `0${local}`;
}
