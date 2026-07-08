import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { findInstallerByIdOrCode } from "@/lib/installerUtils";
import { regenerateAndSendPin } from "@/services/installers";

// POST - Regenerate installer PIN and send it via WhatsApp (free-form only).
// Also clears any failed-attempt lockout (doubles as manual unlock).
// Returns the plain-text PIN and deliveryMethod so the team member knows
// if the PIN was delivered or if the 24h window has expired.
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const installer = await findInstallerByIdOrCode(id);
      if (!installer) {
        return ApiResponse.notFound("Installer not found");
      }

      const { whatsappSent, error, plainPin, deliveryMethod, whatsappMessage, whatsappUrl } =
        await regenerateAndSendPin(installer, session.user.id);

      if (!whatsappSent && !whatsappMessage) {
        return ApiResponse.error(
          error || "Failed to send PIN via WhatsApp",
          502
        );
      }

      return ApiResponse.success(
        { pin: plainPin, deliveryMethod, whatsappMessage, whatsappUrl },
        deliveryMethod === "free-form"
          ? "New PIN sent via WhatsApp"
          : deliveryMethod === "blocked"
            ? "New PIN generated — WhatsApp window expired, share manually"
            : "New PIN generated — share manually via WhatsApp"
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
