import { ProductStatus } from "@/types/rewards";

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
 * Read the Product Status / Rejection Reason cells of a bulk-update row.
 *
 * Blank Product Status means "leave it as it is" — the sheet is primarily a
 * payment sheet, so an empty column must never silently reset eligibility.
 * Labels are matched case-insensitively and accept either the display label
 * ("Not Eligible") or the stored enum value ("NOT_ELIGIBLE").
 */
export function parseProductStatusCells(
  statusCell: unknown,
  reasonCell: unknown
): { productStatus?: ProductStatus; rejectionReason?: string; issue?: string } {
  const raw = statusCell?.toString().trim() ?? "";
  const reason = reasonCell?.toString().trim() || undefined;

  if (!raw) return { rejectionReason: undefined };

  const normalized = raw.toUpperCase().replace(/[\s-]+/g, "_");
  const match = Object.values(ProductStatus).find((s) => s === normalized);

  if (!match) {
    return {
      issue: `Invalid product status "${raw}" (must be: Eligible, Not Eligible, or Rejected)`,
    };
  }

  if (match !== ProductStatus.REJECTED) {
    // A reason only belongs to a rejection; drop a stale one.
    return { productStatus: match, rejectionReason: undefined };
  }

  if (!reason) {
    return {
      productStatus: match,
      issue: "Rejection reason is required when the product is rejected",
    };
  }

  return { productStatus: match, rejectionReason: reason };
}
