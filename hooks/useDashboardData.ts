import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { Granularity } from "@/lib/analytics";

/**
 * Data layer for the dashboard.
 *
 * Every dashboard number now arrives through TanStack Query rather than the
 * ad-hoc `fetch` + `useState` the page used to run, so a range change refetches
 * against a cached previous render instead of blanking the page.
 */

export type TimePeriod =
  | "all"
  | "lastWeek"
  | "last30days"
  | "previousMonth"
  | "thisYear"
  | "previousYear"
  | "custom";

export const TIME_PERIOD_LABELS: Record<TimePeriod, string> = {
  all: "All Time",
  lastWeek: "Last Week",
  last30days: "Last 30 Days",
  previousMonth: "Previous Month",
  thisYear: "This Year",
  previousYear: "Previous Year",
  custom: "Custom Range",
};

/** Short labels for the range toggle; the long form goes in the tooltip. */
export const TIME_PERIOD_TOGGLES: Array<{
  value: Exclude<TimePeriod, "custom">;
  short: string;
}> = [
  { value: "all", short: "ALL" },
  { value: "lastWeek", short: "1W" },
  { value: "last30days", short: "30D" },
  { value: "previousMonth", short: "1M" },
  { value: "thisYear", short: "1Y" },
  { value: "previousYear", short: "PY" },
];

export interface DashboardRange {
  startDate: Date | null;
  endDate: Date | null;
}

/**
 * Resolve a dashboard preset to concrete bounds.
 *
 * `all` intentionally returns no bounds — the server then reports the full
 * history and suppresses the period-over-period comparison.
 */
export function resolveDashboardRange(
  period: TimePeriod,
  customStartDate: string,
  customEndDate: string,
): DashboardRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (period) {
    case "lastWeek": {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      return { startDate: start, endDate: now };
    }
    case "last30days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      return { startDate: start, endDate: now };
    }
    case "previousMonth":
      return {
        startDate: new Date(year, month - 1, 1),
        endDate: new Date(year, month, 0, 23, 59, 59, 999),
      };
    case "thisYear":
      return { startDate: new Date(year, 0, 1), endDate: now };
    case "previousYear":
      return {
        startDate: new Date(year - 1, 0, 1),
        endDate: new Date(year - 1, 11, 31, 23, 59, 59, 999),
      };
    case "custom":
      if (customStartDate && customEndDate) {
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return { startDate: start, endDate: end };
      }
      return { startDate: null, endDate: null };
    case "all":
    default:
      return { startDate: null, endDate: null };
  }
}

/** Serialise a range into the query string every dashboard endpoint accepts. */
export function rangeParams({ startDate, endDate }: DashboardRange): string {
  if (!startDate || !endDate) return "";
  return `startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
}

/** Stable, primitive query-key fragment for a range. */
function rangeKey(range: DashboardRange) {
  return [
    range.startDate?.toISOString() ?? null,
    range.endDate?.toISOString() ?? null,
  ];
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok || !body?.success) {
    throw new Error(body?.message || "Request failed");
  }
  return body.data as T;
}

// -- response shapes ---------------------------------------------------------

export interface SeriesPoint {
  bucket: string;
  installations: number;
  amount: number;
  referrerAmount: number;
  paid: number;
  pending: number;
  failed: number;
  paidAmount: number;
  activeInstallers: number;
}

export interface WindowTotals {
  installations: number;
  amount: number;
  referrerAmount: number;
  paid: number;
  pending: number;
  failed: number;
  paidAmount: number;
  pendingAmount: number;
  failedAmount: number;
  activeInstallers: number;
}

export interface RegionRow {
  name: string;
  province?: string;
  installations: number;
  installers?: number;
  amount: number;
}

export interface LeaderboardRow {
  installerCode: string;
  fullName: string;
  city: string;
  district: string;
  installations: number;
  amount: number;
  referralAmount: number;
  paidAmount: number;
  lastActivityAt: string;
}

export interface FailedReward {
  _id: string;
  installerCode: string;
  productModel: string;
  serialNumber: string;
  rewardAmount: number;
  bankName: string;
  createdAt: string;
}

export interface DashboardAnalytics {
  granularity: Granularity;
  range: {
    start: string;
    end: string;
    previousStart: string | null;
    previousEnd: string | null;
    hasBaseline: boolean;
  };
  series: SeriesPoint[];
  registrations: Array<{ bucket: string; registrations: number }>;
  newInstallers: Array<{ bucket: string; newInstallers: number }>;
  totals: { current: WindowTotals; previous: WindowTotals | null };
  /** Installers registered inside the selected range. */
  totalInstallers: number;
  /** Every installer ever registered — the activation-rate denominator. */
  registeredInstallers: number;
  geography: {
    provinces: RegionRow[];
    districts: RegionRow[];
    cities: RegionRow[];
  };
  cohorts: {
    distribution: Array<{
      band: number | string;
      installers: number;
      installations: number;
    }>;
    leaderboard: LeaderboardRow[];
    concentration: {
      totalInstallations: number;
      activeInstallers: number;
      top10Installations: number;
      top50Installations: number;
    };
    activationLagDays: number | null;
    activatedInstallers: number;
  };
  payments: {
    methods: Array<{ name: string; count: number; amount: number }>;
    banks: Array<{ name: string; count: number; amount: number }>;
    payoutLag: {
      avgDays: number | null;
      maxDays: number | null;
      paidWithDate: number;
      bands: Array<{ band: number | string; count: number }>;
    };
    failedWatchlist: FailedReward[];
  };
  products: Array<{ model: string; installations: number; amount: number }>;
}

export interface RecentInstallation {
  _id: string;
  productModel: string;
  serialNumber: string;
  rewardAmount: number;
  rewardStatus: string;
  installer?: { installerCode: string; fullName: string };
  createdAt: string;
}

export interface RecentInstaller {
  _id: string;
  installerCode: string;
  fullName: string;
  city: string;
  createdAt: string;
}

export interface DistrictInstaller {
  installerName: string;
  installerCode: string;
  district: string;
  city: string;
  totalProducts: number;
  rewardAmount: number;
  referralRewardAmount: number;
}

// -- hooks -------------------------------------------------------------------

/** Every chart on the dashboard reads from this one query. */
export function useDashboardAnalytics(range: DashboardRange) {
  const params = rangeParams(range);
  return useQuery({
    queryKey: ["dashboard", "analytics", ...rangeKey(range)],
    queryFn: () =>
      getJson<DashboardAnalytics>(
        `/api/dashboard/analytics${params ? `?${params}` : ""}`,
      ),
    // Hold the previous slice on screen while the new one loads, so changing
    // the range dims the charts instead of collapsing the page into skeletons.
    placeholderData: keepPreviousData,
  });
}

/** The two "what just happened" feeds at the foot of the page. */
export function useRecentActivity() {
  return useQuery({
    queryKey: ["dashboard", "recent"],
    queryFn: async () => {
      const [rewards, installers] = await Promise.all([
        getJson<{ rewards: RecentInstallation[] }>(
          "/api/rewards?limit=6&sortBy=createdAt&sortOrder=desc",
        ),
        getJson<{ installers: RecentInstaller[] }>(
          "/api/installers?limit=6&sortBy=createdAt&sortOrder=desc",
        ),
      ]);
      return {
        installations: rewards?.rewards ?? [],
        installers: installers?.installers ?? [],
      };
    },
    placeholderData: keepPreviousData,
  });
}

/** Drill-down for a district row; only runs once a district is selected. */
export function useDistrictInstallers(
  district: string | null,
  range: DashboardRange,
) {
  const params = rangeParams(range);
  return useQuery({
    queryKey: ["dashboard", "district", district, ...rangeKey(range)],
    enabled: Boolean(district),
    queryFn: () =>
      getJson<DistrictInstaller[]>(
        `/api/dashboard/installers-by-district?district=${encodeURIComponent(
          district as string,
        )}${params ? `&${params}` : ""}`,
      ),
  });
}
