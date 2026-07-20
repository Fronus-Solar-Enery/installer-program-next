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

// Dial geometry, in viewBox units. Proportions follow the reference gauge:
// a true semicircle of 12 sub-arcs, band thickness 0.41 of the outer radius.
// The segment count is fixed rather than derived from the threshold — the fill
// is percentage-driven, so segments are a visual scale, not one-per-warning.
const SEGMENT_COUNT = 12;

const START_ANGLE = -90; // left end of the arc; 0 is straight up
const END_ANGLE = 90;
const OUTER_RADIUS = 130;
const ARC_WIDTH = 0.41; // band thickness as a fraction of the outer radius
const INNER_RADIUS = OUTER_RADIUS * (1 - ARC_WIDTH);
const CORNER_RADIUS = 9;
const GAP_ANGLE = 1.72; // 0.03rad of padding between neighbouring segments

const VIEW_WIDTH = 280;
const VIEW_HEIGHT = 156;
const CENTER_X = 140;
const CENTER_Y = 140;

const SWEEP_MS = 900;

// Health ramp, low to high. Literal colours rather than theme tokens because
// these are interpolated frame by frame; all three read acceptably on both the
// light and dark card backgrounds.
const RAMP_STOPS = [0, 50, 100];
const RAMP_COLORS = ["#ef4444", "#fbbf24", "#10b981"];

/** Point on the dial. 0deg points straight up, positive turns clockwise. */
function polar(radius: number, degrees: number) {
  const rad = (degrees * Math.PI) / 180;
  return {
    x: CENTER_X + radius * Math.sin(rad),
    y: CENTER_Y - radius * Math.cos(rad),
  };
}

/**
 * Path for one tapered segment: an annular sector, narrower at its inner edge
 * than its outer one because both edges follow their own arc. A rotated div
 * can't do this — its sides stay parallel — and clip-path can taper but cannot
 * round the corners.
 *
 * Corners are rounded by stroking the shape in its own colour with
 * `stroke-linejoin: round`, so the path is inset by half the stroke on every
 * side to keep the painted result on the intended radii.
 */
function segmentPath(angle: number, halfSweep: number) {
  const inset = CORNER_RADIUS / 2;
  const innerR = INNER_RADIUS + inset;
  const outerR = OUTER_RADIUS - inset;

  // Trim the sweep by the same inset, measured at the mid-radius, so gaps
  // between segments stay even once the stroke fattens each one.
  const midR = (innerR + outerR) / 2;
  const angularInset = ((inset / midR) * 180) / Math.PI;
  const half = Math.max(halfSweep - angularInset, 0.5);

  const a0 = angle - half;
  const a1 = angle + half;

  const o0 = polar(outerR, a0);
  const o1 = polar(outerR, a1);
  const i0 = polar(innerR, a0);
  const i1 = polar(innerR, a1);

  const p = (n: number) => n.toFixed(2);

  return [
    `M ${p(o0.x)} ${p(o0.y)}`,
    // Outer edge, sweeping clockwise.
    `A ${outerR} ${outerR} 0 0 1 ${p(o1.x)} ${p(o1.y)}`,
    `L ${p(i1.x)} ${p(i1.y)}`,
    // Inner edge, back anticlockwise.
    `A ${innerR} ${innerR} 0 0 0 ${p(i0.x)} ${p(i0.y)}`,
    "Z",
  ].join(" ");
}

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
  d,
  fillAtPercent,
  stepPercent,
}: {
  progress: MotionValue<number>;
  color: MotionValue<string>;
  d: string;
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
    <>
      {/* Empty track, always visible. */}
      <path
        d={d}
        className="fill-muted stroke-muted"
        strokeWidth={CORNER_RADIUS}
        strokeLinejoin="round"
      />
      <motion.path
        d={d}
        style={{ opacity, fill: color, stroke: color }}
        strokeWidth={CORNER_RADIUS}
        strokeLinejoin="round"
      />
    </>
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

  const totalSegments = SEGMENT_COUNT;
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

  const pitch = (END_ANGLE - START_ANGLE) / totalSegments;
  const halfSweep = (pitch - GAP_ANGLE) / 2;
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
    <div
      className={cn(
        "flex w-full flex-col items-center justify-between",
        className,
      )}
    >
      {/* Fills whatever width it is given; the viewBox fixes the aspect ratio.
          `container-type: inline-size` is what makes the readout's cqw units
          resolve against this box — without it they fall back to the viewport
          and the text stops tracking the dial. */}
      <div
        className="relative w-full"
        style={{ containerType: "inline-size" }}
        role="meter"
        aria-valuenow={remaining}
        aria-valuemin={0}
        aria-valuemax={threshold}
        aria-label={`${remaining} of ${threshold} warnings remaining before suspension`}
      >
        <svg
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          className="h-auto w-full"
          aria-hidden="true"
        >
          {Array.from({ length: totalSegments }).map((_, index) => (
            <GaugeSegment
              key={index}
              progress={progress}
              color={color}
              // Segment centres sit at the middle of each pitch slot.
              d={segmentPath(START_ANGLE + pitch * (index + 0.5), halfSweep)}
              fillAtPercent={(index + 1) * stepPercent}
              stepPercent={stepPercent}
            />
          ))}
        </svg>

        {/* Readout sits inside the arc. The "%" is a sibling of the digits so it
            stays put as they change width. */}
        {/* Anchored from the bottom: the semicircle's baseline sits at the foot
            of the box, so the readout stacks upward into the arc. */}
        <div
          className="absolute inset-x-0 flex flex-col items-center"
          style={{ bottom: "6%" }}
        >
          <motion.span
            className="flex items-start font-semibold leading-none"
            style={{ color }}
          >
            {/* Sized in cqw so the readout tracks the dial at any width, with
                clamps so it stays legible when the card is narrow and doesn't
                run away when it is wide. */}
            <span
              className="tabular-nums leading-none"
              style={{ fontSize: "clamp(1.75rem, 13cqw, 4rem)" }}
            >
              {displayPercent}
            </span>
            <span
              className="leading-none"
              style={{ fontSize: "clamp(0.875rem, 6cqw, 2rem)" }}
            >
              %
            </span>
          </motion.span>
          <span
            className="mt-1.5 text-muted-foreground"
            style={{ fontSize: "clamp(0.7rem, 4cqw, 1.125rem)" }}
          >
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
