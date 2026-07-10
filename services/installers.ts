import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { HydratedDocument } from "mongoose";
import Installer, { IInstaller } from "@/models/Installer";
import {
  sendInstallerRegistrationMessage,
  formatInstallerWhatsAppMessage,
  type DeliveryMethod,
} from "@/lib/whatsappService";
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
import { encryptSecret } from "@/lib/encryption";
import { logger } from "@/lib/logger";

/**
 * Single source of truth for persisting a PIN: bcrypt hash for verification,
 * plus a best-effort AES-256-GCM ciphertext so ADMIN/MANAGER can reveal it.
 * Every PIN write MUST go through here so the encrypted copy never drifts from
 * the hash (a stale copy would reveal an old, wrong PIN). Encryption is
 * best-effort: with no/invalid TOKEN_ENCRYPTION_KEY the PIN still works via the
 * hash and reveal simply reports "unavailable" — registration never breaks.
 */
export async function setInstallerPin(
  installer: HydratedDocument<IInstaller>,
  plainPin: string
): Promise<void> {
  installer.pin = await bcrypt.hash(plainPin, 10);
  try {
    installer.pinEncrypted = process.env.TOKEN_ENCRYPTION_KEY
      ? encryptSecret(plainPin)
      : undefined;
  } catch (error) {
    // Key misconfigured — clear any stale ciphertext, keep the hash working.
    installer.pinEncrypted = undefined;
    logger.warn("PIN encryption skipped — reveal will be unavailable", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

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
 * Generate a fresh 6-digit PIN for an installer, store its bcrypt hash, and
 * deliver the plain-text PIN to the installer via WhatsApp. The plain PIN is
 * never returned to callers — WhatsApp is the only delivery channel.
 * Also clears any lockout state (covers manual unlock / reset).
 */
export async function regenerateAndSendPin(
  installer: HydratedDocument<IInstaller>,
  performedById: string
): Promise<{
  whatsappSent: boolean;
  error?: string;
  plainPin: string;
  deliveryMethod?: DeliveryMethod;
  whatsappMessage?: string;
  whatsappUrl?: string;
}> {
  const plainPin = randomInt(0, 1_000_000).toString().padStart(6, "0");

  await setInstallerPin(installer, plainPin);
  installer.lastPinChangeAt = new Date();
  installer.pinAttempts = 0;
  installer.pinLockedUntil = undefined;
  await installer.save();

  const settings = await getSettings();

  if (!settings.enableWhatsAppNotifications) {
    const { text, whatsappUrl } = formatInstallerWhatsAppMessage({
      fullName: installer.fullName,
      installerCode: installer.installerCode,
      pin: plainPin,
      whatsappNumber: installer.whatsappNumber,
    });
    return {
      whatsappSent: false,
      error: "WhatsApp auto-send is disabled",
      plainPin,
      deliveryMethod: "blocked",
      whatsappMessage: text,
      whatsappUrl,
    };
  }

  const result = await sendInstallerRegistrationMessage(
    {
      fullName: installer.fullName,
      whatsappNumber: installer.whatsappNumber,
      installerCode: installer.installerCode,
      pin: plainPin,
    },
    performedById
  );

  // If free-form delivery failed, generate manual fallback
  if (!result.success) {
    const { text, whatsappUrl } = formatInstallerWhatsAppMessage({
      fullName: installer.fullName,
      installerCode: installer.installerCode,
      pin: plainPin,
      whatsappNumber: installer.whatsappNumber,
    });
    return {
      whatsappSent: false,
      error: result.error,
      plainPin,
      deliveryMethod: result.deliveryMethod,
      whatsappMessage: text,
      whatsappUrl,
    };
  }

  return {
    whatsappSent: true,
    plainPin,
    deliveryMethod: result.deliveryMethod,
  };
}

/**
 * Register a new installer: enforce referral rules, persist, sync to Google
 * Contacts, generate + deliver a login PIN via WhatsApp, and return the fully
 * populated document plus whether PIN delivery succeeded.
 */
export async function createInstaller(
  input: RegisterInstallerInput,
  registeredById: string
): Promise<{
  installer: HydratedDocument<IInstaller> | null;
  whatsappFailed: boolean;
  plainPin: string;
  deliveryMethod?: DeliveryMethod;
  whatsappMessage?: string;
  whatsappUrl?: string;
}> {
  if (input.referrerCode) {
    await assertReferrerWithinLimit(input.referrerCode);
  }

  const installer = await Installer.create({
    ...input,
    registeredBy: registeredById,
  });

  await createGoogleContactForInstaller(installer);

  const { whatsappSent, plainPin, whatsappMessage, whatsappUrl, deliveryMethod } =
    await regenerateAndSendPin(installer, registeredById);

  return {
    installer: await findInstallerByIdOrCode(
      String(installer._id),
      INSTALLER_POPULATE_OPTIONS.full
    ),
    whatsappFailed: !whatsappSent,
    plainPin,
    deliveryMethod,
    whatsappMessage,
    whatsappUrl,
  };
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
