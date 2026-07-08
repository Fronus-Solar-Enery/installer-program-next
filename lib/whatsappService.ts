/**
 * WhatsApp Service — Free-Form Only via Meta WhatsApp Cloud API.
 *
 * All messages are sent as free-form (service) messages within the 24-hour
 * customer service window. Templates are NOT used.
 *
 * Constraints:
 *   - Free-form messages ONLY work within 24h of the customer's last inbound message
 *   - Error code 131047 = window expired → message silently fails, no retry possible
 *   - Only customer messages reset the 24h timer — our replies do NOT extend it
 *   - ALL message types from the customer reset the window (text, image, video, etc.)
 *
 * Delivery cascade:
 *   1. Check if within 24h window
 *   2. If within window → send free-form with retry (up to 3 attempts)
 *   3. If outside window → block, return clear error for UI fallback
 *
 * Requires env vars:
 *   META_WHATSAPP_PHONE_NUMBER_ID  — Meta Business Suite → WhatsApp → Phone numbers
 *   META_WHATSAPP_ACCESS_TOKEN     — System user token with whatsapp_business_messaging
 */

import { logActivity } from "./activityLogger";
import { ActivityType } from "@/models/Activity";
import { getSettings } from "@/models/Settings";
import Installer from "@/models/Installer";
import { logger } from "./logger";
import { normalizePhone } from "./phoneUtils";

const GRAPH_API_VERSION = "v22.0";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const MAX_RETRY_ATTEMPTS = 3;

export type DeliveryMethod = "free-form" | "blocked";

interface WhatsAppMessage {
  phoneNumber: string;
  freeFormText: string;
  performedBy?: string;
}

interface SendResult {
  success: boolean;
  error?: string;
  deliveryMethod?: DeliveryMethod;
}

// ─── Window helpers ──────────────────────────────────────────────────────────

/**
 * Check if a timestamp is within the last 24 hours.
 */
export function isWithin24hWindow(timestamp: Date | undefined): boolean {
  if (!timestamp) return false;
  return Date.now() - timestamp.getTime() < TWENTY_FOUR_HOURS_MS;
}

/**
 * Compute minutes remaining in the 24h window.
 * Returns negative number if window has expired.
 */
export function getMinutesRemaining(lastCustomerMessageAt: Date | undefined): number {
  if (!lastCustomerMessageAt) return -1;
  const expiresAt = lastCustomerMessageAt.getTime() + TWENTY_FOUR_HOURS_MS;
  return Math.floor((expiresAt - Date.now()) / (60 * 1000));
}

// ─── Core send ───────────────────────────────────────────────────────────────

/**
 * Send a free-form (service) text message via Meta Cloud API.
 * Only works within the 24h customer service window.
 * Returns parsed error codes for caller-specific handling.
 */
async function sendFreeFormMessage(
  to: string,
  text: string,
  accessToken: string,
  phoneNumberId: string
): Promise<{ success: boolean; error?: string; errorCode?: number }> {
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    const errorObj = body?.error as Record<string, unknown> | undefined;
    const errorCode = errorObj?.code as number | undefined;
    const errorMessage = (errorObj?.message as string) || response.statusText;

    return {
      success: false,
      error: `WhatsApp API error ${response.status}: ${errorMessage}`,
      errorCode,
    };
  }

  return { success: true };
}

// ─── Main send function ──────────────────────────────────────────────────────

/**
 * Send a WhatsApp free-form message via Meta Cloud API.
 *
 * 1. Validates the 24h window is open (checks DB, not cached)
 * 2. Sends free-form text with retry (exponential backoff)
 * 3. Re-validates window between retries (catches mid-send expiry)
 * 4. Returns deliveryMethod so callers can show appropriate UI
 */
export async function sendWhatsAppMessage({
  phoneNumber,
  freeFormText,
  performedBy,
}: WhatsAppMessage): Promise<SendResult> {
  try {
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      logger.warn(
        "WhatsApp notifications disabled: META_WHATSAPP_PHONE_NUMBER_ID / META_WHATSAPP_ACCESS_TOKEN not set"
      );
      return { success: false, error: "WhatsApp service not configured" };
    }

    const settings = await getSettings();
    if (!settings.enableWhatsAppNotifications) {
      return { success: false, error: "WhatsApp notifications disabled in settings" };
    }

    const to = normalizePhone(phoneNumber);

    logger.debug("WhatsApp sendWhatsAppMessage — looking up installer", {
      phoneNumber,
      normalized: to,
    });

    // Fetch installer's last message timestamp — always from DB, never cached.
    // Query both with and without '+' prefix since DB storage format varies.
    const installer = await Installer.findOne({
      $or: [
        { whatsappNumber: to },
        { whatsappNumber: `+${to}` },
      ],
    }).select("lastCustomerMessageAt");

    logger.debug("WhatsApp installer lookup result", {
      phoneNumber,
      found: !!installer,
      lastCustomerMessageAt: installer?.lastCustomerMessageAt,
    });

    const lastMessageAt = installer?.lastCustomerMessageAt;

    // ── Gate: is the 24h window open? ──
    if (!isWithin24hWindow(lastMessageAt)) {
      const minutesExpired = lastMessageAt
        ? Math.abs(getMinutesRemaining(lastMessageAt))
        : null;

      logger.warn("WhatsApp free-form blocked — window expired", {
        phoneNumber,
        lastMessageAt,
        minutesExpired,
      });

      if (performedBy) {
        await logActivity({
          type: ActivityType.WHATSAPP_FAILED,
          performedBy,
          targetType: "Installer",
          targetId: performedBy,
          description: `WhatsApp message blocked — 24h window expired for ${phoneNumber}`,
          metadata: {
            whatsappNumber: phoneNumber,
            mode: "blocked",
            reason: "window_expired",
            lastCustomerMessageAt: lastMessageAt?.toISOString(),
            minutesExpired,
          },
        });
      }

      return {
        success: false,
        error: "The 24-hour WhatsApp window has expired. Ask the installer to send a message to reopen the window.",
        deliveryMethod: "blocked",
      };
    }

    // ── Within window — send with retry ──
    const minutesRemaining = getMinutesRemaining(lastMessageAt);
    logger.info("WhatsApp free-form send — window open", {
      phoneNumber,
      minutesRemaining,
    });

    let lastError: string | undefined;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const result = await sendFreeFormMessage(to, freeFormText, accessToken, phoneNumberId);

        if (result.success) {
          if (performedBy) {
            await logActivity({
              type: ActivityType.WHATSAPP_FREE_FORM_SENT,
              performedBy,
              targetType: "Installer",
              targetId: performedBy,
              description: `WhatsApp free-form message sent to ${phoneNumber}`,
              metadata: {
                whatsappNumber: phoneNumber,
                mode: "free-form",
                attempt,
                minutesRemaining,
              },
            });
          }
          return { success: true, deliveryMethod: "free-form" };
        }

        // Meta error 131047 = outside 24h window — no retry possible
        if (result.errorCode === 131047) {
          logger.warn("WhatsApp free-form rejected — Meta error 131047 (window expired)", {
            phoneNumber,
            attempt,
          });

          if (performedBy) {
            await logActivity({
              type: ActivityType.WHATSAPP_FAILED,
              performedBy,
              targetType: "Installer",
              targetId: performedBy,
              description: `WhatsApp message blocked — 24h window expired (Meta 131047) for ${phoneNumber}`,
              metadata: {
                whatsappNumber: phoneNumber,
                mode: "blocked",
                reason: "meta_131047",
                attempt,
              },
            });
          }

          return {
            success: false,
            error: "The 24-hour WhatsApp window has expired. Ask the installer to send a message to reopen the window.",
            deliveryMethod: "blocked",
          };
        }

        lastError = result.error;

        // Exponential backoff between retries
        if (attempt < MAX_RETRY_ATTEMPTS) {
          const backoffMs = attempt * 1000;
          await new Promise((r) => setTimeout(r, backoffMs));

          // Re-validate window before next attempt
          const freshInstaller = await Installer.findOne({
            $or: [
              { whatsappNumber: to },
              { whatsappNumber: `+${to}` },
            ],
          }).select("lastCustomerMessageAt");

          if (!isWithin24hWindow(freshInstaller?.lastCustomerMessageAt)) {
            logger.warn("WhatsApp window expired during retry backoff", { phoneNumber });
            return {
              success: false,
              error: "The 24-hour WhatsApp window expired during retry.",
              deliveryMethod: "blocked",
            };
          }
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error";
        logger.error("WhatsApp free-form send attempt failed", {
          phoneNumber,
          attempt,
          error: lastError,
        });

        if (attempt < MAX_RETRY_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
        }
      }
    }

    // All retries exhausted
    if (performedBy) {
      await logActivity({
        type: ActivityType.WHATSAPP_FAILED,
        performedBy,
        targetType: "Installer",
        targetId: performedBy,
        description: `Failed to send WhatsApp message to ${phoneNumber} after ${MAX_RETRY_ATTEMPTS} attempts`,
        metadata: {
          whatsappNumber: phoneNumber,
          mode: "free-form",
          errorMessage: lastError,
        },
      });
    }

    return { success: false, error: lastError, deliveryMethod: "blocked" };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to send WhatsApp message", { error: errorMessage });

    if (performedBy) {
      await logActivity({
        type: ActivityType.WHATSAPP_FAILED,
        performedBy,
        targetType: "Installer",
        targetId: performedBy,
        description: `Failed to send WhatsApp message to ${phoneNumber}`,
        metadata: {
          whatsappNumber: phoneNumber,
          errorMessage,
        },
      });
    }

    return { success: false, error: errorMessage };
  }
}

// ─── Manual fallback ─────────────────────────────────────────────────────────

/**
 * Format a WhatsApp message with installer credentials for manual sharing.
 * Used when auto-send is disabled or the 24h window has expired.
 * Returns the text and a wa.me deep link the team member can tap.
 */
export function formatInstallerWhatsAppMessage(
  installerCode: string,
  pin: string,
  whatsappNumber?: string
): { text: string; whatsappUrl: string } {
  const text = [
    "Your Fronus Installer account is active.",
    "",
    `Installer Code: ${installerCode}`,
    `Login PIN: ${pin}`,
    "",
    "Please save this information to log in at https://installer.fronus.com",
  ].join("\n");

  const normalizedNumber = whatsappNumber
    ? normalizePhone(whatsappNumber)
    : undefined;

  const whatsappUrl = normalizedNumber
    ? `https://wa.me/${normalizedNumber}?text=${encodeURIComponent(text)}`
    : "";

  return { text, whatsappUrl };
}

// ─── High-level send functions ───────────────────────────────────────────────

/**
 * Send installer registration credentials (account active + code + PIN).
 * Free-form only — requires open 24h customer service window.
 */
export async function sendInstallerRegistrationMessage(
  installer: {
    fullName: string;
    whatsappNumber: string;
    installerCode: string;
    pin?: string;
  },
  performedBy: string
): Promise<SendResult> {
  const pin = installer.pin ?? "-";
  const freeFormText = [
    `Hi ${installer.fullName},`,
    "",
    "Your Fronus Installer account is active.",
    "",
    `Installer Code: ${installer.installerCode}`,
    `Login PIN: ${pin}`,
    "",
    "Login at https://installer.fronus.com",
    "Keep your PIN private — do not share it.",
  ].join("\n");

  return sendWhatsAppMessage({
    phoneNumber: installer.whatsappNumber,
    freeFormText,
    performedBy,
  });
}

/**
 * Send reward payment processed notification.
 * Free-form only — requires open 24h customer service window.
 */
export async function sendRewardPaymentMessage(
  reward: {
    installer: {
      fullName: string;
      whatsappNumber: string;
    };
    serialNumber: string;
    productModel: string;
    rewardAmount: number;
    transactionId?: string;
    sendingDate?: Date;
  },
  performedBy: string
): Promise<SendResult> {
  const amount = `Rs. ${reward.rewardAmount.toLocaleString()}`;
  const freeFormText = [
    `Hi ${reward.installer.fullName},`,
    "",
    `Payment processed for ${reward.productModel} (${reward.serialNumber}).`,
    `Amount: ${amount}.`,
    "",
    "Check your account for details.",
  ].join("\n");

  return sendWhatsAppMessage({
    phoneNumber: reward.installer.whatsappNumber,
    freeFormText,
    performedBy,
  });
}

/**
 * Send referral reward processed notification to the referrer.
 * Free-form only — requires open 24h customer service window.
 */
export async function sendReferralRewardMessage(
  referrer: {
    fullName: string;
    whatsappNumber: string;
  },
  referred: {
    fullName: string;
    installerCode: string;
  },
  rewardAmount: number,
  performedBy: string
): Promise<SendResult> {
  const amount = `Rs. ${rewardAmount.toLocaleString()}`;
  const referredInfo = `${referred.fullName} (${referred.installerCode})`;
  const freeFormText = [
    `Hi ${referrer.fullName},`,
    "",
    `Referral reward for referring ${referredInfo}.`,
    `Amount: ${amount}.`,
    "",
    "Check your account for details.",
  ].join("\n");

  return sendWhatsAppMessage({
    phoneNumber: referrer.whatsappNumber,
    freeFormText,
    performedBy,
  });
}
