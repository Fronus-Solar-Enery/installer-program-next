import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import TeamMember, { TeamRole } from "@/models/TeamMember";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody } from "@/lib/validateRequest";
import { registerTeamMemberSchema } from "@/lib/validation";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";

// GET all team members (ADMIN/MANAGER only)
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const teamMembers = await TeamMember.find({})
        .select("-password")
        .sort({ createdAt: -1 });

      return ApiResponse.success({
        members: teamMembers,
        total: teamMembers.length,
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] }
);

// POST - Create new team member (ADMIN/MANAGER only)
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const validation = await validateBody(request, registerTeamMemberSchema);
      if (!validation.success) return validation.response;
      const { name, email, password, role } = validation.data;

      await dbConnect();

      // Check if user can create this role
      const userRole = session.user.role;
      if (role === TeamRole.ADMIN && userRole !== TeamRole.ADMIN) {
        return ApiResponse.forbidden("Only admins can create admin accounts");
      }

      const normalizedEmail = email.toLowerCase();

      // Check if email already exists
      const existingMember = await TeamMember.findOne({
        email: normalizedEmail,
      });
      if (existingMember) {
        return ApiResponse.conflict(
          "A team member with this email already exists"
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create team member
      const teamMember = await TeamMember.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role,
      });

      // Return member without password
      const memberResponse = {
        _id: teamMember._id,
        name: teamMember.name,
        email: teamMember.email,
        role: teamMember.role,
        createdAt: teamMember.createdAt,
      };

      await logActivity({
        type: ActivityType.TEAM_MEMBER_REGISTERED,
        performedBy: session.user.id,
        targetType: "TeamMember",
        targetId: teamMember._id,
        targetName: teamMember.name,
        description: `Created team member ${teamMember.name} (${teamMember.email}) as ${teamMember.role}`,
        ...getClientInfo(request),
      });

      return ApiResponse.success(
        memberResponse,
        "Team member created successfully",
        201
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] }
);
