# IPMS — Landing Page & Installer Portal Plan

## Overview

Four phases to deliver:
1. **Meta WhatsApp Cloud API** — Replace broken CallMeBot with official Meta API
2. **Installer PIN Auth** — Installer Code + PIN login (no NextAuth changes)
3. **Wire WhatsApp Notifications** — Trigger on registration & reward payment
4. **Landing Page** — Public marketing site at `/` for unauthenticated users

---

## Phase 1: Meta WhatsApp Cloud API

**Goal:** Replace CallMeBot's HTTP GET with Meta's Graph API POST.

### Files to change

| File | Change |
|---|---|
| `lib/whatsappService.ts` | Rewrite `sendWhatsAppMessage()` to POST to `graph.facebook.com/v22.0/{phone-id}/messages` |
| `.env.local` | Add 3 env vars (see below) |

### Env vars to add

```
META_WHATSAPP_PHONE_NUMBER_ID=        # From Meta Business Suite → WhatsApp → Phone numbers
META_WHATSAPP_ACCESS_TOKEN=           # System user token with whatsapp_business_messaging permission
META_WHATSAPP_BUSINESS_ACCOUNT_ID=    # WABA ID
```

### API shape

```
POST https://graph.facebook.com/v22.0/{META_WHATSAPP_PHONE_NUMBER_ID}/messages
Authorization: Bearer {META_WHATSAPP_ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "92XXXXXXXXXX",
  "type": "template",
  "template": {
    "name": "installer_welcome",
    "language": { "code": "en" }
  }
}
```

### Templates to create in Meta Business Manager

| Template name | Category | When used |
|---|---|---|
| `installer_welcome` | Utility | On registration — welcome + installer code + PIN |
| `reward_paid` | Utility | When reward is marked PAID — amount + product |
| `referral_earned` | Utility | When referrer earns a referral reward |

All **Utility** category → **free** when sent within a customer service window.

### What stays the same

- Function signatures: `sendInstallerRegistrationMessage()`, `sendRewardPaymentMessage()`, `sendReferralRewardMessage()`
- Activity logging (`WHATSAPP_SENT` / `WHATSAPP_FAILED`)
- The `whatsappNumber` field on installers

---

## Phase 2: Installer PIN Authentication

**Goal:** Installers log in with their **Installer Code + numeric PIN** (no email, no NextAuth changes).

### 2a. Extend Installer model

**File:** `models/Installer.ts`

New fields:

| Field | Type | Details |
|---|---|---|
| `pin` | `String` | bcrypt-hashed, 6-digit numeric. `select: false` — hidden from all queries by default |
| `shareToken` | `String` | Unique UUID v4, auto-generated on creation via `crypto.randomUUID()` |
| `lastPinChangeAt` | `Date` | Tracks when PIN was last changed |
| `pinAttempts` | `Number` | Failed login counter, default 0 |
| `pinLockedUntil` | `Date` | If set, login is blocked until this time |

Indexes: `{ shareToken: 1 }` (unique) — the existing `installerCode` index already covers the login lookup.

### 2b. Installer registration flow update

**File:** `services/installers.ts`

When a team member creates an installer:
1. Generate a random 6-digit PIN
2. Hash it with bcrypt → store in `pin` field
3. Generate a UUID v4 → store in `shareToken` field
4. Immediately fire WhatsApp message with the plain-text PIN (see Phase 3a)
5. The PIN is **never shown** to the team member and **never returned** in any API response — it goes directly to the installer via WhatsApp

If WhatsApp fails to send, the team member sees a "Failed to send PIN" warning in the success dialog with a **"Resend PIN"** button that regenerates + re-sends.

### 2c. Auth mechanism (no NextAuth)

**Login page:** `app/auth/installer/page.tsx`
- Two fields: Installer Code + PIN (6 digits, `type="password"` input)
- Submit → server action:
  1. Find installer by `installerCode` (must use `.select('+pin')` since `pin` is hidden)
  2. **Rate limit check:** if `pinLockedUntil` is in the future, reject with "Too many attempts. Try again in X minutes."
  3. `bcrypt.compare(pin, installer.pin)` — if fail: increment `pinAttempts`. After 3 failed attempts, set `pinLockedUntil` to 15 min from now.
  4. If match → reset `pinAttempts` to 0, clear `pinLockedUntil`, sign a **JWT** using `jose` (already in NextAuth deps) with payload `{ installerId, installerCode, role: "INSTALLER" }`
  5. Set as httpOnly cookie named `installer_token` with 30-day expiry
  6. Redirect to `/my-stats`

**Logout:** Clear the `installer_token` cookie.

**Route protection helper:** `lib/installerAuth.ts`
- Reads `installer_token` cookie
- Verifies JWT
- Returns `{ installerId, installerCode }` or throws redirect to `/auth/installer`

### 2d. New routes

| Route | File | Auth | Purpose |
|---|---|---|---|
| `/auth/installer` | `app/auth/installer/page.tsx` | Public | Installer login form |
| `/my-stats` | `app/my-stats/page.tsx` | Cookie | Installer's private dashboard |
| `/installer/[installerCode]` | `app/installer/[installerCode]/page.tsx` | Public | Shareable profile page |
| `/api/installer/my-stats` | `app/api/installer/my-stats/route.ts` | Cookie | JSON endpoint for dashboard data |
| `/api/installer/logout` | `app/api/installer/logout/route.ts` | Cookie | Clear cookie, redirect to landing |

### 2e. `/my-stats` — Installer private dashboard

Layout: No sidebar, no top navbar. Clean minimal layout with:
- Header: installer name + code + "Share your page" button (copies `/installer/[code]` link)
- Stats cards (3 across): **Total Rewards** — **Paid** — **Pending** (all in Rs.)
- Installation history table: Product | Serial # | Date | Status (Paid/Pending) | Amount
- Referral section: if they referred anyone, show referred installer names + referral earnings
- WhatsApp opt-in toggle (optional)

Data fetching: `GET /api/installer/my-stats` — scoped to `installerId` from the cookie.

### 2f. `/installer/[installerCode]` — Public shareable page

No auth. Designed to look good when shared on WhatsApp.
- Installer name + company name
- City / district
- "Verified Installer" badge
- Stats: Total installations, Total rewards earned
- No sensitive info (no bank, no CNIC, no phone)

Data fetching: Server component — `Installer.findOne({ installerCode }).populate('rewards')`
Limited to non-sensitive fields only.

### 2g. Data scoping for API routes

**New helper:** `lib/installerAuth.ts`

```ts
export async function getInstallerFromCookie(): Promise<{ installerId: string; installerCode: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("installer_token");
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token.value, secret);
    return { installerId: payload.installerId as string, installerCode: payload.installerCode as string };
  } catch {
    return null;
  }
}
```

New API route `app/api/installer/my-stats/route.ts`:
- Uses `getInstallerFromCookie()` instead of `withAuth()`
- Queries `InstallerReward.find({ installer: installerId })` — only that installer's rewards
- No access to other installers' data

Existing team-member API routes are **unchanged** — `withAuth()` still checks NextAuth session.

### 2h. PIN management (edge cases)

| Scenario | Solution |
|---|---|
| WhatsApp failed, PIN never delivered | Team member clicks "Resend PIN" on installer detail page → server generates new PIN, hashes + stores it, re-sends via WhatsApp |
| Installer forgot PIN | Team member clicks "Reset PIN" → same as resend |
| Installer wants to change PIN | "Change PIN" option in `/my-stats` — requires current PIN + new PIN |
| Account locked (3 failed attempts) | Auto-unlocks after 15 min. Team member can also manually unlock from detail page |
| PIN exposure / security concern | Team member can reset at any time — old PIN is immediately invalidated |

---

## Phase 3: Wire WhatsApp Notifications

Connect the already-written (but never called) WhatsApp functions to actual triggers.

### 3a. Installer registration (PIN delivery — Path B)

**File:** `services/installers.ts` → inside `createInstaller()` (after `Installer.create()`)

The PIN is **never exposed to the team member**. It goes directly to the installer:

```ts
// Primary PIN delivery — WhatsApp is the only channel
if (process.env.META_WHATSAPP_ACCESS_TOKEN) {
  sendInstallerRegistrationMessage({
    fullName: installer.fullName,
    whatsappNumber: installer.whatsappNumber,
    installerCode: installer.installerCode,
    pin: plainTextPin,
  }, registeredById).catch(console.error);
} else {
  console.warn("WhatsApp not configured — PIN not delivered to installer", installer.installerCode);
}
```

If WhatsApp is not configured or the send fails, the registration response includes `{ whatsappFailed: true }`. The UI shows a warning: "Could not send PIN via WhatsApp. Click Resend to try again."

### 3b. Reward created

**File:** `app/api/rewards/route.ts` → POST handler (after `InstallerReward.create()`)

```ts
sendRewardPaymentMessage({...}, session.user.id).catch(console.error);
```

### 3c. Reward marked PAID

**File:** `app/api/rewards/[id]/route.ts` → PUT handler

```ts
if (newStatus === "Paid") {
  sendRewardPaymentMessage({...}, session.user.id).catch(console.error);
}
```

### 3d. Referral reward

**File:** `app/api/rewards/route.ts` → POST handler

```ts
if (rewardData.referrer) {
  sendReferralRewardMessage({...}, session.user.id).catch(console.error);
}
```

All sends should check `enableWhatsAppNotifications` setting before firing.

---

## Phase 4: Landing Page

**Goal:** Single-page marketing site at `/` for unauthenticated users. Authenticated users (team or installer) are redirected.

### Page structure

All components under `components/landing/`:

| Component | Purpose |
|---|---|
| `Header.tsx` | Sticky nav — logo, nav links, Sign In (team), Installer Login |
| `HeroSection.tsx` | Headline + subheadline + two CTAs + background |
| `StatsSection.tsx` | Animated counters (installers, installations, rewards paid) |
| `FeaturesSection.tsx` | Bento grid of 6 feature cards |
| `HowItWorksSection.tsx` | 3 steps: Onboard → Track → Grow |
| `ForInstallersSection.tsx` | Dedicated section: "Check your stats, share your profile" → link to `/auth/installer` |
| `CTASection.tsx` | Final call-to-action block |
| `Footer.tsx` | Logo + links + copyright |

### Auth logic in `app/page.tsx`

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LandingPage from "@/components/landing/LandingPage";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  // Installer cookie check happens client-side via a small wrapper
  // that reads document.cookie and redirects to /my-stats if installer_token exists
  return <LandingPage />;
}
```

A client component wrapper at the top of `LandingPage` checks for the installer cookie and redirects.

### Motion

Use the project's shared motion tokens (from `lib/motion.ts` or wherever they're defined — the `EASE_OUT`, `staggerContainer`, `slideUp`, `SPRING_LAYOUT` constants provided earlier).

No CSS files needed — use Tailwind v4 utilities + the existing `globals.css` variables (`brand-*`, `brandsec-*`, `--ease-fluid`).

### Design direction

- Light backgrounds with teal (`brand-*`) as bold accent
- Dark mode uses the existing `.dark` variables (atmospheric dark navy + teal glow)
- Saira font throughout
- Squircle shapes on feature cards (carried from dashboard)
- Framer Motion scroll-reveal animations using `EASE_OUT`

---

## Execution Order

```
Phase 1 (WhatsApp API)  ─┐
                         ├──→ Phase 3 (Wire WhatsApp)
Phase 2 (Installer Auth) ─┘
                              → Phase 4 (Landing Page)
```

**Rationale:** WhatsApp and Installer Auth are independent. Both must finish before WhatsApp can be wired. Landing page is last because it benefits from all other phases being functional.

---

## Env vars summary

```
# Meta WhatsApp Cloud API
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_ACCESS_TOKEN=
META_WHATSAPP_BUSINESS_ACCOUNT_ID=

# Installer JWT cookie secret (use same as NEXTAUTH_SECRET or separate)
INSTALLER_JWT_SECRET=
```
