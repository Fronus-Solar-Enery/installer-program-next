"use client";

import { motion } from "motion/react";
import TestimonialCard, { type Testimonial } from "./TestimonialCard";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";

/**
 * Placeholder slots — swap in real clips as `{ id, name, city, videoSrc,
 * poster }` and the layout doesn't move.
 */
const ITEMS: Testimonial[] = [
  { id: "1" },
  { id: "2" },
  { id: "3" },
  { id: "4" },
];

export default function VideoTestimonials() {
  return (
    <section
      id="testimonials"
      className="lp-section scroll-mt-24 border-t border-border/60"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="mx-auto max-w-6xl space-y-4 px-4"
      >
        <motion.p
          variants={slideUp}
          className="text-xs font-medium uppercase tracking-[0.25em] text-brand-1000 dark:text-brand-600"
        >
          From the field
        </motion.p>
        <motion.h2
          variants={slideUp}
          className="max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl"
        >
          Installer stories
        </motion.h2>
        <motion.p
          variants={slideUp}
          className="max-w-2xl text-pretty text-muted-foreground"
        >
          We&apos;re recording with installers in the program right now. Their
          videos will appear here — real installs, real payouts.
        </motion.p>
      </motion.div>

      <motion.div
        variants={slideUp}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="mt-12 overflow-x-auto pb-4 [scrollbar-width:thin]"
      >
        <div className="mx-auto flex w-max snap-x snap-mandatory gap-5 px-4 lg:max-w-6xl">
          {ITEMS.map((item) => (
            <TestimonialCard key={item.id} item={item} />
          ))}
        </div>
      </motion.div>
    </section>
  );
}
