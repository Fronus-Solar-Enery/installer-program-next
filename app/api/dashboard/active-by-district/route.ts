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

      // Aggregate to get active installers by district
      const activeByDistrict = await InstallerReward.aggregate([
        // Filter by date range if provided
        ...(hasFilterConditions(dateFilter) ? [{ $match: dateFilter }] : []),

        // Lookup installer details to get district
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

        // Group by district and count unique installers
        {
          $group: {
            _id: "$installerDetails.district",
            activeInstallers: { $addToSet: "$installer" },
            totalInstallations: { $sum: 1 },
          },
        },

        // Project final shape with count
        {
          $project: {
            _id: 0,
            district: "$_id",
            activeInstallersCount: { $size: "$activeInstallers" },
            totalInstallations: 1,
          },
        },

        // Sort by active installers count descending
        { $sort: { activeInstallersCount: -1 } },
      ]);

      return ApiResponse.success(activeByDistrict);
    } catch (error) {
      console.error(
        "Error fetching active installers by district:",
        error
      );
      return handleApiError(error);
    }
  }
);
