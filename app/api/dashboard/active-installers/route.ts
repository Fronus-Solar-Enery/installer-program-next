import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import InstallerReward from '@/models/InstallerReward';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { $gte: start, $lte: end };
    }

    // Aggregate to get top 5 active installers
    const topInstallers = await InstallerReward.aggregate([
      // Filter by date range if provided
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),

      // Group by installer
      {
        $group: {
          _id: '$installer',
          installerCode: { $first: '$installerCode' },
          totalProducts: { $sum: 1 },
          totalRewardAmount: { $sum: '$rewardAmount' },
          totalReferrerReward: { $sum: { $ifNull: ['$referrerRewardAmount', 0] } },
        },
      },

      // Sort by number of products (installations) descending
      { $sort: { totalProducts: -1 } },

      // Limit to top 5
      { $limit: 5 },

      // Lookup installer details
      {
        $lookup: {
          from: 'installers',
          localField: '_id',
          foreignField: '_id',
          as: 'installerDetails',
        },
      },

      // Unwind installer details
      { $unwind: '$installerDetails' },

      // Check if installer has referrals (is a referrer)
      {
        $lookup: {
          from: 'installers',
          localField: 'installerDetails._id',
          foreignField: 'referrer',
          as: 'referrals',
        },
      },

      // Calculate referral reward from installers they referred
      {
        $lookup: {
          from: 'installerrewards',
          let: { referrerId: '$installerDetails._id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$referrer', '$$referrerId'] },
                ...(Object.keys(dateFilter).length > 0 ? dateFilter : {}),
              },
            },
            {
              $group: {
                _id: null,
                totalReferralReward: { $sum: { $ifNull: ['$referrerRewardAmount', 0] } },
              },
            },
          ],
          as: 'referralRewards',
        },
      },

      // Project final shape
      {
        $project: {
          _id: 0,
          installerName: '$installerDetails.fullName',
          installerCode: 1,
          totalProducts: 1,
          rewardAmount: '$totalRewardAmount',
          referralRewardAmount: {
            $ifNull: [{ $arrayElemAt: ['$referralRewards.totalReferralReward', 0] }, 0],
          },
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: topInstallers,
    });
  } catch (error) {
    console.error('Error fetching active installers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active installers' },
      { status: 500 }
    );
  }
}
