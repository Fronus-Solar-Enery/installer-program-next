import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Installer, { IInstaller } from '@/models/Installer';
import InstallerReward, { IInstallerReward } from '@/models/InstallerReward';

interface InstallerSearchResult {
  _id: string;
  installerCode: string;
  fullName: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  city: string;
  accountNumber?: string;
  accountTitle?: string;
  companyName?: string;
}

interface RewardSearchResult extends Omit<IInstallerReward, 'installer'> {
  installer?: {
    _id: string;
    installerCode: string;
    fullName: string;
    cnic: string;
    phoneNumber: string;
    whatsappNumber: string;
    city: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        installers: [],
        rewards: [],
        message: 'Search query must be at least 2 characters'
      });
    }

    await dbConnect();

    const searchRegex = new RegExp(query, 'i');

    // Search installers by:
    // - CNIC
    // - Installer Code
    // - Phone Number
    // - WhatsApp Number
    // - Full Name
    // - Account Number
    // - Account Title
    // - Company Name
    const installers = await Installer.find({
      $or: [
        { cnic: searchRegex },
        { installerCode: searchRegex },
        { phoneNumber: searchRegex },
        { whatsappNumber: searchRegex },
        { fullName: searchRegex },
        { accountNumber: searchRegex },
        { accountTitle: searchRegex },
        { companyName: searchRegex },
      ],
    })
      .select('installerCode fullName cnic phoneNumber whatsappNumber city accountNumber accountTitle companyName')
      .limit(10)
      .lean();

    // Search rewards by:
    // - Serial Number
    // - Reward Transaction ID
    // - Referrer Reward Transaction ID
    // Also populate installer to enable searching by installer fields
    const rewards = await InstallerReward.find({
      $or: [
        { serialNumber: searchRegex },
        { transactionId: searchRegex },
        { referrerTransactionId: searchRegex },
      ],
    })
      .populate({
        path: 'installer',
        select: 'installerCode fullName cnic phoneNumber whatsappNumber city',
      })
      .select('serialNumber productModel rewardAmount rewardStatus transactionId referrerTransactionId cityOfInstallation createdAt')
      .limit(10)
      .lean();

    // Also search rewards by installer fields (CNIC, installer code, phone, whatsapp, name)
    const installerIds = await Installer.find({
      $or: [
        { cnic: searchRegex },
        { installerCode: searchRegex },
        { phoneNumber: searchRegex },
        { whatsappNumber: searchRegex },
        { fullName: searchRegex },
      ],
    })
      .select('_id')
      .limit(20)
      .lean();

    if (installerIds.length > 0) {
      const rewardsByInstaller = await InstallerReward.find({
        installer: { $in: installerIds.map(i => i._id) },
      })
        .populate({
          path: 'installer',
          select: 'installerCode fullName cnic phoneNumber whatsappNumber city',
        })
        .select('serialNumber productModel rewardAmount rewardStatus transactionId referrerTransactionId cityOfInstallation createdAt')
        .limit(10)
        .lean();

      // Merge and deduplicate rewards
      const rewardMap = new Map<string, unknown>();
      [...rewards, ...rewardsByInstaller].forEach((reward) => {
        const rewardObj = reward as { _id?: unknown };
        if (rewardObj._id) {
          rewardMap.set(String(rewardObj._id), reward);
        }
      });
      const mergedRewards = Array.from(rewardMap.values()).slice(0, 10);

      return NextResponse.json({
        installers,
        rewards: mergedRewards,
        query,
      });
    }

    return NextResponse.json({
      installers,
      rewards,
      query,
    });

  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
