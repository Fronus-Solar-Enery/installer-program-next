import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import TeamMember from '@/models/TeamMember';
import { changePasswordSchema } from '@/lib/validation';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const body = await request.json();
    const validatedData = changePasswordSchema.parse(body);

    await dbConnect();

    const user = await TeamMember.findById(session.user.id);

    if (!user || !user.password) {
      return ApiResponse.notFound('User not found or password not set');
    }

    // Verify current password
    const isValid = await bcrypt.compare(validatedData.currentPassword, user.password);

    if (!isValid) {
      return ApiResponse.error('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return ApiResponse.success(null, 'Password changed successfully');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return ApiResponse.validationError(error.errors);
    }
    return handleApiError(error);
  }
}
