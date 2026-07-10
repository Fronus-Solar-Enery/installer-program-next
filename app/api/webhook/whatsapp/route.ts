import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import dbConnect from "@/lib/mongodb";
import Installer from "@/models/Installer";
import { logActivity } from "@/lib/activityLogger";
import { ActivityType } from "@/models/Activity";
import { logger } from "@/lib/logger";
import { normalizePhone, whatsappStorageFormat } from "@/lib/phoneUtils";

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
    // Malformed payload is a permanent business error — ack with 200 so Meta
    // stops retrying (a retry would fail identically). Everything else (DB down,
    // body-read failure) is transient: return 500 so Meta redelivers with
    // backoff. F6's atomic $max makes redelivered duplicates harmless.
    if (error instanceof SyntaxError) {
      return NextResponse.json({ status: "ok" }, { status: 200 });
    }
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}

async function processWebhookBody(body: Record<string, unknown>) {
  const entryArr = body.entry as Array<Record<string, unknown>> | undefined;

  // Meta batches multiple entries per delivery, and multiple changes per entry
  // (especially under load or after downtime). Collect messages across ALL of
  // them — reading only entry[0]/changes[0] silently drops the rest.
  const messages: Array<Record<string, unknown>> = [];
  for (const entry of entryArr ?? []) {
    const changes = entry?.changes as Array<Record<string, unknown>> | undefined;
    for (const change of changes ?? []) {
      const value = change?.value as Record<string, unknown> | undefined;
      const changeMessages = value?.messages as Array<Record<string, unknown>> | undefined;
      if (changeMessages?.length) messages.push(...changeMessages);
    }
  }

  if (!messages.length) return;

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

    logger.info("WhatsApp webhook — processing inbound message", {
      from,
      type,
      normalizedNumber,
    });

    try {
      // whatsappNumber is stored canonical (whatsappStorageFormat) — plain equality.
      const installer = await Installer.findOne({
        whatsappNumber: whatsappStorageFormat(from),
      });

      if (!installer) {
        logger.warn("WhatsApp message from unknown number — no matching installer", {
          from,
          normalizedNumber,
          type,
        });
        continue;
      }

      // Update the last customer message timestamp.
      // Only the customer's messages reset the 24h timer — our replies don't.
      // $max is atomic, idempotent, and order-independent: retried/out-of-order
      // webhooks and concurrent installer edits can't regress the timestamp or
      // clobber other fields (which a full-document save() would).
      const msgDate = timestamp
        ? new Date(parseInt(timestamp) * 1000)
        : new Date();
      await Installer.updateOne(
        { _id: installer._id },
        { $max: { lastCustomerMessageAt: msgDate } }
      );

      logger.info("WhatsApp inbound message processed", {
        installerCode: installer.installerCode,
        from,
        type,
        lastCustomerMessageAt: msgDate,
      });

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

    } catch (err) {
      logger.error("Failed to process inbound WhatsApp message", { err, from, type });
    }
  }
}
