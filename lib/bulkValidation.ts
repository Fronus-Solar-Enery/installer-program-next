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
