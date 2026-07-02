# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run test:db      # Test MongoDB connection and diagnose issues
npm run setup        # Generate NEXTAUTH_SECRET + create admin user
npm run setup:admin  # Create first admin user only
npm run setup:secret # Generate NEXTAUTH_SECRET only
```

No test suite exists. Lint is the only automated code check.

## Architecture

Next.js 15 App Router application. MongoDB via Mongoose. NextAuth v5 (JWT sessions). All data access is server-side in API routes; the client uses TanStack Query for data fetching.

### Key directories

- `app/api/` — All API routes. Each resource folder contains `route.ts` for collection endpoints and `[id]/route.ts` for item endpoints.
- `app/(pages)/` — Page components. Auth-protected pages rely on `AppLayout` to enforce session.
- `lib/` — Shared server utilities.
- `models/` — Mongoose schemas. Use the `mongoose.models.X || mongoose.model('X', schema)` pattern to avoid model re-registration in dev.
- `components/` — Client components (shadcn/ui base + custom). Icons are individual files under `components/icons/`.
- `contexts/` — React contexts: `BatchJobContext` (bulk operations progress), `BreadcrumbContext`.

### Auth & authorization

`lib/auth.ts` exports `{ handlers, auth, signIn, signOut }` from NextAuth. `lib/authGuard.ts` exports `withAuth(handler, { roles? })` — a HOF that wraps API route handlers with session checks and role enforcement. Always use `withAuth` in API routes instead of calling `auth()` directly.

Role hierarchy: `ADMIN > MANAGER > USER`. Use `hasRoleOrHigher()` from `authGuard.ts` for hierarchy checks.

### API response pattern

All API routes use `ApiResponse` from `lib/apiResponse.ts`:

- `ApiResponse.success(data, message?)` → 200
- `ApiResponse.badRequest(message, fieldErrors?)` → 400
- `ApiResponse.notFound(message?)` → 404
- `ApiResponse.conflict(message?)` → 409
- `ApiResponse.serverError()` → 500

Use `handleApiError(error)` in catch blocks — it handles Zod errors, Mongoose validation, MongoDB duplicate key (11000), and CastError automatically.

### Database connection

`lib/mongodb.ts` exports `dbConnect()` — cached singleton with connection pooling. Call at the top of every API route handler. Connection is lazy (first request triggers it). Verbose diagnostic logging in dev mode.

### Bulk operations

Batch jobs (`models/BatchJob.ts`, `app/api/batch-jobs/`) handle async bulk register/update/delete for installers and rewards. Frontend tracks progress via `BatchJobContext` + SSE or polling.

### Google Contacts sync

`lib/googleContacts.ts` — optional integration. Syncs installer records to Google Contacts using OAuth refresh token. Installer model stores `googleContactId` for update/delete sync.

### Environment variables

Required: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (OAuth login), `GOOGLE_CONTACTS_*` (contacts sync), `GMAIL_USER` + `GMAIL_APP_PASSWORD` (forgot-password email)

### Validation

Zod schemas in `lib/validation.ts` and `lib/validation-helpers.ts`. API routes parse request bodies with these schemas before touching the database. `validateRequest` from `lib/validateRequest.ts` wraps the parse and returns formatted errors.

### Styling

Tailwind CSS v4 with shadcn/ui components. Font: Saira (Google Fonts). Theme: `next-themes` with `ThemeProvider`. Toast notifications via `sonner`.

## IMPORTANT

- ALWAYS ASK CLARIFYING QUESTIONS IF ANY INSTRUCTIONS ARE UNCLEAR. NEVER ASSUME ANYTHING.
- IF YOU THINK ORIGINAL INSTRUCTIONS ARE INCOMPLETE OR INCORRECT, **DO NOT** GUESS. **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
- IF ORIGINAL INSTRUCTIONS ARE AMBIGUOUS OR OPEN TO MULTIPLE INTERPRETATIONS, **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
