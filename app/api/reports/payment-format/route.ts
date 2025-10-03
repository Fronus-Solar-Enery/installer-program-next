import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const paymentStatus = searchParams.get("paymentStatus") || "PENDING";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = {
      paymentStatus,
    };

    if (startDate || endDate) {
      query.sendingDate = {};
      if (startDate) {
        query.sendingDate.$gte = new Date(startDate);
      }
      if (endDate) {
        query.sendingDate.$lte = new Date(endDate);
      }
    }

    const rewards = await InstallerReward.find(query)
      .populate(
        "installer",
        "installerCode fullName phoneNumber bankName accountNumber accountTitle"
      )
      .populate(
        "referrer",
        "installerCode fullName phoneNumber bankName accountNumber accountTitle"
      )
      .sort({ createdAt: -1 });

    // Create Excel workbook for payment format
    const workbook = XLSX.utils.book_new();

    // Main installer payments
    const installerPayments = rewards.map((reward) => {
      const installer = reward.installer as any;
      return {
        "Phone Number": installer?.phoneNumber || "",
        "Bank Account Number": reward.accountNumber,
        "Bank Account Name": reward.accountTitle,
        "Bank Name": reward.bankName,
        Amount: reward.rewardAmount,
        "Serial Number": reward.serialNumber,
        "Installer Code": reward.installerCode,
      };
    });

    // Referrer payments (only for rewards with referrers)
    const referrerPayments = rewards
      .filter(
        (reward) =>
          reward.referrer &&
          reward.referrerRewardAmount &&
          reward.referrerRewardAmount > 0
      )
      .map((reward) => {
        const referrer = reward.referrer as any;
        return {
          "Phone Number": referrer?.phoneNumber || "",
          "Bank Account Number": referrer?.accountNumber || "",
          "Bank Account Name": referrer?.accountTitle || "",
          "Bank Name": referrer?.bankName || "",
          Amount: reward.referrerRewardAmount,
          "Serial Number": reward.serialNumber,
          "Installer Code": referrer?.installerCode || "",
          Type: "Referral Reward",
        };
      });

    // Create worksheets
    const installerSheet = XLSX.utils.json_to_sheet(installerPayments);
    XLSX.utils.book_append_sheet(
      workbook,
      installerSheet,
      "Installer Payments"
    );

    if (referrerPayments.length > 0) {
      const referrerSheet = XLSX.utils.json_to_sheet(referrerPayments);
      XLSX.utils.book_append_sheet(
        workbook,
        referrerSheet,
        "Referrer Payments"
      );
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new Response(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=payment_format_${paymentStatus}_${Date.now()}.xlsx`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
