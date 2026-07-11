import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import { RewardStatus } from "@/types/rewards";
import LandingPage from "@/components/landing/LandingPage2026";
import { logger } from "@/lib/logger";

async function getLandingStats() {
  try {
    await dbConnect();
    const [installers, installations, paidAgg] = await Promise.all([
      Installer.countDocuments(),
      InstallerReward.countDocuments(),
      InstallerReward.aggregate([
        { $match: { rewardStatus: RewardStatus.PAID } },
        { $group: { _id: null, total: { $sum: "$rewardAmount" } } },
      ]),
    ]);
    return {
      installers,
      installations,
      rewardsPaid: paidAgg[0]?.total ?? 0,
    };
  } catch (error) {
    // Landing page must render even if the DB is unreachable.
    logger.error("Failed to load landing stats", {
      error: error instanceof Error ? error.message : String(error),
    });
    return { installers: 0, installations: 0, rewardsPaid: 0 };
  }
}

export default async function Home() {
  return <LandingPage stats={await getLandingStats()} />;
}
