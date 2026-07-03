# IPMS — Installer Program Management System (Fronus)

Next.js 15 (App Router) app for managing installer programs: installer registration, reward/payment tracking, team management with role-based access, and reporting.

This README is the single source of truth for setup and structure. See [CLAUDE.md](./CLAUDE.md) for architecture/coding conventions used by AI assistants working in this repo.

## Tech Stack

- **Next.js 15** (App Router, Turbopack dev/build) + **React 19** + **TypeScript**
- **MongoDB & Mongoose** — data layer
- **NextAuth.js v5** (beta, JWT sessions) — credentials + Google OAuth login
- **TanStack Query** — client-side data fetching
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives) — styling/components
- **Zod** — schema validation
- **XLSX** — Excel report export
- **Nodemailer** — forgot-password email (Gmail or generic SMTP)
- **Twilio / CallMeBot** — optional WhatsApp notifications (`lib/whatsappService.ts`)
- **Google People API** — optional installer → Google Contacts sync

No automated test suite. `npm run lint` (ESLint) is the only automated check.

## Project Structure

```
app/
  api/                  # All API routes (route.ts per resource, [id]/route.ts for item ops)
  activity/             # Activity log page
  auth/                 # Sign-in, auth error pages
  batch-jobs/           # Bulk operation progress page
  dashboard/            # Dashboard page
  installers/           # Installer list, register, bulk-register, [id] detail
  layout/                # AppLayout (enforces session on protected pages)
  profile/               # User profile page
  reports/               # Reports page
  rewards/               # Reward list, register, bulk-register, bulk-update, [id] detail
  settings/              # App settings page
  team/                  # Team management page
components/
  icons/                 # Individual icon components (incl. components/icons/animated/)
  installers/            # Installer-specific components
  registration/          # Registration form components
  ui/                    # shadcn/ui base components
contexts/
  BatchJobContext.tsx    # Bulk operation progress state (SSE/polling)
  BreadcrumbContext.tsx
lib/                     # Shared server/client utilities (see below)
models/                  # Mongoose schemas
scripts/                 # Node scripts run via npm run setup*/test:db etc.
types/                   # Shared TypeScript types
proxy.ts                 # Next.js proxy/middleware config
instrumentation.ts       # Next.js instrumentation hook (dev-only DNS override for MongoDB SRV lookups)
```

### `lib/` reference

| File | Purpose |
|---|---|
| `auth.ts` | NextAuth config — exports `{ handlers, auth, signIn, signOut }` |
| `authGuard.ts` | `withAuth(handler, { roles? })` HOF — use in every API route instead of calling `auth()` directly |
| `apiResponse.ts` | `ApiResponse` class + `handleApiError()` — standard API response shapes |
| `mongodb.ts` | `dbConnect()` — cached Mongoose connection singleton |
| `validation.ts`, `validation-helpers.ts` | Zod schemas |
| `validateRequest.ts` | Wraps Zod parsing, returns formatted field errors |
| `activityLogger.ts` | Writes to the `Activity` model (audit log) |
| `googleContacts.ts` | Google Contacts sync (OAuth refresh token flow) |
| `whatsappService.ts` | WhatsApp notifications via Twilio or CallMeBot |
| `email.ts` | Forgot-password PIN email sending |
| `queryBuilder.ts`, `pagination.ts`, `queryHelpers.ts` | Mongo filter/sort/pagination helpers for list endpoints |
| `queryClient.ts` | TanStack Query client config |
| `constants.ts`, `formatNumber.ts`, `getInitials.ts`, `getRelativeTime.ts`, `installerUtils.ts`, `registration-styles.ts`, `requestUtils.ts`, `utils.ts` | Misc formatting/UI helpers |

### `models/` reference

`Activity`, `BatchJob`, `GoogleAuth`, `Installer`, `InstallerReward`, `PasswordReset`, `Settings`, `TeamMember`. All use the `mongoose.models.X || mongoose.model('X', schema)` pattern to survive dev hot-reload.

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB instance (local or [Atlas](https://www.mongodb.com/cloud/atlas))

### Setup

```bash
npm install

# create .env.local with at least MONGODB_URI, NEXTAUTH_SECRET, NEXTAUTH_URL (see below)

npm run setup:secret  # prints a NEXTAUTH_SECRET to paste into .env.local
npm run setup:admin   # creates a first ADMIN user (scripts/createAdmin.js)
npm run dev           # http://localhost:3000
```

`npm run setup:admin` / `npm run reset:admin` default to `admin@example.com` / `admin123` (override via `node scripts/createAdmin.js <email> <password> <name>`) — read the script before running against a shared/production database, since defaults are hardcoded.

### Environment Variables

Required:

```env
MONGODB_URI=mongodb://localhost:27017/installer_program   # or mongodb+srv://... for Atlas
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

Optional — Google OAuth login:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Optional — Google Contacts sync (installer → Google Contacts):

```env
GOOGLE_CONTACTS_CLIENT_ID=
GOOGLE_CONTACTS_CLIENT_SECRET=
```

The Google Contacts refresh token is obtained through the in-app OAuth flow (Admin → authenticate Google Contacts) and stored encrypted in the database — it is not an environment variable.

Optional — forgot-password email, via Gmail:

```env
GMAIL_USER=
GMAIL_APP_PASSWORD=
```

...or generic SMTP:

```env
EMAIL_HOST=
EMAIL_PORT=
EMAIL_SECURE=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=
```

Optional — WhatsApp notifications:

```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
# or
CALLMEBOT_API_KEY=
```

Debug:

```env
NEXTAUTH_DEBUG=
```

**Never commit real credentials to this file or to `.env.local`.**

## Commands

```bash
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm start            # Production server
npm run lint         # ESLint

npm run setup         # setup:secret + setup:admin
npm run setup:secret  # Generate a NEXTAUTH_SECRET (scripts/generateSecret.js)
npm run setup:admin   # Seed first admin user (scripts/createAdmin.js)
npm run reset:admin   # Reset/create admin password (scripts/resetAdmin.js)
npm run test:db       # Diagnose MongoDB connection (scripts/testDbConnection.js)

npm run icondex       # Regenerate icon index (scripts/icondex.mjs)
npm run removeprops   # Strip injected icon className props (scripts/remove-iconprops.js)
```

## Authentication & Roles

- Credentials (email/password) and Google OAuth login via NextAuth v5, JWT sessions.
- Forgot password: 6-digit PIN emailed, expires in 10 minutes, single-use, stored via `PasswordReset` model with a MongoDB TTL index for auto-cleanup.
- Role hierarchy: `ADMIN > MANAGER > USER`, enforced in API routes via `withAuth(handler, { roles })` and `hasRoleOrHigher()` (`lib/authGuard.ts`).

| Action | ADMIN | MANAGER | USER |
|---|---|---|---|
| Register installers / rewards | ✅ | ✅ | ✅ |
| Update own profile | ✅ | ✅ | ✅ |
| Register team member | Any role | MANAGER/USER only | ❌ |
| Update/delete team members | ✅ | ✅ (not ADMIN) | ❌ |
| Delete installers / rewards | ✅ | ✅ | ❌ |

## API Routes

All routes live under `app/api/`, use `dbConnect()`, `withAuth()`, Zod validation, and the `ApiResponse` / `handleApiError` conventions from `lib/`.

### Auth
- `POST /api/auth/forgot-password` — request reset PIN
- `POST /api/auth/verify-pin` — verify PIN
- `POST /api/auth/reset-password` — verify PIN + set new password
- `[...nextauth]` — NextAuth sign-in/session handlers

### Team
- `GET /api/team` — list team members
- `POST /api/team` — register new member (role restrictions per hierarchy above)
- `GET /api/team/[id]` / `PUT` / `DELETE`
- `PUT /api/team/profile` — update own profile
- `PUT /api/team/change-password`

### Installers
- `GET/POST /api/installers` — list (filtered/paginated) / register
- `GET/PUT/DELETE /api/installers/[id]`
- `POST /api/installers/bulk-register`, `/api/installers/bulk-delete`, `/api/installers/validate-bulk`

### Rewards
- `GET/POST /api/rewards` — list (filtered/paginated) / register
- `GET/PUT/DELETE /api/rewards/[id]`
- `GET /api/rewards/check-serial` — validate inverter serial number status
- `POST /api/rewards/bulk-register`, `/api/rewards/bulk-update`, `/api/rewards/bulk-delete`, `/api/rewards/validate-bulk`, `/api/rewards/validate-bulk-register`

### Batch Jobs
- `GET/POST /api/batch-jobs`, `GET /api/batch-jobs/[id]`, `POST /api/batch-jobs/process` — async bulk-operation tracking (backs installer/reward bulk endpoints; progress surfaced via `BatchJobContext`)

### Dashboard
- `GET /api/dashboard/active-installers`
- `GET /api/dashboard/installers-by-center`
- `GET /api/dashboard/active-by-training-center`

### Reports (JSON or Excel export)
- `GET /api/reports/installers`
- `GET /api/reports/rewards`
- `GET /api/reports/non-certified-installers`
- `GET /api/reports/payment-format` — Excel formatted for bulk payment processing

### Google Contacts
- `GET /api/google-auth/initiate`, `GET /api/google-auth/callback`, `GET /api/google-auth/status`, `DELETE /api/google-auth/status` — OAuth flow to obtain/manage the Google Contacts refresh token

### Misc
- `GET /api/activities` — audit log feed
- `GET /api/search` — global search (admin-guarded)
- `GET/PUT /api/settings` — app settings
- `GET /api/health/db` — DB connection health check (admin only)

## Development Notes

- `instrumentation.ts` applies a DNS resolver override for MongoDB `mongodb+srv://` lookups in **development only** — do not rely on it in production.
- Icon components are generated/managed via `scripts/icondex.mjs` (`npm run icondex`); one-off icon files live under `components/icons/`.

## License

Proprietary — All rights reserved.
