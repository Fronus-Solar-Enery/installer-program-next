import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { bulkRewardStatusSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { TeamRole } from "@/models/TeamMember";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { RewardStatus } from "@/types/rewards";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";

// Each action only touches rewards in its allowed starting statuses — the same
// rules as rewardStatusChangeError: PAID can't be rejected, and REJECTED can
// only go back to PENDING. Everything else in the selection is skipped.
const ACTIONS = {
  reject: {
    from: [RewardStatus.PENDING, RewardStatus.FAILED],
    to: RewardStatus.REJECTED,
    activity: ActivityType.REWARD_REJECTED,
    verb: "Rejected",
    none: "No rejectable products in selection — only PENDING or FAILED rewards can be rejected",
    skippedNote: "PAID or already rejected",
  },
  restore: {
    from: [RewardStatus.REJECTED],
    to: RewardStatus.PENDING,
    activity: ActivityType.REWARD_RESTORED,
    verb: "Restored",
    none: "No rejected products in selection to restore",
    skippedNote: "not rejected",
  },
} as const;

// POST - Bulk reject / restore rewards (ADMIN only — rejected rewards are
// admin-only, see canSeeRejected).
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const validation = await validateBody(request, bulkRewardStatusSchema);
      if (!validation.success) return validation.response;
      const { rewardIds, action } = validation.data;
      const rule = ACTIONS[action];

      await dbConnect();

      const targets = await InstallerReward.find({
        _id: { $in: rewardIds },
        rewardStatus: { $in: rule.from },
      })
        .select("_id serialNumber installerCode")
        .lean();

      if (targets.length === 0) {
        return ApiResponse.badRequest(rule.none);
      }

      await InstallerReward.updateMany(
        { _id: { $in: targets.map((r) => r._id) } },
        { $set: { rewardStatus: rule.to, updatedBy: session.user.id } },
      );

      const skipped = rewardIds.length - targets.length;

      await logActivity({
        type: rule.activity,
        performedBy: session.user.id,
        targetType: "InstallerReward",
        description: `Bulk ${rule.verb.toLowerCase()} ${targets.length} reward(s)`,
        metadata: {
          summary: true,
          method: `bulk_${action}`,
          count: targets.length,
          skipped,
          installerCode: targets[0]?.installerCode,
          serialNumbers: targets.map((r) => r.serialNumber),
        },
        ...getClientInfo(request),
      });

      return ApiResponse.success(
        { updated: targets.length, skipped },
        skipped > 0
          ? `${rule.verb} ${targets.length} product(s); skipped ${skipped} ${rule.skippedNote}`
          : `${rule.verb} ${targets.length} product(s)`,
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN] },
);
