import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import dbConnect from "@/lib/mongodb";
import RewardArchive from "@/models/RewardArchive";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { TeamRole } from "@/models/TeamMember";

const ARCHIVE_ROLES = [TeamRole.ADMIN, TeamRole.MANAGER];
const DELETE_ROLES = [TeamRole.ADMIN];

function formatDate(d?: Date): string {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

// GET - regenerate the Excel file for a stored archive
export const GET = withAuth(
  async (_request: NextRequest, context: RouteContext, _session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const archive = await RewardArchive.findById(id).lean();

      if (!archive) {
        return ApiResponse.notFound("Archive not found");
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Updated Records");

      worksheet.columns = [
        { header: "Serial Number", key: "serialNumber", width: 18, style: { numFmt: "@" } },
        { header: "Installer Code", key: "installerCode", width: 16, style: { numFmt: "@" } },
        { header: "Account Title", key: "accountTitle", width: 28, style: { numFmt: "@" } },
        { header: "Installer Transaction ID", key: "transactionId", width: 24, style: { numFmt: "@" } },
        { header: "Referrer Transaction ID", key: "referrerTransactionId", width: 24, style: { numFmt: "@" } },
        { header: "Reward Status", key: "rewardStatus", width: 14, style: { numFmt: "@" } },
        { header: "Payment Method", key: "paymentMethod", width: 16, style: { numFmt: "@" } },
        { header: "Sending Date", key: "sendingDate", width: 14, style: { numFmt: "@" } },
        { header: "Installer Amount", key: "rewardAmount", width: 16, style: { numFmt: "@" } },
        { header: "Referrer Amount", key: "referrerRewardAmount", width: 16, style: { numFmt: "@" } },
      ];

      archive.records.forEach((r) => {
        worksheet.addRow({
          serialNumber: String(r.serialNumber ?? ""),
          installerCode: String(r.installerCode ?? ""),
          accountTitle: String(r.accountTitle ?? ""),
          transactionId: String(r.transactionId ?? ""),
          referrerTransactionId: String(r.referrerTransactionId ?? ""),
          rewardStatus: String(r.rewardStatus ?? ""),
          paymentMethod: String(r.paymentMethod ?? ""),
          sendingDate: formatDate(r.sendingDate),
          rewardAmount: String(r.rewardAmount ?? 0),
          referrerRewardAmount: String(r.referrerRewardAmount ?? 0),
        });
      });

      const excelBuffer = await workbook.xlsx.writeBuffer();
      const safeName = archive.archiveName.replace(/[^a-zA-Z0-9._-]/g, "_");

      return new NextResponse(Buffer.from(excelBuffer), {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename=${safeName}.xlsx`,
        },
      });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: ARCHIVE_ROLES }
);

// DELETE - remove an archive (ADMIN only)
export const DELETE = withAuth(
  async (_request: NextRequest, context: RouteContext) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const deleted = await RewardArchive.findByIdAndDelete(id).lean();

      if (!deleted) {
        return ApiResponse.notFound("Archive not found");
      }

      return ApiResponse.success({ id }, "Archive deleted");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: DELETE_ROLES }
);
