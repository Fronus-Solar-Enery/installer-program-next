import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { IInstaller } from "@/models/Installer";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import {
  BatchDuplicateTracker,
  normalizeAccountNumber,
  normalizeIdentity,
} from "@/lib/bulkValidation";
import { isMobileBank } from "@/lib/constants";

interface RewardUpdate {
  serialNumber: string;
  transactionId: string;
  referrerTransactionId?: string;
  rewardStatus: string;
  sendingDate?: string;
  paymentMethod?: string;
  installerCode?: string;
  accountTitle?: string;
  accountNumber?: string;
  issues: string[];
  isValid: boolean;
}

interface ExistingRewardLean {
  serialNumber: string;
  referrer?: unknown;
  rewardStatus: string;
  installer?: Pick<
    IInstaller,
    "installerCode" | "bankName" | "accountNumber" | "accountTitle"
  > | null;
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
        {
          serialNumber: 1,
          referrer: 1,
          rewardStatus: 1,
          installer: 1,
          _id: 0,
        }
      )
        .populate(
          "installer",
          "installerCode bankName accountNumber accountTitle"
        )
        .lean<ExistingRewardLean[]>();

      const existingSerialNumbers = new Set(
        existingRewards.map((r) => r.serialNumber.toUpperCase())
      );

      // Map serial (upper) -> existing reward for status / display lookups
      const existingBySerial = new Map(
        existingRewards.map((r) => [r.serialNumber.toUpperCase(), r])
      );

      const rewardsWithReferrer = new Set(
        existingRewards
          .filter((r) => r.referrer)
          .map((r) => r.serialNumber.toUpperCase())
      );

      // Track serial numbers in the upload batch for duplicate detection
      const serialsInBatch = new BatchDuplicateTracker();

      // Validate each reward
      const validatedRewards: RewardUpdate[] = rewards.map(
        (reward: RewardUpdate, index: number) => {
          const newIssues: string[] = [...reward.issues];
          const serialUpper = reward.serialNumber.toUpperCase();
          const existing = existingBySerial.get(serialUpper);

          // Check if serial number exists in database
          if (!existingSerialNumbers.has(serialUpper)) {
            newIssues.push(
              `Serial number "${reward.serialNumber}" not found in database`
            );
          }

          // Never overwrite an already-PAID reward via bulk update
          if (existing?.rewardStatus === "PAID") {
            newIssues.push(
              `Serial number "${reward.serialNumber}" is already PAID and cannot be overwritten via bulk update`
            );
          }

          // The uploaded row must describe the same payee the payment sheet was
          // generated for — otherwise the TID would be recorded against the
          // wrong reward. Compared against the live installer record, the same
          // source the template and payment-format exports print.
          const installer = existing?.installer;
          if (installer) {
            if (
              normalizeIdentity(reward.installerCode) !==
              normalizeIdentity(installer.installerCode)
            ) {
              newIssues.push(
                `Installer code "${reward.installerCode || ""}" does not match the installer on record ("${installer.installerCode}")`
              );
            }

            if (
              normalizeIdentity(reward.accountTitle) !==
              normalizeIdentity(installer.accountTitle)
            ) {
              newIssues.push(
                `Reward account title "${reward.accountTitle || ""}" does not match the account on record ("${installer.accountTitle}")`
              );
            }

            const mobile = isMobileBank(installer.bankName || "");
            if (
              normalizeAccountNumber(reward.accountNumber, mobile) !==
              normalizeAccountNumber(installer.accountNumber, mobile)
            ) {
              newIssues.push(
                `Reward account number "${reward.accountNumber || ""}" does not match the account on record ("${installer.accountNumber}")`
              );
            }
          }

          // Check for duplicate serial number in the upload batch
          const dupIssue = serialsInBatch.check(
            serialUpper,
            index,
            "serial number"
          );
          if (dupIssue) newIssues.push(dupIssue);

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

          // Echo back the uploaded identity values, not the DB ones — the
          // preview has to show staff what their file actually said.
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
