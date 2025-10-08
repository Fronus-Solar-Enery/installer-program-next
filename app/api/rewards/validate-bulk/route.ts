import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import InstallerReward from '@/models/InstallerReward';

interface RewardUpdate {
  serialNumber: string;
  transactionId: string;
  referrerTransactionId?: string;
  paymentStatus: string;
  sendingDate?: string;
  paymentMethod?: string;
  issues: string[];
  isValid: boolean;
}

interface ExistingRewardLean {
  serialNumber: string;
  referrer?: unknown;
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

    const { rewards } = await req.json();

    if (!rewards || !Array.isArray(rewards) || rewards.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No rewards provided' },
        { status: 400 }
      );
    }

    // Fetch all existing rewards with serial numbers
    const serialNumbers = rewards.map((r: RewardUpdate) => r.serialNumber);
    const existingRewards = await InstallerReward.find(
      { serialNumber: { $in: serialNumbers } },
      { serialNumber: 1, referrer: 1, _id: 0 }
    ).lean<ExistingRewardLean[]>();

    const existingSerialNumbers = new Set(
      existingRewards.map((r) => r.serialNumber.toUpperCase())
    );

    const rewardsWithReferrer = new Set(
      existingRewards
        .filter((r) => r.referrer)
        .map((r) => r.serialNumber.toUpperCase())
    );

    // Track serial numbers in the upload batch for duplicate detection
    const serialsInBatch = new Map<string, number>();

    // Validate each reward
    const validatedRewards: RewardUpdate[] = rewards.map(
      (reward: RewardUpdate, index: number) => {
        const newIssues: string[] = [...reward.issues];
        const serialUpper = reward.serialNumber.toUpperCase();

        // Check if serial number exists in database
        if (!existingSerialNumbers.has(serialUpper)) {
          newIssues.push(`Serial number "${reward.serialNumber}" not found in database`);
        }

        // Check for duplicate serial number in the upload batch
        if (serialsInBatch.has(serialUpper)) {
          const firstOccurrence = serialsInBatch.get(serialUpper)! + 1;
          newIssues.push(
            `Duplicate serial number in upload (first occurrence at row ${firstOccurrence})`
          );
        } else {
          serialsInBatch.set(serialUpper, index);
        }

        // Validate referrer transaction ID requirement
        if (rewardsWithReferrer.has(serialUpper)) {
          if (reward.paymentStatus === 'PAID' && !reward.referrerTransactionId) {
            newIssues.push(
              'Referrer transaction ID is required (this reward has a referrer)'
            );
          }
        }

        // Validate transaction ID is present for PAID status
        if (reward.paymentStatus === 'PAID') {
          if (!reward.transactionId || reward.transactionId.length < 3) {
            newIssues.push('Transaction ID is required for PAID status');
          }
        }

        return {
          ...reward,
          issues: newIssues,
          isValid: newIssues.length === 0,
        };
      }
    );

    const validCount = validatedRewards.filter(r => r.isValid).length;
    const invalidCount = validatedRewards.filter(r => !r.isValid).length;

    return NextResponse.json({
      success: true,
      data: {
        validatedRewards,
        summary: {
          total: validatedRewards.length,
          valid: validCount,
          invalid: invalidCount,
        },
      },
    });
  } catch (error: unknown) {
    console.error('Validation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate rewards';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
