import { Types } from "mongoose";
import Warning, { IWarning } from "@/models/Warning";
import Installer from "@/models/Installer";
import { getSettings } from "@/models/Settings";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { logger } from "@/lib/logger";
import {
  FALSE_CLAIM_REASON,
  WARNING_EXPIRY_MONTHS,
} from "@/lib/constants";
import { ProductStatus } from "@/types/rewards";

/**
 * Start of the window in which a warning still counts toward suspension.
 * Warnings issued before this instant have expired.
 *
 * Pure — the expiry rule is applied as a query bound at read time, so there is
 * no sweeper job to fall behind and no stored "expired" flag to go stale.
 */
export function warningWindowStart(now: Date = new Date()): Date {
  const start = new Date(now);
  start.setMonth(start.getMonth() - WARNING_EXPIRY_MONTHS);
  return start;
}

/** When a warning issued at `issuedAt` stops counting. */
export function warningExpiresAt(issuedAt: Date): Date {
  const expiry = new Date(issuedAt);
  expiry.setMonth(expiry.getMonth() + WARNING_EXPIRY_MONTHS);
  return expiry;
}

/** A warning counts only while un-revoked and inside the expiry window. */
export function isWarningActive(
  warning: Pick<IWarning, "issuedAt" | "revokedAt">,
  now: Date = new Date()
): boolean {
  if (warning.revokedAt) return false;
  return warning.issuedAt.getTime() > warningWindowStart(now).getTime();
}

/** A reward earns a warning only when rejected specifically as a false claim. */
export function rewardEarnsWarning(reward: {
  productStatus?: string | null;
  rejectionReason?: string | null;
}): boolean {
  return (
    reward.productStatus === ProductStatus.REJECTED &&
    reward.rejectionReason === FALSE_CLAIM_REASON
  );
}

export type HealthStatus = "GOOD" | "AT_RISK" | "SUSPENDED";

export function healthStatus(
  activeWarnings: number,
  threshold: number,
  suspended: boolean
): HealthStatus {
  if (suspended) return "SUSPENDED";
  return activeWarnings > 0 ? "AT_RISK" : "GOOD";
}

export interface AccountHealth {
  activeWarnings: number;
  threshold: number;
  suspended: boolean;
  suspendedAt: Date | null;
  status: HealthStatus;
  warnings: {
    _id: string;
    reason: string;
    serialNumber: string;
    issuedAt: Date;
    expiresAt: Date;
  }[];
}

/** Active (un-revoked, unexpired) warnings for one installer. */
export async function countActiveWarnings(
  installerId: string | Types.ObjectId,
  now: Date = new Date()
): Promise<number> {
  return Warning.countDocuments({
    installer: installerId,
    revokedAt: null,
    issuedAt: { $gt: warningWindowStart(now) },
  });
}

/** Full account health for an installer — used by dashboard and /my-stats. */
export async function getAccountHealth(
  installerId: string | Types.ObjectId,
  now: Date = new Date()
): Promise<AccountHealth> {
  const [settings, installer, warnings] = await Promise.all([
    getSettings(),
    Installer.findById(installerId).select("suspendedAt").lean(),
    Warning.find({
      installer: installerId,
      revokedAt: null,
      issuedAt: { $gt: warningWindowStart(now) },
    })
      .sort({ issuedAt: -1 })
      .lean(),
  ]);

  const suspended = Boolean(installer?.suspendedAt);
  const threshold = settings.warningThreshold;

  return {
    activeWarnings: warnings.length,
    threshold,
    suspended,
    suspendedAt: installer?.suspendedAt ?? null,
    status: healthStatus(warnings.length, threshold, suspended),
    warnings: warnings.map((w) => ({
      _id: String(w._id),
      reason: w.reason,
      serialNumber: w.serialNumber,
      issuedAt: w.issuedAt,
      expiresAt: warningExpiresAt(w.issuedAt),
    })),
  };
}

/** Health for many installers at once, without an N+1 per row. */
export async function getWarningCounts(
  installerIds: (string | Types.ObjectId)[],
  now: Date = new Date()
): Promise<Map<string, number>> {
  if (installerIds.length === 0) return new Map();

  const rows = await Warning.aggregate<{ _id: Types.ObjectId; count: number }>([
    {
      $match: {
        installer: {
          $in: installerIds.map((id) => new Types.ObjectId(String(id))),
        },
        revokedAt: null,
        issuedAt: { $gt: warningWindowStart(now) },
      },
    },
    { $group: { _id: "$installer", count: { $sum: 1 } } },
  ]);

  return new Map(rows.map((r) => [String(r._id), r.count]));
}

/**
 * Suspend the installer if active warnings have reached the threshold.
 * Idempotent: an already-suspended installer is left alone.
 */
async function suspendIfThresholdReached(
  installerId: Types.ObjectId,
  installerName: string,
  actorId: string | Types.ObjectId | null
): Promise<boolean> {
  const [settings, activeCount] = await Promise.all([
    getSettings(),
    countActiveWarnings(installerId),
  ]);

  if (activeCount < settings.warningThreshold) return false;

  // Only flips a not-yet-suspended installer, so repeat calls are no-ops.
  const result = await Installer.updateOne(
    { _id: installerId, suspendedAt: null },
    { $set: { suspendedAt: new Date(), suspendedBy: actorId ?? null } }
  );

  if (result.modifiedCount === 0) return false;

  if (actorId) {
    await logActivity({
      type: ActivityType.INSTALLER_SUSPENDED,
      performedBy: actorId,
      targetType: "Installer",
      targetId: installerId,
      targetName: installerName,
      description: `Installer suspended automatically after reaching ${settings.warningThreshold} active warnings`,
      metadata: { activeWarnings: activeCount, threshold: settings.warningThreshold },
    });
  }

  return true;
}

interface SyncRewardInput {
  _id: Types.ObjectId | string;
  // Callers pass a reward straight from Mongoose, where `installer` is a raw
  // ObjectId on a fresh create but a populated document after `.populate()`.
  installer: Types.ObjectId | string | { _id: Types.ObjectId | string };
  serialNumber: string;
  productStatus?: string | null;
  rejectionReason?: string | null;
}

function toInstallerId(
  installer: SyncRewardInput["installer"]
): Types.ObjectId {
  const raw =
    typeof installer === "object" && installer !== null && "_id" in installer
      ? installer._id
      : installer;
  return new Types.ObjectId(String(raw));
}

/**
 * Bring the warning state in line with a reward's current product status.
 *
 * Rejected-as-false-claim issues (or keeps) exactly one warning for that reward;
 * anything else revokes the reward's warning. Called on every reward create and
 * update so correcting a mistaken rejection undoes its warning automatically.
 *
 * Never throws — a warning bookkeeping failure must not fail the reward write.
 */
export async function syncWarningForReward(
  reward: SyncRewardInput,
  actorId: string | Types.ObjectId | null,
  installerName = ""
): Promise<void> {
  try {
    const installerId = toInstallerId(reward.installer);

    if (!rewardEarnsWarning(reward)) {
      const revoked = await Warning.findOneAndUpdate(
        { reward: reward._id, revokedAt: null },
        {
          $set: {
            revokedAt: new Date(),
            revokedBy: actorId ?? null,
            revokedNote: "Reward no longer rejected as a false claim",
          },
        }
      );

      if (revoked && actorId) {
        await logActivity({
          type: ActivityType.WARNING_REVOKED,
          performedBy: actorId,
          targetType: "Installer",
          targetId: installerId,
          targetName: installerName,
          description: `Warning revoked — reward ${reward.serialNumber} is no longer a false claim`,
          metadata: { serialNumber: reward.serialNumber },
        });
      }
      return;
    }

    // Upsert on reward keeps this idempotent across repeated saves.
    const existing = await Warning.findOne({ reward: reward._id });
    if (existing && !existing.revokedAt) return;

    await Warning.findOneAndUpdate(
      { reward: reward._id },
      {
        $set: {
          installer: installerId,
          serialNumber: reward.serialNumber,
          reason: FALSE_CLAIM_REASON,
          issuedAt: new Date(),
          issuedBy: actorId ?? null,
          revokedAt: null,
          revokedBy: null,
          revokedNote: undefined,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (actorId) {
      await logActivity({
        type: ActivityType.WARNING_ISSUED,
        performedBy: actorId,
        targetType: "Installer",
        targetId: installerId,
        targetName: installerName,
        description: `Warning issued for false claim on reward ${reward.serialNumber}`,
        metadata: { serialNumber: reward.serialNumber, reason: FALSE_CLAIM_REASON },
      });
    }

    await suspendIfThresholdReached(installerId, installerName, actorId);
  } catch (error) {
    logger.error("Failed to sync warning for reward", {
      rewardId: String(reward._id),
      error: String(error),
    });
  }
}

/**
 * Lift a suspension. Per product decision this also revokes every active
 * warning, so the installer restarts at zero rather than sitting one warning
 * away from an immediate re-suspension. ADMIN-only — enforced at the route.
 */
export async function unsuspendInstaller(
  installerId: string | Types.ObjectId,
  actorId: string | Types.ObjectId,
  installerName = "",
  note?: string
): Promise<void> {
  const now = new Date();

  await Warning.updateMany(
    { installer: installerId, revokedAt: null },
    {
      $set: {
        revokedAt: now,
        revokedBy: actorId,
        revokedNote: note || "Cleared on unsuspend",
      },
    }
  );

  await Installer.updateOne(
    { _id: installerId },
    { $set: { suspendedAt: null, suspendedBy: null } }
  );

  await logActivity({
    type: ActivityType.INSTALLER_UNSUSPENDED,
    performedBy: actorId,
    targetType: "Installer",
    targetId: installerId,
    targetName: installerName,
    description: "Installer unsuspended and active warnings cleared",
    metadata: note ? { note } : undefined,
  });
}
