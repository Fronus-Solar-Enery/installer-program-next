import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Installer, { IInstaller } from "@/models/Installer";
import { registerInstallerSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody, getSearchParams } from "@/lib/validateRequest";
import { QueryBuilder, parseSortParams } from "@/lib/queryBuilder";
import { getPaginationParams, createPaginationMeta } from "@/lib/pagination";
import { createInstaller, InstallerServiceError } from "@/services/installers";

// GET all installers with filtering
export const GET = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const params = getSearchParams(request);
      const { page, limit, skip } = getPaginationParams(params.raw, {
        maxLimit: 10000, // Allow fetching all installers for dashboard stats
      });
      const { field: sortBy, order: sortOrder } = parseSortParams(params.raw);

      // Build query using QueryBuilder
      const query = new QueryBuilder<IInstaller>()
        .search(
          ["installerCode", "fullName", "cnic", "phoneNumber"],
          params.getString("search")
        )
        .filter("city", params.getString("city"), { regex: true })
        .filter("province", params.getString("province"), { regex: true })
        .boolean("certified", params.getString("certified"))
        .ref("registeredBy", params.getString("registeredBy"))
        .build();

      const [installers, total] = await Promise.all([
        Installer.find(query)
          .populate("registeredBy", "name email role")
          .populate("referrer", "installerCode fullName")
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(limit),
        Installer.countDocuments(query),
      ]);

      return ApiResponse.success({
        installers,
        pagination: createPaginationMeta(total, page, limit),
      });
    } catch (error) {
      return handleApiError(error);
    }
  }
);

// POST - Register new installer
export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      const validation = await validateBody(request, registerInstallerSchema);
      if (!validation.success) return validation.response;

      await dbConnect();

      const installer = await createInstaller(
        validation.data,
        session.user.id
      );

      return ApiResponse.success(
        installer,
        "Installer registered successfully",
        201
      );
    } catch (error) {
      if (error instanceof InstallerServiceError) {
        return ApiResponse.error(error.message, error.status);
      }
      return handleApiError(error);
    }
  }
);
