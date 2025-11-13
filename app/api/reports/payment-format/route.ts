import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import * as XLSX from "xlsx";
import dbConnect from "@/lib/mongodb";
import InstallerReward, { IInstallerReward } from "@/models/InstallerReward";
import { IInstaller } from "@/models/Installer";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { FilterQuery } from "mongoose";

// Type for populated reward document
interface PopulatedReward
  extends Omit<IInstallerReward, "installer" | "referrer"> {
  installer: Pick<
    IInstaller,
    | "installerCode"
    | "fullName"
    | "phoneNumber"
    | "bankName"
    | "accountNumber"
    | "accountTitle"
  >;
  referrer?: Pick<
    IInstaller,
    | "installerCode"
    | "fullName"
    | "phoneNumber"
    | "bankName"
    | "accountNumber"
    | "accountTitle"
  >;
}

// Type for payment row in Excel
interface PaymentRow {
  "To Account": string;
  Bank: string;
  Amount: number;
  Purpose: string;
  "Phone No.": string;
}

// Format phone number to 03XXXXXXXXX
function formatPhoneNumber(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");

  // Remove country code if present
  if (cleaned.startsWith("92")) {
    cleaned = cleaned.substring(2);
  }

  // Add leading 0 if not present
  if (!cleaned.startsWith("0")) {
    cleaned = "0" + cleaned;
  }

  // Ensure it's 11 digits (03XXXXXXXXX format)
  if (cleaned.length === 11 && cleaned.startsWith("03")) {
    return cleaned;
  }

  // If it's 10 digits starting with 3, add 0
  if (cleaned.length === 10 && cleaned.startsWith("3")) {
    return "0" + cleaned;
  }

  return cleaned;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const rewardStatus = searchParams.get("rewardStatus") || "PENDING";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Query for both PENDING and FAILED rewards
    const query: FilterQuery<IInstallerReward> = {
      rewardStatus: { $in: ["PENDING", "FAILED"] },
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
        "installerCode fullName phoneNumber bankName accountNumber accountTitle rewardStatus"
      )
      .populate(
        "referrer",
        "installerCode fullName phoneNumber bankName accountNumber accountTitle"
      )
      .sort({ createdAt: -1 });

    // Create array for all payments
    const allPayments: PaymentRow[] = [];

    // Add installer payments (for each pending/failed reward)
    rewards.forEach((reward) => {
      const populatedReward = reward as unknown as PopulatedReward;
      const installer = populatedReward.installer;
      if (installer) {
        allPayments.push({
          "To Account": installer.accountNumber || "",
          Bank: installer.bankName || "",
          Amount: populatedReward.rewardAmount || 0,
          Purpose: "Others",
          "Phone No.": formatPhoneNumber(installer.phoneNumber || ""),
        });
      }
    });

    // Add referrer payments at the bottom
    rewards.forEach((reward) => {
      const populatedReward = reward as unknown as PopulatedReward;
      const referrer = populatedReward.referrer;
      if (
        referrer &&
        populatedReward.referrerRewardAmount &&
        populatedReward.referrerRewardAmount > 0
      ) {
        allPayments.push({
          "To Account": referrer.accountNumber || "",
          Bank: referrer.bankName || "",
          Amount: populatedReward.referrerRewardAmount || 0,
          Purpose: "Others",
          "Phone No.": formatPhoneNumber(referrer.phoneNumber || ""),
        });
      }
    });

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet from data
    const worksheet = XLSX.utils.json_to_sheet(allPayments);

    // Set all cells to text format
    const range = XLSX.utils.decode_range(worksheet["!ref"] || "A1");
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cell_address];
        if (cell && cell.v !== null && cell.v !== undefined) {
          // Set cell format to text
          cell.t = "s"; // 's' means string/text type
          cell.v = String(cell.v); // Convert value to string
        }
      }
    }

    // Set column widths for better readability
    worksheet["!cols"] = [
      { wch: 20 }, // To Account
      { wch: 25 }, // Bank
      { wch: 12 }, // Amount
      { wch: 10 }, // Purpose
      { wch: 15 }, // Phone No.
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Payment Format");

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
      cellStyles: true,
    });

    return new Response(excelBuffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=payment_format_${Date.now()}.xlsx`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
