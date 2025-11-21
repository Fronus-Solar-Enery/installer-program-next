import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import BatchJob from "@/models/BatchJob";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { TeamRole } from "@/models/TeamMember";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";

interface BulkDeleteResult {
  successCount: number;
  failCount: number;
  failures: Array<{ name: string; reason: string }>;
  batchJobId?: string;
}

// POST - Bulk delete installers (ADMIN/MANAGER only)
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
        "Only admins and managers can delete installers"
      );
    }

    const body = await request.json();
    const { installerIds } = body;

    if (!Array.isArray(installerIds) || installerIds.length === 0) {
      return ApiResponse.error("Invalid installer IDs array", 400);
    }

    await dbConnect();

    const result: BulkDeleteResult = {
      successCount: 0,
      failCount: 0,
      failures: [],
    };

    // First, fetch all installers to validate and check rewards
    const installersToDelete = await Installer.find({
      _id: { $in: installerIds },
    }).lean();

    if (installersToDelete.length === 0) {
      return ApiResponse.error("No installers found to delete", 404);
    }

    // Validate installers and check for rewards
    const validationPromises = installersToDelete.map(async (installer) => {
      const rewardCount = await InstallerReward.countDocuments({
        installer: installer._id,
      });

      if (rewardCount > 0) {
        result.failCount++;
        result.failures.push({
          name: installer.fullName || "Unknown",
          reason: "Cannot delete installer with existing rewards",
        });
        return { valid: false, installer };
      }

      return { valid: true, installer };
    });

    const validationResults = await Promise.all(validationPromises);
    const validInstallers = validationResults
      .filter((r) => r.valid)
      .map((r) => r.installer);

    if (validInstallers.length === 0) {
      return ApiResponse.success(
        result,
        `Bulk delete completed: ${result.successCount} succeeded, ${result.failCount} failed`
      );
    }

    // Collect Google Contact data for batch job (before deleting from DB)
    const googleContactsToDelete = validInstallers
      .filter((i) => i.googleContactId)
      .map((i) => ({
        googleContactId: i.googleContactId,
        installerCode: i.installerCode,
        fullName: i.fullName,
      }));

    // Now delete installers from database and log activities
    const dbDeletePromises = validInstallers.map(async (installer) => {
      try {
        // Delete installer from database
        await Installer.findByIdAndDelete(installer._id);

        // Log activity (non-blocking)
        try {
          await logActivity({
            type: ActivityType.INSTALLER_DELETED,
            performedBy: session.user.id,
            targetType: "Installer",
            targetId: installer._id,
            targetName: `${installer.installerCode} - ${installer.fullName}`,
            description: `Deleted installer ${installer.fullName} (${installer.installerCode})`,
            ipAddress:
              request.headers.get("x-forwarded-for") ||
              request.headers.get("x-real-ip") ||
              undefined,
            userAgent: request.headers.get("user-agent") || undefined,
          });
        } catch (error) {
          console.error("✗ Failed to log activity:", error);
          // Continue even if logging fails
        }

        result.successCount++;
      } catch (error) {
        result.failCount++;
        result.failures.push({
          name: installer.fullName || "Unknown",
          reason:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    });

    // Wait for all database deletions to complete
    await Promise.allSettled(dbDeletePromises);

    // Create batch job for Google Contacts deletion (if any)
    if (googleContactsToDelete.length > 0) {
      try {
        const batchJob = await BatchJob.create({
          type: "GOOGLE_CONTACTS_DELETE",
          status: "pending",
          totalItems: googleContactsToDelete.length,
          processedItems: 0,
          successCount: 0,
          failedCount: 0,
          metadata: {
            googleContacts: googleContactsToDelete,
          },
          createdBy: session.user.id,
        });

        result.batchJobId = batchJob._id.toString();

        console.log(
          `✓ Created batch job ${result.batchJobId} for ${googleContactsToDelete.length} Google Contacts deletions`
        );
      } catch (jobErr) {
        console.error("Failed to create batch job:", jobErr);
        // Don't fail the main operation if job creation fails
      }
    }

    return ApiResponse.success(
      result,
      `Bulk delete completed: ${result.successCount} succeeded, ${result.failCount} failed`
    );
  } catch (error) {
    return handleApiError(error);
  }
}
