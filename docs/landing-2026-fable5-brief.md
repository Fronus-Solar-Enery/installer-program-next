# Fable 5 Design Brief — Installer Program 2026 Landing Page

**Role:** You are a world-class landing-page designer and front-end engineer. Redesign the Fronus–SolaX **Installer Program 2026** marketing landing page end-to-end. This is a **full rethink** of structure, messaging, and visuals — not a reskin. Ship production-ready React, not a mockup.

---

## 1. The business, in one breath

Fronus (partnered with SolaX) runs a rewards program for **solar installers and technicians in Pakistan**. An installer who fits an eligible Fronus inverter earns a **flat Rs 5,000**, paid straight to their bank. This page has one job: get installers to **message our team on WhatsApp to join**.

**Audience:** working solar installers and technicians — practical, mobile-first, often on low-end Android over slow data. Not designers, not executives. Speak plainly.

## 2. The one conversion goal

Everything bends toward a single action: **tap the WhatsApp "Join" CTA.** The installer messages our internal team; the team verifies their details and registers them. Secondary action (much lower priority): "Login to Installer Portal" (`/auth/installer`) for already-registered installers. The WhatsApp CTA must be the visually dominant, always-reachable action (hero, sticky/floating button, final CTA).

WhatsApp links are built via `buildWhatsAppUrl({ intent, source })` from `@/lib/whatsapp` with `WHATSAPP_LINK_ATTRS` — reuse them, never hand-write links.

## 3. The three objections you must defeat

The whole page is an argument against these specific hesitations. Design and copy must actively dissolve them:

1. **"Is this real — will I actually get paid?"** → Lead with concrete proof of legitimacy: SolaX co-branding, the exact Rs 5,000, "paid to your bank," a transparent verification flow, real (later) payout counters. Radiate institutional trust, not hype.
2. **"How fast do I get the money?"** → Make the payout timeline explicit and reassuring in the How-It-Works flow and FAQ. Name the steps; don't leave the wait ambiguous.
3. **"I already push another inverter brand."** → Frame Fronus as _additional_ income on installs they're already doing — low switching cost, flat guaranteed reward, no exclusivity friction. Answer "why switch/add" head-on.

## 4. Brand system — use existing tokens, do not invent new colors

All tokens live in `app/globals.css` (Tailwind v4 `@theme`). Use them; do not introduce off-palette colors.

- **Primary (green):** `--color-brand-100 … brand-1200` (teal-green scale). Use `brand-700/800/900` for emphasis, CTAs, accents.
- **Secondary (slate/neutral):** `--color-brandsec-*`.
- **Semantic:** `--color-background/foreground/card/muted/border`, plus `success`/`destructive`. Respect them.
- **Radius:** `--radius` (~0.65rem) and the `--radius-*` scale. Squircle utilities (`.squircle`) available.
- **Fonts (already wired):** `--font-display` (Geist) for headings, `--font-number`/Bloxat (`.font-number`, tabular-nums) for the big numbers/reward figures, Saira for UI/mono. Use Bloxat for the "Rs 5,000" hero moment.
- **Logo:** `components/ProgramLogo.tsx` (`<ProgramLogo />`, supports `inverted`). Use it in header + footer.
- **Existing landing utilities** in `globals.css` under the `.lp-2026` scope — reuse rather than rebuild: `.lp-glass`, `.lp-nav-island`, `.lp-glow-brand`, `.lp-product-glow`, `.lp-section`, `.lp-marquee`, `.lp-btn-icon`, `.lp-magnetic`, hamburger/menu classes, `--animate-float`. Extend this layer for new effects; keep everything gated under `.lp-2026` so nothing leaks into the app.

**Reward facts (authoritative — from `lib/landingProducts.ts`):** flat **Rs 5,000** per eligible install; eligible products are the three below; the unit must have been **purchased after 1 July 2026** to qualify.

## 5. Aesthetic direction

**Primary reference: https://www.tasteskill.dev/ — it should dominate the look.** Emulate its refined, editorial, high-craft feel: confident typographic hierarchy, generous whitespace, restrained palette, purposeful physics-based motion, premium micro-detail. Fronus's own site (fronus.com) informs brand color/logo only — already captured in the tokens above.

**Theme: light-first and theme-adaptive.** The current landing forces dark mode (`LandingPage2026.tsx` adds `.dark` on mount) — **remove that forced-dark behavior** and design a polished **light** default that also holds up in dark. Both themes must look intentional (test both).

Mood lane: **clean, trustworthy, premium-corporate** — craft over decoration. Trust is the aesthetic goal; every flourish must reinforce credibility, never undercut it.

## 6. Section-by-section direction (all sections, full rethink)

Current file map (rebuild/replace as needed): `components/landing/` → `LandingPage2026`, `Preloader`, `Header2026`, `Hero2026`, `ProofBar`, `ProductShowcase`, `HowItWorks2026`, `VideoTestimonials`, `FaqSection`, `FinalCTA`, `Footer2026`, `FloatingWhatsApp`. Keep the thin server wrapper in `app/(landing)/page.tsx` (it passes live `stats`).

1. **Header** — floating glass island nav (`.lp-nav-island`), logo left, minimal links, WhatsApp "Join" button right. Mobile: morphing hamburger → fullscreen glass menu (classes exist).
2. **Hero** — the decisive screen. Headline built around **"Install Fronus. Earn Rs 5,000 every time."** with the number in Bloxat, animated count-up (spring). One-line subhead naming Pakistan + paid-to-bank. Primary WhatsApp CTA + ghost portal login. Establish legitimacy instantly (SolaX co-brand cue near the top). Consider a real product render as a hero anchor.
3. **Proof bar** — implement the **threshold-gated** model: show fixed value-prop tiles (`Rs 5,000 flat` · `Paid to your bank` · `SolaX-backed` · `Eligible after 1 Jul 2026`) now; render a live counter (from `stats`: installers / installations / rewardsPaid) **only when it crosses a credible floor** (e.g. installs ≥ 50), else fall back to the value-prop tile. One threshold constant, honest at every scale.
4. **Product showcase** — the three real inverters from `lib/landingProducts.ts`, real renders in `public/products/*.webp` (3 angles each, swap on hover): **X1-Genki 6 kW** (single-phase), **X1-Genki 8/10/12 kW** (single-phase), **X3-Genki 10/15 kW** (three-phase). Each card: name, power tier, phase tag, `Rs 5,000` reward badge, blurb. Premium product glow (`.lp-product-glow`). Use `next/image`, webp already optimized.
5. **How It Works** — the **exact real flow**, five steps, no invented steps:
   1. **Get registered** (message us on WhatsApp; our team verifies your details & signs you up)
   2. **Submit a product video** — one video showing the product installed **and** the side-sticker serial number (both in a single clip), **eligible products only**
   3. **We verify the product** (eligible products only)
   4. **Eligibility check** — the unit must have been **purchased after 1 July 2026**
   5. **You get rewarded** — flat Rs 5,000 to your bank
      Make step 5's payout timing explicit enough to answer "how fast?".
6. **Video testimonials** — vertical **9:16** format. **Use placeholders for now** (real installer videos coming); build the player/grid so real clips drop in later with no layout change. Marquee/scroll optional (`.lp-marquee`).
7. **FAQ** — accordion (existing accordion animations in `globals.css`). Seed it to knock out the three objections: payout reality, payout speed, "can I do this alongside another brand," eligibility date, what counts as a valid video, how registration works.
8. **Final CTA** — big, confident, single WhatsApp "Join" action with `.lp-glow-brand`. One decision, no distractions.
9. **Footer** — logo, essentials, SolaX partnership line, portal login link.
10. **Floating WhatsApp** — persistent, reachable on mobile, never obscuring content/CTAs.

## 7. Technical constraints (non-negotiable)

- **Stack:** Next.js 16 (App Router, RSC), React 19, TypeScript, Tailwind CSS v4 (token-based, no ad-hoc hex). Client components where interactivity/motion is needed.
- **Motion:** `motion` v12 — **physics-based springs**, not fixed-duration tweens. GSAP is acceptable only if a specific effect genuinely needs it (it exists in the project), but default to `motion`. Reuse helpers in `@/lib/motion` (`slideUp`, `staggerContainer`, etc.).
- **No new heavy dependencies** — no Three.js / WebGL / large canvas libs. Craft the "premium" feel with CSS, tokens, and spring motion.
- **Performance (this audience is on low-end Android / slow data):** keep JS light, lazy-load below-the-fold and video, use `next/image` for all imagery, avoid layout shift, keep animations GPU-cheap. Fast first paint matters more than spectacle.
- **Accessibility:** semantic HTML, keyboard-reachable, visible focus, WCAG AA contrast in **both** themes, proper touch targets, `prefers-reduced-motion` honored (existing keyframes already gate on it — keep that discipline).
- **Content:** English only. Currency always "Rs 5,000" / PKR. Plain, direct, installer-facing copy — no marketing fluff, no jargon.

## 8. Definition of done

- All sections implemented end-to-end, both light and dark themes intentional, responsive from 360px mobile up.
- Loading / empty / gated states handled (esp. proof bar threshold + testimonial placeholders).
- Reduced-motion path works; keyboard nav works; contrast passes.
- Reuses existing tokens, `.lp-*` utilities, `ProgramLogo`, `landingProducts` data, and `buildWhatsAppUrl` — no duplicated systems, no off-palette colors, no new heavy libs.
- `npm run lint` and `npm run build` pass.

**Guiding line:** every pixel should make a working installer in Pakistan think _"this is real, it's fast, and I'd be leaving money on the table not to join."_
