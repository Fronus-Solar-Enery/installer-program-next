import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import InstallerReward from '@/models/InstallerReward';
import Activity from '@/models/Activity';

interface RewardUpdateInput {
  serialNumber: string;
  transactionId: string;
  referrerTransactionId?: string;
  rewardStatus: string;
  sendingDate?: string;
  paymentMethod?: string;
  isValid?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    let body: { rewards: RewardUpdateInput[] };
    try {
      body = await req.json();
    } catch (parseError: unknown) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { rewards } = body;

    if (!rewards || !Array.isArray(rewards) || rewards.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No rewards provided' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent timeout
    if (rewards.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Maximum 500 rewards per upload. Please split your file.' },
        { status: 400 }
      );
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
      successfulSerials: [] as string[],
    };

    // Only process valid rewards (those without validation issues from frontend)
    const validRewards = rewards.filter((r) => r.isValid !== false);

    if (validRewards.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid rewards to update', data: results },
        { status: 400 }
      );
    }

    // Process each reward update
    for (const rewardUpdate of validRewards) {
      try {
        // Find reward by serial number
        const reward = await InstallerReward.findOne({
          serialNumber: rewardUpdate.serialNumber
        });

        if (!reward) {
          results.failed++;
          results.errors.push(`Serial number ${rewardUpdate.serialNumber} not found`);
          continue;
        }

        // Build update object
        const updateData: Record<string, unknown> = {
          transactionId: rewardUpdate.transactionId,
          rewardStatus: rewardUpdate.rewardStatus,
        };

        // Add optional fields if provided
        if (rewardUpdate.referrerTransactionId) {
          updateData.referrerTransactionId = rewardUpdate.referrerTransactionId;
        }
        if (rewardUpdate.sendingDate) {
          updateData.sendingDate = new Date(rewardUpdate.sendingDate);
        }
        if (rewardUpdate.paymentMethod) {
          updateData.paymentMethod = rewardUpdate.paymentMethod;
        }

        // Update reward
        await InstallerReward.findByIdAndUpdate(
          reward._id,
          updateData,
          { new: true }
        );

        // Log activity
        await Activity.create({
          type: 'REWARD_UPDATED',
          description: `Updated reward status to ${rewardUpdate.rewardStatus} for serial ${rewardUpdate.serialNumber} via bulk upload`,
          performedBy: session.user.id,
          targetType: 'InstallerReward',
          targetId: reward._id,
          metadata: {
            serialNumber: rewardUpdate.serialNumber,
            rewardStatus: rewardUpdate.rewardStatus,
            transactionId: rewardUpdate.transactionId,
            method: 'bulk_update',
          },
        });

        results.success++;
        results.successfulSerials.push(rewardUpdate.serialNumber);
      } catch (err: unknown) {
        results.failed++;
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        // Provide more specific error messages
        if (errorMessage.includes('validation failed')) {
          results.errors.push(`Validation failed for ${rewardUpdate.serialNumber}: ${errorMessage}`);
        } else {
          results.errors.push(`Failed to update ${rewardUpdate.serialNumber}: ${errorMessage}`);
        }
      }
    }

    // Return results with detailed summary
    const response = {
      success: results.success > 0,
      message: results.success > 0
        ? `Successfully updated ${results.success} of ${validRewards.length} reward(s)`
        : 'No rewards were updated successfully',
      data: {
        ...results,
        summary: {
          total: validRewards.length,
          successful: results.success,
          failed: results.failed,
          successRate: validRewards.length > 0
            ? Math.round((results.success / validRewards.length) * 100)
            : 0,
        },
      },
    };

    if (results.success === 0) {
      return NextResponse.json(response, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Bulk update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update rewards';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
