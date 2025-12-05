import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import TeamMember from "@/models/TeamMember";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";

// GET current user profile
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const user = await TeamMember.findById(session.user.id).select(
        "-password"
      );

      if (!user) {
        return ApiResponse.notFound("User not found");
      }

      return ApiResponse.success(user);
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// UPDATE current user profile (name, email)
export const PUT = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const body = await request.json();
      const { name, email } = body;

      await dbConnect();

      const user = await TeamMember.findById(session.user.id);

      if (!user) {
        return ApiResponse.notFound("User not found");
      }

      if (name) user.name = name;
      if (email && email !== user.email) {
        // Check if email already exists
        const existingUser = await TeamMember.findOne({ email });
        if (existingUser) {
          return ApiResponse.error("Email already exists", 409);
        }
        user.email = email;
      }

      await user.save();

      const { password, ...userWithoutPassword } = user.toObject();

      return ApiResponse.success(
        userWithoutPassword,
        "Profile updated successfully"
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
