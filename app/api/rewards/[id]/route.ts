import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { updateRewardSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { TeamRole } from "@/models/TeamMember";

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
      const reward = await InstallerReward.findByIdAndUpdate(
        id,
        { ...validation.data, updatedBy: session.user.id },
        { new: true, runValidators: true },
      ).populate([...POPULATE]);

      if (!reward) {
        return ApiResponse.notFound("Reward not found");
      }

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

      return ApiResponse.success(null, "Reward deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] },
);
