"use client";

import { motion } from "framer-motion";
import {
  IconUserId,
  IconClipboardTick,
  IconDiagramUp,
} from "@/components/icons";
import { staggerContainer, slideUp, VIEWPORT_ONCE } from "@/lib/motion";

const STEPS = [
  {
    icon: IconUserId,
    step: "01",
    title: "Onboard",
    body: "Get registered by the Fronus team and receive your installer code + login PIN on WhatsApp.",
  },
  {
    icon: IconClipboardTick,
    step: "02",
    title: "Track",
    body: "Every installation you complete is registered with its serial number and reward amount.",
  },
  {
    icon: IconDiagramUp,
    step: "03",
    title: "Grow",
    body: "Collect rewards, earn referral bonuses, and build a verified public track record.",
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-muted/20 border-y border-border/50">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="max-w-6xl mx-auto px-4 py-24 space-y-12"
      >
        <motion.div variants={slideUp} className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            How it works
          </h2>
          <p className="text-muted-foreground">
            From first install to first payment in three steps.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <motion.div
              key={step.step}
              variants={slideUp}
              className="relative squircle rounded-3xl bg-card border border-border/60 p-6 space-y-3"
            >
              <span className="text-5xl font-bold text-brand-600/60 dark:text-brand-1000 tabular-nums select-none">
                {step.step}
              </span>
              <div className="flex items-center gap-2">
                <step.icon className="size-5 text-brand-1000 dark:text-brand-600" />
                <h3 className="font-semibold text-lg">{step.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.body}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
