import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import { RewardStatus } from "@/types/rewards";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { getInstallerFromCookie } from "@/lib/installerAuth";
import { getAccountHealth } from "@/lib/warnings";

// GET — the logged-in installer's own dashboard data.
// Auth: installer_token cookie (not NextAuth) — data scoped to that installer only.
export async function GET() {
  try {
    const session = await getInstallerFromCookie();
    if (!session) {
      return ApiResponse.unauthorized("Not signed in");
    }

    await dbConnect();

    const [installer, rewards, referredInstallers, referralRewards, health] =
      await Promise.all([
        Installer.findById(session.installerId).select(
          "installerCode fullName companyName city district certified createdAt"
        ),
        InstallerReward.find({ installer: session.installerId })
          .select(
            "productModel serialNumber installationDate rewardStatus productStatus rejectionReason rewardAmount createdAt"
          )
          .sort({ createdAt: -1 }),
        Installer.find({ referrer: session.installerId }).select(
          "installerCode fullName createdAt"
        ),
        InstallerReward.find({ referrer: session.installerId })
          .select("referrerRewardAmount rewardStatus installerCode createdAt")
          .sort({ createdAt: -1 }),
        getAccountHealth(session.installerId),
      ]);

    if (!installer) {
      return ApiResponse.notFound("Installer not found");
    }

    const totalRewards = rewards.reduce((sum, r) => sum + r.rewardAmount, 0);
    const paidRewards = rewards
      .filter((r) => r.rewardStatus === RewardStatus.PAID)
      .reduce((sum, r) => sum + r.rewardAmount, 0);
    const referralEarnings = referralRewards.reduce(
      (sum, r) => sum + (r.referrerRewardAmount ?? 0),
      0
    );

    return ApiResponse.success({
      installer,
      stats: {
        totalRewards,
        paidRewards,
        pendingRewards: totalRewards - paidRewards,
        installationCount: rewards.length,
        referralEarnings,
      },
      rewards,
      referredInstallers,
      health,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
