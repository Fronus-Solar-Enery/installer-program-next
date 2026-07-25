import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import {
  syncInstallerGoogleContact,
  InstallerServiceError,
} from "@/services/installers";
import { GoogleContactError } from "@/lib/googleContacts";
import { getClientInfo } from "@/lib/requestUtils";

// POST - Create (or re-sync) this installer's Google Contact. Used by the
// detail page for records that have no googleContactId yet.
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const installer = await syncInstallerGoogleContact(id, {
        userId: session.user.id,
        clientInfo: getClientInfo(request),
      });

      return ApiResponse.success(
        installer,
        "Google contact created successfully",
      );
    } catch (error) {
      if (error instanceof InstallerServiceError) {
        return error.status === 404
          ? ApiResponse.notFound(error.message)
          : ApiResponse.badRequest(error.message);
      }
      if (error instanceof GoogleContactError) {
        return ApiResponse.error(
          error.message,
          error.reason === "not_authenticated" ? 409 : 502,
          { contactSync: { failed: true, reason: error.reason } },
        );
      }
      return handleApiError(error);
    }
  },
);
