/**
 * Pure helpers behind the dashboard analytics surface.
 *
 * Everything here is deterministic and DB-free on purpose: the bucketing rules
 * have to agree exactly between the Mongo `$dateTrunc` pipeline in
 * `app/api/dashboard/analytics/route.ts` and the client that renders the
 * series, so they live in one tested place rather than twice.
 *
 * @module analytics
 */

export type Granularity = "day" | "week" | "month";

const DAY_MS = 86_400_000;

/** Reward statuses that carry a dedicated chart colour. */
export const STATUS_KEYS = ["paid", "pending", "failed"] as const;
export type StatusKey = (typeof STATUS_KEYS)[number];

/**
 * Choose a time bucket that keeps a series readable.
 *
 * Targets roughly 7–60 plotted points: daily up to two months, weekly up to
 * ~13 months, monthly beyond that. A range that would render 400 daily ticks
 * is unreadable, and one that renders three monthly bars hides the trend.
 */
export function pickGranularity(start: Date, end: Date): Granularity {
  const days = spanInDays(start, end);
  if (days <= 62) return "day";
  if (days <= 400) return "week";
  return "month";
}

/** Whole days covered by `[start, end]`, floored at 1 so a single day is 1. */
export function spanInDays(start: Date, end: Date): number {
  const ms = end.getTime() - start.getTime();
  if (!Number.isFinite(ms)) return 1;
  return Math.max(1, Math.round(ms / DAY_MS));
}

/**
 * The equally long window immediately before `[start, end]`.
 *
 * Used as the comparison baseline for every KPI delta. The previous window ends
 * one millisecond before the current one starts, so the two never overlap and
 * no reward is counted in both.
 */
export function previousPeriod(
  start: Date,
  end: Date,
): { start: Date; end: Date } {
  const span = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  return { start: new Date(prevEnd.getTime() - span), end: prevEnd };
}

/**
 * Signed percent change against a baseline.
 *
 * Returns `null` when there is no meaningful baseline — going from 0 to any
 * number is not "+∞%", it is simply new activity, and the UI labels it as such
 * instead of printing a nonsense figure.
 */
export function percentDelta(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** `part` as a percentage of `total`; 0 when there is nothing to divide by. */
export function shareOf(part: number, total: number): number {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) return 0;
  return (part / total) * 100;
}

/** Truncate a date to the start of its bucket, in UTC, matching `$dateTrunc`. */
export function truncateToBucket(date: Date, granularity: Granularity): Date {
  const d = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
  if (granularity === "day") return d;
  if (granularity === "month") {
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  }
  // Week buckets start on Monday, matching `$dateTrunc`'s `startOfWeek`.
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday
  const backToMonday = (dayOfWeek + 6) % 7;
  d.setUTCDate(d.getUTCDate() - backToMonday);
  return d;
}

/**
 * Every bucket start between `start` and `end`, inclusive, as ISO strings.
 *
 * Mongo only returns buckets that contain documents. Plotting that directly
 * draws a line straight over quiet weeks and misstates the trend, so the client
 * reindexes the server series onto this full sequence and fills gaps with zero.
 */
export function bucketSequence(
  start: Date,
  end: Date,
  granularity: Granularity,
): string[] {
  const out: string[] = [];
  if (!(start instanceof Date) || !(end instanceof Date)) return out;
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return out;
  if (start > end) return out;

  const last = truncateToBucket(end, granularity).getTime();
  let cursor = truncateToBucket(start, granularity);

  // Hard stop: a malformed range must never spin here.
  for (let i = 0; cursor.getTime() <= last && i < 5000; i++) {
    out.push(cursor.toISOString());
    const next = new Date(cursor.getTime());
    if (granularity === "day") next.setUTCDate(next.getUTCDate() + 1);
    else if (granularity === "week") next.setUTCDate(next.getUTCDate() + 7);
    else next.setUTCMonth(next.getUTCMonth() + 1);
    cursor = next;
  }
  return out;
}

/**
 * Reindex a sparse server series onto the full bucket sequence.
 *
 * Buckets the server had no rows for become `zero`, so gaps read as "nothing
 * happened" rather than being silently interpolated across.
 */
export function fillSeriesGaps<T extends { bucket: string }>(
  rows: T[],
  buckets: string[],
  zero: (bucket: string) => T,
): T[] {
  const byBucket = new Map(rows.map((r) => [r.bucket, r]));
  return buckets.map((b) => byBucket.get(b) ?? zero(b));
}

/** Axis label for a bucket start. Short enough to survive a dense x-axis. */
export function formatBucketLabel(
  bucket: string,
  granularity: Granularity,
): string {
  const d = new Date(bucket);
  if (Number.isNaN(d.getTime())) return "";
  if (granularity === "month") {
    return d.toLocaleDateString("en-GB", {
      month: "short",
      year: "2-digit",
      timeZone: "UTC",
    });
  }
  return `${d.getUTCDate()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Full-precision bucket label for tooltips, where there is room to spell it out. */
export function formatBucketRange(
  bucket: string,
  granularity: Granularity,
): string {
  const d = new Date(bucket);
  if (Number.isNaN(d.getTime())) return "";
  const fmt = (x: Date) =>
    x.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  if (granularity === "day") return fmt(d);
  if (granularity === "month") {
    return d.toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  const end = new Date(d.getTime());
  end.setUTCDate(end.getUTCDate() + 6);
  return `${fmt(d)} – ${fmt(end)}`;
}

/**
 * Histogram bands for "how many installations did this installer submit".
 *
 * Log-ish widths because installer output is heavily skewed — most submit one
 * or two, a handful submit dozens. Equal-width bands would put ~90% of
 * installers in the first bar and tell the reader nothing.
 */
export const VOLUME_BANDS = [
  { label: "1", min: 1, max: 1 },
  { label: "2–3", min: 2, max: 3 },
  { label: "4–6", min: 4, max: 6 },
  { label: "7–12", min: 7, max: 12 },
  { label: "13–25", min: 13, max: 25 },
  { label: "26+", min: 26, max: Number.POSITIVE_INFINITY },
] as const;

/** The band label an installation count falls into. */
export function volumeBand(count: number): string {
  const band = VOLUME_BANDS.find((b) => count >= b.min && count <= b.max);
  return band?.label ?? VOLUME_BANDS[0].label;
}

/** Compact PKR amount for axis ticks and tight labels (`Rs 1.2M`). */
export function formatPkrCompact(value: number): string {
  if (!Number.isFinite(value)) return "Rs 0";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `Rs ${trimZero(value / 1_000_000)}M`;
  if (abs >= 1_000) return `Rs ${trimZero(value / 1_000)}K`;
  return `Rs ${Math.round(value)}`;
}

/** Full PKR amount for tooltips and table cells, where precision is the point. */
export function formatPkr(value: number): string {
  if (!Number.isFinite(value)) return "Rs 0";
  return `Rs ${Math.round(value).toLocaleString("en-US")}`;
}

function trimZero(n: number): string {
  return n.toFixed(1).replace(/\.0$/, "");
}
