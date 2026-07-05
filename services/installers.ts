import { HydratedDocument } from "mongoose";
import Installer, { IInstaller } from "@/models/Installer";
import InstallerReward from "@/models/InstallerReward";
import {
  RegisterInstallerInput,
  UpdateInstallerInput,
} from "@/lib/validation";
import { getSettings } from "@/models/Settings";
import {
  createGoogleContact,
  updateGoogleContact,
  deleteGoogleContact,
} from "@/lib/googleContacts";
import {
  findInstallerByIdOrCode,
  INSTALLER_POPULATE_OPTIONS,
  prepareInstallerContactData,
} from "@/lib/installerUtils";
import { logActivity, getChanges } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { getClientInfo } from "@/lib/requestUtils";

/**
 * Business-rule failure raised by installer orchestration. Route handlers map
 * this to an HTTP response; everything else bubbles up to handleApiError.
 */
export class InstallerServiceError extends Error {
  constructor(message: string, public readonly status: 400 | 404) {
    super(message);
    this.name = "InstallerServiceError";
  }
}

/** Actor context for auditable mutations. */
export interface InstallerActor {
  userId: string;
  clientInfo: ReturnType<typeof getClientInfo>;
}

/**
 * Verify a referrer code exists and has not exhausted its referral quota.
 * Throws InstallerServiceError (400) otherwise.
 */
async function assertReferrerWithinLimit(referrerCode: string): Promise<void> {
  const referrer = await Installer.findOne({ installerCode: referrerCode });
  if (!referrer) {
    throw new InstallerServiceError("Invalid referrer code", 400);
  }

  const referralCount = await Installer.countDocuments({
    referrer: referrer._id,
  });
  const { maxReferralsPerInstaller } = await getSettings();
  if (referralCount >= maxReferralsPerInstaller) {
    throw new InstallerServiceError(
      `Referrer has already referred maximum (${maxReferralsPerInstaller}) installers`,
      400
    );
  }
}

/**
 * Create the installer's Google Contact and persist the returned id.
 * Fire-and-forget: contact-sync failures are logged, never fatal.
 */
async function createGoogleContactForInstaller(
  installer: HydratedDocument<IInstaller>
): Promise<void> {
  try {
    const googleContactId = await createGoogleContact(
      prepareInstallerContactData(installer)
    );

    if (googleContactId) {
      installer.googleContactId = googleContactId;
      await installer.save();
      console.log("✓ Google contact created:", googleContactId);
    } else {
      console.warn("⚠ Google contact creation returned null");
    }
  } catch (error) {
    console.error("✗ Failed to create Google contact:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
    }
  }
}

/**
 * Keep the installer's Google Contact in sync after an update, creating one if
 * it does not yet exist. Non-fatal by design.
 */
async function syncGoogleContactOnUpdate(
  installer: HydratedDocument<IInstaller>
): Promise<void> {
  if (!installer.googleContactId) {
    await createGoogleContactForInstaller(installer);
    return;
  }

  try {
    await updateGoogleContact(
      installer.googleContactId,
      prepareInstallerContactData(installer)
    );
    console.log("✓ Google contact updated successfully");
  } catch (error) {
    console.error("Failed to update Google contact:", error);
  }
}

/**
 * Register a new installer: enforce referral rules, persist, sync to Google
 * Contacts, and return the fully populated document.
 */
export async function createInstaller(
  input: RegisterInstallerInput,
  registeredById: string
): Promise<HydratedDocument<IInstaller> | null> {
  if (input.referrerCode) {
    await assertReferrerWithinLimit(input.referrerCode);
  }

  const installer = await Installer.create({
    ...input,
    registeredBy: registeredById,
  });

  await createGoogleContactForInstaller(installer);

  return findInstallerByIdOrCode(
    String(installer._id),
    INSTALLER_POPULATE_OPTIONS.full
  );
}

/**
 * Update an existing installer: enforce referral rules, persist changes, write
 * an activity log entry, sync Google Contacts, and return the populated doc.
 * Throws InstallerServiceError(404) when the installer is not found.
 */
export async function updateInstaller(
  idOrCode: string,
  input: UpdateInstallerInput,
  actor: InstallerActor
): Promise<HydratedDocument<IInstaller> | null> {
  const installer = await findInstallerByIdOrCode(idOrCode);
  if (!installer) {
    throw new InstallerServiceError("Installer not found", 404);
  }

  const originalData = installer.toObject() as unknown as Record<
    string,
    unknown
  >;

  if (input.referrerCode && input.referrerCode !== installer.referrerCode) {
    await assertReferrerWithinLimit(input.referrerCode);
  }

  Object.assign(installer, input);
  await installer.save();

  const changes = getChanges(originalData, input);
  const changedFields = Object.keys(changes);
  if (changedFields.length > 0) {
    await logActivity({
      type: ActivityType.INSTALLER_UPDATED,
      performedBy: actor.userId,
      targetType: "Installer",
      targetId: installer._id,
      targetName: installer.fullName,
      description: `Updated installer ${installer.installerCode} (${
        installer.fullName
      }): ${changedFields.join(", ")}`,
      metadata: { changes },
      ...actor.clientInfo,
    });
  }

  await syncGoogleContactOnUpdate(installer);

  return findInstallerByIdOrCode(
    String(installer._id),
    INSTALLER_POPULATE_OPTIONS.full
  );
}

/**
 * Delete an installer after guarding against existing rewards, removing its
 * Google Contact as a side effect. Throws InstallerServiceError on 404 / when
 * rewards still reference it.
 */
export async function deleteInstaller(idOrCode: string): Promise<void> {
  const installer = await findInstallerByIdOrCode(idOrCode);
  if (!installer) {
    throw new InstallerServiceError("Installer not found", 404);
  }

  const rewardCount = await InstallerReward.countDocuments({
    installer: installer._id,
  });
  if (rewardCount > 0) {
    throw new InstallerServiceError(
      "Cannot delete installer with existing rewards. Please delete rewards first.",
      400
    );
  }

  if (installer.googleContactId) {
    try {
      console.log(
        `Attempting to delete Google contact: ${installer.googleContactId}`
      );
      const deleted = await deleteGoogleContact(installer.googleContactId);
      if (deleted) {
        console.log(
          `Successfully deleted Google contact for installer: ${installer.installerCode}`
        );
      }
    } catch (error) {
      console.error(
        `Error deleting Google contact for installer ${installer.installerCode}:`,
        error
      );
    }
  }

  await installer.deleteOne();
}
