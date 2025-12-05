import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Installer, { IInstaller } from "@/models/Installer";
import { registerInstallerSchema } from "@/lib/validation";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { createGoogleContact } from "@/lib/googleContacts";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { validateBody, getSearchParams } from "@/lib/validateRequest";
import { QueryBuilder, parseSortParams } from "@/lib/queryBuilder";
import { getPaginationParams, createPaginationMeta } from "@/lib/pagination";
import { BUSINESS_RULES } from "@/lib/constants";

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
      // Validate request body
      const validation = await validateBody(request, registerInstallerSchema);
      if (!validation.success) return validation.response;
      const validatedData = validation.data;

      await dbConnect();

      // Validate referrer code if provided
      if (validatedData.referrerCode) {
        const referrer = await Installer.findOne({
          installerCode: validatedData.referrerCode,
        });
        if (!referrer) {
          return ApiResponse.error("Invalid referrer code", 400);
        }

        // Check if referrer has already referred maximum installers
        const referralCount = await Installer.countDocuments({
          referrer: referrer._id,
        });
        if (referralCount >= BUSINESS_RULES.MAX_REFERRALS_PER_INSTALLER) {
          return ApiResponse.error(
            `Referrer has already referred maximum (${BUSINESS_RULES.MAX_REFERRALS_PER_INSTALLER}) installers`,
            400
          );
        }
      }

      // Create installer
      const installer = await Installer.create({
        ...validatedData,
        registeredBy: session.user.id,
      });

      // Create Google Contact (using global authentication)
      let googleContactStatus = "not attempted";
      try {
        const googleContactId = await createGoogleContact({
          fullName: installer.fullName,
          phoneNumber: installer.phoneNumber,
          whatsappNumber: installer.whatsappNumber,
          address: installer.address,
          city: installer.city,
          province: installer.province,
          companyName: installer.companyName,
          installerCode: installer.installerCode,
          referrerCode: installer.referrerCode,
          cnic: installer.cnic,
          trainingCenter: installer.trainingCenter,
        });

        if (googleContactId) {
          installer.googleContactId = googleContactId;
          await installer.save();
          googleContactStatus = "success";
          console.log("✓ Google contact created:", googleContactId);
        } else {
          googleContactStatus = "failed - no ID returned";
          console.warn("⚠ Google contact creation returned null");
        }
      } catch (error) {
        googleContactStatus = "failed - error";
        console.error("✗ Failed to create Google contact:", error);
        if (error instanceof Error) {
          console.error("Error details:", error.message);
          console.error("Error stack:", error.stack);
        }
      }

      const populatedInstaller = await Installer.findById(installer._id)
        .populate("registeredBy", "name email role")
        .populate("referrer", "installerCode fullName");

      return ApiResponse.success(
        populatedInstaller,
        "Installer registered successfully",
        201
      );
    } catch (error) {
      return handleApiError(error);
    }
  }
);
