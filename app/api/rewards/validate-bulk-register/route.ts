import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Installer from '@/models/Installer';
import InstallerReward from '@/models/InstallerReward';
import TeamMember from '@/models/TeamMember';

interface RewardInput {
  installerCode?: string;
  installerName?: string;
  serialNumber?: string;
  teamMemberEmail?: string;
  referrerCode?: string;
  referrerRewardAmount?: string | number;
  referrerTransactionId?: string;
  rewardStatus?: string;
  issues?: string[];
  isValid?: boolean;
}

interface ExistingRewardLean {
  serialNumber: string;
}

interface InstallerLean {
  installerCode: string;
  fullName: string;
  referrerCode?: string;
}

interface TeamMemberLean {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { rewards } = await request.json();

    if (!Array.isArray(rewards) || rewards.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid rewards data' },
        { status: 400 }
      );
    }

    // Fetch all existing serial numbers
    const existingRewards = await InstallerReward.find(
      {},
      { serialNumber: 1, _id: 0 }
    ).lean<ExistingRewardLean[]>();

    const existingSerialNumbers = new Set(
      existingRewards.map((r) => r.serialNumber?.toUpperCase())
    );

    // Fetch all installers with full name and referrer info
    const installers = await Installer.find(
      {},
      { installerCode: 1, fullName: 1, referrerCode: 1, _id: 0 }
    ).lean<InstallerLean[]>();

    const installerMap = new Map(
      installers.map((i) => [
        i.installerCode.toUpperCase(),
        { fullName: i.fullName, referrerCode: i.referrerCode || null }
      ])
    );

    // Create set of all installer codes for referrer validation
    const installerCodes = new Set(
      installers.map((i) => i.installerCode.toUpperCase())
    );

    // Fetch all team member emails
    const teamMembers = await TeamMember.find({}, { email: 1, _id: 0 }).lean<TeamMemberLean[]>();
    const teamMemberEmails = new Set(
      teamMembers.map((tm) => tm.email.toLowerCase())
    );

    // Track duplicates in batch
    const serialNumbersInBatch = new Map<string, number>();

    const validatedRewards = rewards.map((reward: RewardInput, index: number) => {
      const newIssues: string[] = [];
      const installerCode = reward.installerCode?.toString().toUpperCase();
      const serialNumber = reward.serialNumber?.toString().toUpperCase();
      const teamMemberEmail = reward.teamMemberEmail?.toString().toLowerCase();

      // Auto-extract referrer from installer if available
      let referrerCode = null;
      let autoExtractedReferrer = false;

      // Check if team member email exists
      if (teamMemberEmail && !teamMemberEmails.has(teamMemberEmail)) {
        newIssues.push(`Team member email "${reward.teamMemberEmail}" does not exist in system`);
      }

      // Check if installer exists and name matches
      if (!installerCode) {
        newIssues.push('Installer code is required');
      } else if (!installerMap.has(installerCode)) {
        newIssues.push(`Installer code "${reward.installerCode}" does not exist`);
      } else {
        const installerInfo = installerMap.get(installerCode);

        // Verify installer name matches
        if (reward.installerName && installerInfo?.fullName !== reward.installerName) {
          newIssues.push(
            `Installer name "${reward.installerName}" does not match database (expected: "${installerInfo?.fullName}")`
          );
        }

        // Auto-extract referrer from installer record
        if (installerInfo?.referrerCode) {
          referrerCode = installerInfo.referrerCode;
          autoExtractedReferrer = true;

          // Check referrer reward amount requirement
          if (!reward.referrerRewardAmount) {
            newIssues.push('Referrer reward amount is required for this installer (has referrer in system)');
          }

          // Check referrer transaction ID requirement
          if (!reward.referrerTransactionId) {
            newIssues.push('Referrer transaction ID is required for this installer (has referrer in system)');
          }
        }
      }

      // Check if serial number already exists in database
      if (!serialNumber) {
        newIssues.push('Serial number is required');
      } else if (existingSerialNumbers.has(serialNumber)) {
        newIssues.push(`Serial number "${reward.serialNumber}" already exists in database`);
      }

      // Check for duplicate serial numbers in batch
      if (serialNumber) {
        if (serialNumbersInBatch.has(serialNumber)) {
          const firstOccurrence = serialNumbersInBatch.get(serialNumber)! + 1;
          newIssues.push(
            `Duplicate serial number in upload (first occurrence at row ${firstOccurrence})`
          );
        } else {
          serialNumbersInBatch.set(serialNumber, index);
        }
      }

      return {
        ...reward,
        referrerCode: referrerCode || undefined,
        autoExtractedReferrer,
        issues: [...(reward.issues || []), ...newIssues],
        isValid: reward.isValid && newIssues.length === 0,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        validatedRewards,
      },
    });
  } catch (error: unknown) {
    console.error('Error validating bulk rewards:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to validate rewards';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
