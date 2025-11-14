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

    // Prepare reward documents for batch insert
    const rewardsToInsert = [];
    const rewardValidationErrors: { row: number; serial: string; error: string }[] = [];

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

        // Prepare reward document
        rewardsToInsert.push({
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
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        rewardValidationErrors.push({
          row: i + 1,
          serial: rewardData.serialNumber || 'N/A',
          error: errorMessage
        });
      }
    }

    // Add validation errors to results
    rewardValidationErrors.forEach(({ row, serial, error }) => {
      results.errors.push(`Row ${row} (Serial: ${serial}): ${error}`);
      results.failed++;
    });

    // Batch insert rewards (ordered: false to continue on duplicates)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let insertedRewards: any[] = [];
    if (rewardsToInsert.length > 0) {
      console.log(`Attempting to insert ${rewardsToInsert.length} rewards`);
      try {
        // Without rawResult, insertMany returns the inserted documents directly
        insertedRewards = await InstallerReward.insertMany(rewardsToInsert, {
          ordered: false,
        }) as any[];

        console.log(`Successfully inserted ${insertedRewards.length} rewards`);
        results.successful += insertedRewards.length;
      } catch (err: unknown) {
        console.error('Bulk insert error:', err);

        // Handle Mongoose bulk write errors
        if (err && typeof err === 'object' && 'writeErrors' in err) {
          // Get the successfully inserted documents from the error
          const bulkError = err as any;

          if (Array.isArray(bulkError.insertedDocs)) {
            insertedRewards = bulkError.insertedDocs;
          } else if (bulkError.result && Array.isArray(bulkError.result.insertedDocs)) {
            insertedRewards = bulkError.result.insertedDocs;
          }

          results.successful += insertedRewards.length;

          // Process write errors
          if (Array.isArray(bulkError.writeErrors)) {
            bulkError.writeErrors.forEach((writeErr: any) => {
              const failedDoc = writeErr.err?.op || writeErr.op;
              const errorMessage = writeErr.err?.errmsg || writeErr.errmsg || 'Unknown error';
              const errorCode = writeErr.err?.code || writeErr.code;

              if (errorMessage.includes('duplicate key') || errorCode === 11000) {
                if (errorMessage.includes('serialNumber')) {
                  results.errors.push(`Serial number "${failedDoc.serialNumber}" already exists`);
                } else {
                  results.errors.push(`Duplicate entry for serial number ${failedDoc.serialNumber}`);
                }
              } else {
                results.errors.push(`Failed to create reward for serial ${failedDoc.serialNumber}: ${errorMessage}`);
              }
              results.failed++;
            });
          }
        } else {
          // Fallback for unexpected errors
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          results.errors.push(`Batch insert failed: ${errorMessage}`);
          results.failed += rewardsToInsert.length;
        }

        console.log(`After error handling - successful: ${results.successful}, failed: ${results.failed}`);
      }
    }

    // Batch create activities for successfully inserted rewards
    if (insertedRewards.length > 0) {
      const activities = insertedRewards.map((reward) => ({
        type: 'REWARD_REGISTERED',
        description: `Registered reward for installer ${reward.installerCode} (Product: ${reward.productModel}, Serial: ${reward.serialNumber}) via bulk upload`,
        performedBy: session.user.id,
        targetType: 'InstallerReward',
        targetId: reward._id,
        metadata: {
          installerCode: reward.installerCode,
          productModel: reward.productModel,
          serialNumber: reward.serialNumber,
          rewardAmount: reward.rewardAmount,
          method: 'bulk_register',
        },
      }));

      try {
        await Activity.insertMany(activities, { ordered: false });
      } catch (activityErr) {
        console.error('Failed to create some activity logs:', activityErr);
        // Don't fail the operation if activity logging fails
      }
    }

    const message =
      results.failed === 0
        ? `Successfully created ${results.successful} reward(s)`
        : `Created ${results.successful} reward(s), ${results.failed} failed`;

    const responseData = {
      success: results.failed === 0,
      message,
      data: {
        success: results.successful,
        failed: results.failed,
        errors: results.errors,
      },
    };

    console.log('API Response:', JSON.stringify(responseData, null, 2));

    return NextResponse.json(responseData);
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
