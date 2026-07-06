/**
 * WhatsApp Service using Meta WhatsApp Cloud API (official Graph API).
 *
 * Requires env vars:
 *   META_WHATSAPP_PHONE_NUMBER_ID  — Meta Business Suite → WhatsApp → Phone numbers
 *   META_WHATSAPP_ACCESS_TOKEN     — System user token with whatsapp_business_messaging
 *
 * Messages are sent as pre-approved *templates* (Utility category), created in
 * Meta Business Manager: installer_welcome, reward_paid, referral_earned.
 * Template body placeholders ({{1}}, {{2}}, …) map to `bodyParams` in order.
 */

import { logActivity } from "./activityLogger";
import { ActivityType } from "@/models/Activity";
import { getSettings } from "@/models/Settings";
import { logger } from "./logger";

const GRAPH_API_VERSION = "v22.0";

interface WhatsAppTemplateMessage {
  phoneNumber: string; // Any local/intl format; normalized to 92XXXXXXXXXX
  templateName: string;
  bodyParams: string[]; // Values for {{1}}, {{2}}, … in template body
  performedBy?: string; // For activity logging
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
 * Send a WhatsApp template message via Meta Cloud API.
 * Checks the enableWhatsAppNotifications setting before sending.
 */
export async function sendWhatsAppMessage({
  phoneNumber,
  templateName,
  bodyParams,
  performedBy,
}: WhatsAppTemplateMessage): Promise<{ success: boolean; error?: string }> {
  try {
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.META_WHATSAPP_ACCESS_TOKEN;

    if (!phoneNumberId || !accessToken) {
      logger.warn(
        "WhatsApp notifications disabled: META_WHATSAPP_PHONE_NUMBER_ID / META_WHATSAPP_ACCESS_TOKEN not set"
      );
      return { success: false, error: "WhatsApp service not configured" };
    }

    const { enableWhatsAppNotifications } = await getSettings();
    if (!enableWhatsAppNotifications) {
      return { success: false, error: "WhatsApp notifications disabled in settings" };
    }

    const to = normalizeWhatsAppNumber(phoneNumber);

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

    if (performedBy) {
      await logActivity({
        type: ActivityType.WHATSAPP_SENT,
        performedBy,
        targetType: "Installer",
        targetId: performedBy, // Using performedBy as fallback
        description: `WhatsApp template "${templateName}" sent to ${phoneNumber}`,
        metadata: {
          whatsappNumber: phoneNumber,
          templateName,
        },
      });
    }

    return { success: true };
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
 * Send installer registration welcome + credentials (installer code + PIN).
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
  return sendWhatsAppMessage({
    phoneNumber: installer.whatsappNumber,
    templateName: "installer_welcome",
    bodyParams: [installer.fullName, installer.installerCode, installer.pin ?? "-"],
    performedBy,
  });
}

/**
 * Send reward payment confirmation.
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
  return sendWhatsAppMessage({
    phoneNumber: reward.installer.whatsappNumber,
    templateName: "reward_paid",
    bodyParams: [
      reward.installer.fullName,
      reward.productModel,
      reward.serialNumber,
      `Rs. ${reward.rewardAmount.toLocaleString()}`,
    ],
    performedBy,
  });
}

/**
 * Send referral reward notification to the referrer.
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
  return sendWhatsAppMessage({
    phoneNumber: referrer.whatsappNumber,
    templateName: "referral_earned",
    bodyParams: [
      referrer.fullName,
      `${referred.fullName} (${referred.installerCode})`,
      `Rs. ${rewardAmount.toLocaleString()}`,
    ],
    performedBy,
  });
}
