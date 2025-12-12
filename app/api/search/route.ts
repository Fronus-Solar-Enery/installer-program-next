import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { getSearchParams } from "@/lib/validateRequest";

// GET - Global search across installers and rewards
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const params = getSearchParams(request);
      const query = params.getString("q");

      if (!query || query.trim().length < 2) {
        return ApiResponse.success({
          installers: [],
          rewards: [],
          message: "Search query must be at least 2 characters",
        });
      }

      await dbConnect();

      const searchRegex = new RegExp(query.trim(), "i");

      // Build search conditions for installers
      const installerSearchConditions = [
        { cnic: searchRegex },
        { installerCode: searchRegex },
        { phoneNumber: searchRegex },
        { whatsappNumber: searchRegex },
        { fullName: searchRegex },
        { accountNumber: searchRegex },
        { accountTitle: searchRegex },
        { companyName: searchRegex },
      ];

      // Execute all queries in parallel for faster response
      const [installers, rewards, installerIds] = await Promise.all([
        // Search installers by multiple fields
        Installer.find({ $or: installerSearchConditions })
          .select(
            "installerCode fullName cnic phoneNumber whatsappNumber city accountNumber accountTitle companyName"
          )
          .limit(10)
          .lean(),

        // Search rewards by serial number, transaction IDs
        InstallerReward.find({
          $or: [
            { serialNumber: searchRegex },
            { transactionId: searchRegex },
            { referrerTransactionId: searchRegex },
          ],
        })
          .populate({
            path: "installer",
            select:
              "installerCode fullName cnic phoneNumber whatsappNumber city",
          })
          .select(
            "serialNumber productModel rewardAmount rewardStatus transactionId referrerTransactionId cityOfInstallation createdAt"
          )
          .limit(10)
          .lean(),

        // Get installer IDs for secondary rewards search (subset of conditions)
        Installer.find({
          $or: installerSearchConditions.slice(0, 5), // First 5 conditions only
        })
          .select("_id")
          .limit(20)
          .lean(),
      ]);

      // Fetch rewards by installer IDs if any were found
      let mergedRewards = rewards;
      if (installerIds.length > 0) {
        const rewardsByInstaller = await InstallerReward.find({
          installer: { $in: installerIds.map((i) => i._id) },
        })
          .populate({
            path: "installer",
            select:
              "installerCode fullName cnic phoneNumber whatsappNumber city",
          })
          .select(
            "serialNumber productModel rewardAmount rewardStatus transactionId referrerTransactionId cityOfInstallation createdAt"
          )
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
        mergedRewards = Array.from(rewardMap.values()).slice(
          0,
          10
        ) as typeof rewards;
      }

      return ApiResponse.success({
        installers,
        rewards: mergedRewards,
        query,
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);
