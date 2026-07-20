"use client";

import { useEffect, useRef, useState } from "react";
import {
  useInView,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  compact?: boolean;
  compactThreshold?: number;
}

export function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  className,
  compact,
  compactThreshold,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const spring = useSpring(0, { stiffness: 60, damping: 20 });
  const display = useTransform(spring, (v) => {
    const n =
      compact && v >= (compactThreshold ?? 0)
        ? new Intl.NumberFormat("en-US", {
            notation: "compact",
            compactDisplay: "short",
            maximumFractionDigits: 1,
          }).format(v)
        : Math.round(v).toLocaleString();
    return `${prefix}${n}${suffix}`;
  });
  const [text, setText] = useState(`${prefix}0${suffix}`);

  useEffect(() => {
    if (!inView) return;
    // Reduced motion still gets the number, just without the count-up.
    if (reduceMotion) spring.jump(value);
    else spring.set(value);
  }, [inView, spring, value, reduceMotion]);
  useEffect(() => display.on("change", setText), [display]);

  return (
    <span ref={ref} className={className}>
      {text}
    </span>
  );
}
