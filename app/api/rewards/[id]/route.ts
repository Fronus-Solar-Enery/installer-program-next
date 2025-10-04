import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import InstallerReward from '@/models/InstallerReward';
import { updateRewardSchema } from '@/lib/validation';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { logActivity, getChanges } from '@/lib/activityLogger';
import { ActivityType } from '@/models/Activity';
import { sendRewardPaymentMessage } from '@/lib/whatsappService';
import { PaymentStatus } from '@/types/rewards';

import { TeamRole } from '@/models/TeamMember';

// GET single reward
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const { id } = await params;
    const reward = await InstallerReward.findById(id)
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
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const body = await request.json();
    const validatedData = updateRewardSchema.parse(body);

    await dbConnect();

    const { id } = await params;
    const reward = await InstallerReward.findById(id).populate('referrer');

    if (!reward) {
      return ApiResponse.notFound('Reward not found');
    }

    // Check for duplicate serial number if it's being updated
    if (validatedData.serialNumber && validatedData.serialNumber !== reward.serialNumber) {
      const existingReward = await InstallerReward.findOne({
        serialNumber: validatedData.serialNumber,
        _id: { $ne: id }
      });

      if (existingReward) {
        return ApiResponse.error('Serial number already exists', 400);
      }
    }

    // Track changes for activity log
    const changes = getChanges(reward.toObject(), validatedData);
    const oldPaymentStatus = reward.paymentStatus;

    // Update reward
    Object.assign(reward, validatedData);
    await reward.save();

    const updatedReward = await InstallerReward.findById(reward._id)
      .populate('installer', 'installerCode fullName phoneNumber whatsappNumber bankName accountNumber accountTitle')
      .populate('referrer', 'installerCode fullName phoneNumber bankName accountNumber accountTitle')
      .populate('registeredBy', 'name email role');

    if (!updatedReward) {
      return ApiResponse.error('Failed to fetch updated reward', 500);
    }

    // Log activity
    await logActivity({
      type: ActivityType.REWARD_UPDATED,
      performedBy: session.user.id,
      targetType: 'InstallerReward',
      targetId: reward._id,
      targetName: `${(updatedReward.installer as any).installerCode} - ${updatedReward.serialNumber}`,
      description: `Updated reward for ${(updatedReward.installer as any).fullName}`,
      metadata: { changes },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // Check if payment status changed to PAID
    if (oldPaymentStatus !== PaymentStatus.PAID && validatedData.paymentStatus === PaymentStatus.PAID) {
      // Send WhatsApp notification (non-blocking)
      sendRewardPaymentMessage(
        {
          installer: {
            fullName: (updatedReward.installer as any).fullName,
            whatsappNumber: (updatedReward.installer as any).whatsappNumber,
          },
          serialNumber: updatedReward.serialNumber,
          productModel: updatedReward.productModel,
          rewardAmount: updatedReward.rewardAmount,
          transactionId: updatedReward.transactionId,
          sendingDate: updatedReward.sendingDate,
        },
        session.user.id
      ).catch(err => console.error('WhatsApp notification failed:', err));

      // Log the status change specifically
      await logActivity({
        type: ActivityType.REWARD_MARKED_PAID,
        performedBy: session.user.id,
        targetType: 'InstallerReward',
        targetId: reward._id,
        targetName: `${(updatedReward.installer as any).installerCode} - ${updatedReward.serialNumber}`,
        description: `Marked reward as PAID for ${(updatedReward.installer as any).fullName} - Rs. ${updatedReward.rewardAmount.toLocaleString()}`,
      });
    }

    return ApiResponse.success(updatedReward, 'Reward updated successfully');
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return ApiResponse.validationError(error.errors);
    }
    return handleApiError(error);
  }
}

// DELETE reward (ADMIN/MANAGER only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params;
    const reward = await InstallerReward.findById(id)
      .populate('installer', 'installerCode fullName');

    if (!reward) {
      return ApiResponse.notFound('Reward not found');
    }

    // Store info before deletion
    const rewardInfo = {
      serialNumber: reward.serialNumber,
      installerCode: reward.installerCode,
      installerName: (reward.installer as any)?.fullName,
    };

    await reward.deleteOne();

    // Log activity
    await logActivity({
      type: ActivityType.REWARD_DELETED,
      performedBy: session.user.id,
      targetType: 'InstallerReward',
      targetId: reward._id,
      targetName: `${rewardInfo.installerCode} - ${rewardInfo.serialNumber}`,
      description: `Deleted reward for ${rewardInfo.installerName} (Serial: ${rewardInfo.serialNumber})`,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    return ApiResponse.success(null, 'Reward deleted successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
