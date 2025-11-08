/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { ApiResponse } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const searchParams = request.nextUrl.searchParams;
    const serialNumber = searchParams.get("serialNumber");
    const excludeRewardId = searchParams.get("excludeRewardId"); // Optional: exclude current reward being edited

    if (!serialNumber || !serialNumber.trim()) {
      return ApiResponse.error("Serial number is required", 400);
    }

    // Build query to check if serial number exists (case-insensitive)
    const query: any = {
      serialNumber: { $regex: new RegExp(`^${serialNumber}$`, "i") },
    };

    // Exclude the current reward if editing
    if (excludeRewardId) {
      query._id = { $ne: excludeRewardId };
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
