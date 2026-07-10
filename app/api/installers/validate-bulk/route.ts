import { NextRequest } from "next/server";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import { ApiResponse, handleApiError } from "@/lib/apiResponse";
import { withAuth, type RouteContext, type AuthSession } from "@/lib/authGuard";
import { CITY_TO_DISTRICT, DISTRICT_CODES } from "@/lib/constants";
import { BatchDuplicateTracker } from "@/lib/bulkValidation";

interface InstallerUpload {
  installerCode: string;
  fullName: string;
  referrerCode?: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  province: string;
  companyName?: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  certified: boolean;
  issues: string[];
  isValid: boolean;
}

export const POST = withAuth(
  async (request: NextRequest, context: RouteContext, session: AuthSession) => {
    try {
      await dbConnect();

      const { installers } = await request.json();

      if (
        !installers ||
        !Array.isArray(installers) ||
        installers.length === 0
      ) {
        return ApiResponse.badRequest("No installers provided");
      }

      // Fetch all existing installer codes and CNICs for validation
      const existingInstallers = await Installer.find(
        {},
        { installerCode: 1, cnic: 1, _id: 0 }
      ).lean();

      const existingCodes = new Set(
        existingInstallers.map((i: { installerCode: string; cnic: string }) =>
          i.installerCode.toUpperCase()
        )
      );
      const existingCNICs = new Set(
        existingInstallers.map(
          (i: { installerCode: string; cnic: string }) => i.cnic
        )
      );

      // Get all unique referrer codes from uploaded data
      const referrerCodes = new Set(
        installers
          .map((i: InstallerUpload) => i.referrerCode)
          .filter((code): code is string => !!code)
          .map((code) => code.toUpperCase())
      );

      // Fetch valid referrer codes from database
      const validReferrers = await Installer.find(
        { installerCode: { $in: Array.from(referrerCodes) } },
        { installerCode: 1, _id: 0 }
      ).lean();

      const validReferrerCodes = new Set(
        validReferrers.map((r: { installerCode: string }) =>
          r.installerCode.toUpperCase()
        )
      );

      // Track codes and CNICs in the current upload batch for duplicate detection
      const codesInBatch = new BatchDuplicateTracker();
      const cnicsInBatch = new BatchDuplicateTracker();

      // Validate each installer
      const validatedInstallers: InstallerUpload[] = installers.map(
        (installer: InstallerUpload, index: number) => {
          const newIssues: string[] = [...installer.issues];
          const code = installer.installerCode.toUpperCase();
          const cnic = installer.cnic;

          // Check for duplicate installer code in database
          if (existingCodes.has(code)) {
            newIssues.push(
              `Installer code "${installer.installerCode}" already exists in database`
            );
          }

          // Check for duplicate installer code in the upload batch
          const dupCodeIssue = codesInBatch.check(
            code,
            index,
            "installer code"
          );
          if (dupCodeIssue) newIssues.push(dupCodeIssue);

          // Check installer code prefix matches the district derived from city
          const district = installer.city
            ? CITY_TO_DISTRICT[installer.city]
            : undefined;
          if (installer.city && !district) {
            newIssues.push(
              `Unrecognized city "${installer.city}": cannot determine district`
            );
          } else if (district) {
            const expectedPrefix = DISTRICT_CODES[district];
            if (!code.startsWith(expectedPrefix)) {
              newIssues.push(
                `Installer code must start with "${expectedPrefix}" for district "${district}" (city: ${installer.city})`
              );
            }
          }

          // Check for duplicate CNIC in database
          if (existingCNICs.has(cnic)) {
            newIssues.push(
              `CNIC "${installer.cnic}" already exists in database`
            );
          }

          // Check for duplicate CNIC in the upload batch
          const dupCnicIssue = cnicsInBatch.check(cnic, index, "CNIC");
          if (dupCnicIssue) newIssues.push(dupCnicIssue);

          // Validate referrer code if provided
          if (installer.referrerCode) {
            const refCode = installer.referrerCode.toUpperCase();

            // Check if referrer code matches installer's own code
            if (refCode === code) {
              newIssues.push(
                "Referrer code cannot be the same as installer code"
              );
            }
            // Check if referrer exists in database or in current batch
            else if (!validReferrerCodes.has(refCode)) {
              // Check if it's in the current batch and comes before this installer
              const refIndexInBatch = codesInBatch.indexOf(refCode);

              if (refIndexInBatch === undefined || refIndexInBatch > index) {
                newIssues.push(
                  `Referrer code "${installer.referrerCode}" does not exist (or comes after this entry in the batch)`
                );
              }
            }
          }

          return {
            ...installer,
            issues: newIssues,
            isValid: newIssues.length === 0,
          };
        }
      );

      const validCount = validatedInstallers.filter((i) => i.isValid).length;
      const invalidCount = validatedInstallers.filter((i) => !i.isValid).length;

      return ApiResponse.success({
        validatedInstallers,
        summary: {
          total: validatedInstallers.length,
          valid: validCount,
          invalid: invalidCount,
        },
      });
    } catch (error) {
      console.error("Validation error:", error);
      return handleApiError(error);
    }
  }
);
