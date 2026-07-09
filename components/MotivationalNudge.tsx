"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame } from "lucide-react";

interface Reward {
  createdAt: string;
}

interface MotivationalNudgeProps {
  rewards: Reward[];
}

export function MotivationalNudge({ rewards }: MotivationalNudgeProps) {
  const message = useMemo(() => {
    const now = new Date();
    const thisMonth = rewards.filter((r) => {
      const d = new Date(r.createdAt);
      return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      );
    });

    const lastMonth = rewards.filter((r) => {
      const d = new Date(r.createdAt);
      const last = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return (
        d.getFullYear() === last.getFullYear() &&
        d.getMonth() === last.getMonth()
      );
    });

    const count = thisMonth.length;
    const lastCount = lastMonth.length;

    if (count === 0) {
      if (lastCount > 0) {
        return {
          text: `You installed ${lastCount} product${lastCount !== 1 ? "s" : ""} last month. Let's keep that momentum going this month!`,
          accent: "text-muted-foreground",
        };
      }
      return {
        text: "Ready to earn? Your first installation this month is waiting to happen.",
        accent: "text-muted-foreground",
      };
    }

    if (count >= 5) {
      return {
        text: `Amazing — ${count} installations this month! You're setting the pace. Keep it up!`,
        accent: "text-success-text",
      };
    }

    if (count >= 3) {
      return {
        text: `${count} installations this month — great progress! Just a few more to make this your best month yet.`,
        accent: "text-brand-800",
      };
    }

    if (lastCount > 0 && count < lastCount) {
      return {
        text: `${count} so far this month. You were at ${lastCount} by this time last month — let's catch up!`,
        accent: "text-muted-foreground",
      };
    }

    return {
      text: `${count} installation${count !== 1 ? "s" : ""} this month. Every install is a reward earned. Keep going!`,
      accent: "text-brand-800",
    };
  }, [rewards]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={message.text}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center gap-3 rounded-3xl squircle border border-border bg-card px-4 py-3"
      >
        <Flame className={`size-7 md:size-5 shrink-0 ${message.accent}`} />
        <p className="text-sm text-muted-foreground">{message.text}</p>
      </motion.div>
    </AnimatePresence>
  );
}
