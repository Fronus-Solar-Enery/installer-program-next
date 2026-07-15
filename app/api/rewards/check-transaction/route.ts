import { NextRequest } from "next/server";
import { Types, FilterQuery } from "mongoose";
import dbConnect from "@/lib/mongodb";
import InstallerReward, { IInstallerReward } from "@/models/InstallerReward";
import { ApiResponse } from "@/lib/apiResponse";
import { escapeRegex } from "@/lib/queryBuilder";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const transactionId = searchParams.get("transactionId");
    const excludeRewardId = searchParams.get("excludeRewardId"); // Optional: exclude current reward being edited

    if (!transactionId || !transactionId.trim()) {
      return ApiResponse.error("Transaction ID is required", 400);
    }

    // Check if the transaction ID is already used (case-insensitive, exact).
    // Escape so a value containing regex metacharacters matches literally.
    const query: FilterQuery<IInstallerReward> = {
      transactionId: {
        $regex: new RegExp(`^${escapeRegex(transactionId.trim())}$`, "i"),
      },
    };

    if (excludeRewardId) {
      query._id = { $ne: new Types.ObjectId(excludeRewardId) };
    }

    const existing = await InstallerReward.findOne(query).select("_id");

    return ApiResponse.success({
      exists: !!existing,
      transactionId,
    });
  } catch (error) {
    console.error("Error checking transaction ID:", error);
    return ApiResponse.error("Failed to check transaction ID", 500);
  }
}
