import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import ExcelJS from "exceljs";
import dbConnect from "@/lib/mongodb";
import InstallerReward, { IInstallerReward } from "@/models/InstallerReward";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { ProductStatus } from "@/types/rewards";

// Pre-filled bulk-update template: one row per PENDING/FAILED reward, serial
// number populated from the database so staff only fill in transaction IDs.
// Mirrors the payment-format export (real data, not a blank sample).
type TemplateReward = Pick<IInstallerReward, "serialNumber">;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    // Only eligible products are payable, so rejected and out-of-program
    // claims never reach the sheet staff fill in transaction IDs on.
    const rewards = await InstallerReward.find(
      {
        rewardStatus: { $in: ["PENDING", "FAILED"] },
        productStatus: ProductStatus.ELIGIBLE,
      },
      { serialNumber: 1, _id: 0 }
    )
      .sort({ createdAt: -1 })
      .lean<TemplateReward[]>();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Rewards Template");

    worksheet.columns = [
      { header: "Serial Number", key: "Serial Number", width: 18, style: { numFmt: "@" } },
      { header: "Installer Transaction ID", key: "Installer Transaction ID", width: 25, style: { numFmt: "@" } },
      { header: "Referrer Transaction ID", key: "Referrer Transaction ID", width: 25, style: { numFmt: "@" } },
      { header: "Payment Method", key: "Payment Method", width: 20, style: { numFmt: "@" } },
      // Left blank on purpose: an empty Product Status means "leave unchanged",
      // so the sheet only alters eligibility where staff explicitly type it.
      { header: "Product Status", key: "Product Status", width: 18, style: { numFmt: "@" } },
      { header: "Rejection Reason", key: "Rejection Reason", width: 26, style: { numFmt: "@" } },
    ];

    rewards.forEach((reward) => {
      worksheet.addRow({
        "Serial Number": String(reward.serialNumber || ""),
        "Installer Transaction ID": "",
        "Referrer Transaction ID": "",
        "Payment Method": "UBANK",
        "Product Status": "",
        "Rejection Reason": "",
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
