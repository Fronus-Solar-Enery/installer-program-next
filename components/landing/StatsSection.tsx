"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { staggerContainer, slideUp, VIEWPORT_ONCE } from "@/lib/motion";

export interface LandingStats {
  installers: number;
  installations: number;
  rewardsPaid: number;
}

function Counter({ value, prefix = "" }: { value: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) =>
    `${prefix}${Math.round(v).toLocaleString()}`
  );
  const [text, setText] = useState(`${prefix}0`);

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, spring, value]);

  useEffect(() => display.on("change", setText), [display]);

  return <span ref={ref}>{text}</span>;
}

export default function StatsSection({ stats }: { stats: LandingStats }) {
  const items = [
    { label: "Registered Installers", value: stats.installers },
    { label: "Installations Tracked", value: stats.installations },
    { label: "Rewards Paid", value: stats.rewardsPaid, prefix: "Rs. " },
  ];

  return (
    <section className="border-y border-border/50 bg-muted/20">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT_ONCE}
        className="max-w-5xl mx-auto px-4 py-14 grid grid-cols-1 sm:grid-cols-3 gap-10 text-center"
      >
        {items.map((item) => (
          <motion.div key={item.label} variants={slideUp} className="space-y-1">
            <p className="text-4xl font-bold tabular-nums text-brand-1000 dark:text-brand-600">
              <Counter value={item.value} prefix={item.prefix} />
            </p>
            <p className="text-sm text-muted-foreground">{item.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
