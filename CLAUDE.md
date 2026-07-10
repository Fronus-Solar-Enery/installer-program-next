# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

Fronus Solar Energy's installer rewards program. Solar installers (in Pakistan — CNIC identity, local banks, PKR payments) register with the company, submit product serial numbers as reward claims, and get paid. Two audiences, two surfaces:

1. **Internal team dashboard** (`app/(dashboard)/`) — ADMIN/MANAGER/USER staff manage installers, rewards, products, reports, team members, and settings.
2. **Installer-facing pages** (`app/(standalone)/`) — installers sign in with their installer code + PIN to view their own stats. Outbound comms go through WhatsApp.

Plus a public marketing landing page (`app/(landing)/`, components in `components/landing-2026/`).

## Stack

Next.js 16 App Router (Turbopack) · React 19 · TypeScript 5 · MongoDB via Mongoose 8 · NextAuth v5 beta (JWT sessions) · TanStack Query 5 · Tailwind CSS v4 + shadcn/ui (Radix) · Zod 4 · `motion` 12 (animations) · Vitest 4 · Meta WhatsApp Cloud API · googleapis (Contacts sync) · ExcelJS (report exports).

All data access is server-side in API routes; the client uses TanStack Query for data fetching — never raw `fetch` in components.

## Commands

```bash
npm run dev          # Dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm test             # Vitest unit tests (run once)
npm run test:watch   # Vitest in watch mode
npm run test:db      # Test MongoDB connection and diagnose issues
npm run setup        # Generate NEXTAUTH_SECRET + create admin user
npm run setup:admin  # Create first admin user only
npm run setup:secret # Generate NEXTAUTH_SECRET only
npm run reset:admin  # Reset the admin user
npm run reset:pins   # Reset all installer PINs
npm run icondex      # Regenerate components/icons index
```

### Testing

Vitest unit tests live in `tests/` (`tests/**/*.test.ts`), config in `vitest.config.ts` (node env, tsconfig `@/` aliases). Coverage is intentionally narrow and load-bearing, not breadth-chasing: the pure helpers (`queryBuilder` incl. `escapeRegex`, `pagination`, `apiResponse` error mapping, `validation` Zod schemas, `bulkValidation`, `dateRange`, `constants`, `encryption`, `logger`) and — most valuably — the `withAuth` guard (asserts 401 signed-out / 403 wrong-role / handler runs when allowed), which turns a forgotten role check into a failing test. Tests that touch DB/network are avoided by mocking the seam (e.g. `vi.mock("@/lib/auth")`). Still missing (next steps): per-route auth-guard coverage and a Playwright sign-in→register e2e smoke test.

New non-trivial pure logic (parsing, validation, money/security paths) gets a test in `tests/` following the same pattern. UI components and DB-touching code do not get tests unless asked.

## Definition of done

Before calling any task finished:

1. `npm run lint` and `npm test` pass. For changes touching routing, models, or build config, `npm run build` must pass too.
2. Any new/changed API route: wrapped in `withAuth` (or installer-session check for installer routes), body parsed with a Zod schema before DB access, responses via `ApiResponse`, errors via `handleApiError`, `dbConnect()` called first.
3. New non-trivial pure logic has a unit test in `tests/`.
4. Frontend work reviewed against the UI/UX protocol below: both light and dark themes, responsive at mobile width, keyboard reachable, loading/empty/error states present.
5. No new `console.*` — use `logger`. No secrets or env values committed.
6. Lint may report warnings from the react-hooks compiler rules downgraded in `eslint.config.mjs` (~58 pre-existing) — never add new ones; fix them opportunistically when touching those files, and promote the rules back to `error` once clean.

## Architecture

Next.js 16 App Router application. MongoDB via Mongoose. NextAuth v5 (JWT sessions). Production runs on Vercel (serverless): no in-memory state survives across requests — rate limiting and batch-job progress are Mongo-backed for this reason — and long-running work must fit within function time limits (hence chunked batch-job processing).

### Route groups

- `app/(dashboard)/` — team-facing pages (dashboard, installers, rewards, reports, activity, batch-jobs, team, settings, profile). Its `layout.tsx` redirects unauthenticated users client-side — this is UX only, **not** security. The trust boundary is `withAuth` on the API routes.
- `app/(standalone)/` — installer-facing pages (`auth/`, `installer/[installerCode]`, `my-stats`) with their own minimal layout, no dashboard chrome.
- `app/(landing)/` — public marketing page, rendered from `components/landing-2026/`.
- `app/api/` — all API routes. Each resource folder contains `route.ts` for collection endpoints and `[id]/route.ts` for item endpoints.

### Key directories

- `services/` — per-aggregate orchestration (business rules + persistence + side-effect sync). Route handlers stay thin: auth + validate + call service + respond. Services throw typed errors (e.g. `InstallerServiceError` with an HTTP `status`) and stay HTTP-free; routes map those to `ApiResponse`. See `services/installers.ts` (the only service so far). **Standing goal:** extract `services/rewards.ts` next — when reward route business logic is touched, move it into a service following the installers pattern rather than growing the route handler. Beyond that, extract a new service only when a route handler's business logic outgrows "thin".
- `lib/` — shared server utilities (flat on purpose, see deferred triggers below).
- `models/` — Mongoose schemas. Use the `mongoose.models.X || mongoose.model('X', schema)` pattern to avoid model re-registration in dev.
- `components/` — client components (shadcn/ui base + custom). Icons are individual files under `components/icons/` (~127 custom icons + `components/icons/animated/`); check there before reaching for `lucide-react`, and never add a new icon that duplicates an existing one.
- `hooks/` — client hooks (entity list state, debounce, phone input, CNIC/referrer validation, etc.). Check here before writing a new hook.
- `contexts/` — React contexts: `BatchJobContext` (bulk operations progress), `BreadcrumbContext`.
- `scripts/` — Node maintenance scripts run via npm (admin/PIN resets, DB diagnostics, icon codegen).

### Auth & authorization — two separate systems

**Team members (staff):** `lib/auth.ts` exports `{ handlers, auth, signIn, signOut }` from NextAuth. `lib/authGuard.ts` exports `withAuth(handler, { roles? })` — a HOF that wraps API route handlers with session checks and role enforcement. Always use `withAuth` in API routes instead of calling `auth()` directly. Role hierarchy: `ADMIN > MANAGER > USER`. Use `hasRoleOrHigher()` from `authGuard.ts` for hierarchy checks.

**Installers:** completely separate from NextAuth. `lib/installerAuth.ts` issues a lightweight JWT in an httpOnly cookie (`installer_token`, 30 days), signed with `INSTALLER_JWT_SECRET` (falls back to `NEXTAUTH_SECRET`). Installers authenticate with installer code + PIN (`app/api/auth/verify-pin`). PINs are stored twice on the Installer model: a bcrypt hash for verification and an AES-256-GCM ciphertext (`pinEncrypted`) so ADMIN/MANAGER can reveal them; both are hidden from queries by default. PIN verification is rate-limited and lock-out protected (`pinAttempts`, `pinLockedUntil`).

Installer-facing API routes (`app/api/installer/*`) read the session via `getInstallerFromCookie()` — they are not `withAuth` routes. Never mix the two systems.

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

### Deferred scaling triggers

Two known architecture debts are intentionally deferred — fine at current scale, revisit only when the trigger fires. Do **not** pre-build these:

- **`lib/` grouping** — flat today. When file count roughly doubles (~2-3x), split into `lib/db/`, `lib/integrations/`, `lib/http/`, `lib/domain/`. Mechanical (file moves + import fixes), no new abstraction.
- **Model-access seam** — modules import Mongoose models directly (`import Installer from "@/models/Installer"`). Introduce a repository/DI layer only when a concrete need lands (caching, read replica). Until then, direct imports stay.

### Bulk operations

Batch jobs (`models/BatchJob.ts`, `app/api/batch-jobs/`) handle async bulk register/update/delete for installers and rewards. Frontend tracks progress via `BatchJobContext` + SSE or polling. Bulk inputs are pre-validated via the `validate-bulk*` routes and `lib/bulkValidation.ts` before a job is created.

### WhatsApp (Meta Cloud API)

`lib/whatsappService.ts` sends **free-form messages only** — no templates. Free-form sends work only inside the 24-hour customer-service window, which opens/resets when the installer messages us (tracked as `lastCustomerMessageAt` on the Installer model, updated by the inbound webhook at `app/api/webhook/whatsapp/`). Outside the window the send is blocked with a clear error for UI fallback; error 131047 means the window expired mid-send. Do not add template messaging or retry-past-window logic without asking. Phone numbers always go through `lib/phoneUtils.ts` (`normalizePhone`, `whatsappStorageFormat`) — never hand-format them.

### Google Contacts sync

`lib/googleContacts.ts` — optional integration. Syncs installer records to Google Contacts using OAuth refresh token. Installer model stores `googleContactId` for update/delete sync.

### Activity log

`lib/activityLogger.ts` exports `logActivity()` — fire-and-forget audit trail to `models/Activity.ts`, surfaced on the dashboard activity page. It never throws (logging must not break the main flow). Call it from services/routes for mutations that staff would want an audit trail for (register, update, delete, PIN actions, WhatsApp sends).

### Rate limiting

`lib/rateLimit.ts` — Mongo-backed sliding-window limiter (`isRateLimited` / `recordFailedAttempt`), stateless across processes so it works on serverless. Count only **failed** attempts so legitimate users are never locked out. Use it for anything guessable (PIN verify, password reset).

### Logging

Use `logger` from `lib/logger.ts` (`logger.error/warn/info/debug(message, context?)`) instead of `console.*`. Output is line-delimited JSON in production (aggregator-friendly), readable in dev; level via `LOG_LEVEL` (default `info` prod / `debug` dev). Every API route error already flows through it via `handleApiError`; the `error.tsx`/`global-error.tsx` boundaries route through it too. To enable an external error tracker (Sentry/Bugsnag/…), call `setErrorReporter(reporter)` once at startup (e.g. Next.js `instrumentation.ts`) — every `logger.error` forwards automatically, no call-site changes. Remaining raw `console.*` sites can migrate incrementally.

### Environment variables

Required: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`

Optional:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (OAuth login), `GOOGLE_CONTACTS_CLIENT_ID`, `GOOGLE_CONTACTS_CLIENT_SECRET` (contacts sync; falls back to the plain `GOOGLE_*` pair)
- `GMAIL_USER` + `GMAIL_APP_PASSWORD`, or `EMAIL_HOST`/`EMAIL_PORT`/`EMAIL_SECURE`/`EMAIL_USER`/`EMAIL_PASSWORD`/`EMAIL_FROM` (forgot-password email)
- `INSTALLER_JWT_SECRET` (installer session signing; falls back to `NEXTAUTH_SECRET`)
- `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WHATSAPP_ACCESS_TOKEN` (sending), `META_WHATSAPP_VERIFY_TOKEN`, `META_WHATSAPP_APP_SECRET` (inbound webhook)

Required once Google Contacts is used: `TOKEN_ENCRYPTION_KEY` — 32-byte base64/hex key (`openssl rand -base64 32`) used by `lib/encryption.ts` (AES-256-GCM) to encrypt the stored Google OAuth refresh/access tokens at rest (and installer `pinEncrypted` values). Keep it in the deployment's secret store, **separate from `MONGODB_URI`**, so DB read access alone can't decrypt the tokens. Tokens are encrypted in `google-auth/callback` on write and decrypted only in `getAuthClient()`; values written before this key existed stay as legacy plaintext until the next OAuth re-auth.

### Validation

Zod schemas in `lib/validation.ts` and `lib/validation-helpers.ts`. API routes parse request bodies with these schemas before touching the database. `validateRequest` from `lib/validateRequest.ts` wraps the parse and returns formatted errors. When user input feeds a Mongo regex query, escape it with `escapeRegex` from `lib/queryBuilder.ts`.

### Styling

Tailwind CSS v4 with shadcn/ui components. Fonts (all wired as CSS variables in `app/layout.tsx`): Saira (`--font-saira`, primary UI), Geist (`--font-geist`), and local Bloxat (`--font-bloxat`, display). Theme: `next-themes` with `ThemeProvider` — every UI change must look right in both light and dark. Toast notifications via `sonner`.

### UI/UX & Frontend Design Implementation Protocol

- **Design Quality:** ALWAYS produce production-ready, premium-quality interfaces that follow modern UI/UX principles. Prioritize clarity, usability, accessibility, visual hierarchy, consistency, and responsiveness over decorative elements.
- **Component Philosophy:** Build reusable, composable, scalable, and maintainable components. Avoid duplication and ensure consistent spacing, typography, colors, states, and interaction patterns throughout the application.
- **Frontend Standards:** Follow modern frontend best practices, emphasizing semantic HTML, accessibility (WCAG), responsive layouts, performance optimization, and clean component architecture.
- **Visual Consistency:** Maintain a cohesive design language including spacing system, typography scale, color palette, border radius, shadows, elevation, icons, and interactive states across the entire application.
- **Responsive First:** Design and implement mobile-first layouts that adapt gracefully across all screen sizes without breaking hierarchy, usability, or visual balance.
- **Accessibility:** Ensure keyboard navigation, focus management, ARIA attributes where necessary, sufficient color contrast, reduced motion support, proper touch targets, and semantic structure by default.
- **Interaction Design:** Design intuitive user flows with meaningful feedback, loading states, empty states, validation, skeleton loaders, hover/focus/active states, and graceful error handling.
- **Performance:** Prefer lightweight implementations, minimize layout shifts, optimize rendering, lazy-load where appropriate, and avoid unnecessary complexity or excessive DOM depth.
- **Design System Compliance:** Reuse existing design tokens, utilities, components, and patterns whenever possible instead of introducing new variations without justification.
- **Review Requirement:** Before completing any frontend task, review the implementation for visual consistency, accessibility, responsiveness, maintainability, performance, and overall user experience.

#### Required Skills

You must actively reference and apply the principles from the following skill modules whenever designing, implementing, reviewing, or refactoring frontend or UI/UX code:

- `@.agents/skills/gpt-taste/SKILL.md`
- `@.agents/skills/high-end-visual-design/SKILL.md`
- `/ui-ux-pro-max`
- `/frontend-design`

### Animation Implementation Protocol

- **Library:** `motion` (v12) is the animation library — use spring transitions. GSAP (+ `@gsap/react`, eases in `lib/gsapEases.ts`) survives in a couple of legacy layout spots; do not introduce it into new work.
- **Motion Mechanics:** ALWAYS implement physics-based animations (e.g., springs, inertia) instead of fixed-duration, time-based animations to ensure maximum fluidity and organic responsiveness. Respect `prefers-reduced-motion`.
- **Required Skills:** You must actively reference and apply the principles from the following skill modules whenever writing, planning, or reviewing animation code:
  - `@.agents/skills/animation-vocabulary/SKILL.md`
  - `@.agents/skills/emil-design-eng/SKILL.md`
  - `@.agents/skills/review-animations/SKILL.md`

## IMPORTANT

- ALWAYS ASK CLARIFYING QUESTIONS IF ANY INSTRUCTIONS ARE UNCLEAR. NEVER ASSUME ANYTHING.
- IF YOU THINK ORIGINAL INSTRUCTIONS ARE INCOMPLETE OR INCORRECT, **DO NOT** GUESS. **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
- IF ORIGINAL INSTRUCTIONS ARE AMBIGUOUS OR OPEN TO MULTIPLE INTERPRETATIONS, **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
