import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Settings, { getSettings, ISettings } from '@/models/Settings';
import { ApiResponse, handleApiError } from '@/lib/apiResponse';
import { TeamRole } from '@/models/TeamMember';
import { logActivity } from '@/lib/activityLogger';
import { ActivityType } from '@/models/Activity';
import { Document } from 'mongoose';

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

    // Payment methods: normalize + reject bad shapes before persisting.
    if (body.paymentMethods !== undefined) {
      if (!Array.isArray(body.paymentMethods)) {
        return ApiResponse.badRequest('Payment methods must be a list');
      }
      const cleaned = [
        ...new Set(
          (body.paymentMethods as unknown[])
            .map((m) => String(m).trim())
            .filter(Boolean),
        ),
      ];
      if (cleaned.length === 0) {
        return ApiResponse.badRequest('At least one payment method is required');
      }
      if (cleaned.length > 20 || cleaned.some((m) => m.length > 40)) {
        return ApiResponse.badRequest(
          'Payment methods are limited to 20 entries of 40 characters each',
        );
      }
      body.paymentMethods = cleaned;
    }

    const settings = await getSettings();

    // Store old values for activity log
    const settingsDoc = settings as Document<unknown, unknown, ISettings> & ISettings;
    const oldSettings = settingsDoc ? { ...settingsDoc.toObject() } : {};

    // Update settings
    Object.assign(settings, body);
    settingsDoc.updatedBy = session.user.id;
    await settingsDoc.save();

    // Log activity
    const changes: Record<string, unknown> = {};
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
