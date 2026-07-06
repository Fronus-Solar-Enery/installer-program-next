# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
```

### Testing

Vitest unit tests live in `tests/` (`tests/**/*.test.ts`), config in `vitest.config.ts` (node env, tsconfig `@/` aliases). Coverage is intentionally narrow and load-bearing, not breadth-chasing: the pure helpers (`queryBuilder` incl. `escapeRegex`, `pagination`, `apiResponse` error mapping, `validation` Zod schemas, `encryption`, `logger`) and — most valuably — the `withAuth` guard (asserts 401 signed-out / 403 wrong-role / handler runs when allowed), which turns a forgotten role check into a failing test. Tests that touch DB/network are avoided by mocking the seam (e.g. `vi.mock("@/lib/auth")`). Still missing (next steps): per-route auth-guard coverage and a Playwright sign-in→register e2e smoke test.

## Architecture

Next.js 15 App Router application. MongoDB via Mongoose. NextAuth v5 (JWT sessions). All data access is server-side in API routes; the client uses TanStack Query for data fetching.

### Key directories

- `app/api/` — All API routes. Each resource folder contains `route.ts` for collection endpoints and `[id]/route.ts` for item endpoints.
- `app/(pages)/` — Page components. Auth-protected pages rely on `AppLayout` to enforce session.
- `services/` — Per-aggregate orchestration (business rules + persistence + side-effect sync). Route handlers stay thin: auth + validate + call service + respond. Services throw typed errors (e.g. `InstallerServiceError` with an HTTP `status`) and stay HTTP-free; routes map those to `ApiResponse`. See `services/installers.ts`.
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

### Deferred scaling triggers

Two known architecture debts are intentionally deferred — fine at current scale, revisit only when the trigger fires. Do **not** pre-build these:

- **`lib/` grouping** — flat today. When file count roughly doubles (~2-3x), split into `lib/db/`, `lib/integrations/`, `lib/http/`, `lib/domain/`. Mechanical (file moves + import fixes), no new abstraction.
- **Model-access seam** — modules import Mongoose models directly (`import Installer from "@/models/Installer"`). Introduce a repository/DI layer only when a concrete need lands (caching, read replica). Until then, direct imports stay.

### Bulk operations

Batch jobs (`models/BatchJob.ts`, `app/api/batch-jobs/`) handle async bulk register/update/delete for installers and rewards. Frontend tracks progress via `BatchJobContext` + SSE or polling.

### Google Contacts sync

`lib/googleContacts.ts` — optional integration. Syncs installer records to Google Contacts using OAuth refresh token. Installer model stores `googleContactId` for update/delete sync.

### Logging

Use `logger` from `lib/logger.ts` (`logger.error/warn/info/debug(message, context?)`) instead of `console.*`. Output is line-delimited JSON in production (aggregator-friendly), readable in dev; level via `LOG_LEVEL` (default `info` prod / `debug` dev). Every API route error already flows through it via `handleApiError`; the `error.tsx`/`global-error.tsx` boundaries route through it too. To enable an external error tracker (Sentry/Bugsnag/…), call `setErrorReporter(reporter)` once at startup (e.g. Next.js `instrumentation.ts`) — every `logger.error` forwards automatically, no call-site changes. Remaining raw `console.*` sites can migrate incrementally.

### Environment variables

Required: `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (OAuth login), `GOOGLE_CONTACTS_*` (contacts sync), `GMAIL_USER` + `GMAIL_APP_PASSWORD` (forgot-password email)

Required once Google Contacts is used: `TOKEN_ENCRYPTION_KEY` — 32-byte base64/hex key (`openssl rand -base64 32`) used by `lib/encryption.ts` (AES-256-GCM) to encrypt the stored Google OAuth refresh/access tokens at rest. Keep it in the deployment's secret store, **separate from `MONGODB_URI`**, so DB read access alone can't decrypt the tokens. Tokens are encrypted in `google-auth/callback` on write and decrypted only in `getAuthClient()`; values written before this key existed stay as legacy plaintext until the next OAuth re-auth.

### Validation

Zod schemas in `lib/validation.ts` and `lib/validation-helpers.ts`. API routes parse request bodies with these schemas before touching the database. `validateRequest` from `lib/validateRequest.ts` wraps the parse and returns formatted errors.

### Styling

Tailwind CSS v4 with shadcn/ui components. Font: Saira (Google Fonts). Theme: `next-themes` with `ThemeProvider`. Toast notifications via `sonner`.

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

- **Motion Mechanics:** ALWAYS implement physics-based animations (e.g., springs, inertia) instead of fixed-duration, time-based animations to ensure maximum fluidity and organic responsiveness.
- **Required Skills:** You must actively reference and apply the principles from the following skill modules whenever writing, planning, or reviewing animation code:
  - `@.agents/skills/animation-vocabulary/SKILL.md`
  - `@.agents/skills/emil-design-eng/SKILL.md`
  - `@.agents/skills/review-animations/SKILL.md`

## IMPORTANT

- ALWAYS ASK CLARIFYING QUESTIONS IF ANY INSTRUCTIONS ARE UNCLEAR. NEVER ASSUME ANYTHING.
- IF YOU THINK ORIGINAL INSTRUCTIONS ARE INCOMPLETE OR INCORRECT, **DO NOT** GUESS. **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
- IF ORIGINAL INSTRUCTIONS ARE AMBIGUOUS OR OPEN TO MULTIPLE INTERPRETATIONS, **ALWAYS ASK FOR CLARIFICATION** BEFORE PROCEEDING.
