import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { TeamRole } from "@/models/TeamMember";
import { getAccountHealth, unsuspendInstaller } from "@/lib/warnings";

// GET - account health (active warnings + suspension) for one installer
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const installer = await Installer.findById(id).select("fullName").lean();
      if (!installer) {
        return ApiResponse.notFound("Installer not found");
      }

      return ApiResponse.success(await getAccountHealth(id));
    } catch (error) {
      return handleApiError(error);
    }
  },
);

// POST - lift a suspension. ADMIN only, and clears the active warnings with it
// so the installer restarts at zero rather than one warning from re-suspension.
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const installer = await Installer.findById(id)
        .select("fullName suspendedAt")
        .lean();

      if (!installer) {
        return ApiResponse.notFound("Installer not found");
      }
      if (!installer.suspendedAt) {
        return ApiResponse.badRequest("Installer is not suspended");
      }

      let note: string | undefined;
      try {
        const body = await request.json();
        note = typeof body?.note === "string" ? body.note.trim() : undefined;
      } catch {
        // Body is optional — an unsuspend with no note is fine.
      }

      await unsuspendInstaller(id, session.user.id, installer.fullName, note);

      return ApiResponse.success(
        await getAccountHealth(id),
        "Installer unsuspended and warnings cleared",
      );
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN] },
);
