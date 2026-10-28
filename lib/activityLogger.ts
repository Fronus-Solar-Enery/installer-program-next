import Activity, { ActivityType } from "@/models/Activity";
import InstallerReward from "@/models/InstallerReward";
import { RewardStatus } from "@/types/rewards";
import { Types } from "mongoose";

interface LogActivityParams {
  type: ActivityType;
  performedBy: string | Types.ObjectId;
  targetType: "Installer" | "InstallerReward" | "TeamMember" | "Product";
  // Omitted on bulk summary rows, which describe a batch rather than one entity.
  targetId?: string | Types.ObjectId;
  targetName?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an activity to the database
 * This function is optimized to run asynchronously without blocking the main request
 */
export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    await Activity.create({
      type: params.type,
      performedBy: params.performedBy,
      targetType: params.targetType,
      targetId: params.targetId,
      targetName: params.targetName,
      description: params.description,
      metadata: params.metadata,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    });
  } catch (error) {
    // Log error but don't throw - activity logging should not break the main flow
    console.error("Failed to log activity:", error);
  }
}

/**
 * Helper to extract before/after changes for updates
 */
export function getChanges(
  oldData: Record<string, unknown>,
  newData: Record<string, unknown>
): Record<string, { before: unknown; after: unknown }> {
  const changes: Record<string, { before: unknown; after: unknown }> = {};

  for (const key in newData) {
    if (newData[key] !== undefined && oldData[key] !== newData[key]) {
      changes[key] = {
        before: oldData[key],
        after: newData[key],
      };
    }
  }

  return changes;
}

/**
 * Rejected rewards are admin-only, so for everyone else the audit trail hides
 * the reject/restore entries and anything about a currently-rejected reward
 * (e.g. its original "registered" entry) — otherwise the log would reveal it.
 * Returns an extra condition to AND into an Activity query, or null for admins.
 */
async function rejectedActivityCondition(hideRejected: boolean) {
  if (!hideRejected) return null;
  const rejectedIds = await InstallerReward.find({
    rewardStatus: RewardStatus.REJECTED,
  }).distinct("_id");
  return {
    type: {
      $nin: [ActivityType.REWARD_REJECTED, ActivityType.REWARD_RESTORED],
    },
    $nor: [{ targetType: "InstallerReward", targetId: { $in: rejectedIds } }],
  };
}

/** AND an optional extra condition into a base Activity query. */
function withCondition(
  base: Record<string, unknown>,
  extra: Record<string, unknown> | null
) {
  return extra ? { $and: [base, extra] } : base;
}

/**
 * Get activities for a specific target (installer, reward, etc.)
 */
export async function getTargetActivities(
  targetType: "Installer" | "InstallerReward" | "TeamMember",
  targetId: string,
  limit: number = 50,
  { hideRejected = false }: { hideRejected?: boolean } = {}
) {
  return await Activity.find(
    withCondition(
      { targetType, targetId },
      await rejectedActivityCondition(hideRejected)
    )
  )
    .populate("performedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * Get all activities related to an installer: the installer record itself
 * plus every reward belonging to it (single query, no per-reward round trips)
 */
export async function getInstallerActivities(
  installerId: string,
  limit: number = 200,
  { hideRejected = false }: { hideRejected?: boolean } = {}
) {
  const rewardIds = await InstallerReward.find({
    installer: installerId,
  }).distinct("_id");

  return await Activity.find(
    withCondition(
      {
        $or: [
          { targetType: "Installer", targetId: installerId },
          { targetType: "InstallerReward", targetId: { $in: rewardIds } },
        ],
      },
      await rejectedActivityCondition(hideRejected)
    )
  )
    .populate("performedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * Get recent activities across the system
 */
export async function getRecentActivities(
  limit: number = 100,
  { hideRejected = false }: { hideRejected?: boolean } = {}
) {
  return await Activity.find(
    withCondition({}, await rejectedActivityCondition(hideRejected))
  )
    .populate("performedBy", "name email")
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * Get activities performed by a specific team member
 */
export async function getUserActivities(userId: string, limit: number = 50) {
  return await Activity.find({ performedBy: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}
