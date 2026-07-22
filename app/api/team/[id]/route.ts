import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import TeamMember, { TeamRole } from "@/models/TeamMember";
import { updateTeamMemberSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { logActivity, getChanges } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";

// GET single team member
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const teamMember = await TeamMember.findById(id).select("-password");

      if (!teamMember) {
        return ApiResponse.notFound("Team member not found");
      }

      return ApiResponse.success(teamMember);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// UPDATE team member
export const PUT = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      // Validate request body
      const validation = await validateBody(request, updateTeamMemberSchema);
      if (!validation.success) return validation.response;
      const validatedData = validation.data;

      await dbConnect();

      const { id } = await context.params;
      const teamMember = await TeamMember.findById(id);

      if (!teamMember) {
        return ApiResponse.notFound("Team member not found");
      }

      // MANAGER cannot update ADMIN role
      if (
        session.user.role === TeamRole.MANAGER &&
        teamMember.role === TeamRole.ADMIN
      ) {
        return ApiResponse.forbidden("Managers cannot update admin users");
      }

      // MANAGER cannot assign ADMIN role
      if (
        session.user.role === TeamRole.MANAGER &&
        validatedData.role === TeamRole.ADMIN
      ) {
        return ApiResponse.forbidden("Managers cannot assign admin role");
      }

      const before = teamMember.toObject() as unknown as Record<string, unknown>;

      // Update team member
      Object.assign(teamMember, validatedData);
      await teamMember.save();

      const { password, ...teamMemberWithoutPassword } = teamMember.toObject();

      // Diff without secrets: never let a password value reach the audit log.
      const { password: _pw, ...auditableInput } = validatedData as Record<
        string,
        unknown
      >;
      const changes = getChanges(before, auditableInput);
      const changedFields = Object.keys(changes);
      if (_pw !== undefined) changedFields.push("password");
      if (changedFields.length > 0) {
        await logActivity({
          type: ActivityType.TEAM_MEMBER_UPDATED,
          performedBy: session.user.id,
          targetType: "TeamMember",
          targetId: teamMember._id,
          targetName: teamMember.name,
          description: `Updated team member ${teamMember.name}: ${changedFields.join(", ")}`,
          metadata: { changes },
          ...getClientInfo(request),
        });
      }

      return ApiResponse.success(
        teamMemberWithoutPassword,
        "Team member updated successfully"
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] }
);

// DELETE team member
export const DELETE = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const teamMember = await TeamMember.findById(id);

      if (!teamMember) {
        return ApiResponse.notFound("Team member not found");
      }

      // MANAGER cannot delete ADMIN users
      if (
        session.user.role === TeamRole.MANAGER &&
        teamMember.role === TeamRole.ADMIN
      ) {
        return ApiResponse.forbidden("Managers cannot delete admin users");
      }

      // Cannot delete yourself
      if (teamMember._id.toString() === session.user.id) {
        return ApiResponse.error("You cannot delete your own account", 400);
      }

      const { _id, name, email, role } = teamMember;
      await teamMember.deleteOne();

      await logActivity({
        type: ActivityType.TEAM_MEMBER_DELETED,
        performedBy: session.user.id,
        targetType: "TeamMember",
        targetId: _id,
        targetName: name,
        description: `Deleted team member ${name} (${email}, ${role})`,
        ...getClientInfo(request),
      });

      return ApiResponse.success(null, "Team member deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] }
);
