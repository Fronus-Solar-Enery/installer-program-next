import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import TeamMember, { TeamRole } from '@/models/TeamMember';
import { registerTeamMemberSchema } from '@/lib/validation';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const userRole = session.user.role;

    // Only ADMIN and MANAGER can register new team members
    if (userRole !== TeamRole.ADMIN && userRole !== TeamRole.MANAGER) {
      return ApiResponse.forbidden('Only admins and managers can register team members');
    }

    const body = await request.json();
    const validatedData = registerTeamMemberSchema.parse(body);

    // MANAGER can only register USER or MANAGER roles
    if (userRole === TeamRole.MANAGER && validatedData.role === TeamRole.ADMIN) {
      return ApiResponse.forbidden('Managers cannot register admin users');
    }

    await dbConnect();

    // Check if email already exists
    const existingUser = await TeamMember.findOne({ email: validatedData.email });
    if (existingUser) {
      return ApiResponse.error('Email already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);

    // Create new team member
    const teamMember = await TeamMember.create({
      ...validatedData,
      password: hashedPassword,
    });

    // Remove password from response
    const { password, ...teamMemberWithoutPassword } = teamMember.toObject();

    return ApiResponse.success(teamMemberWithoutPassword, 'Team member registered successfully', 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return ApiResponse.validationError(error.errors);
    }
    return handleApiError(error);
  }
}
