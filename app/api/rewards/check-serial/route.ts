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
    const serialNumber = searchParams.get("serialNumber");
    const excludeRewardId = searchParams.get("excludeRewardId"); // Optional: exclude current reward being edited

    if (!serialNumber || !serialNumber.trim()) {
      return ApiResponse.error("Serial number is required", 400);
    }

    // Build query to check if serial number exists (case-insensitive, exact).
    // Escape so a serial containing regex metacharacters matches literally.
    const query: FilterQuery<IInstallerReward> = {
      serialNumber: { $regex: new RegExp(`^${escapeRegex(serialNumber)}$`, "i") },
    };

    // Exclude the current reward if editing
    if (excludeRewardId) {
      query._id = { $ne: new Types.ObjectId(excludeRewardId) };
    }

    const existingReward = await InstallerReward.findOne(query).select("_id");

    return ApiResponse.success({
      exists: !!existingReward,
      serialNumber,
    });
  } catch (error) {
    console.error("Error checking serial number:", error);
    return ApiResponse.error("Failed to check serial number", 500);
  }
}
