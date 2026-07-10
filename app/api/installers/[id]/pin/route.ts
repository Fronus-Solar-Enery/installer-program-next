import { NextRequest } from "next/server";
import mongoose from "mongoose";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { TeamRole } from "@/models/TeamMember";
import { decryptSecret } from "@/lib/encryption";

// GET — reveal an installer's current PIN for ADMIN/MANAGER.
// Decrypts the AES-256-GCM copy on demand. Returns { pin: null } when no
// encrypted copy exists (installer registered before this feature, or the
// encryption key was unset at PIN-write time) — client shows "regenerate".
export const GET = withAuth(
  async (_request: NextRequest, context: RouteContext, _session: AuthSession) => {
    try {
      await dbConnect();

      const { id } = await context.params;
      const query = mongoose.Types.ObjectId.isValid(id)
        ? Installer.findById(id)
        : Installer.findOne({ installerCode: id.toUpperCase() });

      // pinEncrypted is select:false — pull it in explicitly for this one route.
      const installer = await query.select("+pinEncrypted").exec();
      if (!installer) {
        return ApiResponse.notFound("Installer not found");
      }

      if (!installer.pinEncrypted) {
        return ApiResponse.success({ pin: null });
      }

      return ApiResponse.success({ pin: decryptSecret(installer.pinEncrypted) });
    } catch (error) {
      return handleApiError(error);
    }
  },
  { roles: [TeamRole.ADMIN, TeamRole.MANAGER] }
);
