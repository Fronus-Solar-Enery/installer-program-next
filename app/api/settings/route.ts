import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Settings, { getSettings } from '@/models/Settings';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { TeamRole } from '@/models/TeamMember';
import { logActivity } from '@/lib/activityLogger';
import { ActivityType } from '@/models/Activity';

// GET settings
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    await dbConnect();

    const settings = await getSettings();

    return ApiResponse.success(settings);
  } catch (error) {
    return handleApiError(error);
  }
}

// PUT - Update settings (ADMIN only)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session) {
      return ApiResponse.unauthorized();
    }

    // Only ADMIN can update settings
    if (session.user.role !== TeamRole.ADMIN) {
      return ApiResponse.forbidden('Only administrators can update settings');
    }

    await dbConnect();

    const body = await request.json();
    const settings = await getSettings();

    // Store old values for activity log
    const oldSettings = settings ? { ...(settings as any).toObject() } : {};

    // Update settings
    Object.assign(settings, body);
    (settings as any).updatedBy = session.user.id;
    await (settings as any).save();

    // Log activity
    const changes: Record<string, any> = {};
    for (const key in body) {
      if (oldSettings[key as keyof typeof oldSettings] !== body[key]) {
        changes[key] = {
          before: oldSettings[key as keyof typeof oldSettings],
          after: body[key],
        };
      }
    }

    if (Object.keys(changes).length > 0) {
      await logActivity({
        type: ActivityType.TEAM_MEMBER_UPDATED, // Using closest type
        performedBy: session.user.id,
        targetType: 'TeamMember',
        targetId: session.user.id,
        targetName: 'System Settings',
        description: `Updated system settings`,
        metadata: { changes },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      });
    }

    return ApiResponse.success(settings, 'Settings updated successfully');
  } catch (error) {
    return handleApiError(error);
  }
}
