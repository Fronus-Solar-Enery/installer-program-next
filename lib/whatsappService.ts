/**
 * WhatsApp Service using WhatsApp Business API or Twilio
 *
 * FREE OPTIONS:
 * 1. WhatsApp Business API (Official) - Requires approval, limited free tier
 * 2. CallMeBot API - Free but limited, no registration required
 * 3. Waboxapp - Free tier available
 *
 * PAID BUT AFFORDABLE:
 * 1. Twilio WhatsApp API - Pay as you go
 * 2. MessageBird
 *
 * For this implementation, we'll use CallMeBot API (Free)
 * Setup instructions: https://www.callmebot.com/blog/free-api-whatsapp-messages/
 *
 * User needs to:
 * 1. Add the phone number +34 644 31 95 72 to their contacts (name: CallMeBot)
 * 2. Send message "I allow callmebot to send me messages" to that number
 * 3. Wait for the API key in response
 * 4. Add the API key to environment variables
 */

import { logActivity } from './activityLogger';
import { ActivityType } from '@/models/Activity';

interface WhatsAppMessage {
  phoneNumber: string; // Format: +92XXXXXXXXXX
  message: string;
  performedBy?: string; // For activity logging
}

/**
 * Send WhatsApp message using CallMeBot API (Free)
 * Note: Recipient must have set up CallMeBot on their WhatsApp first
 */
export async function sendWhatsAppMessage({
  phoneNumber,
  message,
  performedBy,
}: WhatsAppMessage): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if WhatsApp is enabled
    const apiKey = process.env.CALLMEBOT_API_KEY;

    if (!apiKey) {
      console.warn('WhatsApp notifications disabled: CALLMEBOT_API_KEY not set');
      return { success: false, error: 'WhatsApp service not configured' };
    }

    // Clean phone number - remove +92 prefix for CallMeBot
    const cleanNumber = phoneNumber.replace('+92', '').replace(/\D/g, '');

    // CallMeBot API endpoint
    const url = `https://api.callmebot.com/whatsapp.php?phone=+92${cleanNumber}&text=${encodeURIComponent(message)}&apikey=${apiKey}`;

    const response = await fetch(url, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    // Log successful WhatsApp send
    if (performedBy) {
      await logActivity({
        type: ActivityType.WHATSAPP_SENT,
        performedBy,
        targetType: 'Installer',
        targetId: performedBy, // Using performedBy as fallback
        description: `WhatsApp message sent to ${phoneNumber}`,
        metadata: {
          whatsappNumber: phoneNumber,
          messagePreview: message.substring(0, 100),
        },
      });
    }

    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Failed to send WhatsApp message:', error);

    // Log failed WhatsApp send
    if (performedBy) {
      await logActivity({
        type: ActivityType.WHATSAPP_FAILED,
        performedBy,
        targetType: 'Installer',
        targetId: performedBy,
        description: `Failed to send WhatsApp to ${phoneNumber}`,
        metadata: {
          whatsappNumber: phoneNumber,
          errorMessage,
        },
      });
    }

    return { success: false, error: errorMessage };
  }
}

/**
 * Send installer registration confirmation
 */
export async function sendInstallerRegistrationMessage(
  installer: {
    fullName: string;
    whatsappNumber: string;
    installerCode: string;
  },
  performedBy: string
): Promise<void> {
  const message = `🎉 *Welcome to Installer Program!*\n\n` +
    `Dear ${installer.fullName},\n\n` +
    `Your installer account has been successfully registered.\n\n` +
    `*Installer Code:* ${installer.installerCode}\n\n` +
    `You can now start installing products and earning rewards.\n\n` +
    `For any queries, please contact our support team.\n\n` +
    `Best regards,\n` +
    `Installer Program Team`;

  await sendWhatsAppMessage({
    phoneNumber: installer.whatsappNumber,
    message,
    performedBy,
  });
}

/**
 * Send reward payment confirmation
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
): Promise<void> {
  const message = `💰 *Reward Payment Confirmation*\n\n` +
    `Dear ${reward.installer.fullName},\n\n` +
    `Your reward payment has been processed!\n\n` +
    `*Product:* ${reward.productModel}\n` +
    `*Serial Number:* ${reward.serialNumber}\n` +
    `*Reward Amount:* Rs. ${reward.rewardAmount.toLocaleString()}\n` +
    (reward.transactionId ? `*Transaction ID:* ${reward.transactionId}\n` : '') +
    (reward.sendingDate ? `*Payment Date:* ${new Date(reward.sendingDate).toLocaleDateString()}\n` : '') +
    `\n` +
    `Thank you for your service!\n\n` +
    `Best regards,\n` +
    `Installer Program Team`;

  await sendWhatsAppMessage({
    phoneNumber: reward.installer.whatsappNumber,
    message,
    performedBy,
  });
}

/**
 * Send referral reward notification
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
): Promise<void> {
  const message = `🎁 *Referral Reward Earned!*\n\n` +
    `Dear ${referrer.fullName},\n\n` +
    `Congratulations! You've earned a referral reward.\n\n` +
    `*Referred Installer:* ${referred.fullName} (${referred.installerCode})\n` +
    `*Referral Reward:* Rs. ${rewardAmount.toLocaleString()}\n\n` +
    `Keep referring more installers to earn more rewards!\n\n` +
    `Best regards,\n` +
    `Installer Program Team`;

  await sendWhatsAppMessage({
    phoneNumber: referrer.whatsappNumber,
    message,
    performedBy,
  });
}

/**
 * ALTERNATIVE: Using Twilio (Paid but more reliable)
 * Uncomment and configure if you want to use Twilio instead
 */
/*
import twilio from 'twilio';

export async function sendWhatsAppViaTwilio({
  phoneNumber,
  message,
}: WhatsAppMessage): Promise<{ success: boolean; error?: string }> {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER; // e.g., whatsapp:+14155238886

    if (!accountSid || !authToken || !twilioWhatsAppNumber) {
      return { success: false, error: 'Twilio not configured' };
    }

    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: message,
      from: twilioWhatsAppNumber,
      to: `whatsapp:${phoneNumber}`,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Twilio WhatsApp error:', error);
    return { success: false, error: error.message };
  }
}
*/
