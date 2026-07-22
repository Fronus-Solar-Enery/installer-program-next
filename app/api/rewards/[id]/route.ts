import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { updateRewardSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { TeamRole } from "@/models/TeamMember";
import { RewardStatus } from "@/types/rewards";
import { getSettings } from "@/models/Settings";
import { sendRewardPaymentMessage } from "@/lib/whatsappService";
import { logger } from "@/lib/logger";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";

const POPULATE = [
  {
    path: "installer",
    select:
      "installerCode fullName cnic phoneNumber whatsappNumber district bankName accountNumber accountTitle",
  },
  {
    path: "referrer",
    select:
      "installerCode fullName phoneNumber bankName accountNumber accountTitle",
  },
  { path: "registeredBy", select: "name email role" },
  { path: "updatedBy", select: "name email role" },
] as const;

// GET single reward
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const reward = await InstallerReward.findById(id).populate([...POPULATE]);

      if (!reward) {
        return ApiResponse.notFound("Reward not found");
      }

      return ApiResponse.success(reward);
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// PUT - Update reward
export const PUT = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const validation = await validateBody(request, updateRewardSchema);
      if (!validation.success) return validation.response;

      await dbConnect();

      const { id } = await context.params;
      const previous = await InstallerReward.findById(id).select(
        "rewardStatus transactionId",
      );
      if (!previous) {
        return ApiResponse.notFound("Reward not found");
      }

      // Reject a Transaction ID already used by a different reward.
      const newTxnId = validation.data.transactionId?.trim();
      if (newTxnId) {
        const dupe = await InstallerReward.exists({
          _id: { $ne: id },
          transactionId: newTxnId,
        });
        if (dupe) {
          return ApiResponse.conflict(
            `Transaction ID "${newTxnId}" is already used by another reward`,
          );
        }
      }

      const becomingPaid =
        previous.rewardStatus !== RewardStatus.PAID &&
        validation.data.rewardStatus === RewardStatus.PAID;

      const becomingFailed =
        previous.rewardStatus !== RewardStatus.FAILED &&
        validation.data.rewardStatus === RewardStatus.FAILED;

      // Enforce Transaction ID before allowing a reward to be marked PAID.
      const settings = becomingPaid ? await getSettings() : null;
      if (settings?.requireTransactionIdForPaid) {
        const effectiveTxnId =
          validation.data.transactionId ?? previous.transactionId;
        if (!effectiveTxnId?.trim()) {
          return ApiResponse.badRequest(
            "Transaction ID is required to mark a reward as PAID",
            { transactionId: ["Transaction ID is required"] },
          );
        }
      }

      const reward = await InstallerReward.findByIdAndUpdate(
        id,
        { ...validation.data, updatedBy: session.user.id },
        { new: true, runValidators: true },
      ).populate([...POPULATE]);

      if (!reward) {
        return ApiResponse.notFound("Reward not found");
      }

      // Notify installer via WhatsApp when reward transitions to PAID.
      const installer = reward.installer as unknown as {
        fullName?: string;
        whatsappNumber?: string;
      } | null;

      if (
        becomingPaid &&
        installer?.fullName &&
        installer?.whatsappNumber
      ) {
        if (settings?.autoSendWhatsAppOnPaid) {
          sendRewardPaymentMessage(
            {
              installer: {
                fullName: installer.fullName,
                whatsappNumber: installer.whatsappNumber,
              },
              serialNumber: reward.serialNumber,
              productModel: reward.productModel,
              rewardAmount: reward.rewardAmount,
              transactionId: reward.transactionId,
              sendingDate: reward.sendingDate,
            },
            session.user.id,
          ).catch((e) =>
            logger.error("Reward-paid WhatsApp failed", { error: String(e) }),
          );
        }
      }

      const activityType = becomingPaid
        ? ActivityType.REWARD_MARKED_PAID
        : becomingFailed
          ? ActivityType.REWARD_MARKED_FAILED
          : ActivityType.REWARD_UPDATED;
      await logActivity({
        type: activityType,
        performedBy: session.user.id,
        targetType: "InstallerReward",
        targetId: reward._id,
        targetName: `${reward.installerCode} - ${reward.serialNumber}`,
        description: `${
          becomingPaid
            ? "Marked reward PAID"
            : becomingFailed
              ? "Marked reward FAILED"
              : "Updated reward"
        } for ${installer?.fullName ?? reward.installerCode} (serial ${reward.serialNumber})`,
        metadata: {
          serialNumber: reward.serialNumber,
          previousStatus: previous.rewardStatus,
          newStatus: reward.rewardStatus,
          transactionId: reward.transactionId,
        },
        ...getClientInfo(request),
      });

      return ApiResponse.success(reward, "Reward updated successfully");
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// DELETE reward (ADMIN/MANAGER only)
export const DELETE = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const reward = await InstallerReward.findByIdAndDelete(id);

      if (!reward) {
        return ApiResponse.notFound("Reward not found");
      }

      await logActivity({
        type: ActivityType.REWARD_DELETED,
        performedBy: session.user.id,
        targetType: "InstallerReward",
        targetId: reward._id,
        targetName: `${reward.installerCode} - ${reward.serialNumber}`,
        description: `Deleted reward for ${reward.installerCode} (serial ${reward.serialNumber})`,
        metadata: { serialNumber: reward.serialNumber },
        ...getClientInfo(request),
      });

      return ApiResponse.success(null, "Reward deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] },
);
