import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { FilterQuery } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Installer, { IInstaller } from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import Product from "@/models/Product";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth } from "@/lib/authGuard";
import { escapeRegex } from "@/lib/queryBuilder";
import {
  COMPLETE_INSTALLER_COLUMNS,
  buildCompleteInstallerRows,
  type ReportInstaller,
  type ReportReward,
} from "@/lib/completeInstallersReport";

export const GET = withAuth(async (request: NextRequest) => {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";
    const city = searchParams.get("city");
    const province = searchParams.get("province");
    const certified = searchParams.get("certified");

    const query: FilterQuery<IInstaller> = {};
    if (city) query.city = { $regex: escapeRegex(city), $options: "i" };
    if (province)
      query.province = { $regex: escapeRegex(province), $options: "i" };
    if (certified === "true" || certified === "false") {
      query.certified = certified === "true";
    }

    const installers = (await Installer.find(query)
      .populate("registeredBy", "name email")
      .populate("referrer", "installerCode fullName")
      .sort({ createdAt: -1 })
      .lean()) as unknown as ReportInstaller[];

    const rewards = (await InstallerReward.find({
      installer: { $in: installers.map((i) => i._id) },
    })
      .populate("registeredBy", "name email")
      .sort({ createdAt: -1 })
      .lean()) as unknown as ReportReward[];

    const products = await Product.find()
      .select("name reward requiresInverter isBattery active")
      .lean();

    const rows = buildCompleteInstallerRows(installers, rewards, products);

    if (format !== "excel") {
      return ApiResponse.success({
        totalInstallers: installers.length,
        totalSubmissions: rewards.length,
        columns: COMPLETE_INSTALLER_COLUMNS.map((c) => c.header),
        rows,
      }) as NextResponse;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Complete Installers");
    worksheet.columns = COMPLETE_INSTALLER_COLUMNS.map((c) => ({
      header: c.header,
      key: c.header,
      width: c.width,
    }));
    worksheet.addRows(rows);
    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: COMPLETE_INSTALLER_COLUMNS.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=complete_installers_report_${Date.now()}.xlsx`,
      },
    });
  } catch (error) {
    return handleApiError(error) as NextResponse;
  }
});
