import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import InstallerReward, { IInstallerReward } from "@/models/InstallerReward";
import Installer from "@/models/Installer";
import { registerRewardSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { FilterQuery } from "mongoose";
import { ZodError } from "zod";

// GET all rewards with filtering
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const rewardStatus = searchParams.get("rewardStatus");
    const productModel = searchParams.get("productModel");
    const city = searchParams.get("city");
    const registeredBy = searchParams.get("registeredBy");
    const installerCode = searchParams.get("installerCode");
    const installerId = searchParams.get("installer"); // Support filtering by installer ID
    const serialNumberStatus = searchParams.get("serialNumberStatus");
    const paymentMethod = searchParams.get("paymentMethod");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    const query: FilterQuery<IInstallerReward> = {};

    if (rewardStatus && rewardStatus !== "all") {
      query.rewardStatus = rewardStatus;
    }

    if (productModel) {
      query.productModel = { $regex: productModel, $options: "i" };
    }

    if (city) {
      query.cityOfInstallation = { $regex: city, $options: "i" };
    }

    if (registeredBy) {
      query.registeredBy = registeredBy;
    }

    if (installerCode) {
      query.installerCode = installerCode.toUpperCase();
    }

    if (installerId) {
      query.installer = installerId;
    }

    if (serialNumberStatus) {
      query.serialNumberStatus = serialNumberStatus;
    }

    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    if (startDate || endDate) {
      query.sendingDate = {};
      if (startDate) {
        query.sendingDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.sendingDate.$lte = new Date(endDate);
      }
    }

    const skip = (page - 1) * limit;

    const [rewards, total] = await Promise.all([
      InstallerReward.find(query)
        .populate(
          "installer",
          "installerCode fullName cnic phoneNumber whatsappNumber trainingCenter bankName accountNumber accountTitle"
        )
        .populate(
          "referrer",
          "installerCode fullName phoneNumber bankName accountNumber accountTitle"
        )
        .populate("registeredBy", "name email role")
        .populate("updatedBy", "name email role")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit),
      InstallerReward.countDocuments(query),
    ]);

    // Get statistics
    const stats = await InstallerReward.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$rewardStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$rewardAmount" },
        },
      },
    ]);

    return ApiResponse.success({
      rewards,
      statistics: stats,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST - Register new reward
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    const body = await request.json();
    const validatedData = registerRewardSchema.parse(body);

    await dbConnect();

    // Find installer by code
    const installer = await Installer.findOne({
      installerCode: validatedData.installerCode,
    });

    if (!installer) {
      return ApiResponse.error("Installer not found with this code", 404);
    }

    // Check if serial number already exists
    const existingReward = await InstallerReward.findOne({
      serialNumber: validatedData.serialNumber,
    });
    if (existingReward) {
      return ApiResponse.error("Serial number already exists", 409);
    }

    // Get bank details from installer
    const bankName = installer.bankName;
    const accountNumber = installer.accountNumber;
    const accountTitle = installer.accountTitle;

    // Prepare reward data
    const rewardData: Record<string, unknown> = {
      ...validatedData,
      installer: installer._id,
      bankName,
      accountNumber,
      accountTitle,
      registeredBy: session.user.id,
    };

    // Handle referrer logic
    if (installer.referrer) {
      const referrer = await Installer.findById(installer.referrer);
      if (referrer) {
        rewardData.referrerCode = referrer.installerCode;
        rewardData.referrer = referrer._id;
        rewardData.referrerRewardAmount = 500; // Fixed amount for referrer
      }
    }

    // Create reward
    const reward = await InstallerReward.create(rewardData);

    const populatedReward = await InstallerReward.findById(reward._id)
      .populate(
        "installer",
        "installerCode fullName cnic phoneNumber whatsappNumber trainingCenter bankName accountNumber accountTitle"
      )
      .populate(
        "referrer",
        "installerCode fullName phoneNumber bankName accountNumber accountTitle"
      )
      .populate("registeredBy", "name email role")
      .populate("updatedBy", "name email role");

    return ApiResponse.success(
      populatedReward,
      "Reward registered successfully",
      201
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return ApiResponse.validationError(error.issues as Array<{ path?: PropertyKey[]; message: string }>);
    }
    return handleApiError(error);
  }
}
