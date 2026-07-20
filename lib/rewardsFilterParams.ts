import type { RewardsFilters } from "@/hooks/useRewardsState";
import { resolveDateRange } from "@/lib/dateRange";

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
  if (filters.productStatus && filters.productStatus !== "all") {
    params.append("productStatus", filters.productStatus);
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

  // Installation date is a month (YYYY-MM) in the UI; widen it to that month.
  if (filters.installationDate) {
    const [year, month] = filters.installationDate.split("-").map(Number);
    if (year && month) {
      params.append(
        "installationStart",
        new Date(Date.UTC(year, month - 1, 1)).toISOString()
      );
      params.append(
        "installationEnd",
        new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString()
      );
    }
  }

  if (filters.sendingStart) {
    params.append("sendingStart", new Date(filters.sendingStart).toISOString());
  }
  if (filters.sendingEnd) {
    const end = new Date(filters.sendingEnd);
    end.setHours(23, 59, 59, 999);
    params.append("sendingEnd", end.toISOString());
  }

  const { start, end } = resolveDateRange(filters);
  if (start) params.append("startDate", start.toISOString());
  if (end) params.append("endDate", end.toISOString());

  return params;
}
