import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { bulkRewardRejectSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { TeamRole } from "@/models/TeamMember";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { RewardStatus } from "@/types/rewards";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";

// POST - Bulk reject rewards (ADMIN/MANAGER only). Only PENDING/FAILED rewards
// move to REJECTED; PAID ones can't be rejected and already-REJECTED ones are
// left as they are — both are reported back as skipped.
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const validation = await validateBody(request, bulkRewardRejectSchema);
      if (!validation.success) return validation.response;
      const { rewardIds } = validation.data;

      await dbConnect();

      const targets = await InstallerReward.find({
        _id: { $in: rewardIds },
        rewardStatus: { $in: [RewardStatus.PENDING, RewardStatus.FAILED] },
      })
        .select("_id serialNumber installerCode")
        .lean();

      if (targets.length === 0) {
        return ApiResponse.badRequest(
          "No rejectable products in selection — only PENDING or FAILED rewards can be rejected",
        );
      }

      await InstallerReward.updateMany(
        { _id: { $in: targets.map((r) => r._id) } },
        {
          $set: {
            rewardStatus: RewardStatus.REJECTED,
            updatedBy: session.user.id,
          },
        },
      );

      const skipped = rewardIds.length - targets.length;

      await logActivity({
        type: ActivityType.REWARD_REJECTED,
        performedBy: session.user.id,
        targetType: "InstallerReward",
        description: `Bulk rejected ${targets.length} reward(s)`,
        metadata: {
          summary: true,
          method: "bulk_reject",
          count: targets.length,
          skipped,
          installerCode: targets[0]?.installerCode,
          serialNumbers: targets.map((r) => r.serialNumber),
        },
        ...getClientInfo(request),
      });

      return ApiResponse.success(
        { rejected: targets.length, skipped },
        skipped > 0
          ? `Rejected ${targets.length} product(s); skipped ${skipped} PAID or already rejected`
          : `Rejected ${targets.length} product(s)`,
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] },
);
