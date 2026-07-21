"use client";

import { motion, useReducedMotion } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  IconWarning2,
  IconShieldStar,
  IconCheckCircle,
} from "@/components/icons";
import { AccountHealthGauge } from "@/components/AccountHealthGauge";

export interface AccountHealthWarning {
  _id: string;
  reason: string;
  serialNumber: string;
  issuedAt: string | Date;
  expiresAt: string | Date;
}

export interface AccountHealthData {
  activeWarnings: number;
  threshold: number;
  suspended: boolean;
  status: "GOOD" | "AT_RISK" | "SUSPENDED";
  warnings: AccountHealthWarning[];
}

const STATUS_COPY = {
  GOOD: {
    label: "Good",
    badge: "success" as const,
    Icon: IconCheckCircle,
    tone: "text-emerald-600 dark:text-emerald-400",
    meter: "bg-emerald-500",
  },
  AT_RISK: {
    label: "At risk",
    badge: "warning" as const,
    Icon: IconWarning2,
    tone: "text-yellow-600 dark:text-yellow-500",
    meter: "bg-yellow-400",
  },
  SUSPENDED: {
    label: "Suspended",
    badge: "destructive" as const,
    Icon: IconShieldStar,
    tone: "text-destructive",
    meter: "bg-destructive",
  },
};

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface AccountHealthCardProps {
  health: AccountHealthData;
  /** Installer-facing copy differs from the team-facing wording. */
  audience?: "team" | "installer";
  /**
   * "bar" is the dense segmented strip used in dashboard side panels; "gauge"
   * is the full dial the installer sees on their own stats page.
   */
  variant?: "bar" | "gauge";
  className?: string;
  compact?: boolean;
}

/**
 * Account health: a warnings meter, standing badge, and the active warnings with
 * the date each stops counting. Presentational — callers supply the data.
 */
export function AccountHealthCard({
  health,
  audience = "team",
  variant = "bar",
  className,
  compact = false,
}: AccountHealthCardProps) {
  const reduceMotion = useReducedMotion();
  const copy = STATUS_COPY[health.status];
  const { Icon } = copy;

  const filled = Math.min(health.activeWarnings, health.threshold);
  const remaining = Math.max(health.threshold - health.activeWarnings, 0);
  const isGauge = variant === "gauge";

  return (
    <section
      className={cn(
        "squircle rounded-3xl border border-border p-4 space-y-4",
        health.suspended && "border-destructive/40 bg-destructive/5",
        className,
      )}
      aria-labelledby="account-health-heading"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "dark:bg-background bg-muted p-1.5 rounded-xl",
              copy.tone,
            )}
          >
            <Icon className="size-10" aria-hidden="true" />
          </div>
          <div>
            <h3
              id="account-health-heading"
              className="text-sm font-medium text-foreground"
            >
              Account Health
            </h3>
            {/* The gauge states the count itself — no need to say it twice. */}
            {!isGauge && (
              <p className="text-xs text-muted-foreground">
                {health.activeWarnings} of {health.threshold} warnings
              </p>
            )}
          </div>
        </div>
        <Badge variant={copy.badge}>{copy.label}</Badge>
      </header>

      {isGauge ? (
        <AccountHealthGauge
          activeWarnings={health.activeWarnings}
          threshold={health.threshold}
          status={health.status}
        />
      ) : (
        /* Segmented meter: one segment per warning allowed before suspension. */
        <div
          className="flex gap-1.5"
          role="meter"
          aria-valuenow={health.activeWarnings}
          aria-valuemin={0}
          aria-valuemax={health.threshold}
          aria-label={`${health.activeWarnings} of ${health.threshold} warnings used`}
        >
          {Array.from({ length: health.threshold }).map((_, index) => (
            <motion.span
              key={index}
              className={cn(
                "h-1.5 flex-1 rounded-full",
                index < filled ? copy.meter : "bg-muted",
              )}
              initial={reduceMotion ? false : { scaleX: 0.4, opacity: 0.4 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={
                reduceMotion
                  ? { duration: 0 }
                  : {
                      type: "spring",
                      stiffness: 420,
                      damping: 34,
                      delay: index * 0.04,
                    }
              }
            />
          ))}
        </div>
      )}

      {/* The gauge's own footer already states standing and headroom, so this
          line would just repeat it. */}
      {!isGauge &&
        (health.suspended ? (
          <p className="text-sm text-destructive">
            {audience === "installer"
              ? "Your account is suspended. New reward claims will not be processed until an administrator restores it. Contact the Fronus team to resolve this."
              : "This installer is suspended. An ADMIN must lift the suspension before new claims are processed."}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            {remaining === 0
              ? "The next warning will suspend this account."
              : `${remaining} more warning${remaining === 1 ? "" : "s"} before suspension.`}
          </p>
        ))}

      {!compact && health.warnings.length > 0 && (
        <ul className="space-y-2">
          {health.warnings.map((warning) => (
            <li
              key={warning._id}
              className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <span className="font-medium text-foreground">
                  {warning.reason}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {warning.serialNumber}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span>Issued {formatDate(warning.issuedAt)}</span>
                <span>Expires {formatDate(warning.expiresAt)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!compact && health.warnings.length === 0 && !health.suspended && (
        <p className="text-sm text-muted-foreground">
          No active warnings. Warnings stop counting six months after they are
          issued.
        </p>
      )}
    </section>
  );
}
