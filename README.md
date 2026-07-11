# IPMS — Installer Program Management System (Fronus)

Next.js 16 (App Router) app for managing solar installer programs: registration, reward/payment tracking, team management with role-based access, and reporting.

This README is the single source of truth for setup and structure. See [CLAUDE.md](./CLAUDE.md) for architecture/coding conventions. See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for system architecture diagrams.

## Tech Stack

- **Next.js 16** (App Router, Turbopack dev/build) + **React 19** + **TypeScript 5**
- **MongoDB & Mongoose 8** — data layer with 10 models
- **NextAuth.js v5** (beta, JWT sessions) — credentials login with role-based access
- **TanStack Query v5** — client-side data fetching (30s stale, 5m gc)
- **Tailwind CSS v4** + **shadcn/ui** (Radix primitives) — styling/components
- **Zod 4** — schema validation
- **React Hook Form** — form management
- **Framer Motion** + **GSAP** + **Lenis** — animations and smooth scrolling
- **Three.js** — 3D rendering
- **Recharts** — dashboard charts
- **ExcelJS** — Excel report export
- **Nodemailer** — forgot-password email (Gmail or generic SMTP)
- **Meta WhatsApp Cloud API** — installer PIN delivery (free-form messages)
- **Google People API** — optional installer → Google Contacts sync

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for complete system diagrams covering all 5 layers:

1. **Client** — Browsers, React Client Components, React Query cache, Suspense boundaries
2. **Rendering & Framework** — App Router route groups, RSC, Server Actions, 15 API routes
3. **Data Access & Caching** — Mongoose singleton, connection pooling, cache hierarchy
4. **External Services** — MongoDB Atlas, NextAuth, WhatsApp, Google Contacts, Nodemailer
5. **Infrastructure** — Vercel Edge, GitHub CI/CD, Vitest, ESLint

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

Optional — WhatsApp notifications (Meta Cloud API):

```env
META_WHATSAPP_PHONE_NUMBER_ID=
META_WHATSAPP_ACCESS_TOKEN=
```

See [docs/WHATSAPP-API-SETUP.md](./docs/WHATSAPP-API-SETUP.md) for full WhatsApp setup guide.

Debug:

```env
NEXTAUTH_DEBUG=
```

**Never commit real credentials to this file or to `.env.local`.**

## Project Structure

```
app/
  (dashboard)/              # Auth-protected pages (sidebar + navbar shell)
    activity/               # Activity log page
    batch-jobs/             # Bulk operation progress page
    dashboard/              # Dashboard page
    installers/             # Installer list, register, bulk-register, [id] detail
    profile/                # User profile page
    reports/                # Reports page
    rewards/                # Reward list, register, bulk-register, bulk-update, [id] detail
    settings/               # App settings page
    team/                   # Team management page
    layout.tsx              # Dashboard shell (Sidebar + TopNavbar)
  (landing)/                # Public marketing page
    page.tsx
    layout.tsx
  (standalone)/             # Standalone pages with own layout
    auth/                   # Sign-in, auth error pages
    installer/              # Installer portal ([id] detail)
    my-stats/               # Public stats page
    layout.tsx
  api/                      # 15 API resource directories
  layout/                   # Shared layout components (Sidebar.tsx, TopNavbar.tsx)
  my-stats/                 # Stats dashboard
  layout.tsx                # Root layout (fonts, providers, theme)
  providers.tsx             # Client providers (Session, QueryClient, Toaster)
  globals.css
  error.tsx / global-error.tsx / loading.tsx / not-found.tsx
components/
  ui/                       # 44 shadcn/ui base components
  icons/                    # 128 individual icon components (incl. animated/)
  installers/               # Installer-specific components (table row, stats cards)
  registration/             # Registration form components
  landing/             # Landing page (Hero, Testimonials, Video, FAQ)
contexts/
  BatchJobContext.tsx       # Bulk operation progress state (SSE/polling)
  BreadcrumbContext.tsx
hooks/                      # 16 custom React hooks
lib/                        # 33 shared server/client utilities (see below)
models/                     # 10 Mongoose schemas
services/                   # Business logic orchestration layer
scripts/                    # Node scripts (setup, admin, diagnostics)
tests/                      # 8 Vitest unit test files
types/                      # Shared TypeScript types
proxy.ts                    # Next.js middleware (auth redirect for protected routes)
instrumentation.ts          # Next.js instrumentation (dev-only DNS override for MongoDB SRV)
```

### `lib/` reference

| File                                                                                                                               | Purpose                                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `auth.ts`                                                                                                                          | NextAuth config — exports `{ handlers, auth, signIn, signOut }`                                   |
| `authGuard.ts`                                                                                                                     | `withAuth(handler, { roles? })` HOF — use in every API route instead of calling `auth()` directly |
| `apiResponse.ts`                                                                                                                   | `ApiResponse` class + `handleApiError()` — standard API response shapes                           |
| `mongodb.ts`                                                                                                                       | `dbConnect()` — cached Mongoose connection singleton                                              |
| `validation.ts`, `validation-helpers.ts`                                                                                           | Zod schemas                                                                                       |
| `validateRequest.ts`                                                                                                               | Wraps Zod parsing, returns formatted field errors                                                 |
| `activityLogger.ts`                                                                                                                | Writes to the `Activity` model (audit log)                                                        |
| `googleContacts.ts`                                                                                                                | Google Contacts sync (OAuth refresh token flow)                                                   |
| `whatsappService.ts`                                                                                                               | WhatsApp notifications via Meta Cloud API (free-form messages)                                    |
| `whatsapp.ts`                                                                                                                      | WhatsApp message formatting utilities                                                             |
| `email.ts`                                                                                                                         | Forgot-password PIN email sending                                                                 |
| `encryption.ts`                                                                                                                    | Encryption utilities for sensitive data                                                           |
| `rateLimit.ts`                                                                                                                     | Rate limiting for login attempts and API calls                                                    |
| `queryBuilder.ts`, `pagination.ts`, `queryHelpers.ts`                                                                              | Mongo filter/sort/pagination helpers for list endpoints                                           |
| `queryClient.ts`                                                                                                                   | TanStack Query client config                                                                      |
| `installerUtils.ts`                                                                                                                | Installer-specific utilities                                                                      |
| `installerAuth.ts`                                                                                                                 | Installer authentication helpers                                                                  |
| `phoneUtils.ts`                                                                                                                    | Phone number normalization                                                                        |
| `requestUtils.ts`                                                                                                                  | Request info extraction (IP, user agent)                                                          |
| `gsapEases.ts`, `motion.ts`                                                                                                        | Animation configuration                                                                           |
| `constants.ts`, `formatNumber.ts`, `getInitials.ts`, `getRelativeTime.ts`, `registration-styles.ts`, `requestUtils.ts`, `utils.ts` | Misc formatting/UI helpers                                                                        |

### `models/` reference

| Model             | Collection        | Key Fields                                   |
| ----------------- | ----------------- | -------------------------------------------- |
| `TeamMember`      | team_members      | email, password, role, name                  |
| `Installer`       | installers        | installerCode, pin, fullName, whatsappNumber |
| `InstallerReward` | installer_rewards | installer, amount, serialNumber              |
| `Product`         | products          | name, category, isActive                     |
| `Settings`        | settings          | enableWhatsAppNotifications, maxReferrals    |
| `Activity`        | activities        | type, performedBy, targetType, changes       |
| `BatchJob`        | batch_jobs        | status, progress, results                    |
| `GoogleAuth`      | google_auths      | accessToken, refreshToken, expiry            |
| `RateLimit`       | rate_limits       | key, attempts, windowStart                   |
| `PasswordReset`   | password_resets   | email, pin, expiresAt                        |

All models use the `mongoose.models.X || mongoose.model('X', schema)` pattern to survive dev hot-reload.

### `services/` reference

| File            | Purpose                                                                                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `installers.ts` | Business logic orchestration — `createInstaller`, `updateInstaller`, `deleteInstaller`, `regenerateAndSendPin` — handles referral limits, Google Contacts sync, WhatsApp PIN delivery, activity logging |

## Authentication & Roles

- Credentials (email/password) login via NextAuth v5, JWT sessions (30-day expiry).
- Forgot password: 6-digit PIN emailed, expires in 10 minutes, single-use, stored via `PasswordReset` model with a MongoDB TTL index for auto-cleanup.
- Login throttling: 5 failed attempts per (email, IP) within 10 minutes.
- Role hierarchy: `ADMIN > MANAGER > USER`, enforced in API routes via `withAuth(handler, { roles })` and `hasRoleOrHigher()` (`lib/authGuard.ts`).

| Action                        | ADMIN    | MANAGER           | USER |
| ----------------------------- | -------- | ----------------- | ---- |
| Register installers / rewards | ✅       | ✅                | ✅   |
| Update own profile            | ✅       | ✅                | ✅   |
| Register team member          | Any role | MANAGER/USER only | ❌   |
| Update/delete team members    | ✅       | ✅ (not ADMIN)    | ❌   |
| Delete installers / rewards   | ✅       | ✅                | ❌   |

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
- `GET /api/health` — health check

## Commands

```bash
# Development
npm run dev          # Dev server (Turbopack)
npm run build        # Production build
npm run build:turbo  # Production build with Turbopack
npm start            # Production server
npm run lint         # ESLint

# Testing
npm run test         # Run Vitest (single run)
npm run test:watch   # Run Vitest (watch mode)

# Setup
npm run setup         # setup:secret + setup:admin
npm run setup:secret  # Generate a NEXTAUTH_SECRET (scripts/generateSecret.js)
npm run setup:admin   # Seed first admin user (scripts/createAdmin.js)
npm run reset:admin   # Reset/create admin password (scripts/resetAdmin.js)
npm run test:db       # Diagnose MongoDB connection (scripts/testDbConnection.js)

# Utilities
npm run icondex       # Regenerate icon index (scripts/icondex.mjs)
npm run removeprops   # Strip injected icon className props (scripts/remove-iconprops.js)
```

## Testing

Unit tests use [Vitest](https://vitest.dev/) and live in `tests/`. Run with:

```bash
npm run test         # Single run
npm run test:watch   # Watch mode
```

Current test coverage:

| Test File              | Tests                         |
| ---------------------- | ----------------------------- |
| `apiResponse.test.ts`  | ApiResponse class formatting  |
| `authGuard.test.ts`    | withAuth HOF role enforcement |
| `constants.test.ts`    | Application constants         |
| `encryption.test.ts`   | Encryption utilities          |
| `logger.test.ts`       | Structured logging            |
| `pagination.test.ts`   | Pagination helpers            |
| `queryBuilder.test.ts` | MongoDB query builder         |
| `validation.test.ts`   | Zod schema validation         |

## Deployment

This app is designed for [Vercel](https://vercel.com) deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard (same as `.env.local` vars above)
3. Vercel auto-detects Next.js and deploys with optimal settings
4. Edge middleware runs on Vercel's Edge Network
5. Serverless functions handle API routes and Server Components
6. Static pages (landing, /my-stats) are served from CDN

For WhatsApp integration, see [docs/WHATSAPP-API-SETUP.md](./docs/WHATSAPP-API-SETUP.md).

## Development Notes

- `instrumentation.ts` applies a DNS resolver override for MongoDB `mongodb+srv://` lookups in **development only** — do not rely on it in production.
- Icon components are generated/managed via `scripts/icondex.mjs` (`npm run icondex`); one-off icon files live under `components/icons/`.
- The app uses three route groups in `app/`: `(dashboard)` for auth-protected pages, `(landing)` for the public marketing page, and `(standalone)` for pages with their own layout (auth, installer portal, stats).
- Middleware (`proxy.ts`) only checks for cookie presence at the Edge — full JWT validation and role checks happen in API routes via `withAuth()`.

## License

Proprietary — All rights reserved.
