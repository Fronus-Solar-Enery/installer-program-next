import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import TeamMember, { TeamRole } from "@/models/TeamMember";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import bcrypt from "bcryptjs";

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
      await dbConnect();

      const { name, email, password, role } = await request.json();

      // Validate required fields
      if (!name || !email || !password) {
        return ApiResponse.badRequest("Name, email, and password are required");
      }

      // Validate password length
      if (password.length < 6) {
        return ApiResponse.badRequest("Password must be at least 6 characters");
      }

      // Validate role
      const validRoles = [TeamRole.ADMIN, TeamRole.MANAGER, TeamRole.USER];
      if (role && !validRoles.includes(role)) {
        return ApiResponse.badRequest("Invalid role");
      }

      // Check if user can create this role
      const userRole = session.user.role;
      if (role === TeamRole.ADMIN && userRole !== TeamRole.ADMIN) {
        return ApiResponse.forbidden("Only admins can create admin accounts");
      }

      // Check if email already exists
      const existingMember = await TeamMember.findOne({
        email: email.toLowerCase(),
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
        email: email.toLowerCase(),
        password: hashedPassword,
        role: role || TeamRole.USER,
      });

      // Return member without password
      const memberResponse = {
        _id: teamMember._id,
        name: teamMember.name,
        email: teamMember.email,
        role: teamMember.role,
        createdAt: teamMember.createdAt,
      };

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
