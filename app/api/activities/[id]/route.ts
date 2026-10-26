import { NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import dbConnect from "@/lib/mongodb";
import Activity from "@/models/Activity";
import { TeamRole } from "@/models/TeamMember";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { logger } from "@/lib/logger";

// DELETE activity (permanent, ADMIN only). Not itself logged as an activity —
// that would recreate a row for every removal — so it goes to the server log.
export const DELETE = withAuth(
  async (_request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      if (!isValidObjectId(id)) {
        return ApiResponse.badRequest("Invalid activity id");
      }

      const activity = await Activity.findByIdAndDelete(id);
      if (!activity) {
        return ApiResponse.notFound("Activity not found");
      }

      logger.info("Activity deleted", {
        activityId: id,
        type: activity.type,
        deletedBy: session.user.id,
      });

      return ApiResponse.success({ id }, "Activity deleted");
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN] }
);
