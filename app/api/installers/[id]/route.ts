import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { updateInstallerSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { TeamRole } from "@/models/TeamMember";
import {
  findInstallerByIdOrCode,
  INSTALLER_POPULATE_OPTIONS,
} from "@/lib/installerUtils";
import { getClientInfo } from "@/lib/requestUtils";
import {
  updateInstaller,
  deleteInstaller,
  InstallerServiceError,
} from "@/services/installers";

// GET single installer with stats
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const installer = await findInstallerByIdOrCode(
        id,
        INSTALLER_POPULATE_OPTIONS.full,
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
  },
);

// PUT - Update installer
export const PUT = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const validation = await validateBody(request, updateInstallerSchema);
      if (!validation.success) return validation.response;

      await dbConnect();

      const { id } = await context.params;
      const updatedInstaller = await updateInstaller(id, validation.data, {
        userId: session.user.id,
        clientInfo: getClientInfo(request),
      });

      return ApiResponse.success(
        updatedInstaller,
        "Installer updated successfully",
      );
    } catch (error) {
      if (error instanceof InstallerServiceError) {
        return error.status === 404
          ? ApiResponse.notFound(error.message)
          : ApiResponse.badRequest(error.message);
      }
      return handleApiError(error);
    }
  },
);

// DELETE installer (ADMIN/MANAGER only)
export const DELETE = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      await deleteInstaller(id, {
        userId: session.user.id,
        clientInfo: getClientInfo(request),
      });

      return ApiResponse.success(null, "Installer deleted successfully");
    } catch (error) {
      if (error instanceof InstallerServiceError) {
        return error.status === 404
          ? ApiResponse.notFound(error.message)
          : ApiResponse.badRequest(error.message);
      }
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] },
);
