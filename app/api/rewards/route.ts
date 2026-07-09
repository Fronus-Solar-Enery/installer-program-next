import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import InstallerReward, { IInstallerReward } from "@/models/InstallerReward";
import Installer from "@/models/Installer";
import { registerRewardSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody, getSearchParams } from "@/lib/validateRequest";
import { QueryBuilder, parseSortParams } from "@/lib/queryBuilder";
import { getPaginationParams, createPaginationMeta } from "@/lib/pagination";
import { getSettings } from "@/models/Settings";
import { RewardStatus } from "@/types/rewards";
import {
  sendRewardPaymentMessage,
  sendReferralRewardMessage,
} from "@/lib/whatsappService";
import { logger } from "@/lib/logger";

// GET all rewards with filtering
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const params = getSearchParams(request);
      const { page, limit, skip } = getPaginationParams(params.raw, {
        maxLimit: 10000, // Allow fetching all rewards for dashboard stats
      });
      const { field: sortBy, order: sortOrder } = parseSortParams(params.raw);

      // Build query using QueryBuilder
      const searchTerm = params.getString("search");

      const query = new QueryBuilder<IInstallerReward>()
        // Server-side search across multiple fields
        .search(
          [
            "serialNumber",
            "transactionId",
            "referrerTransactionId",
            "installerCode",
          ],
          searchTerm,
        )
        .enumFilter("rewardStatus", params.getString("rewardStatus"))
        .filter("productModel", params.getString("productModel"), {
          regex: true,
        })
        .filter("cityOfInstallation", params.getString("city"), { regex: true })
        .ref("registeredBy", params.getString("registeredBy"))
        .filter(
          "installerCode",
          params.getString("installerCode")?.toUpperCase(),
        )
        .ref("installer", params.getString("installer"))
        .filter("paymentMethod", params.getString("paymentMethod"))
        .dateRange(
          "createdAt",
          params.getString("startDate"),
          params.getString("endDate"),
        )
        .build();

      // Check if stats are requested (skip expensive aggregation when not needed)
      const includeStats = params.getString("includeStats") === "true";

      const [rewards, total, stats] = await Promise.all([
        InstallerReward.find(query)
          .populate(
            "installer",
            "installerCode fullName cnic phoneNumber whatsappNumber district bankName accountNumber accountTitle",
          )
          .populate(
            "referrer",
            "installerCode fullName phoneNumber bankName accountNumber accountTitle",
          )
          .populate("registeredBy", "name email role")
          .populate("updatedBy", "name email role")
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit),
        InstallerReward.countDocuments(query),
        // Only run expensive aggregation if stats are requested
        includeStats
          ? InstallerReward.aggregate([
              { $match: query },
              {
                $group: {
                  _id: "$rewardStatus",
                  count: { $sum: 1 },
                  totalAmount: { $sum: "$rewardAmount" },
                },
              },
            ])
          : Promise.resolve([]),
      ]);

      return ApiResponse.success({
        rewards,
        statistics: stats,
        pagination: createPaginationMeta(total, page, limit),
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// POST - Register new reward
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      // Validate request body
      const validation = await validateBody(request, registerRewardSchema);
      if (!validation.success) return validation.response;
      const validatedData = validation.data;

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
      let referrerDoc = null;
      if (installer.referrer) {
        referrerDoc = await Installer.findById(installer.referrer);
        if (referrerDoc) {
          const { defaultReferralReward } = await getSettings();
          rewardData.referrerCode = referrerDoc.installerCode;
          rewardData.referrer = referrerDoc._id;
          rewardData.referrerRewardAmount = defaultReferralReward;
        }
      }

      // Create reward
      const reward = await InstallerReward.create(rewardData);

      // WhatsApp notifications — fire-and-forget, never block the response.
      if (reward.rewardStatus === RewardStatus.PAID) {
        sendRewardPaymentMessage(
          {
            installer: {
              fullName: installer.fullName,
              whatsappNumber: installer.whatsappNumber,
            },
            serialNumber: reward.serialNumber,
            productModel: reward.productModel,
            rewardAmount: reward.rewardAmount,
            transactionId: reward.transactionId,
            sendingDate: reward.sendingDate,
          },
          session.user.id,
        ).catch((e) =>
          logger.error("Reward WhatsApp failed", { error: String(e) }),
        );
      }
      if (referrerDoc && reward.referrerRewardAmount) {
        sendReferralRewardMessage(
          {
            fullName: referrerDoc.fullName,
            whatsappNumber: referrerDoc.whatsappNumber,
          },
          {
            fullName: installer.fullName,
            installerCode: installer.installerCode,
          },
          reward.referrerRewardAmount,
          session.user.id,
        ).catch((e) =>
          logger.error("Referral WhatsApp failed", { error: String(e) }),
        );
      }

      const populatedReward = await InstallerReward.findById(reward._id)
        .populate(
          "installer",
          "installerCode fullName cnic phoneNumber whatsappNumber district bankName accountNumber accountTitle",
        )
        .populate(
          "referrer",
          "installerCode fullName phoneNumber bankName accountNumber accountTitle",
        )
        .populate("registeredBy", "name email role")
        .populate("updatedBy", "name email role");

      return ApiResponse.success(
        populatedReward,
        "Reward registered successfully",
        201,
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
);
