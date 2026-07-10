/**
 * Shared Framer Motion tokens for scroll-reveal and layout animation.
 * Keep all landing/marketing motion on these so the feel stays consistent.
 */
import type { Variants, Transition } from "motion/react";

export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const SPRING_LAYOUT: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

export const slideUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 20 },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

/** Standard viewport config for whileInView reveals. */
export const VIEWPORT_ONCE = { once: true, margin: "-80px" } as const;
