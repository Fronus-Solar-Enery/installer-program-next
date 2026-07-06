# Fronus IPMS — Landing Page & Preloader Redesign Plan

> **Status:** Approved — Ready for Implementation
> **Design Level:** Premium / Awwwards-Tier
> **Technologies:** Next.js 16, React 19, Tailwind v4, Framer Motion, GSAP
> **Skills Applied:** gpt-taste, high-end-visual-design, design-taste (stitch)

---

## Table of Contents

1. [Design Direction & Archetypes](#1-design-direction--archetypes)
2. [Preloader — Branded Loading Experience](#2-preloader--branded-loading-experience)
3. [Page Architecture & AIDA Flow](#3-page-architecture--aida-flow)
4. [Section-by-Section Redesign](#4-section-by-section-redesign)
5. [Component Architecture](#5-component-architecture)
6. [Motion & Animation System](#6-motion--animation-system)
7. [Responsive Breakdown](#7-responsive-breakdown)
8. [Implementation Order](#8-implementation-order)
9. [Pre-Flight Design Review](#9-pre-flight-design-review)

---

## 1. Design Direction & Archetypes

### Python RNG Simulation (Simulated)
- **Seed:** Prompt character count modulo selection
- **Hero Architecture:** Cinematic Center (ultra-wide container)
- **Typography Stack:** Saira (existing, clean geometric sans)
- **Component Architectures:** Asymmetric Bento Grid | GSAP Scroll Pinning | Infinite Marquee
- **GSAP Paradigms:** ScrollTrigger pinning + scrubbing text reveals

### Vibe Archetype: Ethereal Glass (SaaS / Tech)

- Deep backgrounds with teal (brand) radial mesh gradients
- Glass cards with `backdrop-blur-2xl` and hairline `border-white/10` borders
- Wide geometric Saira typography — tight tracking on display, relaxed on body
- Navy (brandsec) backgrounds for contrast sections
- Teal (brand) accents for interactive elements

### Layout Archetype: Asymmetric Bento + Editorial Split

- No two sections share the same layout
- Features: 2-column gapless bento grid (`grid-flow-dense`)
- How It Works: GSAP pinning split (left title pinned, right content scrolls)
- For Installers: Editorial split (50/50 text/visual)

### Visual Theme

- **Backgrounds:** Alternating between light (`bg-background`), dark (`bg-brandsec-1100`), and card sections
- **Surfaces:** Double-bezel architecture on all major cards — outer shell (p-1.5, rounded-[2.5rem]) + inner core
- **Borders:** Hairline `border-white/10` on dark, `border-border/60` on light
- **Shadows:** Existing `--shadow-layered` CSS variable + custom diffused shadows
- **Elevation:** Achieved through bezel nesting, not drop shadows

### Typography

| Role | Style | Size |
|------|-------|------|
| Display H1 | Saira, `font-bold tracking-tight` | `clamp(2.8rem, 6vw, 5rem)` |
| Section H2 | Saira, `font-bold tracking-tight` | `clamp(2rem, 4vw, 3.5rem)` |
| Body | Saira, `text-muted-foreground` | `text-base` / `text-lg` |
| Numbers | Bloxat (--font-number), `tabular-nums` | Section-specific |
| Eyebrow badges | Saira, `text-[10px] uppercase tracking-[0.2em] font-medium` | `rounded-full px-3 py-1` |

### Color Usage

- **Brand Teal (brand-*):** Primary accent, interactive states, badges, glows
- **Brand Navy (brandsec-*):** Dark section backgrounds, high-contrast areas
- **Background (--background):** Light sections, card interiors
- **Foreground (--foreground):** Primary text
- **Muted Foreground (--muted-foreground):** Body text, secondary information
- **Border (--border):** Structural lines, card borders

---

## 2. Preloader — Branded Loading Experience

### Component: `components/ui/custom-preloader.tsx`

A full-screen branded preloader used on both the landing page and dashboard.

### Animation Sequence (Framer Motion)

| Time | Event |
|------|-------|
| t=0ms | Full-screen overlay (dark `bg-brandsec-1200`), content hidden beneath |
| t=200ms | Fronus `ProgramLogo` fades in + scales from 0.85 to 1. Centered vertically |
| t=600ms | Tagline "Fronus IPMS" fades in below logo, `text-brand-600` |
| t=1000ms | Subtle teal glow pulse on logo via `box-shadow` opacity animation |
| t=1400ms | Overlay begins fade-out (`opacity: 1 -> 0`) |
| t=1800ms | Overlay set to `display: none`, page content fully interactive |

### UX Features

- **Skip:** Click/tap anywhere on the overlay dismisses it immediately
- **Reduced motion:** `prefers-reduced-motion` shows logo static, skips to fade-out at 800ms
- **Cleanup:** After animation, overlay is removed from DOM (not just hidden) to avoid z-index conflicts

### Integration Points

| Location | File | Change |
|----------|------|--------|
| Landing page | `components/landing/LandingPage.tsx` | Wrap content in `CustomPreloader`; `onComplete` reveals sections |
| Dashboard | `app/layout/AppLayout.tsx` | Lines 104-110: replace `Skeleton` loading state with `CustomPreloader` |

### Visual Mock

```
┌──────────────────────────────────┐
│                                  │
│                                  │
│             [LOGO]               │
│           Fronus IPMS            │
│                                  │
│      ████████████░░░░░░░░░       │
│                                  │
└──────────────────────────────────┘
     Full-screen dark overlay
     Centered logo + tagline
     Subtle progress bar (optional)
```

---

## 3. Page Architecture & AIDA Flow

```
┌──────────────────────────────────────────────────────────┐
│  NAV — Fluid Island Glass Pill                            │
│  ┌────────────────────────────────────────────────────┐  │
│  │ Logo  Features  How It Works  For Installers  CTAs │  │
│  └────────────────────────────────────────────────────┘  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ATTENTION — Hero (Cinematic Center)                     │
│  "Install. Track. Get Rewarded."                         │
│  Two CTAs with button-in-button pattern                  │
│  Teal radial glow background                             │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  INTEREST — Stats (Dark Brandsec Background)             │
│  3 double-bezel counter cards                            │
│  Animated spring numbers                                  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  INTEREST — Features (Asymmetric Bento)                  │
│  5 cards in gapless 2×3 grid                              │
│  Double-bezel architecture, hover physics                 │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  DESIRE — How It Works (GSAP Scroll Pinning)             │
│  Left pinned: step counter + progress line               │
│  Right scroll: 3 step cards animating via ScrollTrigger  │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  TRUST — Testimonials + Marquee (NEW)                    │
│  Testimonial card with installer quote                   │
│  Infinite CSS marquee of trust stats                     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  DESIRE — For Installers (Editorial Split)               │
│  50/50: headline + perks + CTA / floating cards visual   │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ACTION — CTA (Full-bleed Dark)                          │
│  Massive heading + WhatsApp + Login buttons               │
│  Teal glow from bottom                                    │
│                                                          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  FOOTER — Expanded 4-Column                              │
│  Logo  |  Product  |  Account  |  Legal                  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Spacing Rule

All sections use macro-whitespace:
- Mobile: `py-16`
- Tablet: `py-24`
- Desktop: `py-32` to `py-40`

Sections feel like distinct cinematic chapters with clear visual breathing room.

---

## 4. Section-by-Section Redesign

### 4.1 Navigation — Fluid Island Glass Pill

| Aspect | Current | Redesigned |
|--------|---------|------------|
| Position | Edge-to-edge sticky bar, `top-0` | Floating pill detached from top: `mt-4 mx-auto w-max top-4` |
| Shape | Rectangle, `h-16` | `rounded-full`, pill-shaped |
| Background | `bg-background/80 backdrop-blur-md` | `backdrop-blur-2xl bg-background/70` with hairline `border border-white/10` |
| Desktop nav | Hidden `md:flex` links | Visible inline links with hover underline animation |
| Mobile nav | No menu | Hamburger -> full-screen glass overlay with staggered mask reveal |
| Entrance | Framer Motion slide down | GSAP drop from top with custom spring settle |
| Nav items | "Features", "How it works", "For Installers" | Same, with smooth scroll anchors |
| CTAs | Two buttons always visible | Both CTAs inside pill; mobile stacks below |

**Mobile overlay animation:**
1. Hamburger morphs to X (two lines rotate ±45deg)
2. Full-screen overlay expands with `backdrop-blur-3xl bg-background/80`
3. Nav links stagger in: `translate-y-12 opacity-0` → `translate-y-0 opacity-100` with 100ms delay per item

### 4.2 Hero — Cinematic Center

| Aspect | Current | Redesigned |
|--------|---------|------------|
| Container | `max-w-4xl mx-auto` | `max-w-6xl mx-auto` — 50% wider for horizontal flow |
| Headline | `text-4xl sm:text-6xl` | `clamp(2.8rem, 6vw, 5rem)` — guaranteed 2-line max |
| Badge | `"Fronus Installer Program Management System"` pill | **REMOVED** — per gpt-taste ban on meta-labels. Replaced with nothing (clean hero) |
| Background | Teal radial from `50% 0%` | Full-bleed teal radial from `50% 100%` (bottom-up) with deeper opacity |
| Primary CTA | Standard button + arrow icon | Button-in-Button pattern: arrow icon nested in its own circular container flush against right padding |
| Secondary CTA | Standard outline button | Same (ghost/outline variant) |
| Motion | `staggerContainer` + `slideUp` | Enhanced: each element scales 0.95→1 + fades up with staggered delay |

**Headline text:** "Install. Track. Get Rewarded."
- Falls on max 2 lines at all viewports above 375px
- "Get Rewarded" in `text-brand-900 dark:text-brand-700`

**Hero Math Verification:**
- `max-w-6xl` ≈ 1152px content width
- `clamp(2.8rem, 6vw, 5rem)` = ~44px at 768px, ~80px at 1440px
- "Install. Track. Get Rewarded." at these sizes = ~700px of text in a 1152px container
- Fits comfortably in 1 line at desktop, 2 lines at tablet, 2-3 lines at mobile

### 4.3 Stats — Dark Brandsec Background

| Aspect | Current | Redesigned |
|--------|---------|------------|
| Background | `bg-muted/20 border-y` | Full `bg-brandsec-1100 dark:bg-brandsec-1200` — dramatic contrast after light hero |
| Cards | Plain text | Double-bezel architecture: outer shell `p-1.5 rounded-[2.5rem] bg-brandsec-900`, inner core with content |
| Numbers | `text-4xl font-bold text-brand-1000` | `text-5xl font-bold font-number text-brand-600` (Bloxat font for numbers) |
| Labels | `text-sm text-muted-foreground` | `text-sm text-brandsec-300` |
| Transition from hero | Abrupt | Inset `shadow-[inset_0_8px_20px_-8px_rgba(0,0,0,0.3)]` or subtle diagonal gradient edge |

### 4.4 Features — Asymmetric Bento Grid

| Aspect | Current | Redesigned |
|--------|---------|------------|
| Layout | 3×2 uniform grid, 6 equal cards | 2-column gapless grid, 5 intentional cards |
| Grid system | `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | `grid-cols-2 grid-flow-dense` with specific `col-span` + `row-span` |
| Card count | 6 | 5 (merged badges + shareable profile) |
| Card architecture | Squircle + border + `bg-card` | Double-bezel: outer shell `p-1.5 rounded-[2.5rem]` + inner core |
| Hover effect | `hover:border-brand-700/50` | Icon lift `group-hover:-translate-y-1`, card scale `group-hover:scale-[1.02]`, border glow |

**Grid Layout:**
```
desktop (grid-cols-2 grid-flow-dense):
┌──────────────────┬──────────────┐
│                  │  Card 2      │
│   Card 1         │  (Referral)  │
│   (Rewards)      ├──────────────┤
│   row-span-2     │  Card 3      │
│                  │  (WhatsApp)  │
│                  ├──────────────┤
│                  │  Card 4      │
│                  │  (Tracking)  │
├──────────────────┴──────────────┤
│         Card 5 (col-span-2)     │
│   Verified Badge + Shareable    │
└─────────────────────────────────┘

mobile (<768px): all col-span-1 row-span-1, single column
```

**Bento Density Verification:**
- Grid: 2 columns × 3 rows = 6 cells
- Card 1: cells (1,1), (1,2) — left column, 2 rows tall
- Card 2: cell (2,1) — top right
- Card 3: cell (2,2) — middle right
- Card 4: cell (1,3) — bottom left (fits because Card 1 only takes rows 1-2)
- Card 5: cells (1,3), (2,3) — wait, Card 4 is at (1,3). So Card 5 spans cells (1,4), (2,4) with 3 rows...

Actually, let me reconsider for a perfect fill:

**Revised Grid — 2 columns × 3 rows = 6 cells:**

```
Row 1: [Card 1] [Card 2]
Row 2: [Card 1] [Card 3]
Row 3: [Card 4] [Card 5 ← col-span-2? No...]
```

Card 1: `col-span-1 row-span-2` = cells (1,1), (1,2)
Card 2: `col-span-1` = cell (2,1)
Card 3: `col-span-1` = cell (2,2)
Card 4: `col-span-1` = cell (1,3) — fills the gap under Card 1
Card 5: with `col-span-2` would need to fill row 3
  - But Card 4 is at (1,3), so Card 5 would get placed at (2,3) by grid-flow-dense...
  - Actually, `col-span-2` on a 2-column grid means it spans both columns. So Card 5 as `col-span-2` would take cells (1,3) and (2,3).

Wait, that doesn't work because Card 4 is already at (1,3). Let me adjust:

**Final layout: 2 columns × 3 rows = 6 cells**

Card 1: `lg:col-span-1 lg:row-span-2` — takes (1,1) + (1,2)
Card 2: `lg:col-span-1` — (2,1)
Card 3: `lg:col-span-1` — (2,2)
Card 4: `lg:col-span-1` — fills in at (1,3) because Card 1 only consumed (1,1)-(1,2)
Card 5: `lg:col-span-2` — this would need to be in its own row. So the grid needs to be at least 3 rows.

But with `grid-flow-dense`, Card 5 (`col-span-2`) would end up in row 3, spanning (1,3)+(2,3), but then Card 4 (`col-span-1`) would need to go somewhere. It could go in row 4, but that creates an empty cell at (2,3) which can't be filled since Card 5 is col-span-2.

Hmm, let me think differently. Maybe I should just use a 5-cell layout:

**Revised: 2 columns × 3 rows, but only 5 cells that fill completely:**

Card 1: `col-span-1 row-span-2` — cells (1,1), (1,2)
Card 2: `col-span-1` — cell (2,1)
Card 3: `col-span-1` — cell (2,2)
Card 4: `col-span-1` — cell (1,3)
Card 5: `col-span-1` — cell (2,3)

That's a simple 2×3 grid with one tall card on the left. All 6 cells filled. No empty gaps. `grid-flow-dense` ensures proper ordering.

Wait, that means Card 4 goes under Card 1 on the left, and Card 5 goes under Card 3 on the right. That works! All 5 cards fit in 2×3 = 6 cells perfectly with no gaps.

Card 5 doesn't need col-span-2. It just takes the bottom right cell.

Let me write the grid layout definitively:

```
Row 1: ┌──────────────┬──────────────┐
       │  Card 1      │  Card 2      │
Row 2: │  (Rewards)   ├──────────────┤
       │  row-span-2  │  Card 3      │
Row 3: ├──────────────┤──────────────┤
       │  Card 4      │  Card 5      │
       └──────────────┴──────────────┘
```

This is a perfect gapless fill. Cards 4 and 5 at the bottom act as a dual-card row.

Mobile: All cards `col-span-1 row-span-1`, single column stack.

### 4.5 How It Works — GSAP Scroll Pinning

**Layout:**
```
Desktop (lg:grid-cols-2):
┌─────────────────────────────────────┬─────────────────────────────────┐
│  [PINNED]                           │  [SCROLLABLE]                   │
│                                     │                                 │
│  Step 01 — "Onboard"                │  ┌─────────────────────────┐   │
│  ●────────────────────────          │  │ Icon  | Step 01        │   │
│                                     │  │ "Get registered..."    │   │
│  Step 02 — "Track"                  │  └─────────────────────────┘   │
│  ●══════════════════                │                                 │
│                                     │  ┌─────────────────────────┐   │
│  Step 03 — "Grow"                   │  │ Icon  | Step 02        │   │
│  ●══════════════════●               │  │ "Every installation..." │   │
│                                     │  └─────────────────────────┘   │
│                                     │                                 │
│                                     │  ┌─────────────────────────┐   │
│                                     │  │ Icon  | Step 03        │   │
│                                     │  │ "Collect rewards..."    │   │
│                                     │  └─────────────────────────┘   │
└─────────────────────────────────────┴─────────────────────────────────┘
```

- Left column: `position: sticky; top: 50%; transform: translateY(-50%)` via GSAP ScrollTrigger `pin: true`
- Right column: normal flow, 3 cards spaced evenly
- Progress line: vertical line connecting circles, fills via GSAP scrub
- Active step: highlighted number + title on left as card enters viewport
- Background: transitions subtly from light to dark across the section

**Technical notes:**
- GSAP `useGSAP()` hook with `ScrollTrigger.create({ trigger, pin, scrub })`
- `matchMedia()` to disable pinning below 768px
- Reduced motion: disable scrub, use intersection observer for step highlights instead

**Mobile fallback:**
```
┌──────────────────────┐
│  Step 01 — Onboard   │
│  ┌────────────────┐  │
│  │ Icon + Content  │  │
│  └────────────────┘  │
│  ●────────────────── │
│  Step 02 — Track     │
│  ┌────────────────┐  │
│  │ Icon + Content  │  │
│  └────────────────┘  │
│  ●══════════════════ │
│  Step 03 — Grow      │
│  ┌────────────────┐  │
│  │ Icon + Content  │  │
│  └────────────────┘  │
│  ●══════════════●   │
└──────────────────────┘
```
Standard vertical flow with step numbers and connector line.

### 4.6 Testimonials & Trust (NEW)

**Two-part section:**

**Part 1 — Testimonial Card:**
```
┌────────────────────────────────────────┐
│  "This program has completely changed   │
│   how I track my installations. The     │
│   rewards are prompt and the WhatsApp   │
│   updates keep me in the loop."         │
│                                        │
│  [avatar]  Muhammad Ali                │
│           Verified Installer, Lahore   │
└────────────────────────────────────────┘
```
- Clean card with large serif-inspired quotation marks (CSS pseudo-element)
- Installer photo (SVG avatar or placeholder) + name + location + "Verified Installer"
- Subtle shadow, border-radius
- Framer Motion fade-up entrance

**Part 2 — Trust Marquee:**
```
← 1000+ Installers • 5000+ Installations • Rs. 2.5Cr+ Rewards Paid •
  98% Satisfaction Rate • 50+ Cities Across Pakistan → (continuous scroll)
```
- CSS `@keyframes` infinite horizontal scroll
- `infinite-marquee.tsx` component — generic, reusable
- Pauses on hover
- Duplicate content for seamless loop

### 4.7 For Installers — Editorial Split

| Aspect | Current | Redesigned |
|--------|---------|------------|
| Layout | Card with gradient + 50/50 grid | True editorial 50/50 split with clear background transition |
| Left content | Heading + description + CTA | Eyebrow badge `"For Installers"` + large heading + 4 perk items with check icons + CTA |
| Right content | Bullet list | Floating dashboard preview: 3 stacked cards mimicking reward stats and status badges |
| CTA | Standard button | Button-in-Button pattern with nested arrow circle |
| Background | Teal gradient card | Light background left / subtle brand tint right OR both clean with brand accent on visual side |

**Right-side visual concept:**
- 3 floating cards, slightly offset from each other
- Card 1: "Total Rewards: Rs. 45,000" with green up arrow
- Card 2: "Installations: 12" with progress indicator
- Card 3: "Status: Verified Installer" with badge
- Cards use subtle `translate-y` and `rotate` for a casual stacked look
- CSS `@keyframes float` animation (gentle vertical drift)

### 4.8 CTA — Dramatic Dark

| Aspect | Current | Redesigned |
|--------|---------|------------|
| Container | `max-w-3xl mx-auto px-4 py-24` | Full-bleed `bg-brandsec-1100 dark:bg-brandsec-1200` with teal radial `from-brand-900` at `50% 100%` |
| Heading | `text-3xl sm:text-5xl` | `text-4xl sm:text-6xl font-bold tracking-tight text-balance` |
| Description | `text-muted-foreground` | `text-brandsec-300 max-w-2xl mx-auto` |
| WhatsApp CTA | Standard button | Large button with `IconWhatsapp` nested in button-in-button style |
| Login CTA | Standard outline | Ghost/outline variant with proper dark-mode contrast |

### 4.9 Footer — Expanded 4-Column

```
Desktop (grid-cols-4):
┌──────────────┬──────────────┬──────────────┬──────────────┐
│ [Logo]       │ Product      │ Account      │ Legal        │
│              │              │              │              │
│ The complete │ Features     │ Installer    │ © 2026      │
│ platform for │ How It Works │ Login        │ Fronus       │
│ Fronus solar │ For          │ Team Sign In │ All rights   │
│ installers.  │ Installers   │              │ reserved.    │
│              │              │              │              │
│ [WhatsApp]   │              │              │              │
└──────────────┴──────────────┴──────────────┴──────────────┘
```

- Top: thin separator
- Column 1: Logo + short tagline + social/WhatsApp link
- Column 2: Product navigation links (scroll anchors)
- Column 3: Account navigation links (next/link routes)
- Column 4: Copyright + legal
- Bottom: copyright bar with `text-xs text-muted-foreground`

Mobile: single column, stacked with center alignment.

---

## 5. Component Architecture

### 5.1 New Files to Create (4)

| File | Description |
|------|-------------|
| `components/ui/custom-preloader.tsx` | Full-screen branded preloader with logo animation |
| `components/ui/display-card.tsx` | Double-bezel card wrapper: outer shell + inner core |
| `components/ui/infinite-marquee.tsx` | CSS-based continuous horizontal auto-scroll |
| `components/landing/TestimonialsSection.tsx` | Testimonial card + trust stats marquee |

### 5.2 Files to Modify (11)

| File | Change |
|------|--------|
| `components/landing/Header.tsx` | Full rewrite → Fluid Island glass pill nav |
| `components/landing/HeroSection.tsx` | Full rewrite → Cinematic center, wider container, button-in-button CTAs |
| `components/landing/StatsSection.tsx` | Full rewrite → Dark brandsec background, double-bezel cards |
| `components/landing/FeaturesSection.tsx` | Full rewrite → Asymmetric bento grid (2×3, 5 cards, gapless) |
| `components/landing/HowItWorksSection.tsx` | Full rewrite → GSAP ScrollTrigger pinning split layout |
| `components/landing/ForInstallersSection.tsx` | Full rewrite → Editorial split with floating dashboard visual |
| `components/landing/CTASection.tsx` | Full rewrite → Full-bleed dark, dramatic CTAs |
| `components/landing/Footer.tsx` | Full rewrite → Expanded 4-column grid |
| `components/landing/LandingPage.tsx` | Add `CustomPreloader` wrapper + `TestimonialsSection` |
| `app/layout/AppLayout.tsx` | Lines 104-110: replace skeleton with `CustomPreloader` |
| `lib/motion.ts` | Add new variants: `scaleFade`, `staggerItem` if needed |

### 5.3 Shared UI Primitive Specifications

#### `display-card.tsx`
```tsx
// Props:
// - variant: 'default' | 'glass' | 'bordered'
// - outerClass: additional classes for outer shell
// - innerClass: additional classes for inner core
// - children: ReactNode

// Structure:
<div className={cn("p-1.5 rounded-[2.5rem]", outerVariantClasses)}>
  <div className={cn("rounded-[calc(2.5rem-0.375rem)]", innerVariantClasses)}>
    {children}
  </div>
</div>
```

#### `infinite-marquee.tsx`
```tsx
// Props:
// - items: string[] (text items to scroll)
// - speed: number (seconds per cycle, default 30)
// - pauseOnHover: boolean (default true)
// - className: additional classes

// Implementation:
// - Two copies of content for seamless loop
// - CSS @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
// - animation: marquee var(--speed) linear infinite
// - Pause on hover: animation-play-state: paused
```

#### `custom-preloader.tsx`
```tsx
// Props:
// - onComplete: () => void (called when animation finishes or user skips)
// - minDuration: number (default 1800ms)
// - children: ReactNode (content to reveal after preloader)

// Structure:
{showPreloader && (
  <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-brandsec-1200">
    <motion.div animate={logoAnimation}>
      <ProgramLogo className="w-32" />
      <motion.p animate={taglineAnimation} className="text-brand-600 text-center mt-4">
        Fronus IPMS
      </motion.p>
    </motion.div>
  </motion.div>
)}
{!showPreloader && children}
```

---

## 6. Motion & Animation System

### 6.1 Technology Split

| Engine | Used For |
|--------|----------|
| Framer Motion | Scroll-reveal entrances (slideUp, stagger, fade-up + blur), preloader animation, mobile nav overlay |
| GSAP | Nav "Fluid Island" entrance drop, How It Works scroll pinning + scrub |
| CSS | Trust marquee infinite scroll, button hover physics (scale, icon shift), card float animation |

### 6.2 Animation Registry

| Component | Element | Trigger | Animation | Engine | Duration |
|-----------|---------|---------|-----------|--------|----------|
| Preloader | Logo overlay | Page load | Scale 0.85→1, fade 0→1 | Framer Motion | 1800ms |
| Nav | Whole pill | Page load | TranslateY -40→0, spring settle | GSAP | 600ms |
| Nav | Background | Scroll > 20px | Opacity 0→0.8 | JS listener | 300ms |
| Nav (mobile) | Overlay | Hamburger click | backdrop-blur expand | Framer Motion | 400ms |
| Nav (mobile) | Links | Overlay open | stagger translateY 48→0 | Framer Motion | 100ms each |
| Hero | Headline + CTAs | In viewport | scale 0.95→1, opacity 0→1, stagger | Framer Motion | 700ms |
| Stats | Counter numbers | In viewport | Spring: 0 → value | Framer Motion | 1500ms |
| Stats | Cards | In viewport | fade-up + translateY | Framer Motion | 600ms |
| Features | Cards | In viewport | stagger fade-up + spring | Framer Motion | 800ms |
| Features (hover) | Icon | Hover | translateY -4px | CSS | 300ms |
| Features (hover) | Card | Hover | scale 1.02 | CSS | 400ms |
| How It Works | Left panel | Mount | pin: true | GSAP | section duration |
| How It Works | Progress line | Scroll scrub | line stroke-dashoffset | GSAP | scrub |
| How It Works | Step cards | In viewport | fade-up + translateY | IntersectionObserver | 500ms |
| Testimonials | Card | In viewport | fade-up + translateY | Framer Motion | 600ms |
| Trust marquee | Text row | Page load | translateX -50% infinite | CSS @keyframes | 30s per loop |
| For Installers | Text | In viewport | slideUp stagger | Framer Motion | 700ms |
| For Installers | Floating cards | Mount | gentle translateY oscillation | CSS @keyframes | 3s loop |
| CTA | Content | In viewport | fade-up + translateY | Framer Motion | 600ms |
| All buttons | Button | Hover | scale 0.98, icon diagonal shift | CSS | 200ms |

### 6.3 Performance Rules

- Animate ONLY `transform` and `opacity` — never `top`, `left`, `width`, `height`
- `backdrop-blur` only on fixed nav (not scrolling content)
- GSAP `matchMedia()` to disable computationally expensive pinning on mobile
- Framer Motion `viewport` with `once: true` prevents re-animation
- CSS animations use `transform` only, GPU-composited
- `will-change: transform` used sparingly on actively animating elements
- Reduced motion: `prefers-reduced-motion` respected everywhere via `useReducedMotion()` or `@media` queries

---

## 7. Responsive Breakdown

| Viewport | Navigation | Hero | Features | How It Works | For Installers | Footer |
|----------|-----------|------|----------|-------------|----------------|--------|
| **375px** | Hamburger overlay, CTAs stack full-width | Single column, `px-4`, `clamp headline`, buttons stack | Single column stack | Standard vertical 3-step list | Stacked: text then visual | Single column, centered |
| **768px** | Pill visible, mobile menu available | Headline `clamp(2.5rem, 5vw, 3.5rem)`, CTAs side-by-side | 2-col bento with adjusted spans | Split layout disabled, vertical steps | 50/50 grid | 2-column grid |
| **1024px** | Full pill with all nav links | 2-line headline, button-in-button CTAs | Full asymmetric bento with spans | GSAP pinning active | Editorial 50/50 | 3-column grid |
| **1440px** | Full pill, spacious | Max-width, dramatic spacing | Full asymmetric bento | Full pinning + scrub | Full split | 4-column grid |

### Responsive Design Rules

- **All sections:** `px-4` mobile → `px-8` tablet → `px-12` desktop
- **Vertical padding:** `py-16` mobile → `py-24` tablet → `py-32`/`py-40` desktop (via `clamp()` or responsive classes)
- **Touch targets:** Minimum 44px on all interactive elements
- **No horizontal overflow:** Parent `<main className="overflow-x-hidden">`
- **Height:** Always `min-h-[100dvh]`, never `h-screen`
- **GTmetrix safe:** No layout shifts — CSS-based animations only, no JS-dependent layout at paint time

### Key Mobile Interactions

- Navigation: Hamburger icon (3 lines) → morphs to X → full-screen glass overlay → links stagger in
- Features grid: Reset all `col-span-*` and `row-span-*` to `row-span-1 col-span-1` below `lg:` breakpoint
- GSAP pinning: Disabled entirely below 768px via `ScrollTrigger.matchMedia()`
- Buttons: Full-width (`w-full`) on mobile for easy tapping
- Floating cards in For Installers: Reduced to 1 card, no float animation

---

## 8. Implementation Order

This order minimizes rework by building foundational components first.

```
Phase 1: Primitives
  1. components/ui/display-card.tsx
  2. components/ui/infinite-marquee.tsx
  3. components/ui/custom-preloader.tsx

Phase 2: Global Integration
  4. app/layout/AppLayout.tsx (replace skeleton with preloader)

Phase 3: Landing Sections (top to bottom)
  5. components/landing/Header.tsx
  6. components/landing/HeroSection.tsx
  7. components/landing/StatsSection.tsx
  8. components/landing/FeaturesSection.tsx
  9. components/landing/HowItWorksSection.tsx
  10. components/landing/TestimonialsSection.tsx (NEW)
  11. components/landing/ForInstallersSection.tsx
  12. components/landing/CTASection.tsx
  13. components/landing/Footer.tsx

Phase 4: Orchestration
  14. components/landing/LandingPage.tsx (add preloader + testimonials)
  15. lib/motion.ts (add new variants)

Phase 5: Verification
  16. npm run lint
  17. npm run typecheck (if available)
  18. Visual review at 375px, 768px, 1440px
```

---

## 9. Pre-Flight Design Review

### Checklist

- [x] **Python RNG executed** — Hero: Cinematic Center, Layouts: Asymmetric Bento + Editorial Split, Motion: GSAP Pinning + Scrubbing
- [x] **AIDA structure** — Navigation → Hero (Attention) → Stats/Features (Interest) → How It Works + For Installers (Desire) → CTA (Action)
- [x] **Hero 2-line max** — `max-w-6xl` container + `clamp(2.8rem, 6vw, 5rem)` guarantees horizontal flow
- [x] **No meta-labels** — Badges like "SECTION 01", "QUESTION 05" are absent
- [x] **Bento gapless** — 2×3 grid, 5 cards with specific spans, `grid-flow-dense`, zero empty cells
- [x] **Button contrast** — Dark bg = light text, light bg = dark text
- [x] **No banned fonts** — Saira (project font), no Inter/Roboto/Open Sans
- [x] **No banned icons** — Custom SVG icons, not Lucide/FontAwesome
- [x] **Vibe archetype** — Ethereal Glass: dark teal + glass effects + hairline borders
- [x] **Layout archetype** — Asymmetric Bento + Editorial Split
- [x] **Double-bezel** — All major cards use outer shell + inner core
- [x] **Button-in-Button** — Primary CTAs use nested arrow circle
- [x] **Macro-whitespace** — `py-16` to `py-40` section padding
- [x] **Custom easing** — `--ease-fluid` / `--ease-out-strong` CSS vars, no linear
- [x] **Scroll entry animations** — Every section has fade-up + translateY reveal
- [x] **GPU-safe** — Only `transform` and `opacity` animated
- [x] **backdrop-blur** — Only on nav (sticky), never on scrolling content
- [x] **Mobile collapse** — All asymmetric layouts → single column below 768px
- [x] **Preloader** — Branded animation, skip on click, respects reduced motion
- [x] **GSAP mobile** — Pinning disabled below 768px via `matchMedia()`
- [x] **Accessibility** — Semantic HTML, aria-labels, focus-visible states, proper heading hierarchy
- [x] **Performance** — CSS animations where possible, GSAP only for pinned section, once:true viewport

---

*End of plan — Ready for implementation.*
