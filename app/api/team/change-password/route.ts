import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import { changePasswordSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";

export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      // Validate request body
      const validation = await validateBody(request, changePasswordSchema);
      if (!validation.success) return validation.response;
      const validatedData = validation.data;

      await dbConnect();

      const user = await TeamMember.findById(session.user.id);

      if (!user || !user.password) {
        return ApiResponse.notFound("User not found or password not set");
      }

      // Verify current password
      const isValid = await bcrypt.compare(
        validatedData.currentPassword,
        user.password
      );

      if (!isValid) {
        return ApiResponse.error("Current password is incorrect", 401);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      // Record that a password change happened — never the value itself.
      await logActivity({
        type: ActivityType.TEAM_MEMBER_PASSWORD_CHANGED,
        performedBy: session.user.id,
        targetType: "TeamMember",
        targetId: user._id,
        targetName: user.name,
        description: `${user.name} changed their own password`,
        ...getClientInfo(request),
      });

      return ApiResponse.success(null, "Password changed successfully");
    } catch (error) {
      return handleApiError(error);
    }
  }
);
