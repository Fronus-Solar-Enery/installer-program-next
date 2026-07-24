import { NextRequest } from "next/server";
import { z } from "zod";
import dbConnect from "@/lib/mongodb";
import InstallerReward from "@/models/InstallerReward";
import RewardArchive, {
  IRewardArchiveRecord,
} from "@/models/RewardArchive";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { TeamRole } from "@/models/TeamMember";
import { LIST_MAX_LIMIT } from "@/lib/pagination";
import { validateBody } from "@/lib/validateRequest";

const ARCHIVE_ROLES = [TeamRole.ADMIN, TeamRole.MANAGER];

const createArchiveSchema = z.object({
  fileName: z.string().trim().min(1, "File name is required"),
  serialNumbers: z.array(z.string().trim().min(1)).min(1, "No serials"),
  successCount: z.number().int().nonnegative().default(0),
  failedCount: z.number().int().nonnegative().default(0),
  totalRowsInFile: z.number().int().nonnegative().default(0),
});

// Strip a trailing .xlsx/.xls extension so the suffix reads cleanly.
function baseName(fileName: string): string {
  return fileName.replace(/\.(xlsx|xls)$/i, "");
}

// POST - archive the successfully-updated records of one bulk-update file
export const POST = withAuth(
  async (request: NextRequest, _context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const parsed = await validateBody(request, createArchiveSchema);
      if (!parsed.success) return parsed.response;
      const { fileName, serialNumbers, successCount, failedCount, totalRowsInFile } =
        parsed.data;

      // Snapshot the authoritative post-update state straight from the DB.
      const rewards = await InstallerReward.find(
        { serialNumber: { $in: serialNumbers } },
        {
          serialNumber: 1,
          installerCode: 1,
          accountTitle: 1,
          transactionId: 1,
          referrerTransactionId: 1,
          rewardStatus: 1,
          paymentMethod: 1,
          sendingDate: 1,
          rewardAmount: 1,
          referrerRewardAmount: 1,
          _id: 0,
        }
      ).lean();

      if (rewards.length === 0) {
        return ApiResponse.badRequest("No matching rewards found to archive");
      }

      const records: IRewardArchiveRecord[] = rewards.map((r) => ({
        serialNumber: r.serialNumber,
        installerCode: r.installerCode,
        accountTitle: r.accountTitle,
        transactionId: r.transactionId,
        referrerTransactionId: r.referrerTransactionId,
        rewardStatus: r.rewardStatus,
        paymentMethod: r.paymentMethod,
        sendingDate: r.sendingDate,
        rewardAmount: r.rewardAmount || 0,
        referrerRewardAmount: r.referrerRewardAmount || 0,
      }));

      const totalInstallerAmount = records.reduce(
        (sum, r) => sum + r.rewardAmount,
        0
      );
      const totalReferrerAmount = records.reduce(
        (sum, r) => sum + r.referrerRewardAmount,
        0
      );
      const totalAmount = totalInstallerAmount + totalReferrerAmount;

      const archiveName = `${baseName(fileName)}_PKR.${totalAmount}`;

      const archive = await RewardArchive.create({
        fileName,
        archiveName,
        uploadedBy: session.user.id,
        totalRecords: records.length,
        successCount,
        failedCount,
        totalRowsInFile,
        totalInstallerAmount,
        totalReferrerAmount,
        totalAmount,
        records,
      });

      return ApiResponse.success(
        { id: archive._id, archiveName },
        "Archive saved"
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: ARCHIVE_ROLES }
);

// GET - list archives (metadata only, no record payloads)
export const GET = withAuth(
  async () => {
    try {
      await dbConnect();

      const archives = await RewardArchive.find(
        {},
        { records: 0 }
      )
        .populate("uploadedBy", "name email")
        .sort({ createdAt: -1 })
        .limit(LIST_MAX_LIMIT)
        .lean();

      return ApiResponse.success({ archives });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: ARCHIVE_ROLES }
);
