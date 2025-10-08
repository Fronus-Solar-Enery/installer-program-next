import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import { getRecentActivities, getTargetActivities } from "@/lib/activityLogger";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";

// GET activities
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");
    const limit = parseInt(searchParams.get("limit") || "100");

    let activities;

    if (targetType && targetId) {
      // Get activities for a specific target
      activities = await getTargetActivities(
        targetType as 'Installer' | 'InstallerReward' | 'TeamMember',
        targetId,
        limit
      );
    } else {
      // Get recent activities across the system
      activities = await getRecentActivities(limit);
    }

    return ApiResponse.success({ activities, total: activities.length });
  } catch (error) {
    return handleApiError(error);
  }
}
