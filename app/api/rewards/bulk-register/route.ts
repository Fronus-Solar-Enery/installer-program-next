import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Installer from '@/models/Installer';
import InstallerReward from '@/models/InstallerReward';
import TeamMember from '@/models/TeamMember';
import Activity from '@/models/Activity';

interface RewardDataInput {
  timestamp: string;
  teamMemberEmail: string;
  installerCode: string;
  productModel: string;
  serialNumber: string;
  serialNumberStatus: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  rewardStatus: string;
  rewardAmount: string | number;
  paymentMethod: string;
  cityOfInstallation?: string;
  referrerCode?: string;
  referrerRewardAmount?: string | number;
  inverterSerialNumber?: string;
  transactionId?: string;
  referrerTransactionId?: string;
  sendingDate?: string;
}

interface InstallerLean {
  _id: string;
  installerCode: string;
}

interface TeamMemberLean {
  _id: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    let rewards: RewardDataInput[];
    try {
      const body = await request.json();
      rewards = body.rewards;
    } catch (parseError: unknown) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON format. Please ensure your data is properly formatted.',
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(rewards) || rewards.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No rewards data provided' },
        { status: 400 }
      );
    }

    // Limit batch size
    if (rewards.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Maximum 500 rewards per upload. Please split your file.' },
        { status: 400 }
      );
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Fetch all installers once
    const installers = await Installer.find({}, { installerCode: 1, _id: 1 }).lean<InstallerLean[]>();
    const installerMap = new Map(
      installers.map((i) => [i.installerCode.toUpperCase(), i._id.toString()])
    );

    // Fetch all team members once
    const teamMembers = await TeamMember.find({}, { email: 1, _id: 1 }).lean<TeamMemberLean[]>();
    const teamMemberMap = new Map(
      teamMembers.map((tm) => [tm.email.toLowerCase(), tm._id.toString()])
    );

    for (let i = 0; i < rewards.length; i++) {
      const rewardData = rewards[i];

      try {
        // Required field validation
        const requiredFields: (keyof RewardDataInput)[] = [
          'timestamp',
          'teamMemberEmail',
          'installerCode',
          'productModel',
          'serialNumber',
          'serialNumberStatus',
          'bankName',
          'accountNumber',
          'accountTitle',
          'rewardStatus',
          'rewardAmount',
          'paymentMethod',
        ];
        const missingFields = requiredFields.filter(field => !rewardData[field]);

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Find team member ID
        const teamMemberId = teamMemberMap.get(rewardData.teamMemberEmail.toLowerCase());
        if (!teamMemberId) {
          throw new Error(`Team member email "${rewardData.teamMemberEmail}" not found`);
        }

        // Find installer ID
        const installerId = installerMap.get(rewardData.installerCode.toUpperCase());
        if (!installerId) {
          throw new Error(`Installer code "${rewardData.installerCode}" not found`);
        }

        // Find referrer ID if referrer code is provided
        let referrerId: string | undefined;
        if (rewardData.referrerCode) {
          referrerId = installerMap.get(rewardData.referrerCode.toUpperCase());
          if (!referrerId) {
            throw new Error(`Referrer code "${rewardData.referrerCode}" not found`);
          }
        }

        // Parse dates
        let installationDate: Date | undefined;
        if (rewardData.timestamp) {
          const parsedDate = new Date(rewardData.timestamp);
          if (!isNaN(parsedDate.getTime())) {
            installationDate = parsedDate;
          }
        }

        let sendingDate: Date | undefined;
        if (rewardData.sendingDate) {
          const parsedDate = new Date(rewardData.sendingDate);
          if (!isNaN(parsedDate.getTime())) {
            sendingDate = parsedDate;
          }
        }

        // Parse reward amounts
        const rewardAmount = parseFloat(String(rewardData.rewardAmount));
        if (isNaN(rewardAmount)) {
          throw new Error('Invalid reward amount');
        }

        let referrerRewardAmount: number | undefined;
        if (rewardData.referrerRewardAmount) {
          referrerRewardAmount = parseFloat(String(rewardData.referrerRewardAmount));
          if (isNaN(referrerRewardAmount)) {
            throw new Error('Invalid referrer reward amount');
          }
        }

        // Create new reward
        const newReward = await InstallerReward.create({
          registeredBy: teamMemberId,
          installer: installerId,
          installerCode: rewardData.installerCode.toUpperCase(),
          referrerCode: rewardData.referrerCode?.toUpperCase() || undefined,
          referrer: referrerId,
          cityOfInstallation: rewardData.cityOfInstallation || 'Not Specified',
          productModel: rewardData.productModel,
          serialNumber: rewardData.serialNumber,
          inverterSerialNumber: rewardData.inverterSerialNumber || '',
          serialNumberStatus: rewardData.serialNumberStatus,
          installationDate: installationDate,
          bankName: rewardData.bankName,
          accountNumber: rewardData.accountNumber,
          accountTitle: rewardData.accountTitle,
          rewardStatus: rewardData.rewardStatus,
          transactionId: rewardData.transactionId || undefined,
          rewardAmount: rewardAmount,
          referrerRewardAmount: referrerRewardAmount || 0,
          referrerTransactionId: rewardData.referrerTransactionId || undefined,
          sendingDate: sendingDate,
          paymentMethod: rewardData.paymentMethod,
        });

        // Log activity
        await Activity.create({
          type: 'REWARD_REGISTERED',
          description: `Registered reward for installer ${rewardData.installerCode} (Product: ${rewardData.productModel}, Serial: ${rewardData.serialNumber}) via bulk upload`,
          performedBy: session.user.id,
          targetType: 'InstallerReward',
          targetId: newReward._id,
          metadata: {
            installerCode: rewardData.installerCode,
            productModel: rewardData.productModel,
            serialNumber: rewardData.serialNumber,
            rewardAmount: rewardAmount,
            method: 'bulk_register',
          },
        });

        results.successful++;
      } catch (error: unknown) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(
          `Row ${i + 1} (Serial: ${rewardData.serialNumber || 'N/A'}): ${errorMessage}`
        );
      }
    }

    const message =
      results.failed === 0
        ? `Successfully created ${results.successful} reward(s)`
        : `Created ${results.successful} reward(s), ${results.failed} failed`;

    return NextResponse.json({
      success: results.failed === 0,
      message,
      data: {
        success: results.successful,
        failed: results.failed,
        errors: results.errors,
      },
    });
  } catch (error: unknown) {
    console.error('Error in bulk reward creation:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred during bulk upload';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
