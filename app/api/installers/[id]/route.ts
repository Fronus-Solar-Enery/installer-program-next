import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import { updateInstallerSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { TeamRole } from "@/models/TeamMember";
import {
  findInstallerByIdOrCode,
  INSTALLER_POPULATE_OPTIONS,
  prepareInstallerContactData,
} from "@/lib/installerUtils";

import {
  createGoogleContact,
  updateGoogleContact,
  deleteGoogleContact,
} from "@/lib/googleContacts";
import mongoose from "mongoose";
import { BUSINESS_RULES } from "@/lib/constants";
import { logActivity, getChanges } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";

// GET single installer with stats
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const installer = await findInstallerByIdOrCode(
        id,
        INSTALLER_POPULATE_OPTIONS.full
      );

      if (!installer) {
        return ApiResponse.notFound("Installer not found");
      }

      // Get reward statistics
      const installerId = installer._id;
      const [totalRewards, pendingRewards, paidRewards, failedRewards] =
        await Promise.all([
          InstallerReward.countDocuments({ installer: installerId }),
          InstallerReward.countDocuments({
            installer: installerId,
            rewardStatus: "PENDING",
          }),
          InstallerReward.countDocuments({
            installer: installerId,
            rewardStatus: "PAID",
          }),
          InstallerReward.countDocuments({
            installer: installerId,
            rewardStatus: "FAILED",
          }),
        ]);

      // Get reward amounts
      const rewardAmounts = await InstallerReward.aggregate([
        { $match: { installer: installerId } },
        {
          $group: {
            _id: "$rewardStatus",
            total: { $sum: "$rewardAmount" },
          },
        },
      ]);

      const amountByStatus = {
        all: 0,
        PENDING: 0,
        PAID: 0,
        FAILED: 0,
      };

      rewardAmounts.forEach((item) => {
        amountByStatus[item._id as keyof typeof amountByStatus] = item.total;
        amountByStatus.all += item.total;
      });

      return ApiResponse.success({
        installer,
        statistics: {
          totalRewards,
          pendingRewards,
          paidRewards,
          failedRewards,
          totalAmount: amountByStatus.all,
          pendingAmount: amountByStatus.PENDING,
          paidAmount: amountByStatus.PAID,
          failedAmount: amountByStatus.FAILED,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// PUT - Update installer
export const PUT = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      // Validate request body
      const validation = await validateBody(request, updateInstallerSchema);
      if (!validation.success) return validation.response;
      const validatedData = validation.data;

      await dbConnect();

      const { id } = await context.params;
      const installer = await findInstallerByIdOrCode(id);

      if (!installer) {
        return ApiResponse.notFound("Installer not found");
      }

      // Capture original data for activity logging
      const originalData = installer.toObject() as unknown as Record<
        string,
        unknown
      >;

      // Validate referrer code if being updated
      if (
        validatedData.referrerCode &&
        validatedData.referrerCode !== installer.referrerCode
      ) {
        const referrer = await Installer.findOne({
          installerCode: validatedData.referrerCode,
        });
        if (!referrer) {
          return ApiResponse.badRequest("Invalid referrer code");
        }

        // Check referral limit using constant
        const referralCount = await Installer.countDocuments({
          referrer: referrer._id,
        });
        if (referralCount >= BUSINESS_RULES.MAX_REFERRALS_PER_INSTALLER) {
          return ApiResponse.badRequest(
            `Referrer has already referred maximum (${BUSINESS_RULES.MAX_REFERRALS_PER_INSTALLER}) installers`
          );
        }
      }

      // Update installer
      Object.assign(installer, validatedData);
      await installer.save();

      // Log activity
      const clientInfo = getClientInfo(request);
      const changes = getChanges(originalData, validatedData);
      const changedFields = Object.keys(changes);

      if (changedFields.length > 0) {
        await logActivity({
          type: ActivityType.INSTALLER_UPDATED,
          performedBy: session.user.id,
          targetType: "Installer",
          targetId: installer._id,
          targetName: installer.fullName,
          description: `Updated installer ${installer.installerCode} (${
            installer.fullName
          }): ${changedFields.join(", ")}`,
          metadata: { changes },
          ...clientInfo,
        });
      }

      // Sync with Google Contacts
      const contactData = prepareInstallerContactData(installer);
      if (installer.googleContactId) {
        try {
          await updateGoogleContact(installer.googleContactId, contactData);
          console.log("✓ Google contact updated successfully");
        } catch (error) {
          console.error("Failed to update Google contact:", error);
        }
      } else {
        try {
          const googleContactId = await createGoogleContact(contactData);
          if (googleContactId) {
            installer.googleContactId = googleContactId;
            await installer.save();
            console.log("✓ Google contact created:", googleContactId);
          }
        } catch (error) {
          console.error("Failed to create Google contact:", error);
        }
      }

      const updatedInstaller = await findInstallerByIdOrCode(
        String(installer._id),
        INSTALLER_POPULATE_OPTIONS.full
      );

      return ApiResponse.success(
        updatedInstaller,
        "Installer updated successfully"
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// DELETE installer (ADMIN/MANAGER only)
export const DELETE = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const installer = await findInstallerByIdOrCode(id);

      if (!installer) {
        return ApiResponse.notFound("Installer not found");
      }

      const installerId = installer._id;

      // Check if installer has any rewards
      const rewardCount = await InstallerReward.countDocuments({
        installer: installerId,
      });
      if (rewardCount > 0) {
        return ApiResponse.badRequest(
          "Cannot delete installer with existing rewards. Please delete rewards first."
        );
      }

      // Delete Google Contact
      if (installer.googleContactId) {
        try {
          console.log(
            `Attempting to delete Google contact: ${installer.googleContactId}`
          );
          const deleted = await deleteGoogleContact(installer.googleContactId);
          if (deleted) {
            console.log(
              `Successfully deleted Google contact for installer: ${installer.installerCode}`
            );
          }
        } catch (error) {
          console.error(
            `Error deleting Google contact for installer ${installer.installerCode}:`,
            error
          );
        }
      }

      await installer.deleteOne();

      return ApiResponse.success(null, "Installer deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] }
);
