# WhatsApp API + Installer JWT — ENV Setup Guide

Step-by-step instructions for obtaining all environment variables defined in `LANDING-PAGE-PLAN.md`.

---

## ENV Summary

| Variable | Where to get it |
|---|---|
| `META_WHATSAPP_BUSINESS_ACCOUNT_ID` | Meta Business Suite → WhatsApp Accounts |
| `META_WHATSAPP_PHONE_NUMBER_ID` | Meta Business Suite → WhatsApp → Phone Numbers |
| `META_WHATSAPP_ACCESS_TOKEN` | System User token with `whatsapp_business_messaging` permission |
| `INSTALLER_JWT_SECRET` | Generated locally via `openssl rand -base64 32` |

---

## Step 1: Create / Access a Meta Business Account

1. Go to **https://business.facebook.com/overview** and log in with your personal Facebook account
2. If you don't have a Business Account yet, click **Create Account** and fill in your business name, email, and details
3. Once created, you'll be in **Meta Business Suite**

---

## Step 2: Create a WhatsApp Business Account (WABA)

1. In Meta Business Suite, go to **Settings** (gear icon, bottom left) → **WhatsApp Accounts**
2. Click **Add New WhatsApp Account**
3. Follow the wizard:
   - Enter your business name
   - Verify your business (phone number or email)
   - Accept Meta's terms
4. After creation, the **WABA ID** is displayed on the WhatsApp Accounts page
5. **Copy this value** → this is `META_WHATSAPP_BUSINESS_ACCOUNT_ID`

---

## Step 3: Register a Phone Number

1. In the same WhatsApp section, click **Phone Numbers**
2. Click **Add Phone Number**
3. Enter a phone number that can receive SMS or a voice call
4. Choose verification method (SMS code or phone call) and complete verification
5. Once verified, the phone number appears in the table
6. The **ID** column (numeric) is your `META_WHATSAPP_PHONE_NUMBER_ID`
7. **Copy this value**

> **Important:** This number must not be associated with an existing WhatsApp personal account. Using it will disconnect your personal WhatsApp. Use a dedicated business line or a virtual number.

---

## Step 4: Create a System User & Generate Access Token

1. **First, create a Meta App** (if you don't have one):
   - Go to **https://developers.facebook.com/apps/**
   - Click **Create App** → choose **Business** as the app type
   - Fill in the app name and contact email
   - Once created, go to **Dashboard** and **Add Product** → select **WhatsApp**
   - Configure the WhatsApp product by selecting your Business Account (WABA from Step 2)

2. Go to **Meta Business Suite → Settings → Users → System Users**
3. Click **Add** → name it e.g. "InstallerProgram API"
4. Role: **Admin**
5. Click **Generate New Token**
6. **Select the Meta App** you created in step 1 from the dropdown (this is required — the token is scoped to an app)
7. In the permissions panel, select:
   - **`whatsapp_business_messaging`** — required to send messages
   - **`whatsapp_business_management`** — required to manage templates (optional, only needed during setup)
8. Token expiration:
   - **60 days** (default) — requires periodic rotation
   - For a **never-expiring token**, ensure the system user is an **Admin** and generate the token from that admin level
9. Click **Generate Token**
10. **Copy the token immediately** — it is shown once. This is `META_WHATSAPP_ACCESS_TOKEN`
11. Store it in a password manager, not just `.env.local`

---

## Step 5: Create WhatsApp Message Templates

1. In Meta Business Suite, go to **WhatsApp → Message Templates**
2. Click **Create Template**
3. Category: **Utility** (free to send within the customer service window)

Create these three templates:

| Template Name | Category | Purpose | Variables |
|---|---|---|---|
| `installer_welcome` | Utility | Registration — account active + code + PIN | `fullName`, `installerCode`, `pin` |
| `reward_paid` | Utility | Reward payment processed | `fullName`, `productModel`, `serialNumber`, `amount` |
| `referral_earned` | Utility | Referral reward processed | `fullName`, `referredInfo`, `amount` |

**Recommended body text (strict Utility — no promotional language):**

```
installer_welcome:
"Your installer account is active. Name: {{1}}, Code: {{2}}, PIN: {{3}}. Keep your PIN private."

reward_paid:
"Payment processed for {{2}} ({{3}}). Amount: {{4}}. {{1}}, check your account."

referral_earned:
"Referral reward for {{1}}. Referred: {{2}}. Amount: {{3}}."
```

> **Why this wording:** Meta rejects Utility templates with promotional language ("congratulations", "welcome!", "you've earned"). Keep body purely factual and informational.

4. Each template goes through **Meta review** (2–24 hours for first templates)
5. Templates must be **approved** before they can be sent

---

## Step 6: Generate INSTALLER_JWT_SECRET

Run one of these commands in your terminal:

```powershell
# PowerShell (Windows)
openssl rand -base64 32
```

```bash
# Linux / macOS / WSL
openssl rand -base64 32
```

```bash
# Node.js (any OS)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output — this is `INSTALLER_JWT_SECRET`.

> **Recommendation:** Use a value different from `NEXTAUTH_SECRET` for security isolation. It can be the same, but separate is safer.

---

## Step 7: Add to `.env.local`

```env
# Meta WhatsApp Cloud API
META_WHATSAPP_PHONE_NUMBER_ID=123456789012345
META_WHATSAPP_ACCESS_TOKEN=EAAx...paste-your-token-here
META_WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345

# WhatsApp Webhook (Phase 2 — hybrid inbound)
META_WHATSAPP_VERIFY_TOKEN=your-custom-verify-token
META_WHATSAPP_APP_SECRET=your-app-secret-from-meta

# Installer JWT cookie secret
INSTALLER_JWT_SECRET=paste-your-base64-secret-here
```

---

## Step 8: Set Up WhatsApp Webhook (Optional — Hybrid Mode)

This enables free-form messaging when an installer messages you within 24 hours, bypassing template approval.

### 8a. Get your App Secret

1. Go to **https://developers.facebook.com/apps/**
2. Select your app → **Settings** → **Basic**
3. Copy the **App Secret** → set as `META_WHATSAPP_APP_SECRET` in `.env.local`

### 8b. Choose a Verify Token

Pick any random string (you'll enter this in Meta). Set as `META_WHATSAPP_VERIFY_TOKEN` in `.env.local`.

### 8c. Register the Webhook in Meta

1. Go to **Meta Developer Portal** → your app → **WhatsApp** → **Configuration**
2. Under **Webhook**, click **Edit**
3. **Callback URL:** `https://your-domain.com/api/webhook/whatsapp`
4. **Verify Token:** the same string you set in `META_WHATSAPP_VERIFY_TOKEN`
5. Click **Verify and Save**
6. Subscribe to **messages** field

### 8d. Enable Hybrid Mode

In your app's **Settings** page, toggle **Enable WhatsApp Hybrid Mode** to on.

### How it works

| Installer messaged within 24h? | What we send | Cost |
|---|---|---|
| Yes | Free-form text (no template needed) | Free |
| No | Template (requires Meta approval) | ~$0.01–0.05 |

The webhook at `POST /api/webhook/whatsapp` receives incoming messages and updates each installer's `lastCustomerMessageAt` timestamp.

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---|---|---|
| "Access token has expired" | Non-admin user token or 60-day expiry | Regenerate token or use an admin system user |
| "Not enough permissions" | Missing `whatsapp_business_messaging` scope | Edit the system user token permissions |
| "Phone number not verified" | Number not yet verified via SMS | Go to WhatsApp → Phone Numbers and verify |
| "Template not approved" | Content violates Meta policy | Use strict Utility wording (no promotional language). See recommended body text in Step 5. |
| "Message failed to send" | Recipient hasn't opted in within 24h | Utility templates can send outside window if approved |
| Webhook verification fails | Wrong verify token | Ensure `META_WHATSAPP_VERIFY_TOKEN` matches what you entered in Meta Developer Portal |
| Webhook signature invalid | Wrong app secret | Ensure `META_WHATSAPP_APP_SECRET` matches your Meta app's App Secret |
