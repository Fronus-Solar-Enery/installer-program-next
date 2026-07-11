"use client";

import { motion } from "motion/react";
import {
  IconWhatsapp,
  IconSmartphone2,
  IconVerifiedCheck,
  IconCalendar,
  IconBank,
} from "@/components/icons";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";

/** The real program flow — five steps, nothing invented. */
const STEPS = [
  {
    icon: IconWhatsapp,
    title: "Get registered",
    body: "Message us on WhatsApp. Our team verifies your details, signs you up, and sends your installer code and PIN.",
  },
  {
    icon: IconSmartphone2,
    title: "Submit a product video",
    body: "One clip showing the unit installed and the serial number on the side sticker — both in the same video. Eligible products only.",
  },
  {
    icon: IconVerifiedCheck,
    title: "We verify the product",
    body: "Our team checks the serial number and confirms it's a genuine, eligible Fronus unit.",
  },
  {
    icon: IconCalendar,
    title: "Eligibility check",
    body: "The unit must have been purchased after 1 July 2026 to qualify for the reward.",
  },
  {
    icon: IconBank,
    title: "You get rewarded",
    body: "A flat Rs 5,000 is transferred to your bank account — typically within a few working hours of approval, not months.",
    highlight: true,
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="lp-section relative scroll-mt-24 border-t border-border/60"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          className="space-y-4 self-start lg:sticky lg:top-32"
        >
          <motion.p
            variants={slideUp}
            className="text-xs font-medium uppercase tracking-[0.25em] text-brand-900 dark:text-brand-800"
          >
            How it works
          </motion.p>
          <motion.h2
            variants={slideUp}
            className="font-display text-3xl font-bold tracking-tight sm:text-5xl"
          >
            From install to bank transfer, in five steps
          </motion.h2>
          <motion.p
            variants={slideUp}
            className="max-w-md text-pretty text-muted-foreground"
          >
            Every step is verified by our team, so every reward is real. You can
            track your installs and payouts any time in the installer portal.
          </motion.p>
        </motion.div>

        <motion.ol
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          className="relative space-y-4"
        >
          {STEPS.map((step, i) => (
            <motion.li
              key={step.title}
              variants={slideUp}
              className={
                step.highlight
                  ? "relative squircle rounded-3xl border border-brand-900/25 bg-brand-200/70 p-6 dark:border-brand-900/20 dark:bg-brand-1000/20 text-brand-800 dark:text-brand-700"
                  : "relative squircle rounded-3xl border border-foreground/10 bg-card p-6 dark:border-white/8"
              }
            >
              <div className="flex items-start gap-5">
                <span
                  aria-hidden
                  className="font-number pt-0.5 text-3xl leading-snug text-brand-800 tabular-nums dark:text-brand-600/80"
                >
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-bold">
                      {step.title}
                    </h3>
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-900/10 dark:bg-brand-900/15">
                      <step.icon className="size-5 text-brand-900 dark:text-brand-600" />
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>

                  {step.highlight && (
                    <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-brand-900/30 bg-background/70 px-4 py-3 dark:border-brand-700/40">
                      <span className="text-xs text-muted-foreground">
                        Reward credited · Bank transfer
                      </span>
                      <span className="font-number text-lg tabular-nums text-brand-900 dark:text-brand-600">
                        Rs 5,000
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
