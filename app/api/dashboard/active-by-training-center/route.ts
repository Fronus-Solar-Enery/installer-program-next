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

    // Aggregate to get active installers by training center
    const activeByTrainingCenter = await InstallerReward.aggregate([
      // Filter by date range if provided
      ...(Object.keys(dateFilter).length > 0 ? [{ $match: dateFilter }] : []),

      // Lookup installer details to get training center
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

      // Group by training center and count unique installers
      {
        $group: {
          _id: '$installerDetails.trainingCenter',
          activeInstallers: { $addToSet: '$installer' },
          totalInstallations: { $sum: 1 },
        },
      },

      // Project final shape with count
      {
        $project: {
          _id: 0,
          trainingCenter: '$_id',
          activeInstallersCount: { $size: '$activeInstallers' },
          totalInstallations: 1,
        },
      },

      // Sort by active installers count descending
      { $sort: { activeInstallersCount: -1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: activeByTrainingCenter,
    });
  } catch (error) {
    console.error('Error fetching active installers by training center:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active installers by training center' },
      { status: 500 }
    );
  }
}
