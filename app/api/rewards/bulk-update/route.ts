import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import Activity from "@/models/Activity";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { BUSINESS_RULES } from "@/lib/constants";
import { getSettings } from "@/models/Settings";
import { RewardStatus, ProductStatus } from "@/types/rewards";
import { syncWarningForReward } from "@/lib/warnings";
import { logger } from "@/lib/logger";
import mongoose from "mongoose";

interface RewardUpdateInput {
  serialNumber: string;
  transactionId: string;
  referrerTransactionId?: string;
  rewardStatus: string;
  productStatus?: string;
  rejectionReason?: string;
  sendingDate?: string;
  paymentMethod?: string;
  isValid?: boolean;
}

interface BulkResults {
  success: number;
  failed: number;
  errors: string[];
  successfulSerials: string[];
}

// POST - Bulk update rewards
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      let body: { rewards: RewardUpdateInput[] };
      try {
        body = await request.json();
      } catch {
        return ApiResponse.badRequest("Invalid JSON in request body");
      }

      const { rewards } = body;

      if (!rewards || !Array.isArray(rewards) || rewards.length === 0) {
        return ApiResponse.badRequest("No rewards provided");
      }

      // Limit batch size using centralized constant
      if (rewards.length > BUSINESS_RULES.MAX_BULK_BATCH_SIZE) {
        return ApiResponse.badRequest(
          `Maximum ${BUSINESS_RULES.MAX_BULK_BATCH_SIZE} rewards per upload. Please split your file.`
        );
      }

      const results: BulkResults = {
        success: 0,
        failed: 0,
        errors: [],
        successfulSerials: [],
      };

      // Only process valid rewards
      const validRewards = rewards.filter((r) => r.isValid !== false);

      if (validRewards.length === 0) {
        return ApiResponse.badRequest("No valid rewards to update");
      }

      // Pre-fetch all rewards in one query (performance optimization)
      const serialNumbers = validRewards.map((r) => r.serialNumber);
      const existingRewards = await InstallerReward.find({
        serialNumber: { $in: serialNumbers },
      }).lean();

      // Create a map for O(1) lookups
      const rewardMap = new Map(
        existingRewards.map((r) => [r.serialNumber, r])
      );

      const { requireTransactionIdForPaid } = await getSettings();

      // Build bulk write operations
      type BulkWriteOp = {
        updateOne: {
          filter: { serialNumber: string };
          update: { $set: Record<string, unknown> };
        };
      };
      const bulkOps: BulkWriteOp[] = [];

      // Warning re-evaluations deferred until after the bulk write lands.
      const warningSyncs: {
        _id: mongoose.Types.ObjectId | string;
        installer: mongoose.Types.ObjectId | string;
        serialNumber: string;
        productStatus?: string;
        rejectionReason?: string;
      }[] = [];

      // Activity logs to create
      const activitiesToCreate: {
        type: string;
        description: string;
        performedBy: string;
        targetType: string;
        targetId: mongoose.Types.ObjectId;
        metadata: Record<string, unknown>;
      }[] = [];

      for (const rewardUpdate of validRewards) {
        const existingReward = rewardMap.get(rewardUpdate.serialNumber);

        if (!existingReward) {
          results.failed++;
          results.errors.push(
            `Serial number ${rewardUpdate.serialNumber} not found`
          );
          continue;
        }

        // Enforce Transaction ID before allowing a reward to be marked PAID.
        if (
          requireTransactionIdForPaid &&
          rewardUpdate.rewardStatus === RewardStatus.PAID &&
          !(rewardUpdate.transactionId || existingReward.transactionId)?.trim()
        ) {
          results.failed++;
          results.errors.push(
            `Serial number ${rewardUpdate.serialNumber} needs a Transaction ID to be marked PAID`
          );
          continue;
        }

        // Product status the row will end up with — the incoming value when the
        // sheet supplies one, otherwise whatever the reward already has.
        const effectiveProductStatus =
          (rewardUpdate.productStatus as ProductStatus | undefined) ||
          existingReward.productStatus ||
          ProductStatus.ELIGIBLE;

        // Only eligible products can be paid. Blocking it here as well as in the
        // template stops a hand-edited sheet from paying out a rejected claim.
        if (
          rewardUpdate.rewardStatus === RewardStatus.PAID &&
          effectiveProductStatus !== ProductStatus.ELIGIBLE
        ) {
          results.failed++;
          results.errors.push(
            `Serial number ${rewardUpdate.serialNumber} is ${effectiveProductStatus} and cannot be marked PAID`
          );
          continue;
        }

        // Build update data
        const updateData: Record<string, unknown> = {
          transactionId: rewardUpdate.transactionId,
          rewardStatus: rewardUpdate.rewardStatus,
          updatedBy: session.user.id,
        };

        if (rewardUpdate.productStatus) {
          updateData.productStatus = rewardUpdate.productStatus;
          updateData.rejectionReason =
            rewardUpdate.productStatus === ProductStatus.REJECTED
              ? rewardUpdate.rejectionReason
              : undefined;
        }

        if (rewardUpdate.referrerTransactionId) {
          updateData.referrerTransactionId = rewardUpdate.referrerTransactionId;
        }
        if (rewardUpdate.sendingDate) {
          updateData.sendingDate = new Date(rewardUpdate.sendingDate);
        }
        if (rewardUpdate.paymentMethod) {
          updateData.paymentMethod = rewardUpdate.paymentMethod;
        }

        // Add to bulk operations
        bulkOps.push({
          updateOne: {
            filter: { serialNumber: rewardUpdate.serialNumber },
            update: { $set: updateData },
          },
        });

        // Prepare activity log
        activitiesToCreate.push({
          type: "REWARD_UPDATED",
          description: `Updated reward status to ${rewardUpdate.rewardStatus} for serial ${rewardUpdate.serialNumber} via bulk upload`,
          performedBy: session.user.id,
          targetType: "InstallerReward",
          targetId: new mongoose.Types.ObjectId(existingReward._id),
          metadata: {
            serialNumber: rewardUpdate.serialNumber,
            rewardStatus: rewardUpdate.rewardStatus,
            transactionId: rewardUpdate.transactionId,
            method: "bulk_update",
          },
        });

        // Only rows whose product status the sheet actually set need their
        // warning re-evaluated after the write.
        if (rewardUpdate.productStatus) {
          warningSyncs.push({
            _id: existingReward._id,
            installer: existingReward.installer,
            serialNumber: rewardUpdate.serialNumber,
            productStatus: effectiveProductStatus,
            rejectionReason:
              effectiveProductStatus === ProductStatus.REJECTED
                ? rewardUpdate.rejectionReason
                : undefined,
          });
        }

        results.success++;
        results.successfulSerials.push(rewardUpdate.serialNumber);
      }

      // Execute bulk update in a single operation
      if (bulkOps.length > 0) {
        try {
          await InstallerReward.bulkWrite(bulkOps, { ordered: false });
        } catch (err) {
          console.error("Bulk write error:", err);
          results.success = 0;
          results.failed = validRewards.length;
          results.errors.push("Bulk update failed. Please try again.");
          results.successfulSerials = [];

          return ApiResponse.serverError("Bulk update failed");
        }
      }

      // Issue or revoke warnings for the rows whose product status changed.
      // Sequential on purpose: suspension reads the installer's live warning
      // count, and two rows for the same installer must not race on it.
      for (const sync of warningSyncs) {
        try {
          await syncWarningForReward(sync, session.user.id);
        } catch (err) {
          logger.error("Bulk warning sync failed", {
            serialNumber: sync.serialNumber,
            error: String(err),
          });
        }
      }

      // Batch insert activity logs (non-blocking)
      if (activitiesToCreate.length > 0) {
        try {
          await Activity.insertMany(activitiesToCreate, { ordered: false });
        } catch (activityErr) {
          console.error("Failed to create some activity logs:", activityErr);
        }
      }

      return ApiResponse.success(
        {
          ...results,
          summary: {
            total: validRewards.length,
            successful: results.success,
            failed: results.failed,
            successRate:
              validRewards.length > 0
                ? Math.round((results.success / validRewards.length) * 100)
                : 0,
          },
        },
        `Successfully updated ${results.success} of ${validRewards.length} reward(s)`
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
