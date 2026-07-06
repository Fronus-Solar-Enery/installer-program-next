"use client";

import { useBatchJobs } from "@/contexts/BatchJobContext";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, XCircle, Clock, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Loading from "./ui/loading";
import { IconCheckCircle, IconDangerCircle } from "./icons";
import { AnimatePresence, motion } from "framer-motion";

export function BatchJobProgress() {
  const { activeJobs, isPolling, retryJob } = useBatchJobs();

  if (activeJobs.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-10 right-10 z-50 max-w-72 w-full space-y-2">
      {activeJobs.map((job) => {
        const PENDING = job.status === "pending";
        const PROCESSING = job.status === "processing";
        const COMPLETED = job.status === "completed";
        const FAILED = job.status === "failed";
        return (
          <Card
            key={job._id}
            className="p-4 bg-card dark:bg-background/40 backdrop-blur-md shadow-lg border"
          >
            <div className="space-y-3">
              {/* Success/Failure Counts */}
              {!COMPLETED && (
                <>
                  {/* Header */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="space-y-1">
                          <h4 className="font-semibold">
                            {job.type === "GOOGLE_CONTACTS_CREATE"
                              ? "Creating Contacts"
                              : "Deleting Contacts"}
                          </h4>
                        </div>
                        {/* PERCENTAGE */}
                        <div className="text-xs text-muted-foreground capitalize font-mono">
                          {job.processedItems} / {job.totalItems} contacts
                        </div>
                      </div>
                      {PENDING && <Clock className="size-10 text-blue-500" />}
                      {PROCESSING && <Loading className="size-10" stroke={4} />}
                      {FAILED && <XCircle className="size-10 text-red-500" />}
                    </div>
                    {/* PROGRESS BAR */}
                    <div className="w-full flex items-center">
                      <div className="grow relative h-6">
                        <Progress
                          value={job.progressPercentage}
                          className="size-full"
                        />
                        <div className="absolute inset-0 flex items-center justify-between text-xs size-full px-2 font-semibold mix-blend-difference font-mono">
                          <div className="flex items-center gap-1">
                            <div className="size-2.5 relative flex items-center justify-center z-0">
                              <span
                                className={cn(
                                  "size-1.5 rounded-full",
                                  PENDING && "bg-yellow-600",
                                  PROCESSING && "bg-yellow-600",
                                  COMPLETED && "bg-blue-600",
                                  FAILED && "bg-red-600"
                                )}
                              />
                              <span
                                className={cn(
                                  "absolute inset-0 size-full animate-pulse rounded-full -z-10",
                                  PENDING && "bg-yellow-900/30",
                                  PROCESSING && "bg-blue-900/30",
                                  COMPLETED && "bg-green-900/30",
                                  FAILED && "bg-red-900/30"
                                )}
                              />
                            </div>
                            <p>{job.status}</p>
                          </div>
                          <span>{job.progressPercentage}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(job.successCount > 0 || job.failedCount > 0) && (
                    <div className="flex gap-4 text-xs font-mono capitalize">
                      <JobsSucceed succeed={job.successCount.toString()} />
                      <JobsFailed failed={job.failedCount.toString()} />
                    </div>
                  )}
                </>
              )}
              {COMPLETED && (
                <AnimatePresence mode="wait">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex items-center gap-2 justify-between"
                  >
                    {job.successCount > 0 ? (
                      <>
                        <div className="space-y-1">
                          <div className="text-lg">Completed Successfully</div>
                          {(job.successCount > 0 || job.failedCount > 0) && (
                            <div className="flex gap-4 text-xs font-mono capitalize">
                              <JobsSucceed succeed={job.successCount} />
                              <JobsFailed failed={job.failedCount} />
                            </div>
                          )}
                        </div>
                        <IconCheckCircle
                          fill
                          duotone
                          className="size-10 text-green-700 dark:text-green-400"
                        />
                      </>
                    ) : (
                      <>
                        Completed{" "}
                        <IconCheckCircle className="size-10 text-muted-foreground" />
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              )}

              {/* Errors */}
              {FAILED && job.metadata?.errors && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                  <p className="font-semibold">Errors:</p>
                  <ul className="list-disc list-inside max-h-20 overflow-y-auto">
                    {(job.metadata.errors as string[])
                      .slice(0, 5)
                      .map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    {(job.metadata.errors as string[]).length > 5 && (
                      <li>
                        ... and {(job.metadata.errors as string[]).length - 5}{" "}
                        more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Retry Button */}
              {FAILED && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => retryJob(job._id)}
                >
                  <RefreshCcw className="mr-2 h-3 w-3" />
                  Retry Job
                </Button>
              )}
            </div>
          </Card>
        );
      })}

      {/* Polling Indicator */}
      {isPolling && (
        <div className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
          Live updates active
        </div>
      )}
    </div>
  );
}

function JobsSucceed({ succeed }: { succeed: number | string }) {
  return (
    <div className="flex items-center gap-1 dark:text-green-400 text-green-700">
      <IconCheckCircle />
      <span>{succeed} succeeded</span>
    </div>
  );
}

function JobsFailed({ failed }: { failed: number | string }) {
  return (
    <div className="flex items-center gap-1 text-destructive-text">
      <IconDangerCircle />
      <span>{failed} failed</span>
    </div>
  );
}
