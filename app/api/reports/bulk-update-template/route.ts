import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import ExcelJS from "exceljs";
import dbConnect from "@/lib/mongodb";
import InstallerReward, { IInstallerReward } from "@/models/InstallerReward";
import { IInstaller } from "@/models/Installer";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { isMobileBank } from "@/lib/constants";
import { normalizeAccountNumber } from "@/lib/bulkValidation";

// Pre-filled bulk-update template: one row per PENDING/FAILED reward, with the
// serial number and the payee's identity columns populated from the database so
// staff only fill in transaction IDs. Identity is read from the live installer
// record (same source as the payment-format export) so the two sheets agree —
// validate-bulk compares the uploaded values against that same source.
type TemplateReward = Pick<IInstallerReward, "serialNumber"> & {
  installer?: Pick<
    IInstaller,
    "installerCode" | "bankName" | "accountNumber" | "accountTitle"
  > | null;
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const rewards = await InstallerReward.find(
      {
        rewardStatus: { $in: ["PENDING", "FAILED"] },
      },
      { serialNumber: 1, installer: 1, _id: 0 }
    )
      .populate("installer", "installerCode bankName accountNumber accountTitle")
      .sort({ createdAt: -1 })
      .lean<TemplateReward[]>();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rewards Template");

    worksheet.columns = [
      { header: "Installer Code", key: "Installer Code", width: 16, style: { numFmt: "@" } },
      { header: "Reward Account Title", key: "Reward Account Title", width: 28, style: { numFmt: "@" } },
      { header: "Reward Account Number", key: "Reward Account Number", width: 22, style: { numFmt: "@" } },
      { header: "Serial Number", key: "Serial Number", width: 18, style: { numFmt: "@" } },
      { header: "Installer Transaction ID", key: "Installer Transaction ID", width: 25, style: { numFmt: "@" } },
      { header: "Referrer Transaction ID", key: "Referrer Transaction ID", width: 25, style: { numFmt: "@" } },
      { header: "Payment Method", key: "Payment Method", width: 20, style: { numFmt: "@" } },
    ];

    rewards.forEach((reward) => {
      const installer = reward.installer;
      worksheet.addRow({
        "Installer Code": String(installer?.installerCode || ""),
        "Reward Account Title": String(installer?.accountTitle || ""),
        // Mobile-wallet accounts are phone numbers — same 03XXXXXXXXX form the
        // payment-format sheet prints.
        "Reward Account Number": normalizeAccountNumber(
          installer?.accountNumber,
          isMobileBank(installer?.bankName || "")
        ),
        "Serial Number": String(reward.serialNumber || ""),
        "Installer Transaction ID": "",
        "Referrer Transaction ID": "",
        "Payment Method": "UBANK",
      });
    });

    const excelBuffer = await workbook.xlsx.writeBuffer();

    return new Response(Buffer.from(excelBuffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=rewards_bulk_update_template_${Date.now()}.xlsx`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
