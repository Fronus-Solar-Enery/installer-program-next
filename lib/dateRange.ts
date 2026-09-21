import type { BaseDateFilters } from "@/hooks/useEntityListState";

export interface DateRangeBounds {
  start: Date | null;
  end: Date | null;
}

const pakistanDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Karachi",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Return an ISO-like calendar date as seen by rewards users in Pakistan. */
export function toPakistanCalendarDate(value: string | Date): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const parts = pakistanDateFormatter.formatToParts(date);
  const getPart = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");

  return year && month && day ? `${year}-${month}-${day}` : "";
}

/**
 * Resolve a date-range preset (or custom range) to concrete local-time bounds.
 *
 * Presets are relative to the start of "today". `week`/`month`/`year` span from
 * N days/years back up to the end of today (23:59:59.999). `custom` uses the
 * provided dates, snapping start to 00:00:00 and end to 23:59:59.999 of their
 * local day; either bound may be null for a one-sided custom range.
 * `all` returns `{ start: null, end: null }` (no filtering).
 *
 * Single source of truth for the client filter hooks
 * ([[use-optimized-installer-filter]] / [[use-optimized-rewards-filter]]) so a
 * boundary fix lands in one place.
 */
export function resolveDateRange({
  dateRange,
  customStartDate,
  customEndDate,
}: BaseDateFilters): DateRangeBounds {
  if (dateRange === "all") return { start: null, end: null };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  switch (dateRange) {
    case "today":
      return { start: today, end: endOfToday };
    case "week": {
      const start = new Date(today);
      start.setDate(today.getDate() - 7);
      return { start, end: endOfToday };
    }
    case "month": {
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      return { start, end: endOfToday };
    }
    case "year": {
      const start = new Date(today);
      start.setFullYear(today.getFullYear() - 1);
      return { start, end: endOfToday };
    }
    case "custom": {
      let start: Date | null = null;
      let end: Date | null = null;
      if (customStartDate) {
        start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
      }
      if (customEndDate) {
        end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
      }
      return { start, end };
    }
    default:
      return { start: null, end: null };
  }
}
