import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';
import { changePasswordSchema } from '@/lib/validation';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { authOptions } from '@/lib/auth';

// GET current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const user = await TeamMember.findById(session.user.id).select('-password');

    if (!user) {
      return ApiResponse.notFound('User not found');
    }

    return ApiResponse.success(user);
  } catch (error) {
    return handleApiError(error);
  }
}

// UPDATE current user profile (name, email)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const body = await request.json();
    const { name, email } = body;

    await dbConnect();

    const user = await TeamMember.findById(session.user.id);

    if (!user) {
      return ApiResponse.notFound('User not found');
    }

    if (name) user.name = name;
    if (email && email !== user.email) {
      // Check if email already exists
      const existingUser = await TeamMember.findOne({ email });
      if (existingUser) {
        return ApiResponse.error('Email already exists', 409);
      }
      user.email = email;
    }

    await user.save();

    const { password, ...userWithoutPassword } = user.toObject();

    return ApiResponse.success(userWithoutPassword, 'Profile updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
