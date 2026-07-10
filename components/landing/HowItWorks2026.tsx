"use client";

import { motion } from "motion/react";
import { IconWhatsapp, IconClipboardTick, IconMoney } from "@/components/icons";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";

const STEPS = [
  {
    icon: IconWhatsapp,
    n: "01",
    title: "Join",
    body: "Message us on WhatsApp. We register you and send your installer code + PIN — also on WhatsApp.",
  },
  {
    icon: IconClipboardTick,
    n: "02",
    title: "Install",
    body: "Fit a Fronus inverter for a customer. Register the install with its serial number.",
  },
  {
    icon: IconMoney,
    n: "03",
    title: "Earn",
    body: "Rs 5,000 lands in your bank for every eligible install. Repeat as often as you like.",
  },
];

export default function HowItWorks2026() {
  return (
    <section
      id="how-it-works"
      className="relative mx-auto max-w-6xl px-4 py-24"
    >
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="space-y-3 text-center"
      >
        <motion.p
          variants={slideUp}
          className="text-xs uppercase tracking-[0.3em] text-brand-800"
        >
          How It Works
        </motion.p>
        <motion.h2
          variants={slideUp}
          className="font-display text-3xl font-bold tracking-tight sm:text-5xl"
        >
          Three steps to your first Rs 5,000
        </motion.h2>
      </motion.div>

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="relative mt-16 grid grid-cols-1 gap-6 md:grid-cols-3"
      >
        {STEPS.map((step) => (
          <motion.div
            key={step.n}
            variants={slideUp}
            className="lp-glass rounded-3xl p-7"
          >
            <div className="mb-4 flex items-center justify-between">
              <span className="font-number text-5xl font-bold text-brand-800/50">
                {step.n}
              </span>
              <div className="flex size-11 items-center justify-center rounded-2xl bg-brand-800/15">
                <step.icon className="size-5 text-brand-500" />
              </div>
            </div>
            <h3 className="font-display text-xl font-bold">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {step.body}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
