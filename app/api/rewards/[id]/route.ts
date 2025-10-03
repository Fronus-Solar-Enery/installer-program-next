import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import InstallerReward from '@/models/InstallerReward';
import { updateRewardSchema } from '@/lib/validation';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';

import { TeamRole } from '@/models/TeamMember';

// GET single reward
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const reward = await InstallerReward.findById(params.id)
      .populate('installer', 'installerCode fullName phoneNumber bankName accountNumber accountTitle')
      .populate('referrer', 'installerCode fullName phoneNumber bankName accountNumber accountTitle')
      .populate('registeredBy', 'name email role');

    if (!reward) {
      return ApiResponse.notFound('Reward not found');
    }

    return ApiResponse.success(reward);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT - Update reward
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const body = await request.json();
    const validatedData = updateRewardSchema.parse(body);

    await dbConnect();

    const reward = await InstallerReward.findById(params.id).populate('referrer');

    if (!reward) {
      return ApiResponse.notFound('Reward not found');
    }

    // Validation: Transaction ID is required
    if (validatedData.transactionId !== undefined && !validatedData.transactionId) {
      return ApiResponse.error('Installer transaction ID is required', 400);
    }

    // Validation: If installer has referrer, referrer transaction ID is also required
    if (validatedData.transactionId && reward.referrer && !validatedData.referrerTransactionId) {
      return ApiResponse.error('Referrer transaction ID is required when installer has a referrer', 400);
    }

    // Update reward
    Object.assign(reward, validatedData);
    await reward.save();

    const updatedReward = await InstallerReward.findById(reward._id)
      .populate('installer', 'installerCode fullName phoneNumber bankName accountNumber accountTitle')
      .populate('referrer', 'installerCode fullName phoneNumber bankName accountNumber accountTitle')
      .populate('registeredBy', 'name email role');

    return ApiResponse.success(updatedReward, 'Reward updated successfully');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return ApiResponse.validationError(error.errors);
    }
    return handleApiError(error);
  }
}

// DELETE reward (ADMIN/MANAGER only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    // Only ADMIN and MANAGER can delete
    if (session.user.role !== TeamRole.ADMIN && session.user.role !== TeamRole.MANAGER) {
      return ApiResponse.forbidden('Only admins and managers can delete rewards');
    }

    await dbConnect();

    const reward = await InstallerReward.findById(params.id);

    if (!reward) {
      return ApiResponse.notFound('Reward not found');
    }

    await reward.deleteOne();

    return ApiResponse.success(null, 'Reward deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
