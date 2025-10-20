import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import TeamMember, { TeamRole } from '@/models/TeamMember';
import { updateTeamMemberSchema } from '@/lib/validation';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { ZodError } from 'zod';


// GET single team member
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const { id } = await params;
    const teamMember = await TeamMember.findById(id).select('-password');

    if (!teamMember) {
      return ApiResponse.notFound('Team member not found');
    }

    return ApiResponse.success(teamMember);
  } catch (error) {
    return handleApiError(error);
  }
}

// UPDATE team member
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const userRole = session.user.role;

    // Only ADMIN and MANAGER can update team members
    if (userRole !== TeamRole.ADMIN && userRole !== TeamRole.MANAGER) {
      return ApiResponse.forbidden('Only admins and managers can update team members');
    }

    const body = await request.json();
    const validatedData = updateTeamMemberSchema.parse(body);

    await dbConnect();

    const { id } = await params;
    const teamMember = await TeamMember.findById(id);

    if (!teamMember) {
      return ApiResponse.notFound('Team member not found');
    }

    // MANAGER cannot update ADMIN role
    if (userRole === TeamRole.MANAGER && teamMember.role === TeamRole.ADMIN) {
      return ApiResponse.forbidden('Managers cannot update admin users');
    }

    // MANAGER cannot assign ADMIN role
    if (userRole === TeamRole.MANAGER && validatedData.role === TeamRole.ADMIN) {
      return ApiResponse.forbidden('Managers cannot assign admin role');
    }

    // Update team member
    Object.assign(teamMember, validatedData);
    await teamMember.save();

    const { password, ...teamMemberWithoutPassword } = teamMember.toObject();

    return ApiResponse.success(teamMemberWithoutPassword, 'Team member updated successfully');
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return ApiResponse.validationError(error.issues as Array<{ path?: PropertyKey[]; message: string }>);
    }
    return handleApiError(error);
  }
}

// DELETE team member
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const userRole = session.user.role;

    // Only ADMIN can delete team members
    if (userRole !== TeamRole.ADMIN) {
      return ApiResponse.forbidden('Only admins can delete team members');
    }

    await dbConnect();

    const { id } = await params;
    const teamMember = await TeamMember.findById(id);

    if (!teamMember) {
      return ApiResponse.notFound('Team member not found');
    }

    // Cannot delete yourself
    if (teamMember._id.toString() === session.user.id) {
      return ApiResponse.error('You cannot delete your own account', 400);
    }

    await teamMember.deleteOne();

    return ApiResponse.success(null, 'Team member deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
