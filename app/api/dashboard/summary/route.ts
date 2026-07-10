import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { buildDateRangeFilter, hasFilterConditions } from "@/lib/queryHelpers";

/**
 * Dashboard summary — everything the dashboard used to compute client-side by
 * downloading /api/rewards?limit=5000 and /api/installers?limit=5000. Now a
 * handful of $group aggregations. Honors the same startDate/endDate range the
 * dashboard's time-period toggle produces.
 */
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      const dateFilter = buildDateRangeFilter(startDate, endDate);
      const rangeMatch = hasFilterConditions(dateFilter)
        ? [{ $match: dateFilter }]
        : [];

      const pending = { $eq: ["$rewardStatus", "PENDING"] };
      const paid = { $eq: ["$rewardStatus", "PAID"] };
      const failed = { $eq: ["$rewardStatus", "FAILED"] };
      const referrerAmt = { $ifNull: ["$referrerRewardAmount", 0] };

      // Stats + product/city breakdowns over the selected date range, one query.
      const [breakdown] = await InstallerReward.aggregate([
        ...rangeMatch,
        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: null,
                  totalRewards: { $sum: 1 },
                  totalAmount: { $sum: "$rewardAmount" },
                  pendingAmount: {
                    $sum: { $cond: [pending, "$rewardAmount", 0] },
                  },
                  paidAmount: { $sum: { $cond: [paid, "$rewardAmount", 0] } },
                  failedAmount: {
                    $sum: { $cond: [failed, "$rewardAmount", 0] },
                  },
                  referrerRewardsTotal: { $sum: referrerAmt },
                  referrerRewardsPending: {
                    $sum: { $cond: [pending, referrerAmt, 0] },
                  },
                  referrerRewardsPaid: {
                    $sum: { $cond: [paid, referrerAmt, 0] },
                  },
                },
              },
            ],
            products: [
              { $group: { _id: "$productModel", installations: { $sum: 1 } } },
              { $sort: { installations: -1 } },
              { $limit: 6 },
            ],
            cities: [
              {
                $match: {
                  cityOfInstallation: { $nin: [null, "", "undefined", "null"] },
                },
              },
              {
                $group: {
                  _id: "$cityOfInstallation",
                  installations: { $sum: 1 },
                },
              },
              { $sort: { installations: -1 } },
              { $limit: 5 },
            ],
          },
        },
      ]);

      const emptyStats = {
        totalRewards: 0,
        totalAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        failedAmount: 0,
        referrerRewardsTotal: 0,
        referrerRewardsPending: 0,
        referrerRewardsPaid: 0,
      };
      const stats = { ...emptyStats, ...(breakdown?.stats?.[0] ?? {}) };
      delete (stats as { _id?: unknown })._id;

      const productData = (breakdown?.products ?? []).map(
        (p: { _id: string; installations: number }) => ({
          model:
            p._id && p._id.length > 25 ? p._id.substring(0, 25) + "..." : p._id,
          installations: p.installations,
        }),
      );
      const cityData = (breakdown?.cities ?? []).map(
        (c: { _id: string; installations: number }) => ({
          city: c._id,
          installations: c.installations,
        }),
      );

      // Active-installer timeline: 4 fixed windows, independent of the selected
      // range (matches previous client behavior). Distinct installer per window.
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      const last30Start = new Date();
      last30Start.setDate(last30Start.getDate() - 30);
      const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      const last6MonthsStart = new Date();
      last6MonthsStart.setMonth(last6MonthsStart.getMonth() - 6);
      const previousYearStart = new Date(currentYear - 1, 0, 1);
      const previousYearEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59);

      const distinctInstallers = (start: Date, end: Date) => [
        { $match: { createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: "$installer" } },
        { $count: "count" },
      ];

      const [timeline] = await InstallerReward.aggregate([
        {
          $facet: {
            last30days: distinctInstallers(last30Start, now),
            previousMonth: distinctInstallers(prevMonthStart, prevMonthEnd),
            last6months: distinctInstallers(last6MonthsStart, now),
            previousYear: distinctInstallers(previousYearStart, previousYearEnd),
          },
        },
      ]);

      const count = (arr?: Array<{ count: number }>) => arr?.[0]?.count ?? 0;

      // Total installers registered within the selected range.
      const installerDateFilter = buildDateRangeFilter(startDate, endDate);
      const totalInstallers = await Installer.countDocuments(
        installerDateFilter,
      );

      return ApiResponse.success({
        stats,
        totalInstallers,
        productData,
        cityData,
        activeTimeline: {
          last30days: count(timeline?.last30days),
          previousMonth: count(timeline?.previousMonth),
          last6months: count(timeline?.last6months),
          previousYear: count(timeline?.previousYear),
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
);
