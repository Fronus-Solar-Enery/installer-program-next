import mongoose, { HydratedDocument } from "mongoose";
import Installer, { IInstaller } from "@/models/Installer";
import { ContactData } from "@/lib/googleContacts";

/**
 * Options for populating installer relationships
 */
export const INSTALLER_POPULATE_OPTIONS = {
  /** Basic population - just the essentials */
  basic: {
    referrer: "installerCode fullName",
    registeredBy: "name email",
  },
  /** Full population - includes role for registeredBy */
  full: {
    referrer: "installerCode fullName",
    registeredBy: "name email role",
  },
} as const;

type PopulateOptions =
  (typeof INSTALLER_POPULATE_OPTIONS)[keyof typeof INSTALLER_POPULATE_OPTIONS];

/**
 * Find an installer by either MongoDB ObjectId or installer code
 * @param idOrCode - The MongoDB ObjectId or installer code to search for
 * @param populateOptions - Optional population configuration
 * @returns The installer document or null if not found
 */
export async function findInstallerByIdOrCode(
  idOrCode: string,
  populateOptions?: PopulateOptions
): Promise<HydratedDocument<IInstaller> | null> {
  let query;

  // Check if the input is a valid MongoDB ObjectId
  if (mongoose.Types.ObjectId.isValid(idOrCode)) {
    query = Installer.findById(idOrCode);
  } else {
    // Otherwise, search by installer code (case-insensitive)
    query = Installer.findOne({
      installerCode: idOrCode.toUpperCase(),
    });
  }

  // Apply population if options are provided
  if (populateOptions) {
    query = query
      .populate("referrer", populateOptions.referrer)
      .populate("registeredBy", populateOptions.registeredBy);
  }

  return query.exec();
}

/**
 * Prepare contact data from an installer document for Google Contacts API
 * @param installer - The installer document
 * @returns ContactData object ready for Google Contacts operations
 */
export function prepareInstallerContactData(
  installer: HydratedDocument<IInstaller>
): ContactData {
  return {
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
  };
}
