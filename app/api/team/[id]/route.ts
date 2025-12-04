import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import TeamMember, { TeamRole } from "@/models/TeamMember";
import { updateTeamMemberSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";

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

      // Update team member
      Object.assign(teamMember, validatedData);
      await teamMember.save();

      const { password, ...teamMemberWithoutPassword } = teamMember.toObject();

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

      await teamMember.deleteOne();

      return ApiResponse.success(null, "Team member deleted successfully");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] }
);
