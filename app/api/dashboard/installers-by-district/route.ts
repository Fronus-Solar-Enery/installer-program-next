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
      const district = searchParams.get("district");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      if (!district) {
        return ApiResponse.badRequest("District is required");
      }

      const dateFilter = buildDateRangeFilter(startDate, endDate);

      // Aggregate to get installers from specific district with installations
      const installers = await InstallerReward.aggregate([
        // Filter by date range if provided
        ...(hasFilterConditions(dateFilter) ? [{ $match: dateFilter }] : []),

        // Lookup installer details
        {
          $lookup: {
            from: "installers",
            localField: "installer",
            foreignField: "_id",
            as: "installerDetails",
          },
        },

        // Unwind installer details
        { $unwind: "$installerDetails" },

        // Filter by district
        {
          $match: {
            "installerDetails.district": district,
          },
        },

        // Group by installer
        {
          $group: {
            _id: "$installer",
            installerName: { $first: "$installerDetails.fullName" },
            installerCode: { $first: "$installerDetails.installerCode" },
            district: { $first: "$installerDetails.district" },
            city: { $first: "$installerDetails.city" },
            totalProducts: { $sum: 1 },
            totalRewardAmount: { $sum: "$rewardAmount" },
            totalReferralReward: {
              $sum: { $ifNull: ["$referrerRewardAmount", 0] },
            },
          },
        },

        // Sort by total products descending
        { $sort: { totalProducts: -1 } },

        // Project final shape
        {
          $project: {
            _id: 0,
            installerName: 1,
            installerCode: 1,
            district: 1,
            city: 1,
            totalProducts: 1,
            rewardAmount: "$totalRewardAmount",
            referralRewardAmount: "$totalReferralReward",
          },
        },
      ]);

      return ApiResponse.success(installers);
    } catch (error) {
      console.error("Error fetching installers by district:", error);
      return handleApiError(error);
    }
  }
);
