/**
 * Product catalog for the Installer Program 2026 landing page.
 *
 * Sourced directly from /public/products/*.webp. Each product maps to its real
 * render files (3 angles each) so the showcase can swap views on hover.
 *
 * Reward is flat Rs 5,000 PKR per eligible install (per blueprint §1).
 */

export interface LandingProduct {
  /** Stable id, used for React keys + WhatsApp `product` param. */
  id: string;
  /** Display name shown on the card. */
  name: string;
  /** Power tier(s) shown as the headline spec. */
  power: string;
  /** Single-phase / three-phase tag. */
  phase: "Single-phase" | "Three-phase";
  /** Series line, e.g. "X1-Genki". */
  series: string;
  /** Reward badge copy. */
  reward: string;
  /** Ordered angle views, all from /public/products/. */
  views: string[];
  /** Short positioning line for the card body. */
  blurb: string;
}

export const REWARD_AMOUNT_PKR = 5000;

export const LANDING_PRODUCTS: LandingProduct[] = [
  {
    id: "x1-genki-6kw",
    name: "X1-Genki",
    power: "6 kW",
    phase: "Single-phase",
    series: "X1-Genki",
    reward: "Rs 5,000",
    blurb: "Compact single-phase hybrid for residential rooftops.",
    views: [
      "/products/X1-Genki-6kw-01.webp",
      "/products/X1-Genki-6kw-02.webp",
      "/products/X1-Genki-6kw-03.webp",
    ],
  },
  {
    id: "x1-genki-8-12kw",
    name: "X1-Genki",
    power: "8 / 10 / 12 kW",
    phase: "Single-phase",
    series: "X1-Genki",
    reward: "Rs 5,000",
    blurb: "Higher-output single-phase hybrid for larger homes and small shops.",
    views: [
      "/products/X1-Genki-8kw+10kw+12kW-01.webp",
      "/products/X1-Genki-8kw+10kw+12kW-02+.webp",
      "/products/X1-Genki-8kw+10kw+12kW-03.webp",
    ],
  },
  {
    id: "x3-genki-10-15kw",
    name: "X3-Genki",
    power: "10 / 15 kW",
    phase: "Three-phase",
    series: "X3-Genki",
    reward: "Rs 5,000",
    blurb: "Three-phase hybrid built for commercial and industrial installs.",
    views: [
      "/products/X3-Genki-10kw+15kW-01.webp",
      "/products/X3-Genki-10kw+15kW-02.webp",
      "/products/X3-Genki-10kw+15kW-03.webp",
    ],
  },
];
