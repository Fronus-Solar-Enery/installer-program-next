"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "motion/react";
import {
  IconMoney,
  IconBank,
  IconShieldStar,
  IconCalendar,
} from "@/components/icons";
import { slideUp, staggerContainer, VIEWPORT_ONCE } from "@/lib/motion";

export interface LandingStats {
  installers: number;
  installations: number;
  rewardsPaid: number;
}

/**
 * Live counters only render once they're big enough to build trust instead
 * of undermining it ("3 installers registered" reads as a dead program).
 * Below the floor, the fixed value-prop tiles carry the section.
 */
const LIVE_STATS_MIN_INSTALLS = 50;

const VALUE_TILES = [
  { icon: IconMoney, title: "Rs 5,000 flat", sub: "Per eligible install" },
  { icon: IconBank, title: "Paid to your bank", sub: "Direct transfer" },
  { icon: IconShieldStar, title: "SolaX-backed", sub: "Official partnership" },
  {
    icon: IconCalendar,
    title: "After 1 Jul 2026",
    sub: "Unit purchase date to qualify",
  },
];

function Counter({ value, prefix = "" }: { value: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(
    spring,
    (v) => `${prefix}${Math.round(v).toLocaleString()}`,
  );
  const [text, setText] = useState(`${prefix}0`);

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, spring, value]);
  useEffect(() => display.on("change", setText), [display]);

  return (
    <span ref={ref} className="font-number tabular-nums">
      {text}
    </span>
  );
}

export default function ProofBar({ stats }: { stats: LandingStats }) {
  const showLive = stats.installations >= LIVE_STATS_MIN_INSTALLS;

  const counters = [
    { label: "Registered installers", value: stats.installers },
    { label: "Installations rewarded", value: stats.installations },
    { label: "Paid out so far", value: stats.rewardsPaid, prefix: "Rs " },
  ];

  return (
    <section className="border-y border-border/60 bg-brand-300/50 dark:bg-muted/30">
      {showLive ? (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          className="mx-auto grid max-w-5xl grid-cols-1 gap-8 px-4 py-12 text-center sm:grid-cols-3"
        >
          {counters.map((item) => (
            <motion.div
              key={item.label}
              variants={slideUp}
              className="space-y-1"
            >
              <p className="text-3xl font-bold text-brand-900 sm:text-4xl dark:text-brand-600">
                <Counter value={item.value} prefix={item.prefix} />
              </p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT_ONCE}
          className="mx-auto grid max-w-5xl grid-cols-2 gap-x-4 gap-y-8 px-4 py-10 lg:grid-cols-4"
        >
          {VALUE_TILES.map((tile) => (
            <motion.div
              key={tile.title}
              variants={slideUp}
              className="flex items-center gap-3"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-brand-900/15 dark:bg-brand-900/15">
                <tile.icon className="size-6 text-brand-900 dark:text-brand-700" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-foreground">
                  {tile.title}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tile.sub}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
