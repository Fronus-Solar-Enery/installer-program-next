import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";

interface RewardUpdate {
  serialNumber: string;
  transactionId: string;
  referrerTransactionId?: string;
  rewardStatus: string;
  sendingDate?: string;
  paymentMethod?: string;
  issues: string[];
  isValid: boolean;
}

interface ExistingRewardLean {
  serialNumber: string;
  referrer?: unknown;
}

export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { rewards } = await request.json();

      if (!rewards || !Array.isArray(rewards) || rewards.length === 0) {
        return ApiResponse.badRequest("No rewards provided");
      }

      // Fetch all existing rewards with serial numbers
      const serialNumbers = rewards.map((r: RewardUpdate) => r.serialNumber);
      const existingRewards = await InstallerReward.find(
        { serialNumber: { $in: serialNumbers } },
        { serialNumber: 1, referrer: 1, _id: 0 }
      ).lean<ExistingRewardLean[]>();

      const existingSerialNumbers = new Set(
        existingRewards.map((r) => r.serialNumber.toUpperCase())
      );

      const rewardsWithReferrer = new Set(
        existingRewards
          .filter((r) => r.referrer)
          .map((r) => r.serialNumber.toUpperCase())
      );

      // Track serial numbers in the upload batch for duplicate detection
      const serialsInBatch = new Map<string, number>();

      // Validate each reward
      const validatedRewards: RewardUpdate[] = rewards.map(
        (reward: RewardUpdate, index: number) => {
          const newIssues: string[] = [...reward.issues];
          const serialUpper = reward.serialNumber.toUpperCase();

          // Check if serial number exists in database
          if (!existingSerialNumbers.has(serialUpper)) {
            newIssues.push(
              `Serial number "${reward.serialNumber}" not found in database`
            );
          }

          // Check for duplicate serial number in the upload batch
          if (serialsInBatch.has(serialUpper)) {
            const firstOccurrence = serialsInBatch.get(serialUpper)! + 1;
            newIssues.push(
              `Duplicate serial number in upload (first occurrence at row ${firstOccurrence})`
            );
          } else {
            serialsInBatch.set(serialUpper, index);
          }

          // Validate referrer transaction ID requirement
          if (rewardsWithReferrer.has(serialUpper)) {
            if (
              reward.rewardStatus === "PAID" &&
              !reward.referrerTransactionId
            ) {
              newIssues.push(
                "Referrer transaction ID is required (this reward has a referrer)"
              );
            }
          }

          // Validate transaction ID is present for PAID status
          if (reward.rewardStatus === "PAID") {
            if (!reward.transactionId || reward.transactionId.length < 3) {
              newIssues.push("Transaction ID is required for PAID status");
            }
          }

          return {
            ...reward,
            issues: newIssues,
            isValid: newIssues.length === 0,
          };
        }
      );

      const validCount = validatedRewards.filter((r) => r.isValid).length;
      const invalidCount = validatedRewards.filter((r) => !r.isValid).length;

      return ApiResponse.success({
        validatedRewards,
        summary: {
          total: validatedRewards.length,
          valid: validCount,
          invalid: invalidCount,
        },
      });
    } catch (error) {
      console.error("Validation error:", error);
      return handleApiError(error);
    }
  }
);
