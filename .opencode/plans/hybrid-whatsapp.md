# Hybrid WhatsApp Messaging Plan

## Goal
Send free-form text when the installer is within a 24h window (they messaged us recently), fall back to templates when outside the window, and gracefully handle failures.

## Architecture

```
Installer sends WhatsApp
        ↓
Meta webhook fires → POST /api/webhook/whatsapp
        ↓
We update Installer.lastCustomerMessageAt
        ↓
When we need to notify:
  check lastCustomerMessageAt is within 24h?
    YES → send free-form text (no template needed, free)
    NO  → send template (requires Meta approval)
  If template also fails → log, don't block
```

---

## Step 1: Installer Model — Add timestamp field

**File:** `models/Installer.ts`

Add to `IInstaller` interface:
```ts
lastCustomerMessageAt?: Date;
```

Add to schema:
```ts
lastCustomerMessageAt: {
  type: Date,
},
```

---

## Step 2: WhatsApp Webhook Endpoint

**New file:** `app/api/webhook/whatsapp/route.ts`

### `GET` — Meta verification handshake
Meta sends GET to verify webhook URL. Respond with `hub.challenge` if verify token matches.

```
GET /api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=<token>&hub.challenge=<challenge>
```

### `POST` — Receive incoming messages
Meta sends message events. Verify `X-Hub-Signature-256` HMAC header. Parse message, match sender phone to Installer, update `lastCustomerMessageAt`.

**Key details:**
- Unauthenticated route
- Verify HMAC signature using `META_WHATSAPP_APP_SECRET`
- Match incoming phone number to Installer via `whatsappNumber`
- Only update timestamp for `text` type messages
- Return 200 quickly

---

## Step 3: WhatsApp Service — Add free-form sending

**File:** `lib/whatsappService.ts`

### New: `sendFreeFormMessage()`
Sends plain text (not template):
```ts
{
  messaging_product: "whatsapp",
  to,
  type: "text",
  text: { body: "..." }
}
```

### New: `isWithin24hWindow()`
Simple date math — checks if `lastCustomerMessageAt` is within 24 hours.

### Update: `sendWhatsAppMessage()`
Auto-detect mode:
```ts
const installer = await Installer.findOne({ whatsappNumber: to });
if (installer?.lastCustomerMessageAt && isWithin24hWindow(installer.lastCustomerMessageAt)) {
  return sendFreeFormMessage(to, textMessage);
} else {
  return sendTemplateMessage(to, templateName, bodyParams);
}
```

---

## Step 4: Activity Types

**File:** `models/Activity.ts`

Add:
```ts
WHATSAPP_RECEIVED = 'WHATSAPP_RECEIVED',
WHATSAPP_DELIVERED = 'WHATSAPP_DELIVERED',
```

---

## Step 5: New Environment Variables

**File:** `.env.local`

Add:
```bash
META_WHATSAPP_VERIFY_TOKEN=<random-string>
META_WHATSAPP_APP_SECRET=<from Meta Developer Portal>
```

---

## Step 6: Settings toggle

**File:** `models/Settings.ts`

Add:
```ts
enableWhatsAppHybridMode: boolean; // default: false
```

---

## Files to create/modify

| File | Action |
|---|---|
| `models/Installer.ts` | Add `lastCustomerMessageAt` field |
| `models/Activity.ts` | Add `WHATSAPP_RECEIVED` type |
| `models/Settings.ts` | Add `enableWhatsAppHybridMode` toggle |
| `app/api/webhook/whatsapp/route.ts` | **New** — GET (verify) + POST (incoming messages) |
| `lib/whatsappService.ts` | Add `sendFreeFormMessage()`, `isWithin24hWindow()`, update `sendWhatsAppMessage()` |
| `.env.local` | Add `META_WHATSAPP_VERIFY_TOKEN`, `META_WHATSAPP_APP_SECRET` |
| `docs/WHATSAPP-API-SETUP.md` | Document webhook setup steps |
