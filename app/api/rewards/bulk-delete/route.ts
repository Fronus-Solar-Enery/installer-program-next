import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { TeamRole } from "@/models/TeamMember";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";

interface BulkDeleteResult {
  successCount: number;
  failCount: number;
  failures: Array<{ name: string; reason: string }>;
}

interface PopulatedInstaller {
  installerCode: string;
  fullName: string;
}

// POST - Bulk delete rewards (ADMIN/MANAGER only)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    // Only ADMIN and MANAGER can delete
    if (
      session.user.role !== TeamRole.ADMIN &&
      session.user.role !== TeamRole.MANAGER
    ) {
      return ApiResponse.forbidden(
        "Only admins and managers can delete rewards"
      );
    }

    const body = await request.json();
    const { rewardIds } = body;

    if (!Array.isArray(rewardIds) || rewardIds.length === 0) {
      return ApiResponse.error("Invalid reward IDs array", 400);
    }

    await dbConnect();

    const result: BulkDeleteResult = {
      successCount: 0,
      failCount: 0,
      failures: [],
    };

    // Process deletions in parallel for better performance
    const deletePromises = rewardIds.map(async (rewardId) => {
      try {
        // Find reward
        const reward = await InstallerReward.findById(rewardId).populate(
          "installer",
          "installerCode fullName"
        );

        if (!reward) {
          result.failCount++;
          result.failures.push({
            name: "Unknown",
            reason: "Reward not found",
          });
          return;
        }

        const rewardName = reward.serialNumber;

        // Store info before deletion
        const installerData = reward.installer as unknown as PopulatedInstaller;
        const rewardInfo = {
          serialNumber: reward.serialNumber,
          installerCode: reward.installerCode,
          installerName: installerData?.fullName,
        };

        // Delete reward from database
        await reward.deleteOne();

        // Log activity (non-blocking)
        try {
          await logActivity({
            type: ActivityType.REWARD_DELETED,
            performedBy: session.user.id,
            targetType: "InstallerReward",
            targetId: reward._id,
            targetName: `${rewardInfo.installerCode} - ${rewardInfo.serialNumber}`,
            description: `Deleted reward for ${rewardInfo.installerName} (Serial: ${rewardInfo.serialNumber})`,
            ipAddress:
              request.headers.get("x-forwarded-for") ||
              request.headers.get("x-real-ip") ||
              undefined,
            userAgent: request.headers.get("user-agent") || undefined,
          });
        } catch (error) {
          console.error("✗ Failed to log activity:", error);
          // Continue with deletion even if logging fails
        }

        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.failures.push({
          name: "Unknown",
          reason:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    });

    // Wait for all deletions to complete
    await Promise.allSettled(deletePromises);

    return ApiResponse.success(
      result,
      `Bulk delete completed: ${result.successCount} succeeded, ${result.failCount} failed`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
