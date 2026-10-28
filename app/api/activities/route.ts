import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import {
  getRecentActivities,
  getTargetActivities,
  getInstallerActivities,
} from "@/lib/activityLogger";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { canSeeRejected } from "@/types/rewards";

// GET activities
export const GET = withAuth(
  async (request: NextRequest, _context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(request.url);
      const targetType = searchParams.get("targetType");
      const targetId = searchParams.get("targetId");
      const installerId = searchParams.get("installerId");
      const limit = parseInt(searchParams.get("limit") || "100");

      // Rejected rewards (and their audit entries) are admin-only.
      const options = { hideRejected: !canSeeRejected(session.user.role) };

      let activities;

      if (installerId) {
        // All activities for an installer + its rewards in one query
        activities = await getInstallerActivities(installerId, limit, options);
      } else if (targetType && targetId) {
        // Get activities for a specific target
        activities = await getTargetActivities(
          targetType as "Installer" | "InstallerReward" | "TeamMember",
          targetId,
          limit,
          options
        );
      } else {
        // Get recent activities across the system
        activities = await getRecentActivities(limit, options);
      }

      return ApiResponse.success({ activities, total: activities.length });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
