"use client";

import { memo, useEffect, useState } from "react";
import {
  motion,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";

// Each warning is drawn as a run of segments rather than a single tick, so the
// arc stays dense and readable at the small thresholds this program uses
// (5 warnings -> 30 segments) while every segment still maps to a real warning.
const SEGMENTS_PER_WARNING = 6;

// Arc sweeps past horizontal on both sides, matching the reference dial.
const START_ANGLE = -100;
const END_ANGLE = 100;

const RADIUS = 108;
const SEGMENT_LENGTH = 28;
const SEGMENT_WIDTH = 9;
const BOX_WIDTH = 280;
const CENTER_Y = 138;
const BOX_HEIGHT = 196;

const SWEEP_MS = 900;

// Health ramp, low to high. Literal colours rather than theme tokens because
// these are interpolated frame by frame; all three read acceptably on both the
// light and dark card backgrounds.
const RAMP_STOPS = [0, 50, 100];
const RAMP_COLORS = ["#ef4444", "#fbbf24", "#10b981"];

export interface AccountHealthGaugeProps {
  activeWarnings: number;
  threshold: number;
  status: "GOOD" | "AT_RISK" | "SUSPENDED";
  className?: string;
}

/**
 * One segment of the dial.
 *
 * Its own component so it can subscribe to the shared progress value with a
 * hook — the fill can't be computed in the parent's render loop.
 */
const GaugeSegment = memo(function GaugeSegment({
  progress,
  color,
  angle,
  fillAtPercent,
  stepPercent,
}: {
  progress: MotionValue<number>;
  color: MotionValue<string>;
  angle: number;
  /** Progress value at which this segment is fully lit. */
  fillAtPercent: number;
  stepPercent: number;
}) {
  // Fades in as the sweep passes it, so the arc fills continuously instead of
  // snapping segment to segment.
  const opacity = useTransform(
    progress,
    [fillAtPercent - stepPercent, fillAtPercent],
    [0, 1],
    { clamp: true },
  );

  return (
    // Spoke pivots about the gauge centre (its own bottom edge); the bar rides
    // at the far end. Rotation lives here rather than on the animated bar
    // because motion applies translate before rotate, which would swing each
    // bar about its own edge instead.
    <span
      aria-hidden="true"
      className="absolute"
      style={{
        width: SEGMENT_WIDTH,
        height: RADIUS + SEGMENT_LENGTH,
        left: "50%",
        top: CENTER_Y - (RADIUS + SEGMENT_LENGTH),
        marginLeft: -SEGMENT_WIDTH / 2,
        transformOrigin: "50% 100%",
        transform: `rotate(${angle}deg)`,
      }}
    >
      {/* Empty track, always visible. */}
      <span
        className="relative block w-full rounded-full bg-muted"
        style={{ height: SEGMENT_LENGTH }}
      >
        <motion.span
          className="absolute inset-0 block rounded-full"
          style={{ opacity, backgroundColor: color }}
        />
      </span>
    </span>
  );
});

/**
 * Semicircular segmented gauge for account standing.
 *
 * Reads as health remaining, not damage taken: a clean account fills the whole
 * arc in green, and each warning eats one warning's worth of segments. The arc,
 * the percentage and their shared colour are all driven by a single spring, so
 * the number and the ramp move together on the way up.
 */
export function AccountHealthGauge({
  activeWarnings,
  threshold,
  status,
  className,
}: AccountHealthGaugeProps) {
  const reduceMotion = useReducedMotion();

  const totalSegments = Math.max(threshold, 1) * SEGMENTS_PER_WARNING;
  const remaining = Math.max(threshold - activeWarnings, 0);

  // Headline figure. Rounded, but never rounded up to 100% while a warning is
  // still active, nor down to 0% while any headroom is left — the number must
  // not contradict the arc beside it.
  const rawPercent = (remaining / Math.max(threshold, 1)) * 100;
  const healthPercent =
    remaining === 0
      ? 0
      : remaining === threshold
        ? 100
        : Math.min(99, Math.max(1, Math.round(rawPercent)));

  const step = (END_ANGLE - START_ANGLE) / (totalSegments - 1);
  const stepPercent = 100 / totalSegments;

  // Single source of truth for the whole dial.
  const progress = useSpring(0, { duration: SWEEP_MS, bounce: 0 });
  const color = useTransform(progress, RAMP_STOPS, RAMP_COLORS);

  const [displayPercent, setDisplayPercent] = useState(
    reduceMotion ? healthPercent : 0,
  );

  useEffect(() => {
    if (reduceMotion) progress.jump(healthPercent);
    else progress.set(healthPercent);
  }, [progress, healthPercent, reduceMotion]);

  useEffect(
    () => progress.on("change", (v) => setDisplayPercent(Math.round(v))),
    [progress],
  );

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <div
        className="relative"
        style={{ width: BOX_WIDTH, height: BOX_HEIGHT }}
        role="meter"
        aria-valuenow={remaining}
        aria-valuemin={0}
        aria-valuemax={threshold}
        aria-label={`${remaining} of ${threshold} warnings remaining before suspension`}
      >
        {Array.from({ length: totalSegments }).map((_, index) => (
          <GaugeSegment
            key={index}
            progress={progress}
            color={color}
            angle={START_ANGLE + index * step}
            fillAtPercent={(index + 1) * stepPercent}
            stepPercent={stepPercent}
          />
        ))}

        {/* Readout sits inside the arc. The "%" is a sibling of the digits so it
            stays put as they change width. */}
        <div
          className="absolute inset-x-0 flex flex-col items-center"
          style={{ top: CENTER_Y - 62 }}
        >
          <motion.span
            className="flex items-start font-semibold leading-none"
            style={{ color }}
          >
            <span className="text-5xl tabular-nums leading-none">
              {displayPercent}
            </span>
            <span className="text-2xl leading-none">%</span>
          </motion.span>
          <span className="mt-2 text-sm text-muted-foreground">
            Account Health
          </span>
        </div>
      </div>

      {/* Footer strip: plain-language standing on the left, headroom on the
          right. */}
      <div className="mt-1 flex w-full flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-border bg-muted/40 px-4 py-2 text-center">
        <span className="text-xs text-muted-foreground sm:text-sm">
          {status === "SUSPENDED"
            ? "Your account is suspended"
            : remaining === 0
              ? "The next warning suspends your account"
              : activeWarnings === 0
                ? "Your account is in good standing"
                : "Your account has active warnings"}
        </span>
        <motion.span
          className="rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap text-white"
          style={{ backgroundColor: color }}
        >
          {status === "SUSPENDED"
            ? "Suspended"
            : `${remaining} of ${threshold} left`}
        </motion.span>
      </div>
    </div>
  );
}
