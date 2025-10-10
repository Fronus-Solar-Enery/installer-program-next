import Activity, { ActivityType, IActivity } from '@/models/Activity';
import { Types } from 'mongoose';

interface LogActivityParams {
  type: ActivityType;
  performedBy: string | Types.ObjectId;
  targetType: 'Installer' | 'InstallerReward' | 'TeamMember';
  targetId: string | Types.ObjectId;
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
    console.error('Failed to log activity:', error);
  }
}

/**
 * Helper to extract before/after changes for updates
 */
export function getChanges(oldData: Record<string, unknown>, newData: Record<string, unknown>): Record<string, { before: unknown; after: unknown }> {
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
 * Get activities for a specific target (installer, reward, etc.)
 */
export async function getTargetActivities(
  targetType: 'Installer' | 'InstallerReward' | 'TeamMember',
  targetId: string,
  limit: number = 50
) {
  return await Activity.find({ targetType, targetId })
    .populate('performedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * Get recent activities across the system
 */
export async function getRecentActivities(limit: number = 100) {
  return await Activity.find()
    .populate('performedBy', 'name email')
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
