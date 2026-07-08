# WhatsApp API Setup Guide

Complete setup guide for the Fronus Installer Program's WhatsApp integration.

This system sends messages using **free-form (service) messages only** — no templates, no approvals, no per-message costs. Messages are delivered within the 24-hour customer service window that opens when an installer messages you first.

---

## How It Works

### The 24-Hour Rule

WhatsApp enforces a strict policy:

1. An installer sends your business a message → a **24-hour customer service window** opens
2. Inside that window, you can reply with **any free-form content** — text, images, documents, buttons, lists — **no template needed, no cost**
3. After 24 hours of silence from the installer, the window closes and **you cannot send free-form messages** until they message you again
4. Only the installer's messages reset the 24-hour timer — your own replies do NOT extend it
5. **ALL** message types from the installer reset the window — not just text. Images, videos, documents, stickers, locations, and interactive messages all count

### Delivery Flow

```
Installer messages your WhatsApp number
  → Webhook fires → lastCustomerMessageAt updated in DB
  → Team registers the installer in the web app
  → System checks: is lastCustomerMessageAt within 24 hours?
    → YES: sends free-form text with credentials (FREE)
    → NO: blocks delivery, shows "Ask installer to send a message" in UI
  → Team clicks "Resend PIN" after installer sends another message
  → Free-form sent (FREE)
```

### What Gets Sent

All messages are plain text. No templates, no structured messages. Examples:

**Registration:**
```
Hi Ahmed Khan,

Your Fronus Installer account is active.

Installer Code: FRN-1234
Login PIN: 482917

Login at https://installer.fronus.com
Keep your PIN private — do not share it.
```

**Reward Payment:**
```
Hi Ahmed Khan,

Payment processed for FR-5000 (SN-2024-001).
Amount: Rs. 5,000.

Check your account for details.
```

**Referral Reward:**
```
Hi Ahmed Khan,

Referral reward for referring Bilal Ahmed (FRN-5678).
Amount: Rs. 1,000.

Check your account for details.
```

---

## Setup Steps

### Step 1: Create / Access a Meta Business Account

1. Go to **https://business.facebook.com/overview**
2. Log in with your personal Facebook account
3. If you don't have a Business Account, click **Create Account** and fill in your business name, email, and details
4. Once created, you'll be in **Meta Business Suite**

---

### Step 2: Create a WhatsApp Business Account (WABA)

1. In Meta Business Suite, go to **Settings** (gear icon, bottom left) → **WhatsApp Accounts**
2. Click **Add New WhatsApp Account**
3. Follow the wizard:
   - Enter your business name
   - Verify your business (phone number or email)
   - Accept Meta's terms
4. After creation, the **WABA ID** is displayed on the WhatsApp Accounts page
5. **Copy this value** → this is `META_WHATSAPP_BUSINESS_ACCOUNT_ID`

---

### Step 3: Register a Phone Number

1. In the same WhatsApp section, click **Phone Numbers**
2. Click **Add Phone Number**
3. Enter a phone number that can receive SMS or a voice call
4. Choose verification method (SMS code or phone call) and complete verification
5. Once verified, the phone number appears in the table
6. The **ID** column (numeric) is your `META_WHATSAPP_PHONE_NUMBER_ID`
7. **Copy this value**

> **Important:** This number must not be associated with an existing WhatsApp personal account. Using it will disconnect your personal WhatsApp. Use a dedicated business line or a virtual number.

---

### Step 4: Create a Meta App

1. Go to **https://developers.facebook.com/apps/**
2. Click **Create App** → choose **Business** as the app type
3. Fill in the app name and contact email
4. Once created, go to **Dashboard** and **Add Product** → select **WhatsApp**
5. Configure the WhatsApp product by selecting your Business Account (WABA from Step 2)

---

### Step 5: Create a System User & Generate Access Token

1. Go to **Meta Business Suite → Settings → Users → System Users**
2. Click **Add** → name it e.g. "InstallerProgram API"
3. Role: **Admin**
4. Click **Generate New Token**
5. **Select the Meta App** you created in Step 4 from the dropdown (the token is scoped to an app)
6. In the permissions panel, select:
   - **`whatsapp_business_messaging`** — required to send messages
7. Token expiration:
   - **60 days** (default) — requires periodic rotation
   - For a **never-expiring token**, ensure the system user is an **Admin** and generate the token from that admin level
8. Click **Generate Token**
9. **Copy the token immediately** — it is shown once. This is `META_WHATSAPP_ACCESS_TOKEN`
10. Store it in a password manager, not just `.env.local`

> **Note:** You do NOT need `whatsapp_business_management` permission since we are not creating or managing message templates.

---

### Step 6: Set Up the Webhook (Required)

The webhook is **required** — not optional. It tracks when installers message you so the system knows if the 24-hour window is open.

#### 6a. Get your App Secret

1. Go to **https://developers.facebook.com/apps/**
2. Select your app → **Settings** → **Basic**
3. Copy the **App Secret** → set as `META_WHATSAPP_APP_SECRET` in `.env.local`

#### 6b. Choose a Verify Token

Pick any random string (you'll enter this in Meta). Set as `META_WHATSAPP_VERIFY_TOKEN` in `.env.local`.

```bash
# Generate a random verify token
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

#### 6c. Register the Webhook in Meta

1. Go to **Meta Developer Portal** → your app → **WhatsApp** → **Configuration**
2. Under **Webhook**, click **Edit**
3. **Callback URL:** `https://your-domain.com/api/webhook/whatsapp`
4. **Verify Token:** the same string you set in `META_WHATSAPP_VERIFY_TOKEN`
5. Click **Verify and Save**
6. Subscribe to **messages** field

#### 6d. Verify the Webhook Works

1. Send a test message from a personal WhatsApp to your business number
2. Check your server logs — you should see `"WhatsApp inbound message processed"`
3. Check your database — the installer's `lastCustomerMessageAt` should be updated

---

### Step 7: Generate INSTALLER_JWT_SECRET

Run one of the following commands in your terminal:

```bash
# Node.js (any OS)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```powershell
# PowerShell (Windows)
openssl rand -base64 32
```

Copy the output — this is `INSTALLER_JWT_SECRET`.

> **Recommendation:** Use a value different from `NEXTAUTH_SECRET` for security isolation.

---

### Step 8: Add to `.env.local`

```env
# Meta WhatsApp Cloud API
META_WHATSAPP_PHONE_NUMBER_ID=123456789012345
META_WHATSAPP_ACCESS_TOKEN=EAAx...paste-your-token-here
META_WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345

# WhatsApp Webhook (REQUIRED — tracks 24h window)
META_WHATSAPP_VERIFY_TOKEN=your-custom-verify-token
META_WHATSAPP_APP_SECRET=your-app-secret-from-meta

# Installer JWT cookie secret
INSTALLER_JWT_SECRET=paste-your-base64-secret-here
```

---

## Settings

These settings are configurable from the **Settings** page in the app:

| Setting | Default | Description |
|---|---|---|
| `enableWhatsAppNotifications` | `true` | Master toggle for WhatsApp sending. When off, credentials are shown in the UI for manual sharing. |

The `enableWhatsAppHybridMode` setting exists in the database but is **no longer used**. Free-form messaging is always attempted when the 24h window is open.

---

## How the System Decides What to Send

### Registration Flow

1. Team fills out the registration form and clicks "Register"
2. System creates the installer record in the database
3. System generates a 6-digit PIN and hashes it with bcrypt
4. System calls `sendInstallerRegistrationMessage()`:
   a. Normalizes the installer's WhatsApp number
   b. Queries the database for `lastCustomerMessageAt`
   c. Checks: is `lastCustomerMessageAt` within the last 24 hours?
   d. **If YES:** sends free-form text with credentials → logs `WHATSAPP_FREE_FORM_SENT`
   e. **If NO:** blocks delivery, generates a `wa.me` link and plain text for manual sharing → logs `WHATSAPP_FAILED` with reason `"window_expired"`
5. System returns to the UI with `deliveryMethod: "free-form"` or `deliveryMethod: "blocked"`

### Resend PIN Flow

1. Team clicks "Resend PIN" on an installer's profile or in the registration modal
2. System generates a NEW 6-digit PIN (old PIN is invalidated)
3. Same delivery logic as registration — checks 24h window, sends free-form or blocks
4. If blocked, team sees "Ask installer to send a message to reopen the 24-hour window"

### Reward Notification Flow

1. Team marks a reward as "Paid" in the system
2. System calls `sendRewardPaymentMessage()` or `sendReferralRewardMessage()`
3. Same delivery logic — checks 24h window, sends free-form or blocks
4. If blocked, the notification is not sent. Team can notify the installer through other channels.

---

## Retry Logic

When sending a free-form message, the system retries up to **3 times** with exponential backoff:

| Attempt | Delay | Action |
|---|---|---|
| 1 | Immediate | Send message |
| 2 | 1 second | Re-validate window, then send |
| 3 | 2 seconds | Re-validate window, then send |

If the 24-hour window expires during the retry backoff, the system stops immediately and returns `deliveryMethod: "blocked"`.

---

## Error Handling

### Meta Error Code 131047

This is the most important error code. It means: **"More than 24 hours have passed since the recipient last replied."**

When this error is received:
- The message was NOT delivered (silently failed)
- No retry is possible — the message will never arrive
- The system returns `deliveryMethod: "blocked"`
- The UI shows: "Ask the installer to send a message to reopen the 24-hour window"

### Other Errors

| Error | Meaning | System behavior |
|---|---|---|
| Access token expired | Token needs rotation | Returns error, logs activity |
| Phone number not on WhatsApp | Recipient doesn't have WhatsApp | Returns error, logs activity |
| Rate limit (130429) | Too many messages sent | Retries after backoff |
| Network error | Connectivity issue | Retries up to 3 times |

---

## UI Behavior

### Registration Success — Free-Form Delivered

```
┌─────────────────────────────────────┐
│          ✓ Successful!              │
│                                     │
│     [Installer Name]                │
│     Code: FRN-1234                  │
│                                     │
│     PIN: 482917                     │
│     [Copy]                          │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ ✓ Credentials sent via WhatsApp│ │
│  │ Free-form message delivered    │ │
│  │ within the 24-hour window      │ │
│  └────────────────────────────────┘ │
│                                     │
│  [View Installer] [Register Another]│
└─────────────────────────────────────┘
```

### Registration Success — Window Expired

```
┌─────────────────────────────────────┐
│          ✓ Successful!              │
│                                     │
│     [Installer Name]                │
│     Code: FRN-1234                  │
│                                     │
│     PIN: 482917                     │
│     [Copy]                          │
│                                     │
│  ┌────────────────────────────────┐ │
│  │ ⚠ WhatsApp window expired     │ │
│  │                                │ │
│  │ The installer needs to send    │ │
│  │ you a WhatsApp message first   │ │
│  │ to reopen the 24-hour window.  │ │
│  │ Then click "Resend PIN" to     │ │
│  │ deliver credentials for free.  │ │
│  │                                │ │
│  │ ┌──────────────────────────┐   │ │
│  │ │ Your Fronus Installer... │   │ │
│  │ │ Code: FRN-1234           │   │ │
│  │ │ PIN: 482917              │   │ │
│  │ └──────────────────────────┘   │ │
│  │                                │ │
│  │ [Send on WhatsApp] [Copy Text] │ │
│  │                                │ │
│  │ [        Resend PIN        ]   │ │
│  └────────────────────────────────┘ │
│                                     │
│  [View Installer] [Register Another]│
└─────────────────────────────────────┘
```

When the window is expired:
- The system provides a `wa.me` deep link the team can tap to open WhatsApp with the credentials pre-filled
- The team can copy the text and send it manually
- The "Resend PIN" button generates a new PIN and attempts free-form delivery again

---

## Phone Number Normalization

All phone numbers are normalized to a consistent format: digits only, international prefix, no `+`.

| Input | Normalized |
|---|---|
| `0300-1234567` | `923001234567` |
| `+923001234567` | `923001234567` |
| `923001234567` | `923001234567` |
| `92 300 1234567` | `923001234567` |

This normalization is applied in:
- The webhook (when matching incoming messages to installers)
- The WhatsApp service (when sending messages)
- The `wa.me` link generation (for manual sharing)

---

## What the Webhook Tracks

The webhook at `POST /api/webhook/whatsapp` processes **all inbound message types**:

| Message Type | Resets 24h Window? | Content Logged |
|---|---|---|
| Text | Yes | Message body |
| Image | Yes | — |
| Video | Yes | — |
| Document | Yes | — |
| Sticker | Yes | — |
| Location | Yes | — |
| Contact | Yes | — |
| Interactive (button/list) | Yes | Button/list type |
| Audio | Yes | — |

**Why track all types:** An installer might send an image or sticker instead of text. All of these reset the 24-hour window, so the system must track them.

---

## Activity Logging

Every WhatsApp action is logged as an Activity record:

| Activity Type | When | Metadata |
|---|---|---|
| `WHATSAPP_FREE_FORM_SENT` | Free-form message delivered | `mode: "free-form"`, `attempt`, `minutesRemaining` |
| `WHATSAPP_FAILED` | Delivery failed or blocked | `mode: "blocked"`, `reason: "window_expired"` or `reason: "meta_131047"` |
| `WHATSAPP_RECEIVED` | Inbound message from installer | `messageType: "text"/"image"/etc.` |

These are visible in the Activity page and can be filtered by type.

---

## Important Constraints

1. **Free-form only** — the system never sends template messages
2. **24h window is mandatory** — if the installer hasn't messaged in 24 hours, you cannot send
3. **No broadcasts** — you can only reply to installers who have messaged you recently
4. **No scheduled messages** — you cannot pre-schedule a WhatsApp message for later
5. **Your replies don't extend the window** — only the installer's messages reset the timer
6. **The window ticks during weekends/holidays** — it's a 24-hour clock, not business hours
7. **The window is per-installer** — each installer has their own 24h window

---

## Cost

**Zero.** All messages are free-form service messages within the 24h customer service window. Meta does not charge for these.

| Message type | Cost |
|---|---|
| Free-form text within 24h window | **Free** |
| Free-form text outside 24h window | **Blocked** (not sent) |
| Template messages | **Not used** |

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| "WhatsApp service not configured" | Env vars not set | Add `META_WHATSAPP_PHONE_NUMBER_ID` and `META_WHATSAPP_ACCESS_TOKEN` to `.env.local` |
| "WhatsApp notifications disabled in settings" | Setting turned off | Go to Settings → toggle "Enable WhatsApp Notifications" on |
| "24-hour WhatsApp window has expired" | Installer hasn't messaged in 24h | Ask installer to send a WhatsApp message to your business number, then click "Resend PIN" |
| "Access token has expired" | Token needs rotation (60-day default) | Regenerate token in Meta Business Suite → System Users |
| "Not enough permissions" | Missing `whatsapp_business_messaging` scope | Edit the system user token permissions in Meta Business Suite |
| "Phone number not verified" | Number not yet verified via SMS | Go to WhatsApp → Phone Numbers and verify |
| Credentials show as "blocked" but installer just messaged | Webhook not set up or not receiving | Verify webhook is registered in Meta Developer Portal and `META_WHATSAPP_APP_SECRET` is correct |
| Installer's message didn't reset the window | Message type not tracked | Ensure webhook is subscribed to the `messages` field. All message types are now tracked. |
| "wa.me" link shows wrong number | Phone number normalization issue | Check that the installer's `whatsappNumber` is stored in `+92XXXXXXXXXX` format |
| Resend PIN returns 502 error | WhatsApp send failed and no fallback generated | Check server logs for the specific error. Usually means env vars are misconfigured. |

---

## Files Reference

| File | Purpose |
|---|---|
| `lib/phoneUtils.ts` | Shared phone number normalization |
| `lib/whatsappService.ts` | Core WhatsApp sending logic (free-form only) |
| `app/api/webhook/whatsapp/route.ts` | Inbound message handler (tracks 24h window) |
| `services/installers.ts` | Registration + PIN orchestration |
| `app/api/installers/route.ts` | Registration API endpoint |
| `app/api/installers/[id]/resend-pin/route.ts` | Resend PIN API endpoint |
| `app/installers/register/RegistrationModal.tsx` | Success/error UI with delivery status |
| `app/installers/register/page.tsx` | Registration form with WhatsApp state |
| `models/Installer.ts` | `lastCustomerMessageAt` field (line 148) |
| `models/Settings.ts` | `enableWhatsAppNotifications` setting |
