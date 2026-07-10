"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Progress } from "@/components/ui/progress";
import { slideUp } from "@/lib/motion";
import { IconAward } from "@/components/icons";

const TIERS = [
  {
    threshold: 5,
    name: "Bronze",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "🥉",
    copy: "Your first 5 installations earn you recognition.",
  },
  {
    threshold: 10,
    name: "Silver",
    color: "text-slate-500 dark:text-slate-300",
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    icon: "🥈",
    copy: "Silver tier unlocked! Keep going to reach Gold at 25.",
  },
  {
    threshold: 25,
    name: "Gold",
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    icon: "🥇",
    copy: "Gold installer! You're in the top tier. Diamond awaits at 50.",
  },
  {
    threshold: 50,
    name: "Diamond",
    color: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
    icon: "💎",
    copy: "Diamond installer! You're among the elite.",
  },
  {
    threshold: 100,
    name: "Legend",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    icon: "👑",
    copy: "Legendary status. Your dedication is unmatched.",
  },
];

interface MilestoneProgressProps {
  installationCount: number;
}

export function MilestoneProgress({ installationCount }: MilestoneProgressProps) {
  const { currentTier, nextTier, progressPercent, installationsNeeded } = useMemo(() => {
    const completedTiers = TIERS.filter((t) => installationCount >= t.threshold);
    const current = completedTiers[completedTiers.length - 1] ?? null;
    const next = TIERS.find((t) => installationCount < t.threshold) ?? null;

    if (!next) {
      return {
        currentTier: TIERS[TIERS.length - 1],
        nextTier: null,
        progressPercent: 100,
        installationsNeeded: 0,
      };
    }

    const prevThreshold = current?.threshold ?? 0;
    const range = next.threshold - prevThreshold;
    const progress = ((installationCount - prevThreshold) / range) * 100;

    return {
      currentTier: current,
      nextTier: next,
      progressPercent: Math.min(Math.max(progress, 0), 100),
      installationsNeeded: next.threshold - installationCount,
    };
  }, [installationCount]);

  return (
    <motion.div
      variants={slideUp}
      className={`rounded-2xl border p-5 ${currentTier?.bg ?? "bg-muted/30"} ${currentTier?.border ?? "border-border"}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <IconAward className={`size-5 ${currentTier?.color ?? "text-muted-foreground"}`} />
            <span className="text-sm font-medium text-muted-foreground">
              Installation Milestone
            </span>
          </div>
          <p className="text-2xl font-bold tabular-nums">
            {installationCount} / {nextTier?.threshold ?? "∞"}
          </p>
          <p className="text-sm text-muted-foreground">
            {nextTier
              ? `${installationsNeeded} more to reach ${nextTier.icon} ${nextTier.name}`
              : "You've reached the highest tier!"}
          </p>
        </div>
        {currentTier && (
          <div className="flex items-center gap-2 rounded-xl bg-background/60 px-3 py-1.5 text-sm font-medium">
            <span>{currentTier.icon}</span>
            <span className={currentTier.color}>{currentTier.name}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <Progress
          value={progressPercent}
          className="h-3 bg-muted/60 [&>div]:transition-all [&>div]:duration-700 [&>div]:ease-out"
        />
        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
          <span>{currentTier?.name ?? "Starter"}</span>
          <span>{nextTier?.name ?? "Max"}</span>
        </div>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">
        {nextTier?.copy ?? currentTier?.copy ?? "Keep installing to earn more rewards."}
      </p>
    </motion.div>
  );
}
