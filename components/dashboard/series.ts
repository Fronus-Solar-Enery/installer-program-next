import {
  bucketSequence,
  fillSeriesGaps,
  formatBucketLabel,
  formatBucketRange,
  type Granularity,
} from "@/lib/analytics";
import type { DashboardAnalytics } from "@/hooks/useDashboardData";

/** One plotted point: every server series merged onto a common bucket. */
export interface TrendPoint {
  bucket: string;
  label: string;
  fullLabel: string;
  installations: number;
  amount: number;
  referrerAmount: number;
  paid: number;
  pending: number;
  failed: number;
  paidAmount: number;
  activeInstallers: number;
  registrations: number;
  newInstallers: number;
  returningInstallers: number;
  cumulativeAmount: number;
  cumulativePaid: number;
}

/**
 * Merge the server's three sparse series onto one gap-filled timeline.
 *
 * Mongo only emits buckets that contain rows. Plotting that directly draws a
 * straight line across a quiet fortnight and overstates the trend, so every
 * bucket in the range is materialised here and missing ones read as zero.
 * Cumulative totals are a running sum over that filled timeline, which is the
 * only ordering in which they are correct.
 */
export function buildTrendSeries(
  analytics: DashboardAnalytics | undefined,
): TrendPoint[] {
  if (!analytics) return [];

  const granularity: Granularity = analytics.granularity;
  const start = new Date(analytics.range.start);
  const end = new Date(analytics.range.end);
  const buckets = bucketSequence(start, end, granularity);
  if (!buckets.length) return [];

  const registrations = new Map(
    analytics.registrations.map((r) => [r.bucket, r.registrations]),
  );
  const newInstallers = new Map(
    analytics.newInstallers.map((r) => [r.bucket, r.newInstallers]),
  );

  const filled = fillSeriesGaps(analytics.series, buckets, (bucket) => ({
    bucket,
    installations: 0,
    amount: 0,
    referrerAmount: 0,
    paid: 0,
    pending: 0,
    failed: 0,
    paidAmount: 0,
    activeInstallers: 0,
  }));

  let runningAmount = 0;
  let runningPaid = 0;

  return filled.map((row) => {
    runningAmount += row.amount + row.referrerAmount;
    runningPaid += row.paidAmount;

    const fresh = newInstallers.get(row.bucket) ?? 0;
    return {
      ...row,
      label: formatBucketLabel(row.bucket, granularity),
      fullLabel: formatBucketRange(row.bucket, granularity),
      registrations: registrations.get(row.bucket) ?? 0,
      newInstallers: fresh,
      // An installer can only be "new" once, so returning is whatever is left
      // of the active set. Clamped because the two series are computed by
      // separate pipelines and a boundary row must never render negative.
      returningInstallers: Math.max(0, row.activeInstallers - fresh),
      cumulativeAmount: runningAmount,
      cumulativePaid: runningPaid,
    };
  });
}

/** Down-sample a series to at most `points` values for a stat-tile sparkline. */
export function sparkValues(
  series: TrendPoint[],
  pick: (p: TrendPoint) => number,
  points = 16,
): number[] {
  if (series.length <= points) return series.map(pick);
  const step = series.length / points;
  return Array.from({ length: points }, (_, i) =>
    pick(series[Math.min(series.length - 1, Math.floor(i * step))]),
  );
}
