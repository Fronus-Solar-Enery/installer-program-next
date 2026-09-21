import type { RewardsFilters } from "@/hooks/useRewardsState";
import { resolveDateRange } from "@/lib/dateRange";

// Reward installation and sending dates represent calendar dates in Pakistan.
// Store/query their boundaries explicitly rather than relying on the server's
// timezone, which may be UTC in production.
const PAKISTAN_UTC_OFFSET_MS = 5 * 60 * 60 * 1000;

function pakistanDayStart(date: string): Date | null {
  const [yearText, monthText, dayText] = date.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return null;

  return new Date(Date.UTC(year, month - 1, day) - PAKISTAN_UTC_OFFSET_MS);
}

function pakistanMonthStart(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1) - PAKISTAN_UTC_OFFSET_MS);
}

function pakistanMonthEnd(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 1) - PAKISTAN_UTC_OFFSET_MS - 1);
}

/**
 * Turn the rewards list filter state into query params.
 *
 * The list fetch and the Excel export both use this, so a download is always
 * the same filtered set that is on screen. They used to build their params
 * separately and had drifted — the export sent filter names the API never read,
 * quietly exporting everything.
 */
export function buildRewardsFilterParams(
  filters: RewardsFilters,
  search?: string
): URLSearchParams {
  const params = new URLSearchParams();

  if (search) params.append("search", search);
  if (filters.rewardStatus && filters.rewardStatus !== "ALL") {
    params.append("rewardStatus", filters.rewardStatus);
  }
  if (filters.paymentMethod && filters.paymentMethod !== "all") {
    params.append("paymentMethod", filters.paymentMethod);
  }
  if (filters.productModel && filters.productModel !== "all") {
    params.append("productModel", filters.productModel);
  }
  if (filters.teamMember && filters.teamMember !== "all") {
    params.append("registeredBy", filters.teamMember);
  }

  // Installation date is a Pakistan calendar month (YYYY-MM) in the UI.
  if (filters.installationDate) {
    const [year, month] = filters.installationDate.split("-").map(Number);
    if (year && month) {
      params.append(
        "installationStart",
        pakistanMonthStart(year, month).toISOString()
      );
      params.append(
        "installationEnd",
        pakistanMonthEnd(year, month).toISOString()
      );
    }
  }

  if (filters.sendingStart) {
    const start = pakistanDayStart(filters.sendingStart);
    if (start) params.append("sendingStart", start.toISOString());
  }
  if (filters.sendingEnd) {
    const start = pakistanDayStart(filters.sendingEnd);
    if (start) {
      params.append("sendingEnd", new Date(start.getTime() + 86_400_000 - 1).toISOString());
    }
  }

  const { start, end } = resolveDateRange(filters);
  if (start) params.append("startDate", start.toISOString());
  if (end) params.append("endDate", end.toISOString());

  return params;
}
