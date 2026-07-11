"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  IconCheck,
  IconClockCircle,
  IconCloseCircle,
  IconWarning2,
} from "@/components/icons";
import type { RewardPageState } from "@/lib/rewardPageState";

type NodeState = "complete" | "current" | "blocked" | "failed" | "upcoming";

const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

const NODE_STYLES: Record<NodeState, string> = {
  complete: "bg-success/10 text-success-text ring-success/20",
  current:
    "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20",
  blocked:
    "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 ring-yellow-500/20",
  failed: "bg-destructive/10 text-destructive-text ring-destructive/20",
  upcoming: "bg-muted text-muted-foreground ring-border",
};

const NODE_ICONS: Record<NodeState, React.ComponentType<IconProps>> = {
  complete: IconCheck,
  current: IconClockCircle,
  blocked: IconWarning2,
  failed: IconCloseCircle,
  upcoming: IconClockCircle,
};

function stepsFor(
  state: RewardPageState,
): { label: string; node: NodeState }[] {
  return [
    { label: "Registered", node: "complete" },
    {
      label: "Verified",
      node: state === "blocked" ? "blocked" : "complete",
    },
    {
      label: "Paid",
      node:
        state === "paid"
          ? "complete"
          : state === "failed"
            ? "failed"
            : "upcoming",
    },
  ];
}

export default function LifecycleStepper({
  state,
}: {
  state: RewardPageState;
}) {
  const reduceMotion = useReducedMotion();
  const steps = stepsFor(state);
  const currentIndex = state === "paid" ? 3 : state === "blocked" ? 1 : 2;

  return (
    <ol
      aria-label={`Payment progress: step ${Math.min(currentIndex, 3)} of 3`}
      className="flex w-full items-center"
    >
      {steps.map((step, i) => {
        const connectorDone = i > 0 && steps[i - 1].node === "complete";
        return (
          <li
            key={step.label}
            className={cn("flex items-center", i > 0 && "flex-1")}
          >
            {i > 0 && (
              <div
                aria-hidden
                className="relative mx-2 h-px flex-1 overflow-hidden bg-border sm:mx-3"
              >
                <motion.div
                  className={cn(
                    "absolute inset-0 origin-left bg-success/80",
                    step.node === "upcoming" && "bg-muted",
                  )}
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  animate={{ scaleX: connectorDone ? 1 : 0 }}
                  transition={SPRING}
                />
              </div>
            )}
            <div className="flex shrink-0 items-center gap-2">
              <motion.span
                initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ ...SPRING, delay: reduceMotion ? 0 : i * 0.06 }}
                className={cn(
                  "flex size-8 items-center justify-center rounded-full ring-1",
                  NODE_STYLES[step.node],
                )}
              >
                {(() => {
                  const Icon = NODE_ICONS[step.node];
                  return <Icon className="size-4" />;
                })()}
              </motion.span>
              <span
                className={cn(
                  "text-xs font-medium",
                  step.node === "upcoming"
                    ? "text-muted-foreground"
                    : "text-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
