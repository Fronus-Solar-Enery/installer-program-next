import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { bulkRewardAccountSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { TeamRole } from "@/models/TeamMember";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { RewardStatus } from "@/types/rewards";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";

// POST - Bulk update payment account details on rewards (ADMIN/MANAGER only).
// PAID rewards are skipped: the money already left, so their payee is history.
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const validation = await validateBody(request, bulkRewardAccountSchema);
      if (!validation.success) return validation.response;
      const { rewardIds, bankName, accountNumber, accountTitle } =
        validation.data;

      await dbConnect();

      const targets = await InstallerReward.find({
        _id: { $in: rewardIds },
        rewardStatus: { $ne: RewardStatus.PAID },
      })
        .select("_id serialNumber installerCode")
        .lean();

      if (targets.length === 0) {
        return ApiResponse.badRequest(
          "No editable products in selection — PAID rewards cannot have their account details changed",
        );
      }

      const editableIds = targets.map((r) => r._id);
      await InstallerReward.updateMany(
        { _id: { $in: editableIds } },
        {
          $set: {
            bankName,
            accountNumber,
            accountTitle,
            updatedBy: session.user.id,
          },
        },
      );

      const skipped = rewardIds.length - targets.length;
      const clientInfo = getClientInfo(request);

      await logActivity({
        type: ActivityType.REWARD_UPDATED,
        performedBy: session.user.id,
        targetType: "InstallerReward",
        description: `Bulk updated account details on ${targets.length} reward(s) → ${bankName} / ${accountNumber} / ${accountTitle}`,
        metadata: {
          summary: true,
          method: "bulk_account_update",
          count: targets.length,
          skippedPaid: skipped,
          bankName,
          accountNumber,
          accountTitle,
          installerCode: targets[0]?.installerCode,
          serialNumbers: targets.map((r) => r.serialNumber),
        },
        ...clientInfo,
      });

      return ApiResponse.success(
        { updated: targets.length, skippedPaid: skipped },
        skipped > 0
          ? `Updated ${targets.length} product(s); skipped ${skipped} already PAID`
          : `Updated account details on ${targets.length} product(s)`,
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] },
);
