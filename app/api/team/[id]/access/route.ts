import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import TeamMember, { TeamRole } from "@/models/TeamMember";
import { teamMemberAccessSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";
import { checkAccessChange } from "@/lib/teamAccess";

// PATCH - Revoke or restore a team member's sign-in access
export const PATCH = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const validation = await validateBody(request, teamMemberAccessSchema);
      if (!validation.success) return validation.response;
      const { revoked } = validation.data;

      await dbConnect();

      const { id } = await context.params;
      const teamMember = await TeamMember.findById(id);

      if (!teamMember) {
        return ApiResponse.notFound("Team member not found");
      }

      const activeAdminCount = await TeamMember.countDocuments({
        role: TeamRole.ADMIN,
        accessRevoked: { $ne: true },
      });

      const denial = checkAccessChange({
        actor: { id: session.user.id, role: session.user.role },
        target: {
          id: teamMember._id.toString(),
          role: teamMember.role,
          accessRevoked: teamMember.accessRevoked,
        },
        revoke: revoked,
        activeAdminCount,
      });
      if (denial) {
        return denial.status === 403
          ? ApiResponse.forbidden(denial.message)
          : ApiResponse.error(denial.message, 400);
      }

      // No-op if already in the requested state
      if (Boolean(teamMember.accessRevoked) === revoked) {
        const { password, ...unchanged } = teamMember.toObject();
        return ApiResponse.success(unchanged);
      }

      teamMember.accessRevoked = revoked;
      teamMember.accessRevokedAt = revoked ? new Date() : undefined;
      teamMember.accessRevokedBy = revoked
        ? new mongoose.Types.ObjectId(session.user.id)
        : undefined;
      await teamMember.save();

      await logActivity({
        type: revoked
          ? ActivityType.TEAM_MEMBER_ACCESS_REVOKED
          : ActivityType.TEAM_MEMBER_ACCESS_RESTORED,
        performedBy: session.user.id,
        targetType: "TeamMember",
        targetId: teamMember._id,
        targetName: teamMember.name,
        description: `${revoked ? "Revoked" : "Restored"} access for team member ${teamMember.name} (${teamMember.email})`,
        ...getClientInfo(request),
      });

      const { password, ...teamMemberWithoutPassword } = teamMember.toObject();

      return ApiResponse.success(
        teamMemberWithoutPassword,
        revoked ? "Access revoked" : "Access restored"
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] }
);
