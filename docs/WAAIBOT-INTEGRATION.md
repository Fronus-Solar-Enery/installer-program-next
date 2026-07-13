# Waaibot Integration — Hand-Off Implementation Guide

Complete guide for integrating [Waaibot](https://waaibot.com) (Pakistan's hybrid WhatsApp API) into the Fronus Installer Program to send **business-initiated** WhatsApp notifications — something the current Meta Cloud API free-form integration cannot do outside the 24-hour customer-service window.

> **Status:** Not implemented. This document is the full spec for whoever implements it (developer or AI session).
>
> **Sources:** API details extracted from https://waaibot.com/api-docs and https://waaibot.com/freeapi on 2026-07-13. The public docs are thin — verify details against the Waaibot Portal dashboard once an account exists.

---

## 1. The headline answer: CAN we send business-initiated messages?

**Yes.** This is Waaibot's entire value proposition and the reason to add it.

|                                       | Meta Cloud API (current, `lib/whatsappService.ts`)                      | Waaibot                                                                                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Business-initiated (we message first) | ❌ Only via pre-approved **templates** (we deliberately don't use them) | ✅ Any free-form text, any time                                                                                                                  |
| 24-hour window restriction            | ✅ Blocks all free-form sends outside window                            | ❌ No window concept in their API                                                                                                                |
| Message types                         | Text only (our implementation)                                          | Text, media (image/document), interactive workflows (buttons/lists)                                                                              |
| Official Meta channel                 | ✅ Official                                                             | ⚠️ "Hybrid" — you link a normal WhatsApp number by scanning a QR code (WhatsApp-Web-style session), **not** an official Meta Business API number |
| Setup                                 | Meta Business verification, phone number ID, system-user token          | Sign up → scan QR → copy API key (minutes)                                                                                                       |

### ⚠️ The trade-off you must understand before going live

Waaibot's "hybrid" engine works by linking a real WhatsApp account (QR scan, like WhatsApp Web). That means:

1. **Number ban risk.** WhatsApp actively bans numbers doing automated/bulk sends through unofficial channels. Use a **dedicated number** (NOT the main Fronus business number, NOT the number tied to the Meta Cloud API). If it gets banned, you lose that number's chat history and reachability, not the business.
2. **No official delivery guarantees.** No documented delivery receipts, SLAs, or message status callbacks (only workflow button-reply webhooks are documented).
3. **Session fragility.** QR-linked sessions can drop (phone offline, WhatsApp update, re-link needed). Someone on the team must own "is the Waaibot device still connected" as an operational check.
4. **Keep volumes human-like.** Event-driven one-at-a-time notifications (registration, payment) are the safe pattern. Do NOT use this for bulk broadcast blasts to hundreds of installers at once without understanding the ban risk.

**Recommendation:** Use Waaibot as the business-initiated channel for transactional notifications, keep the Meta Cloud API integration as-is for the inbound webhook + within-window sends, and put the whole thing behind a settings toggle so it can be disabled instantly if the linked number has problems.

---

## 2. Waaibot API reference (complete public surface)

### Authentication

Every request needs the `X-API-Key` header. The key is generated in the **Waaibot Portal dashboard** (see §3).

### Single endpoint

```
POST https://api.waaibot.com/v1/send
Content-Type: application/json
X-API-Key: YOUR_API_KEY
```

### Payload type 1 — Standard text

```json
{
  "phone": "923001234567",
  "type": "text",
  "message": "Your Waaibot verification code is: 8821"
}
```

- `phone`: digits only, international format, **no leading `+`** — exactly what our `normalizePhone()` in [lib/phoneUtils.ts](../lib/phoneUtils.ts) already produces. Do not use the DB `whatsappNumber` field raw (it stores `+92…`).

### Payload type 2 — Trigger workflow (interactive buttons/lists)

```json
{
  "phone": "923001234567",
  "type": "flow",
  "flow_id": "flw_ecommerce_cod",
  "variables": {
    "order_id": "ORD-992",
    "amount": "4500"
  }
}
```

- Workflows are built visually in the Waaibot Portal ("visual workflow builder"). `flow_id` comes from there. `variables` are substituted into the flow's message text.
- This is the **non-developer surface**: a Fronus team member can design/edit the message content, buttons, and follow-up logic in the portal without code changes — the app only passes the `flow_id` and variables.

### Payload type 3 — Send media

```json
{
  "phone": "923001234567",
  "type": "document",
  "media_url": "https://waaibot.com/assets/invoice-992.pdf",
  "caption": "Here is your invoice for Order #992"
}
```

- `type: "document"` shown in docs; `image` also referenced on the site. `media_url` must be a publicly fetchable URL.

### Webhooks (inbound, optional)

When a workflow (`type: "flow"`) shows buttons/lists and the user taps one, Waaibot POSTs to a webhook URL **you configure inside the visual workflow builder** (per-flow, in the portal — not via API):

```json
{
  "event": "button_reply",
  "lead_number": "923022597807",
  "flowId": "283",
  "button_text": "Confirm Appointment",
  "custom_payload": { "name": "Azam Sajid", "code": "556682" },
  "timestamp": 1708864000
}
```

### Not documented publicly (verify in portal / ask their support)

- Response body shape of `/v1/send` (assume `2xx` = accepted; log the raw body until confirmed)
- Error codes, rate limits, per-day send caps on the free tier
- Delivery status callbacks (none documented)
- Webhook signature/authentication (none documented — see §6 security note)

Free tier: 1 linked WhatsApp device, full REST API + workflow builder + webhooks. High-volume broadcasting and multi-agent chat are paid ("Premium Pass").

---

## 3. Non-developer setup (one-time, no code)

Any team member can do this — it's the part that CANNOT be done in code:

1. **Create account** at https://waaibot.com → "Get Started Free". No credit card.
2. **Get a dedicated SIM/number** for outbound notifications (see risk note in §1). Install WhatsApp on a phone with that number.
3. **Link the number**: in the Waaibot Portal, scan the QR code with that phone's WhatsApp (Linked Devices). The phone should stay powered and online.
4. **Generate the API key**: Portal → API section → generate key. This becomes the `WAAIBOT_API_KEY` env var.
5. **Test without any code** — from any terminal or an online tool like reqbin.com:
   ```bash
   curl -X POST https://api.waaibot.com/v1/send \
     -H "Content-Type: application/json" \
     -H "X-API-Key: YOUR_API_KEY" \
     -d '{"phone": "92XXXXXXXXXX", "type": "text", "message": "Fronus test message"}'
   ```
   Message should arrive on the target WhatsApp within seconds. **Record the actual response body** — we need it for §5 error handling.
6. _(Optional, later)_ Build interactive flows in the visual workflow builder and note their `flow_id`s.

---

## 4. Where this plugs into the codebase — trigger map

The app already has a clean WhatsApp seam. Every notification flows through `sendWhatsAppMessage()` in [lib/whatsappService.ts](../lib/whatsappService.ts), called from exactly these places:

| Event (user's requirement)                                          | Trigger location                                                                                                                                                                                                   | Current behavior                                                                                                                           |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Installer registered**                                            | [services/installers.ts:191](../services/installers.ts#L191) → `sendInstallerRegistrationMessage()` (code + PIN message)                                                                                           | Blocked unless installer messaged us in last 24h — which a brand-new installer almost never has. **This is the biggest win from Waaibot.** |
| **Reward paid to installer**                                        | [app/api/rewards/route.ts:171](../app/api/rewards/route.ts#L171) (created as PAID) and [app/api/rewards/[id]/route.ts:104](../app/api/rewards/%5Bid%5D/route.ts#L104) (marked paid) → `sendRewardPaymentMessage()` | Same 24h restriction                                                                                                                       |
| **Referral reward**                                                 | [app/api/rewards/route.ts:189](../app/api/rewards/route.ts#L189) → `sendReferralRewardMessage()`                                                                                                                   | Same 24h restriction                                                                                                                       |
| **Product registered for reward** (new claim submitted, any status) | **Does not exist yet.** Reward creation in [app/api/rewards/route.ts](../app/api/rewards/route.ts) only notifies when status is already PAID.                                                                      | New message + new high-level function needed (see §5 step 4)                                                                               |

Supporting pieces that stay unchanged and get reused:

- [lib/phoneUtils.ts](../lib/phoneUtils.ts) — `normalizePhone()` output (`923001234567`) is exactly Waaibot's `phone` format.
- [lib/activityLogger.ts](../lib/activityLogger.ts) — every send/failure must keep logging activities (same `ActivityType.WHATSAPP_*` types; add `provider: "waaibot"` in metadata).
- `getSettings().enableWhatsAppNotifications` — master toggle keeps gating everything.
- The Meta inbound webhook ([app/api/webhook/whatsapp/](../app/api/webhook/whatsapp/)) and `lastCustomerMessageAt` tracking stay — they still serve the within-window Meta path.

---

## 5. Implementation plan (step by step)

### Step 0 — Decision to confirm with the owner before coding

Pick the delivery strategy (this guide assumes **Option B**):

- **Option A — Waaibot replaces Meta entirely.** Simplest code (one provider), but throws away the official channel and puts ALL traffic on the ban-risk hybrid number.
- **Option B — Cascade (recommended):** try Meta free-form when the 24h window is open (official channel, zero risk), fall back to Waaibot when the window is closed or Meta fails. Notifications become effectively always-deliverable while minimizing unofficial-channel volume.
- **Option C — Waaibot only for specific events** (e.g. only registration credentials), Meta for the rest.

### Step 1 — Env vars

Add to `.env.local` and the Vercel project:

```bash
WAAIBOT_API_KEY=***          # from portal (§3 step 4)
# Optional, defaults in code:
WAAIBOT_API_URL=https://api.waaibot.com/v1/send
```

Document them in [CLAUDE.md](../CLAUDE.md)'s env var section and `.env.example` if present. Never commit values.

### Step 2 — New provider module: `lib/waaibotService.ts`

Thin transport layer, mirroring the structure of `sendFreeFormMessage()` in the existing service. Sketch:

```ts
// lib/waaibotService.ts
import { logger } from "./logger";
import { normalizePhone } from "./phoneUtils";

const WAAIBOT_API_URL =
  process.env.WAAIBOT_API_URL ?? "https://api.waaibot.com/v1/send";

interface WaaibotSendResult {
  success: boolean;
  error?: string;
  httpStatus?: number;
}

export function isWaaibotConfigured(): boolean {
  return Boolean(process.env.WAAIBOT_API_KEY);
}

/** Send a business-initiated free-form text via Waaibot. No 24h window. */
export async function sendWaaibotText(
  phoneNumber: string,
  message: string,
): Promise<WaaibotSendResult> {
  const apiKey = process.env.WAAIBOT_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "Waaibot not configured (WAAIBOT_API_KEY missing)",
    };
  }

  const response = await fetch(WAAIBOT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify({
      phone: normalizePhone(phoneNumber), // "923001234567" — no '+'
      type: "text",
      message,
    }),
  });

  const bodyText = await response.text().catch(() => "");
  if (!response.ok) {
    logger.warn("Waaibot send failed", {
      httpStatus: response.status,
      body: bodyText.slice(0, 500),
    });
    return {
      success: false,
      error: `Waaibot API error ${response.status}`,
      httpStatus: response.status,
    };
  }

  logger.info("Waaibot message sent", { phone: normalizePhone(phoneNumber) });
  return { success: true };
}
```

Notes for the implementer:

- Keep it text-only for now. `sendWaaibotFlow(flowId, variables)` / media can be added later when a concrete need lands — don't pre-build.
- Retry policy: one retry on 5xx/network error is enough; do NOT retry 4xx. (Waaibot error semantics are undocumented — log the response body verbatim so we learn them.)
- Response shape is undocumented — treat any 2xx as success until real responses are observed (§3 step 5).

### Step 3 — Wire the cascade into `sendWhatsAppMessage()`

In [lib/whatsappService.ts](../lib/whatsappService.ts), the current flow inside `sendWhatsAppMessage()` is:

1. config + settings checks
2. installer lookup for `lastCustomerMessageAt`
3. **window closed → return `deliveryMethod: "blocked"`** ← inject fallback here
4. window open → Meta send with retries; hard failures return blocked ← and here

Changes:

- Extend the `DeliveryMethod` type: `"free-form" | "waaibot" | "blocked"`.
- At the two "blocked" exits (window expired up-front; Meta 131047 mid-send; retries exhausted): if `isWaaibotConfigured()`, call `sendWaaibotText()` instead of returning blocked. On success, `logActivity` with the existing `WHATSAPP_FREE_FORM_SENT` type (or a new `WHATSAPP_WAAIBOT_SENT` activity type in [models/Activity.ts](../models/Activity.ts) — new type preferred, keeps the audit trail honest) and return `{ success: true, deliveryMethod: "waaibot" }`. On failure, fall through to today's blocked result.
- If Waaibot is NOT configured, behavior is byte-for-byte identical to today — that's the safety property to preserve.
- Because all three high-level functions (`sendInstallerRegistrationMessage`, `sendRewardPaymentMessage`, `sendReferralRewardMessage`) route through `sendWhatsAppMessage()`, **all existing triggers get the fallback with zero call-site changes.** This is the root-cause place to change; do not patch individual routes.

UI ripple: anything that renders `deliveryMethod` (registration success dialogs showing the manual wa.me fallback) should treat `"waaibot"` like `"free-form"` (i.e., delivered — no manual fallback needed). Grep for `deliveryMethod` in `app/` and `components/` and update the branches.

### Step 4 — New event: "product registered for reward"

The user explicitly wants a notification when a claim/reward is first registered (before payment). Add to [lib/whatsappService.ts](../lib/whatsappService.ts):

```ts
/** Notify installer their product serial was registered for a reward. */
export async function sendRewardRegisteredMessage(
  reward: {
    installer: { fullName: string; whatsappNumber: string };
    serialNumber: string;
    productModel: string;
    rewardAmount: number;
  },
  performedBy: string,
): Promise<SendResult> {
  const freeFormText = [
    `Hi ${reward.installer.fullName},`,
    "",
    `Your product ${reward.productModel} (${reward.serialNumber}) has been registered for a reward.`,
    `Reward amount: Rs. ${reward.rewardAmount.toLocaleString()}.`,
    "",
    "You'll be notified when the payment is processed.",
  ].join("\n");

  return sendWhatsAppMessage({
    phoneNumber: reward.installer.whatsappNumber,
    freeFormText,
    performedBy,
  });
}
```

Call it in [app/api/rewards/route.ts](../app/api/rewards/route.ts) POST handler, right after `InstallerReward.create(rewardData)`, **only when `rewardStatus !== PAID`** (PAID already triggers the payment message — don't double-message). Fire-and-forget with `.catch()` + `logger.error`, same as the existing calls at lines 171/189. Mirror the same guard if bulk/batch reward registration paths exist ([lib/bulkValidation.ts](../lib/bulkValidation.ts) / batch-jobs) — but for batch jobs, confirm with the owner first: notifying 500 installers in one batch run is exactly the bulk pattern that risks the Waaibot number (§1).

### Step 5 — Settings toggle (optional but recommended)

Add `enableWaaibotFallback: boolean` (default `true`) to [models/Settings.ts](../models/Settings.ts) and the settings UI, checked alongside `enableWhatsAppNotifications` in the cascade. Gives ADMIN a kill switch if the linked number misbehaves — without a redeploy.

### Step 6 — Tests

Per project convention (pure logic gets tests, seams get mocked):

- `tests/waaibotService.test.ts` — mock global `fetch`; assert: correct URL/headers/payload shape, `+92`→`92` phone normalization, missing-key short circuit, non-2xx → `success: false`, no retry on 4xx.
- Extend the existing whatsappService test approach: window-expired + Waaibot configured → Waaibot called, result `deliveryMethod: "waaibot"`; window expired + not configured → today's `"blocked"`; Waaibot failure → `"blocked"`.

### Step 7 — Definition of done (project standard)

- `npm run lint`, `npm test` pass (and `npm run build` — this touches models if Step 5 is done).
- No `console.*` — all logging via `logger`.
- Activity log entries for every send/failure with `provider` metadata.
- `.env` values documented, never committed.

---

## 6. Optional phase 2 — interactive flows + inbound webhook

Skip until there's a concrete use case. When there is (e.g. "Confirm your bank details" buttons):

1. Team member builds the flow in the Waaibot Portal visual builder, sets the webhook URL to `https://<app-domain>/api/webhook/waaibot`, notes the `flow_id`.
2. Add `sendWaaibotFlow(phone, flowId, variables)` to `lib/waaibotService.ts` (payload type 2 in §2).
3. New route `app/api/webhook/waaibot/route.ts` receiving the `button_reply` payload (§2).
   **Security note:** Waaibot documents no webhook signature. Mitigate: put an unguessable token in the webhook path or query string configured in the portal (e.g. `/api/webhook/waaibot?token=<random>`), verify it server-side, and treat the payload as untrusted input (Zod-validate, `escapeRegex` anything used in queries). Do NOT mutate money/PIN state from this webhook alone.

---

## 7. Open questions for Waaibot support (before heavy usage)

1. Exact success/error response schema of `/v1/send`?
2. Rate limits and daily caps on the free tier?
3. Delivery status callbacks — do they exist?
4. Webhook signing/verification mechanism?
5. What happens to queued sends when the linked device is offline — queued, dropped, or errored?
6. Their guidance on safe daily volumes to avoid WhatsApp number bans?

---

## 8. Summary for the implementer

Waaibot = one endpoint (`POST https://api.waaibot.com/v1/send`, `X-API-Key` header), three payload types (text / flow / media), business-initiated sends with no 24h window, QR-linked hybrid engine with number-ban risk. Integration = one new ~60-line transport module (`lib/waaibotService.ts`), a fallback branch at the two "blocked" exits inside `sendWhatsAppMessage()` (which upgrades all three existing notification triggers at once), one new high-level message function for reward registration, env var, settings toggle, tests. Meta integration, inbound webhook, phone utils, and activity logging all stay as-is.
