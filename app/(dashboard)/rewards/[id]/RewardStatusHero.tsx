"use client";

import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { cn } from "@/lib/utils";
import {
  IconCheckCircle,
  IconClockCircle,
  IconCloseCircle,
  IconEdit2,
  IconMoney,
  IconWarning2,
} from "@/components/icons";
import LifecycleStepper from "./LifecycleStepper";
import type { RewardPageState } from "@/lib/rewardPageState";
import type { RewardDetails } from "@/hooks/useRewardDetails";

const SPRING = { type: "spring", stiffness: 300, damping: 30 } as const;

const STATE_CHROME: Record<
  RewardPageState,
  { card: string; chip: React.ReactNode }
> = {
  payable: {
    card: "bg-muted/20",
    chip: (
      <Badge variant="warning" role="status">
        <IconClockCircle className="size-3" />
        Pending
      </Badge>
    ),
  },
  blocked: {
    card: "bg-yellow-500/5 border-yellow-500/20",
    chip: (
      <Badge variant="warning" role="status">
        <IconWarning2 className="size-3" />
        Action needed
      </Badge>
    ),
  },
  paid: {
    card: "bg-success/5 border-success/20",
    chip: (
      <Badge variant="success" role="status">
        <IconCheckCircle className="size-3" />
        Paid
      </Badge>
    ),
  },
  failed: {
    card: "bg-destructive/5 border-destructive/20",
    chip: (
      <Badge variant="destructive" role="status">
        <IconCloseCircle className="size-3" />
        Failed
      </Badge>
    ),
  },
};

function formatDate(date?: string) {
  if (!date) return null;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface RewardStatusHeroProps {
  reward: RewardDetails;
  state: RewardPageState;
  pendingDays: number;
  blockers: string[];
  onMarkPaid: () => void;
  onEdit: () => void;
}

export default function RewardStatusHero({
  reward,
  state,
  pendingDays,
  blockers,
  onMarkPaid,
  onEdit,
}: RewardStatusHeroProps) {
  const reduceMotion = useReducedMotion();
  const installer = reward.installer;

  return (
    <Card
      className={cn(
        "shadow-layered transition-colors duration-300",
        STATE_CHROME[state].card,
      )}
    >
      <CardContent className="space-y-5 p-5 lg:p-6">
        {/* Amount lockup + contextual action */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={state}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduceMotion ? undefined : { opacity: 0, scale: 0.9 }}
                  transition={SPRING}
                >
                  {STATE_CHROME[state].chip}
                </motion.span>
              </AnimatePresence>
              {state === "payable" && pendingDays > 14 && (
                <span className="text-xs text-muted-foreground">
                  Pending {pendingDays} days
                </span>
              )}
            </div>
            <p className="font-number text-4xl font-semibold leading-tight tracking-tight tabular-nums">
              Rs. {(reward.rewardAmount ?? 0).toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              to{" "}
              {installer ? (
                <Link
                  href={`/installers/${installer._id}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {installer.fullName}
                </Link>
              ) : (
                <span className="font-medium text-foreground">Unknown</span>
              )}
              {(reward.installerCode || installer?.installerCode) && (
                <span className="font-mono">
                  {" "}
                  · {reward.installerCode || installer?.installerCode}
                </span>
              )}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {state === "payable" && (
              <Button size="lg" onClick={onMarkPaid}>
                <IconMoney className="mr-2 size-4" duotone />
                Mark as Paid
              </Button>
            )}
            {state === "blocked" && (
              <Button variant="outline" onClick={onEdit}>
                <IconEdit2 className="mr-2 size-4" duotone />
                Complete details
              </Button>
            )}
            {state === "failed" && (
              <>
                <Button onClick={onMarkPaid}>
                  <IconMoney className="mr-2 size-4" duotone />
                  Retry payment
                </Button>
                <Button variant="outline" onClick={onEdit}>
                  Edit details
                </Button>
              </>
            )}
            {state === "paid" && (
              <Button variant="outline" onClick={onMarkPaid}>
                <IconEdit2 className="mr-2 size-4" duotone />
                Edit payment
              </Button>
            )}
          </div>
        </div>

        {/* Blocked: requirements checklist */}
        {state === "blocked" && (
          <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3 text-sm">
            <p className="font-medium">
              Payment blocked — {blockers.length} missing{" "}
              {blockers.length === 1 ? "detail" : "details"}
            </p>
            <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
              {blockers.map((b) => (
                <li key={b} className="flex items-center gap-1.5">
                  <IconWarning2
                    className="size-3 text-yellow-600 dark:text-yellow-400"
                    duotone
                  />
                  {b} missing —{" "}
                  <button
                    type="button"
                    onClick={onEdit}
                    className="text-foreground underline underline-offset-2"
                  >
                    add it
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Paid: receipt line */}
        {state === "paid" && (reward.transactionId || reward.sendingDate) && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
            className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-success/20 bg-success/5 p-3 text-xs"
          >
            {reward.transactionId && (
              <span className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Txn</span>
                <span className="font-mono font-medium">
                  {reward.transactionId}
                </span>
                <CopyButton
                  text={reward.transactionId}
                  label="Transaction ID"
                />
              </span>
            )}
            {reward.sendingDate && (
              <span className="text-muted-foreground">
                Sent {formatDate(reward.sendingDate)}
              </span>
            )}
            {reward.paymentMethod && (
              <span className="text-muted-foreground">
                via {reward.paymentMethod}
              </span>
            )}
          </motion.div>
        )}

        <LifecycleStepper state={state} />
      </CardContent>
    </Card>
  );
}
