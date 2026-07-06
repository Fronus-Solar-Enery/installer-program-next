import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { buildDateRangeFilter, hasFilterConditions } from "@/lib/queryHelpers";

export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(request.url);
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      const dateFilter = buildDateRangeFilter(startDate, endDate);

      // Aggregate to get top 5 active installers
      const topInstallers = await InstallerReward.aggregate([
        // Filter by date range if provided
        ...(hasFilterConditions(dateFilter) ? [{ $match: dateFilter }] : []),

        // Group by installer
        {
          $group: {
            _id: "$installer",
            installerCode: { $first: "$installerCode" },
            totalProducts: { $sum: 1 },
            totalRewardAmount: { $sum: "$rewardAmount" },
            totalReferrerReward: {
              $sum: { $ifNull: ["$referrerRewardAmount", 0] },
            },
          },
        },

        // Sort by number of products (installations) descending
        { $sort: { totalProducts: -1 } },

        // Limit to top 5
        { $limit: 5 },

        // Lookup installer details
        {
          $lookup: {
            from: "installers",
            localField: "_id",
            foreignField: "_id",
            as: "installerDetails",
          },
        },

        // Unwind installer details
        { $unwind: "$installerDetails" },

        // Check if installer has referrals (is a referrer)
        {
          $lookup: {
            from: "installers",
            localField: "installerDetails._id",
            foreignField: "referrer",
            as: "referrals",
          },
        },

        // Calculate referral reward from installers they referred
        {
          $lookup: {
            from: "installerrewards",
            let: { referrerId: "$installerDetails._id" },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ["$referrer", "$$referrerId"] },
                  ...(Object.keys(dateFilter).length > 0 ? dateFilter : {}),
                },
              },
              {
                $group: {
                  _id: null,
                  totalReferralReward: {
                    $sum: { $ifNull: ["$referrerRewardAmount", 0] },
                  },
                },
              },
            ],
            as: "referralRewards",
          },
        },

        // Project final shape
        {
          $project: {
            _id: 0,
            installerName: "$installerDetails.fullName",
            installerCode: 1,
            totalProducts: 1,
            rewardAmount: "$totalRewardAmount",
            referralRewardAmount: {
              $ifNull: [
                { $arrayElemAt: ["$referralRewards.totalReferralReward", 0] },
                0,
              ],
            },
          },
        },
      ]);

      return ApiResponse.success(topInstallers);
    } catch (error) {
      console.error("Error fetching active installers:", error);
      return handleApiError(error);
    }
  }
);
