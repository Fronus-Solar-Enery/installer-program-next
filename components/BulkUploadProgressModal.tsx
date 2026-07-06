"use client";

import { CheckCircle2, Loader2, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export interface UploadStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  progress?: number;
  details?: string;
  error?: string;
}

interface BulkUploadProgressModalProps {
  isOpen: boolean;
  steps: UploadStep[];
  onClose?: () => void;
  totalRecords: number;
  description?: string;
  title?: string;
  processedRecords: number;
  successCount: number;
  failedCount: number;
}

export default function BulkUploadProgressModal({
  isOpen,
  steps,
  onClose,
  totalRecords,
  processedRecords,
  successCount,
  failedCount,
}: BulkUploadProgressModalProps) {
  if (!isOpen) return null;

  const allCompleted = steps.every((step) => step.status === "completed");
  const hasError = steps.some((step) => step.status === "error");
  const overallProgress =
    totalRecords > 0 ? Math.round((processedRecords / totalRecords) * 100) : 0;

  const getStepIcon = (status: UploadStep["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "processing":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent hideClose className="p-0 gap-0">
        <VisuallyHidden>
          <DialogTitle></DialogTitle>
          <DialogDescription></DialogDescription>
        </VisuallyHidden>

        {/* Header */}
        <div className="p-6 border-b border-border">
          <div>
            <h2 className="text-2xl font-bold">
              {allCompleted
                ? "Registeration Complete!"
                : hasError
                ? "Registeration Failed"
                : "Registeration Installers..."}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {allCompleted
                ? `Successfully processed ${totalRecords} record(s)`
                : hasError
                ? "An error occurred during Registeration"
                : `Processing ${totalRecords} record(s)...`}
            </p>
          </div>
        </div>

        {/* Overall Progress */}
        <div className="p-6 border-b border-border">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{overallProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
              <div
                className={cn(
                  "h-full transition-all duration-300",
                  hasError ? "bg-red-600" : "bg-blue-600"
                )}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <span className="font-medium text-green-600">
                    {successCount}
                  </span>{" "}
                  Success
                </span>
                {failedCount > 0 && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium text-red-600">
                      {failedCount}
                    </span>{" "}
                    Failed
                  </span>
                )}
              </div>
              <span>
                {processedRecords} / {totalRecords} processed
              </span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-280px)]">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-[10px] top-8 bottom-0 w-0.5 bg-border" />
                )}

                <div className="flex items-start gap-3">
                  <div className="relative z-10 mt-0.5">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3
                        className={cn(
                          "font-semibold text-sm",
                          step.status === "completed" && "text-green-600",
                          step.status === "processing" && "text-blue-600",
                          step.status === "error" && "text-red-600",
                          step.status === "pending" && "text-muted-foreground"
                        )}
                      >
                        {step.title}
                      </h3>
                      {step.progress !== undefined &&
                        step.status === "processing" && (
                          <span className="text-xs text-muted-foreground">
                            {step.progress}%
                          </span>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {step.description}
                    </p>

                    {step.details && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.details}
                      </p>
                    )}

                    {step.error && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                        {step.error}
                      </div>
                    )}

                    {step.progress !== undefined &&
                      step.status === "processing" && (
                        <div className="mt-2 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className="h-full bg-blue-600 transition-all duration-300"
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        {/* <div className="p-6 border-t border-border">
          <Button
            variant={"secondary"}
            onClick={onClose}
            className="w-full"
            disabled={!allCompleted || hasError}
          >
            Close
          </Button>
        </div> */}
      </DialogContent>
    </Dialog>
  );
}
