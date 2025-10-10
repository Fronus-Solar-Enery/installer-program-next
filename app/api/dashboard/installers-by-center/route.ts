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
    const trainingCenter = searchParams.get('trainingCenter');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!trainingCenter) {
      return NextResponse.json({ error: 'Training center is required' }, { status: 400 });
    }

    // Build date filter
    const dateFilter: Record<string, unknown> = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.createdAt = { $gte: start, $lte: end };
    }

    // Aggregate to get installers from specific training center with installations
    const installers = await InstallerReward.aggregate([
      // Filter by date range if provided
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),

      // Lookup installer details
      {
        $lookup: {
          from: 'installers',
          localField: 'installer',
          foreignField: '_id',
          as: 'installerDetails',
        },
      },

      // Unwind installer details
      { $unwind: '$installerDetails' },

      // Filter by training center
      {
        $match: {
          'installerDetails.trainingCenter': trainingCenter,
        },
      },

      // Group by installer
      {
        $group: {
          _id: '$installer',
          installerName: { $first: '$installerDetails.fullName' },
          installerCode: { $first: '$installerDetails.installerCode' },
          trainingCenter: { $first: '$installerDetails.trainingCenter' },
          city: { $first: '$installerDetails.city' },
          totalProducts: { $sum: 1 },
          totalRewardAmount: { $sum: '$rewardAmount' },
          totalReferralReward: { $sum: { $ifNull: ['$referrerRewardAmount', 0] } },
        },
      },

      // Sort by total products descending
      { $sort: { totalProducts: -1 } },

      // Project final shape
      {
        $project: {
          _id: 0,
          installerName: 1,
          installerCode: 1,
          trainingCenter: 1,
          city: 1,
          totalProducts: 1,
          rewardAmount: '$totalRewardAmount',
          referralRewardAmount: '$totalReferralReward',
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      data: installers,
    });
  } catch (error) {
    console.error('Error fetching installers by training center:', error);
    return NextResponse.json(
      { error: 'Failed to fetch installers by training center' },
      { status: 500 }
    );
  }
}
