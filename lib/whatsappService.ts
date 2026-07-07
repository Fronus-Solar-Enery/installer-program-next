/**
 * WhatsApp Service using Meta WhatsApp Cloud API (official Graph API).
 *
 * Supports two sending modes:
 *   1. Template messages — pre-approved Utility templates (Meta review required)
 *   2. Free-form messages — plain text sent within 24h of customer's last message
 *
 * Hybrid mode (enableWhatsAppHybridMode setting):
 *   - Checks Installer.lastCustomerMessageAt to determine if within 24h window
 *   - If within window: sends free-form text (no template needed, free)
 *   - If outside window: sends template (requires Meta approval)
 *   - If template also fails: logs error but does not block the action
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

const GRAPH_API_VERSION = "v22.0";
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface WhatsAppMessage {
  phoneNumber: string;
  templateName: string;
  bodyParams: string[];
  freeFormText?: string; // Plain text for hybrid mode
  performedBy?: string;
}

/**
 * Check if a timestamp is within the last 24 hours.
 */
export function isWithin24hWindow(timestamp: Date | undefined): boolean {
  if (!timestamp) return false;
  return Date.now() - timestamp.getTime() < TWENTY_FOUR_HOURS_MS;
}

/**
 * Normalize a Pakistani phone number to Meta's expected format: digits only,
 * international prefix, no leading +. e.g. "0300-1234567" → "923001234567".
 */
export function normalizeWhatsAppNumber(phoneNumber: string): string {
  let digits = phoneNumber.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  return digits;
}

/**
 * Send a plain text (free-form) WhatsApp message via Meta Cloud API.
 * Only usable within 24h of customer's last message.
 */
async function sendFreeFormMessage(
  to: string,
  text: string,
  accessToken: string,
  phoneNumberId: string
): Promise<{ success: boolean; error?: string }> {
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
    const body = await response.text().catch(() => "");
    throw new Error(`WhatsApp API error ${response.status}: ${body || response.statusText}`);
  }

  return { success: true };
}

/**
 * Send a WhatsApp template message via Meta Cloud API.
 */
async function sendTemplateMessage(
  to: string,
  templateName: string,
  bodyParams: string[],
  accessToken: string,
  phoneNumberId: string
): Promise<{ success: boolean; error?: string }> {
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
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: bodyParams.length
            ? [
                {
                  type: "body",
                  parameters: bodyParams.map((text) => ({ type: "text", text })),
                },
              ]
            : undefined,
        },
      }),
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`WhatsApp API error ${response.status}: ${body || response.statusText}`);
  }

  return { success: true };
}

/**
 * Send a WhatsApp message via Meta Cloud API.
 * In hybrid mode: checks 24h window and sends free-form if within window.
 * Falls back to template if free-form fails or hybrid mode is off.
 */
export async function sendWhatsAppMessage({
  phoneNumber,
  templateName,
  bodyParams,
  freeFormText,
  performedBy,
}: WhatsAppMessage): Promise<{ success: boolean; error?: string }> {
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

    const to = normalizeWhatsAppNumber(phoneNumber);

    // Hybrid mode: try free-form first if within 24h window
    if (settings.enableWhatsAppHybridMode && freeFormText) {
      try {
        const installer = await Installer.findOne({
          $or: [
            { whatsappNumber: to },
            { whatsappNumber: `+${to}` },
          ],
        }).select("lastCustomerMessageAt");

        if (isWithin24hWindow(installer?.lastCustomerMessageAt)) {
          const result = await sendFreeFormMessage(to, freeFormText, accessToken, phoneNumberId);

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
              },
            });
          }

          return result;
        }
      } catch (freeFormError) {
        // Free-form failed — fall through to template
        logger.warn("Free-form message failed, falling back to template", {
          error: freeFormError instanceof Error ? freeFormError.message : "Unknown",
          phoneNumber,
        });
      }
    }

    // Template mode (default, or fallback)
    const result = await sendTemplateMessage(to, templateName, bodyParams, accessToken, phoneNumberId);

    if (performedBy) {
      await logActivity({
        type: ActivityType.WHATSAPP_SENT,
        performedBy,
        targetType: "Installer",
        targetId: performedBy,
        description: `WhatsApp template "${templateName}" sent to ${phoneNumber}`,
        metadata: {
          whatsappNumber: phoneNumber,
          templateName,
          mode: "template",
        },
      });
    }

    return result;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error("Failed to send WhatsApp message", { error: errorMessage, templateName });

    if (performedBy) {
      await logActivity({
        type: ActivityType.WHATSAPP_FAILED,
        performedBy,
        targetType: "Installer",
        targetId: performedBy,
        description: `Failed to send WhatsApp template "${templateName}" to ${phoneNumber}`,
        metadata: {
          whatsappNumber: phoneNumber,
          templateName,
          errorMessage,
        },
      });
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Send installer registration credentials (account active + code + PIN).
 * Template: installer_welcome — {{1}} name, {{2}} installer code, {{3}} PIN.
 */
export async function sendInstallerRegistrationMessage(
  installer: {
    fullName: string;
    whatsappNumber: string;
    installerCode: string;
    pin?: string;
  },
  performedBy: string
): Promise<{ success: boolean; error?: string }> {
  const pin = installer.pin ?? "-";
  return sendWhatsAppMessage({
    phoneNumber: installer.whatsappNumber,
    templateName: "installer_welcome",
    bodyParams: [installer.fullName, installer.installerCode, pin],
    freeFormText: `Your installer account is active. Name: ${installer.fullName}, Code: ${installer.installerCode}, PIN: ${pin}. Keep your PIN private.`,
    performedBy,
  });
}

/**
 * Send reward payment processed notification.
 * Template: reward_paid — {{1}} name, {{2}} product, {{3}} serial, {{4}} amount.
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
): Promise<{ success: boolean; error?: string }> {
  const amount = `Rs. ${reward.rewardAmount.toLocaleString()}`;
  return sendWhatsAppMessage({
    phoneNumber: reward.installer.whatsappNumber,
    templateName: "reward_paid",
    bodyParams: [
      reward.installer.fullName,
      reward.productModel,
      reward.serialNumber,
      amount,
    ],
    freeFormText: `Payment processed for ${reward.productModel} (${reward.serialNumber}). Amount: ${amount}. ${reward.installer.fullName}, check your account.`,
    performedBy,
  });
}

/**
 * Send referral reward processed notification to the referrer.
 * Template: referral_earned — {{1}} referrer name, {{2}} referred name (code), {{3}} amount.
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
): Promise<{ success: boolean; error?: string }> {
  const amount = `Rs. ${rewardAmount.toLocaleString()}`;
  const referredInfo = `${referred.fullName} (${referred.installerCode})`;
  return sendWhatsAppMessage({
    phoneNumber: referrer.whatsappNumber,
    templateName: "referral_earned",
    bodyParams: [referrer.fullName, referredInfo, amount],
    freeFormText: `Referral reward for ${referrer.fullName}. Referred: ${referredInfo}. Amount: ${amount}.`,
    performedBy,
  });
}
