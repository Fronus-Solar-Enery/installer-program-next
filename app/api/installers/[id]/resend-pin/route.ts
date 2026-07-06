import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { findInstallerByIdOrCode } from "@/lib/installerUtils";
import { regenerateAndSendPin } from "@/services/installers";

// POST - Regenerate installer PIN and re-send it via WhatsApp.
// Also clears any failed-attempt lockout (doubles as manual unlock).
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const installer = await findInstallerByIdOrCode(id);
      if (!installer) {
        return ApiResponse.notFound("Installer not found");
      }

      const { whatsappSent, error } = await regenerateAndSendPin(
        installer,
        session.user.id
      );

      if (!whatsappSent) {
        return ApiResponse.error(
          error || "Failed to send PIN via WhatsApp",
          502
        );
      }

      return ApiResponse.success(null, "New PIN sent via WhatsApp");
    } catch (error) {
      return handleApiError(error);
    }
  }
);
