import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { logger } from "@/lib/logger";
import { normalizePhone } from "@/lib/phoneUtils";

const VERIFY_TOKEN = process.env.META_WHATSAPP_VERIFY_TOKEN;
const APP_SECRET = process.env.META_WHATSAPP_APP_SECRET;

/**
 * GET /api/webhook/whatsapp
 * Meta webhook verification handshake.
 * Meta sends: ?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>
 * We respond with the challenge value if the verify token matches.
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN && challenge) {
    logger.info("WhatsApp webhook verified successfully");
    return new NextResponse(challenge, { status: 200 });
  }

  logger.warn("WhatsApp webhook verification failed", { mode, token });
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * POST /api/webhook/whatsapp
 * Receives incoming WhatsApp messages from Meta.
 * Verifies the X-Hub-Signature-256 HMAC header for security.
 * Updates Installer.lastCustomerMessageAt for ANY inbound message type
 * (text, image, video, document, sticker, location, interactive, etc.)
 * so the 24-hour customer service window is accurately tracked.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify HMAC signature if APP_SECRET is configured
    if (APP_SECRET) {
      const signature = request.headers.get("x-hub-signature-256");
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }

      const rawBody = await request.text();
      const expectedSignature = `sha256=${createHmac("sha256", APP_SECRET).update(rawBody).digest("hex")}`;

      if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        logger.warn("WhatsApp webhook invalid signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      // Re-parse body after reading raw text
      const body = JSON.parse(rawBody);
      await processWebhookBody(body);
    } else {
      // No APP_SECRET configured — skip HMAC verification (dev mode)
      const body = await request.json();
      await processWebhookBody(body);
    }

    // Always return 200 quickly to acknowledge receipt
    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    logger.error("WhatsApp webhook error", { err: error });
    // Still return 200 to prevent Meta retries for processing errors
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }
}

async function processWebhookBody(body: Record<string, unknown>) {
  const entryArr = body.entry as Array<Record<string, unknown>> | undefined;
  const entry = entryArr?.[0];
  const changes = entry?.changes as Array<Record<string, unknown>> | undefined;
  const value = changes?.[0]?.value as Record<string, unknown> | undefined;
  const messages = value?.messages as Array<Record<string, unknown>> | undefined;

  if (!messages?.length) return;

  await dbConnect();

  for (const message of messages) {
    const from = message.from as string | undefined;
    const type = message.type as string | undefined;
    const timestamp = message.timestamp as string | undefined;

    if (!from) continue;

    // Track ALL message types for 24h window — not just text.
    // Images, videos, documents, stickers, locations, interactive messages,
    // and contacts all reset the customer service window timer.
    // Skipping status/webhook events (no "from" field on those).

    const normalizedNumber = normalizePhone(from);

    try {
      const installer = await Installer.findOne({
        whatsappNumber: normalizedNumber,
      });

      if (!installer) {
        logger.debug("WhatsApp message from unknown number", { from, type });
        continue;
      }

      // Update the last customer message timestamp.
      // Only the customer's messages reset the 24h timer — our replies don't.
      installer.lastCustomerMessageAt = timestamp
        ? new Date(parseInt(timestamp) * 1000)
        : new Date();
      await installer.save();

      // Extract message content based on type
      let messageContent: string | undefined;
      if (type === "text") {
        messageContent = (message.text as Record<string, unknown>)?.body as string | undefined;
      } else if (type === "interactive") {
        const interactive = message.interactive as Record<string, unknown> | undefined;
        messageContent = interactive?.type as string | undefined;
      }

      // Log the inbound message activity
      await logActivity({
        type: ActivityType.WHATSAPP_RECEIVED,
        performedBy: installer._id,
        targetType: "Installer",
        targetId: installer._id,
        targetName: installer.fullName,
        description: `WhatsApp ${type || "message"} received from ${installer.fullName}`,
        metadata: {
          whatsappNumber: from,
          messageType: type,
          messageContent,
        },
      });

      logger.debug("WhatsApp inbound message processed", {
        installerCode: installer.installerCode,
        from,
        type,
      });
    } catch (err) {
      logger.error("Failed to process inbound WhatsApp message", { err, from, type });
    }
  }
}
