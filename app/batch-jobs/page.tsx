"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  IconRefresh,
  IconClockCircle,
  IconCheckCircle,
  IconClock,
  IconClipboardCheck,
  IconCheck,
  IconClose,
  IconTrashBin2,
  IconEye,
} from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import IconDanger from "@/components/icons/Danger";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminGuard } from "@/hooks/useRoleGuard";
import HoverCard from "@/components/HoverCard";
import { useBatchJobs } from "@/contexts/BatchJobContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DeleteConfirmationDialog,
  DeleteDialogState,
  DeleteStatus,
} from "@/components/DeleteConfirmationDialog";

interface BatchJob {
  _id: string;
  type: "GOOGLE_CONTACTS_CREATE" | "GOOGLE_CONTACTS_DELETE";
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  totalItems: number;
  processedItems: number;
  successCount: number;
  failedCount: number;
  metadata?: {
    errors?: string[];
    [key: string]: unknown;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  progressPercentage: number;
}

export default function BatchJobsPage() {
  const { retryJob } = useBatchJobs();
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [selectedJob, setSelectedJob] = useState<BatchJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [retryingCodes, setRetryingCodes] = useState<Set<string>>(new Set());

  // Cancel dialog state
  const [cancelDialog, setCancelDialog] = useState<DeleteDialogState>({
    open: false,
    status: "confirm",
    itemId: undefined,
    itemName: undefined,
  });

  // Delete dialog state
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>({
    open: false,
    status: "confirm",
    itemId: undefined,
    itemName: undefined,
  });

  const { isAuthorized } = useAdminGuard({
    autoRedirect: true,
  });

  const fetchJobs = async () => {
    try {
      // setLoading(true);
      const response = await fetch("/api/batch-jobs?limit=100");
      if (!response.ok) throw new Error("Failed to fetch batch jobs");
      const data = await response.json();
      if (data.success) {
        setJobs(data.data.jobs || []);
      }
      // setLoading(false);
    } catch (error) {
      console.error("Error fetching batch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchJobs();

      const interval = setInterval(() => {
        fetchJobs();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isAuthorized]);

  // Clear retrying codes when retry jobs complete successfully
  useEffect(() => {
    if (jobs.length === 0) return;

    // Check if any retrying jobs have completed successfully
    jobs.forEach((job) => {
      if (job.status === "completed" && job.successCount > 0) {
        // If this was a retry job for installer codes, we can safely clear them
        // We can't directly know which codes were in this job, but we keep them in the set
        // They will be automatically disabled if user tries to click again
      }
    });

    // Clean up old retrying codes every minute to prevent memory leak
    const cleanup = setInterval(() => {
      if (retryingCodes.size > 100) {
        console.log("Clearing old retrying codes cache");
        setRetryingCodes(new Set());
      }
    }, 60000); // Every minute

    return () => clearInterval(cleanup);
  }, [jobs, retryingCodes]);

  const handleCancelJob = async () => {
    if (!cancelDialog.itemId) return;

    setCancelDialog((prev) => ({ ...prev, status: "deleting" }));

    try {
      const response = await fetch(
        `/api/batch-jobs?jobId=${cancelDialog.itemId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to cancel job");
      }

      setCancelDialog((prev) => ({
        ...prev,
        status: "success",
        message: "Batch job cancelled successfully",
      }));

      // Auto-close after 1.5s and refresh
      setTimeout(() => {
        setCancelDialog({ open: false, status: "confirm" });
        fetchJobs();
      }, 1500);
    } catch (error) {
      console.error("Error cancelling job:", error);
      setCancelDialog((prev) => ({
        ...prev,
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to cancel job",
      }));
    }
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      await fetchJobs();
      setLoading(false);
    } catch (error) {
      console.error("Error cancelling job:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!deleteDialog.itemId) return;

    setDeleteDialog((prev) => ({ ...prev, status: "deleting" }));

    try {
      const response = await fetch(
        `/api/batch-jobs?jobId=${deleteDialog.itemId}&action=delete`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to delete job");
      }

      setDeleteDialog((prev) => ({
        ...prev,
        status: "success",
        message: "Batch job deleted successfully",
      }));

      // Auto-close after 1.5s and refresh
      setTimeout(() => {
        setDeleteDialog({ open: false, status: "confirm" });
        fetchJobs();
      }, 1500);
    } catch (error) {
      console.error("Error deleting job:", error);
      setDeleteDialog((prev) => ({
        ...prev,
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to delete job",
      }));
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === "all") return true;
    return job.status === statusFilter;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: {
        color:
          "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
        icon: IconClock,
      },
      processing: {
        color:
          "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        icon: IconClockCircle,
      },
      completed: {
        color:
          "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
        icon: IconCheck,
      },
      failed: {
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        icon: IconDanger,
      },
      cancelled: {
        color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
        icon: IconDanger,
      },
    };

    const variant =
      variants[status as keyof typeof variants] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge
        variant="outline"
        className={cn("h-6 pr-2.5 pl-1 py-1 font-medium border", variant.color)}
      >
        <Icon className="size-4!" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    const isCreate = type === "GOOGLE_CONTACTS_CREATE";
    return (
      <Badge
        variant="outline"
        className={cn(
          "h-6 px-2.5 py-1 font-medium border",
          isCreate
            ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
            : "bg-rose-900/10 text-rose-600 dark:text-rose-400 border-rose-400/20",
        )}
      >
        {isCreate ? "Create Contacts" : "Delete Contacts"}
      </Badge>
    );
  };

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex-1 overflow-auto space-y-4">
      <PageHeader
        title="Batch Jobs"
        description="Monitor and manage background job processing"
        action={
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 h-9 rounded-lg" disabled={loading}>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Jobs</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              <IconRefresh className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 flex-col gap-4 mt-4">
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Total Jobs
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      <p className="text-2xl font-bold">{jobs.length}</p>
                    )}
                  </div>
                  <IconClipboardCheck className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Pending
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {jobs.filter((j) => j.status === "pending").length}
                      </p>
                    )}
                  </div>
                  <IconClock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Processing
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-28" />
                    ) : (
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {jobs.filter((j) => j.status === "processing").length}
                      </p>
                    )}
                  </div>
                  <IconClockCircle className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Completed
                    </p>
                    {loading ? (
                      <Skeleton className="h-8 w-18" />
                    ) : (
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {jobs.filter((j) => j.status === "completed").length}
                      </p>
                    )}
                  </div>
                  <IconCheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Jobs Table */}
          <Card>
            <CardContent className="lg:p-0">
              <div className="w-full">
                <div className="bg-muted/50">
                  <div className="flex items-center justify-between p-4">
                    <div className="w-36">Job ID</div>
                    <div className="w-30">Type</div>
                    <div className="w-28">Status</div>
                    <div className="w-60">Progress</div>
                    <div className="w-24">Items</div>
                    <div className="w-24">Success</div>
                    <div className="w-24">Failed</div>
                    <div className="w-30">Created</div>
                    <div className="w-24">Duration</div>
                    <div className="w-32">Actions</div>
                  </div>
                </div>
                <ScrollArea className="size-full h-[715px] bg-background">
                  {loading ? (
                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
                      (i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between h-12 border-b border-border px-4 py-2"
                        >
                          {/* ID */}
                          <div className="w-36 flex items-center">
                            <Skeleton className="h-6 w-28" />
                          </div>
                          {/* Type */}
                          <div className="w-30 flex items-center">
                            <Skeleton className="h-6 w-28" />
                          </div>
                          {/* Status */}
                          <div className="w-28 flex items-center">
                            <Skeleton className="h-6 w-20" />
                          </div>
                          {/* Progress */}
                          <div className="w-60 flex items-center">
                            <div className="space-y-1 grow">
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-8" />
                              </div>
                              <Skeleton className="h-2 w-full" />
                            </div>
                          </div>
                          {/* Items */}
                          <div className="w-24 flex items-center">
                            <Skeleton className="h-4 w-8" />
                          </div>
                          {/* Success */}
                          <div className="w-24 flex items-center">
                            <Skeleton className="h-4 w-6" />
                          </div>
                          {/* Failed */}
                          <div className="w-24 flex items-center">
                            <Skeleton className="h-4 w-6" />
                          </div>
                          {/* Created */}
                          <div className="w-30 flex items-center">
                            <Skeleton className="h-4 w-20" />
                          </div>
                          {/* Duration */}
                          <div className="w-24 flex items-center">
                            <Skeleton className="h-4 w-12" />
                          </div>
                          {/* Actions */}
                          <div className="w-32 flex items-center gap-2">
                            <Skeleton className="h-5 w-5" round />
                            <Skeleton className="h-5 w-5" round />
                            <Skeleton className="h-5 w-5" round />
                            <Skeleton className="h-5 w-5" round />
                          </div>
                        </div>
                      ),
                    )
                  ) : filteredJobs.length === 0 ? (
                    <div className="flex items-center justify-center p-12 h-[715px]">
                      <div className="text-center">
                        <IconClipboardCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No batch jobs found
                        </p>
                      </div>
                    </div>
                  ) : (
                    filteredJobs.map((job) => {
                      // console.log(job.progressPercentage);
                      return (
                        <div
                          key={job._id}
                          className="flex items-center justify-between h-12 border-b border-border px-4 py-2 hover:bg-muted/30"
                        >
                          <div className="w-36 flex items-center">
                            <span
                              className="font-mono text-xs truncate"
                              title={job._id}
                            >
                              #{job._id.slice(-8)}
                            </span>
                          </div>
                          <div className="w-30 flex items-center">
                            {getTypeBadge(job.type)}
                          </div>
                          <div className="w-28 flex items-center">
                            {getStatusBadge(job.status)}
                          </div>
                          <div className="w-60 flex items-center">
                            <div className="grow relative h-6">
                              <Progress
                                value={job.progressPercentage}
                                className="size-full"
                              />
                              <div className="absolute inset-0 flex items-center justify-between text-xs size-full px-2 font-semibold mix-blend-difference font-mono">
                                <span>
                                  {job.processedItems} / {job.totalItems}
                                </span>
                                <span>{job.progressPercentage}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="w-24 font-mono flex items-center text-sm font-medium">
                            {job.totalItems}
                          </div>
                          <div className="w-24 font-mono flex items-center text-sm">
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              {job.successCount}
                            </span>
                          </div>
                          <div className="w-24 font-mono flex items-center text-sm">
                            <span
                              className={cn(
                                "font-medium",
                                job.failedCount > 0
                                  ? "text-red-600 dark:text-red-400 cursor-help"
                                  : "text-muted-foreground",
                              )}
                            >
                              {job.failedCount > 0 && job.metadata?.errors ? (
                                <HoverCard
                                  trigger={job.failedCount.toString()}
                                  content={
                                    <div className="text-xs max-w-64">
                                      <p className="font-semibold mb-1">
                                        Errors:
                                      </p>
                                      <ul className="list-disc list-inside space-y-1">
                                        {(job.metadata.errors as string[])
                                          .slice(0, 5)
                                          .map((err, i) => (
                                            <li key={i} className="break-all">
                                              {err}
                                            </li>
                                          ))}
                                        {(job.metadata.errors as string[])
                                          .length > 5 && (
                                          <li className="text-muted-foreground">
                                            +
                                            {(job.metadata.errors as string[])
                                              .length - 5}{" "}
                                            more
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  }
                                />
                              ) : (
                                job.failedCount
                              )}
                            </span>
                          </div>
                          <div className="w-30 flex items-center font-mono">
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              <HoverCard
                                trigger={formatDistanceToNow(
                                  new Date(job.createdAt),
                                  {
                                    addSuffix: true,
                                  },
                                ).replace("about ", "")}
                                content={new Date(
                                  job.createdAt,
                                ).toLocaleString()}
                              />
                            </span>
                          </div>
                          <div className="w-24 flex items-center">
                            <span className="text-sm text-muted-foreground">
                              {job.completedAt ? (
                                <HoverCard
                                  trigger={`${Math.round(
                                    (new Date(job.completedAt).getTime() -
                                      new Date(job.createdAt).getTime()) /
                                      1000,
                                  )}s`}
                                  content={(() => {
                                    const s = Math.round(
                                      (new Date(job.completedAt).getTime() -
                                        new Date(job.createdAt).getTime()) /
                                        1000,
                                    );
                                    return `${Math.floor(s / 60)}m ${s % 60}s`;
                                  })()}
                                />
                              ) : job.status === "processing" ? (
                                "Running..."
                              ) : (
                                "-"
                              )}
                            </span>
                          </div>
                          <div className="w-32 flex items-center gap-2">
                            <button
                              className="text-muted-foreground hover:text-foreground cursor-pointer"
                              onClick={() => setSelectedJob(job)}
                              title="View Details"
                            >
                              <IconEye />
                            </button>
                            <button
                              className={cn(
                                "text-destructive-text hover:text-destructive-text-hover cursor-pointer",
                                !(
                                  job.status === "pending" ||
                                  job.status === "processing"
                                ) &&
                                  "opacity-50 select-none cursor-not-allowed",
                              )}
                              onClick={() => {
                                setCancelDialog({
                                  open: true,
                                  status: "confirm",
                                  itemId: job._id,
                                  itemName: `Job #${job._id.slice(-6)}`,
                                });
                              }}
                              disabled={
                                !(
                                  job.status === "pending" ||
                                  job.status === "processing"
                                )
                              }
                            >
                              <IconClose className="size-5" />
                            </button>
                            <button
                              className={cn(
                                "text-destructive-text hover:text-destructive-text-hover cursor-pointer",
                                (job.status === "pending" ||
                                  job.status === "processing") &&
                                  "opacity-50 select-none cursor-not-allowed",
                              )}
                              disabled={
                                job.status === "pending" ||
                                job.status === "processing"
                              }
                              onClick={() => {
                                setDeleteDialog({
                                  open: true,
                                  status: "confirm",
                                  itemId: job._id,
                                  itemName: `Job #${job._id.slice(-6)}`,
                                });
                              }}
                              title="Delete Job"
                            >
                              <IconTrashBin2 />
                            </button>

                            {job.status === "failed" && (
                              <button
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 cursor-pointer"
                                onClick={async () => {
                                  toast.promise(retryJob(job._id), {
                                    loading: "Retrying job...",
                                    success: "Job retry started",
                                    error: "Failed to retry job",
                                  });
                                }}
                                title="Retry Job"
                              >
                                <IconRefresh />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </>
      </div>

      {/* Cancel Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={cancelDialog.open}
        status={cancelDialog.status}
        itemName={cancelDialog.itemName}
        message={cancelDialog.message}
        entityType="batch-job"
        warningMessage="Any contacts that have already been processed will not be affected."
        onConfirm={handleCancelJob}
        onClose={() => setCancelDialog({ open: false, status: "confirm" })}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialog.open}
        status={deleteDialog.status}
        itemName={deleteDialog.itemName}
        message={deleteDialog.message}
        entityType="batch-job"
        warningMessage="This action cannot be undone and will remove all job data from the database."
        onConfirm={handleDeleteJob}
        onClose={() => setDeleteDialog({ open: false, status: "confirm" })}
      />

      {/* Job Details Dialog */}
      <Dialog
        open={!!selectedJob}
        onOpenChange={(open) => !open && setSelectedJob(null)}
      >
        <DialogContent className="w-2xl max-h-[80vh] overflow-visible!">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Job Details
              {selectedJob && getStatusBadge(selectedJob.status)}
            </DialogTitle>
            <DialogDescription>
              ID: <span className="font-mono text-xs">{selectedJob?._id}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedJob && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">
                    Total Items
                  </p>
                  <p className="text-xl font-bold">{selectedJob.totalItems}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground font-medium">
                    Processed
                  </p>
                  <p className="text-xl font-bold">
                    {selectedJob.processedItems}
                  </p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Success
                  </p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {selectedJob.successCount}
                  </p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                    Failed
                  </p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">
                    {selectedJob.failedCount}
                  </p>
                </div>
              </div>

              {/* Timestamps */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Created At</span>
                  <span className="font-mono">
                    {new Date(selectedJob.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-mono">
                    {new Date(selectedJob.updatedAt).toLocaleString()}
                  </span>
                </div>
                {selectedJob.completedAt && (
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Completed At</span>
                    <span className="font-mono">
                      {new Date(selectedJob.completedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Error Log */}
              {selectedJob.metadata?.errors &&
                (selectedJob.metadata.errors as string[]).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2 text-red-600 dark:text-red-400">
                      <IconDanger className="size-4" />
                      Error Log (
                      {(selectedJob.metadata.errors as string[]).length} failed)
                    </h4>
                    <ScrollArea className="bg-muted/50 rounded-lg p-4 max-h-60 overflow-y-auto font-mono text-xs space-y-1 border border-border h-60">
                      {(selectedJob.metadata.errors as string[]).map(
                        (error, i) => {
                          // Extract installer code from error message (format: "CODE: error message")
                          const match = error.match(/^([A-Z0-9]+):/);
                          const installerCode = match ? match[1] : null;

                          return (
                            <div
                              key={i}
                              className="text-destructive-text break-all flex gap-2 items-center group bg-muted/50 px-2 py-1 rounded"
                            >
                              <span className="text-muted-foreground select-none shrink-0 text-bold text-sm mr-2 ml-1">
                                {i + 1}.
                              </span>
                              <span className="flex-1">{error}</span>
                              {installerCode &&
                                selectedJob.type ===
                                  "GOOGLE_CONTACTS_CREATE" && (
                                  <HoverCard
                                    trigger={
                                      <div
                                        className={cn(
                                          "size-full pr-2 transition-colors shrink-0",
                                          retryingCodes.has(installerCode)
                                            ? "cursor-not-allowed pointer-events-none text-muted-foreground/50 opacity-50"
                                            : "cursor-pointer text-muted-foreground hover:text-foreground",
                                        )}
                                        onClick={async () => {
                                          if (retryingCodes.has(installerCode))
                                            return;

                                          try {
                                            // Add to retrying set
                                            setRetryingCodes((prev) =>
                                              new Set(prev).add(installerCode),
                                            );

                                            const res = await fetch(
                                              "/api/batch-jobs",
                                              {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type":
                                                    "application/json",
                                                },
                                                body: JSON.stringify({
                                                  type: "GOOGLE_CONTACTS_CREATE",
                                                  installerCodes: [
                                                    installerCode,
                                                  ],
                                                }),
                                              },
                                            );

                                            if (!res.ok)
                                              throw new Error(
                                                "Failed to create retry job",
                                              );

                                            const data = await res.json();

                                            if (
                                              data.success &&
                                              data.data.jobId
                                            ) {
                                              // Start the job immediately
                                              await retryJob(data.data.jobId);
                                              toast.success(
                                                `Retry job started for ${installerCode}`,
                                              );
                                            }
                                          } catch (err) {
                                            toast.error(
                                              "Failed to retry contact creation",
                                            );
                                            console.error(err);
                                            // Remove from retrying set on error
                                            setRetryingCodes((prev) => {
                                              const newSet = new Set(prev);
                                              newSet.delete(installerCode);
                                              return newSet;
                                            });
                                          }
                                        }}
                                        title={
                                          retryingCodes.has(installerCode)
                                            ? `${installerCode} is being retried...`
                                            : `Retry ${installerCode}`
                                        }
                                      >
                                        <IconRefresh className="size-3" />
                                      </div>
                                    }
                                    content={
                                      <span className="font-sans">
                                        {retryingCodes.has(installerCode) ? (
                                          <>
                                            Retry in progress for{" "}
                                            <strong>{installerCode}</strong>
                                          </>
                                        ) : (
                                          <>
                                            Retry creating google contact for{" "}
                                            <strong>{installerCode}</strong>
                                          </>
                                        )}
                                      </span>
                                    }
                                  />
                                )}
                            </div>
                          );
                        },
                      )}
                    </ScrollArea>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
