"use client";

import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IconActivity,
  IconClockCircle,
  IconEdit2,
  IconInfoCircle,
  IconTrashBin2,
} from "@/components/icons";
import IconUser from "@/components/icons/User";
import IconUserPlus from "@/components/icons/UserPlus";
import type { InstallerActivity } from "@/hooks/useInstallerDetails";

function classifyActivity(type: string) {
  return {
    isCreated: type.includes("REGISTERED") || type.includes("CREATED"),
    isUpdated: type.includes("UPDATED"),
    isDeleted: type.includes("DELETED"),
    isPaid: type.includes("PAID"),
    isFailed: type.includes("FAILED"),
  };
}

function ActivityDot({ type }: { type: string }) {
  const { isCreated, isUpdated, isDeleted, isPaid, isFailed } =
    classifyActivity(type);

  const colorClass =
    isDeleted || isFailed
      ? "bg-destructive/10 text-destructive-text ring-destructive/20"
      : isCreated || isPaid
        ? "bg-success/10 text-success-text ring-success/20"
        : isUpdated
          ? "bg-brandsec-500/20 text-brandsec-800 dark:text-brandsec-300 ring-brandsec-500/20"
          : "bg-muted text-muted-foreground ring-border";

  const Icon = type.includes("INSTALLER_REGISTERED")
    ? IconUserPlus
    : isUpdated
      ? IconEdit2
      : isDeleted
        ? IconTrashBin2
        : IconActivity;

  return (
    <div
      className={`relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full ring-4 ring-background ${colorClass}`}
    >
      <Icon className="size-4" duotone />
    </div>
  );
}

function activityBadgeVariant(
  type: string,
): "default" | "destructive" | "outline" | "secondary" {
  const { isCreated, isUpdated, isDeleted, isPaid } = classifyActivity(type);
  if (isDeleted) return "destructive";
  if (isCreated || isPaid) return "default";
  if (isUpdated) return "secondary";
  return "outline";
}

function activityTitle(activity: InstallerActivity) {
  if (activity.type === "INSTALLER_REGISTERED" && activity.metadata) {
    const name = activity.metadata.name || activity.targetName || "Unknown";
    const code = activity.metadata.code || "";
    return `Created new installer: ${name} (${code})`;
  }
  return activity.description;
}

function formatTimestamp(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ActivityTimelineSkeleton() {
  return (
    <div className="space-y-6 p-1">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-start gap-4">
          <Skeleton round className="size-9 shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ActivityTimeline({
  activities,
}: {
  activities: InstallerActivity[];
}) {
  const reduceMotion = useReducedMotion();

  if (activities.length === 0) {
    return (
      <Card className="min-h-72 flex items-center justify-center">
        <CardContent className="p-12 text-center">
          <IconActivity
            className="mx-auto mb-4 size-12 text-muted-foreground"
            duotone
          />
          <p className="text-muted-foreground">No activity recorded yet</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Registrations, updates and reward events will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ol aria-label="Activity timeline" className="relative space-y-4">
      {/* Vertical rail */}
      <div
        aria-hidden
        className="absolute bottom-4 left-[17px] top-4 w-px bg-border"
      />
      {activities.map((activity, i) => (
        <motion.li
          key={activity._id}
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 28,
            delay: Math.min(i, 8) * 0.04,
          }}
          className="flex items-start gap-4"
        >
          <ActivityDot type={activity.type} />
          <div className="min-w-0 flex-1 rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-layered">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <p className="min-w-0 text-sm font-medium leading-snug">
                {activityTitle(activity)}
              </p>
              <Badge
                variant={activityBadgeVariant(activity.type)}
                className="shrink-0"
              >
                {activity.type
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (l: string) => l.toUpperCase())}
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <IconUser className="size-3" duotone />
                {activity.performedBy?.name || "Unknown"}
              </span>
              <span aria-hidden className="text-muted-foreground/50">
                •
              </span>
              <span className="flex items-center gap-1">
                <IconClockCircle className="size-3" duotone />
                <time dateTime={activity.createdAt}>
                  {formatTimestamp(activity.createdAt)}
                </time>
              </span>
              {activity.targetName &&
                !activity.type.includes("INSTALLER_REGISTERED") && (
                  <>
                    <span aria-hidden className="text-muted-foreground/50">
                      •
                    </span>
                    <span className="truncate">
                      Target: {activity.targetName}
                    </span>
                  </>
                )}
            </div>

            {/* Changes */}
            {activity.metadata?.changes &&
              Object.keys(activity.metadata.changes).length > 0 && (
                <details className="group mt-3">
                  <summary className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground">
                    <IconInfoCircle className="size-3" duotone />
                    View changes (
                    {Object.keys(activity.metadata.changes).length})
                  </summary>
                  <dl className="mt-2 space-y-2 rounded-lg bg-muted/40 p-3">
                    {Object.entries(activity.metadata.changes).map(
                      ([key, value]) => (
                        <div key={key} className="text-xs">
                          <dt className="font-medium capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </dt>
                          <dd className="ml-4 break-words">
                            <span className="text-destructive-text line-through">
                              {String(value.before || "N/A")}
                            </span>
                            {" → "}
                            <span className="text-success-text">
                              {String(value.after || "N/A")}
                            </span>
                          </dd>
                        </div>
                      ),
                    )}
                  </dl>
                </details>
              )}

            {/* WhatsApp metadata */}
            {activity.metadata?.whatsappNumber && (
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <Badge variant="outline" className="font-mono">
                  {String(activity.metadata.whatsappNumber)}
                </Badge>
                {activity.metadata.errorMessage && (
                  <span className="text-destructive-text">
                    Error: {String(activity.metadata.errorMessage)}
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.li>
      ))}
    </ol>
  );
}
