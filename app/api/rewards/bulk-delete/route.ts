import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { TeamRole } from "@/models/TeamMember";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";

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
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const body = await request.json();
      const { rewardIds } = body;

      if (!Array.isArray(rewardIds) || rewardIds.length === 0) {
        return ApiResponse.badRequest("Invalid reward IDs array");
      }

      await dbConnect();

      const result: BulkDeleteResult = {
        successCount: 0,
        failCount: 0,
        failures: [],
      };

      const clientInfo = getClientInfo(request);

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

          // Store info before deletion
          const installerData =
            reward.installer as unknown as PopulatedInstaller;
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
              ...clientInfo,
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
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] }
);
