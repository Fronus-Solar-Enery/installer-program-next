"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ExcelJS from "exceljs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Trash2,
  Upload,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { PAYMENT_METHOD } from "@/lib/constants";
import { FileDropzone } from "@/components/ui/drop-zone";
import { IconLayer, IconReward, IconTrashBin2 } from "@/components/icons";
import IconExcel from "@/components/icons/Excel";
import { toast } from "sonner";
import BulkUploadProgressModal, {
  UploadStep,
} from "@/components/BulkUploadProgressModal";
import Loading from "@/components/ui/loading";
import IconDownloadMinimalistic from "@/components/icons/DownloadMinimalistic";

function worksheetToJson(
  worksheet: ExcelJS.Worksheet,
): Record<string, unknown>[] {
  const headers: string[] = [];
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = cell.value != null ? String(cell.value) : "";
  });

  const rows: Record<string, unknown>[] = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj: Record<string, unknown> = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (header) obj[header] = cell.value;
    });
    rows.push(obj);
  });
  return rows;
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

interface RewardUpdate {
  serialNumber: string;
  transactionId: string;
  referrerTransactionId?: string;
  rewardStatus: string;
  sendingDate?: string;
  paymentMethod?: string;
  issues: string[];
  isValid: boolean;
}

export default function BulkUploadRewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<RewardUpdate[]>([]);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingInvalid, setDownloadingInvalid] = useState(false);
  const [downloadingPaymentFormat, setDownloadingPaymentFormat] =
    useState(false);
  const [fileReading, setFileReading] = useState(false);
  const [fileReadProgress, setFileReadProgress] = useState(0);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);

  // Progress tracking state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([]);
  const [processedRecords, setProcessedRecords] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const downloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      const template = [
        {
          "Serial Number": "SN123456",
          "Installer Transaction ID": "TXN001",
          "Referrer Transaction ID": "TXN002 (optional)",
          "Payment Method": "UBANK (optional)",
        },
      ];

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Rewards Template");
      ws.columns = [
        { header: "Serial Number", key: "Serial Number", width: 15 },
        {
          header: "Installer Transaction ID",
          key: "Installer Transaction ID",
          width: 25,
        },
        {
          header: "Referrer Transaction ID",
          key: "Referrer Transaction ID",
          width: 25,
        },
        { header: "Payment Method", key: "Payment Method", width: 25 },
      ];
      ws.addRows(template);

      await downloadWorkbook(wb, "rewards_bulk_update_template.xlsx");
    } finally {
      setTimeout(() => setDownloadingTemplate(false), 500);
    }
  };

  const downloadPaymentFormat = async () => {
    setDownloadingPaymentFormat(true);
    try {
      const response = await fetch("/api/reports/payment-format?format=excel");

      if (!response.ok) {
        throw new Error("Failed to download payment format report");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payment_format_${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Payment format downloaded successfully");
    } catch (error) {
      console.error("Failed to download payment format:", error);
      toast.error("Failed to download payment format report");
    } finally {
      setTimeout(() => setDownloadingPaymentFormat(false), 500);
    }
  };

  const validateRewardStatus = (status: string): boolean => {
    const validStatuses = ["PAID", "PENDING", "FAILED"];
    return validStatuses.includes(status.toUpperCase());
  };

  const validatePaymentMethod = (method: string): boolean => {
    if (!method) return true; // Optional field
    const normalizedMethod = method.toUpperCase().trim();
    return PAYMENT_METHOD.some(
      (pm) =>
        pm.value.toUpperCase() === normalizedMethod ||
        pm.label.toUpperCase() === normalizedMethod,
    );
  };

  const normalizePaymentMethod = (method: string): string => {
    if (!method) return "";
    const normalizedInput = method.toUpperCase().trim();
    const matched = PAYMENT_METHOD.find(
      (pm) =>
        pm.value.toUpperCase() === normalizedInput ||
        pm.label.toUpperCase() === normalizedInput,
    );
    return matched ? matched.value : method;
  };

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return true; // Optional field
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  const validateReward = useCallback(
    (reward: Omit<RewardUpdate, "issues" | "isValid">): string[] => {
      const issues: string[] = [];

      // Required field validations
      if (!reward.serialNumber || reward.serialNumber.length < 3) {
        issues.push("Serial number is required (min 3 characters)");
      }

      if (!reward.transactionId || reward.transactionId.length < 3) {
        issues.push("Installer transaction ID is required");
      }

      if (!reward.rewardStatus) {
        issues.push("Payment status is required");
      } else if (!validateRewardStatus(reward.rewardStatus)) {
        issues.push(
          `Invalid reward status "${reward.rewardStatus}" (must be: PAID, PENDING, or FAILED)`,
        );
      }

      // Sending date validation (always present - defaults to current date if not provided)
      if (reward.sendingDate && !validateDate(reward.sendingDate)) {
        issues.push(
          `Invalid sending date format "${reward.sendingDate}" (expected: YYYY-MM-DD)`,
        );
      }

      if (
        reward.paymentMethod &&
        !validatePaymentMethod(reward.paymentMethod)
      ) {
        issues.push(
          `Invalid payment method "${reward.paymentMethod}" (must be: UBANK, UPaisa, or NayaPay)`,
        );
      }

      return issues;
    },
    [],
  );

  const handleFileChange = (file: File) => {
    if (file) {
      setFile(file);
      parseExcelFile(file);
    }
  };

  const parseExcelFile = useCallback(
    (file: File) => {
      setFileReading(true);
      setFileReadProgress(0);

      const reader = new FileReader();
      let progressInterval: NodeJS.Timeout;

      // Smooth progress animation
      const startProgress = () => {
        let progress = 0;
        progressInterval = setInterval(() => {
          progress += 3;
          if (progress <= 25) {
            setFileReadProgress(progress);
          }
        }, 80);
      };

      startProgress();

      // Track real file reading progress
      reader.onprogress = (event) => {
        if (event.lengthComputable) {
          clearInterval(progressInterval);
          const percentLoaded =
            Math.round((event.loaded / event.total) * 40) + 25;
          setFileReadProgress(percentLoaded);
        }
      };

      reader.onload = async (e) => {
        try {
          clearInterval(progressInterval);
          setFileReadProgress(70);

          // Allow UI to update
          await new Promise((resolve) => requestAnimationFrame(resolve));

          const data = e.target?.result as ArrayBuffer;

          setFileReadProgress(75);
          await new Promise((resolve) => requestAnimationFrame(resolve));

          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(data);

          setFileReadProgress(80);
          await new Promise((resolve) => requestAnimationFrame(resolve));

          const worksheet = workbook.worksheets[0];

          setFileReadProgress(85);
          await new Promise((resolve) => requestAnimationFrame(resolve));

          const jsonData = worksheetToJson(worksheet);

          setFileReadProgress(90);
          await new Promise((resolve) => requestAnimationFrame(resolve));

          // Get current date in YYYY-MM-DD format as default
          const getCurrentDate = () => {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
          };

          const defaultSendingDate = getCurrentDate();

          const parsedRewards: RewardUpdate[] = jsonData.map((row) => {
            const rawPaymentMethod =
              row["Payment Method"]?.toString().trim() || "";
            const rawSendingDate = row["Sending Date"]?.toString().trim();

            const transactionId =
              row["Installer Transaction ID"]?.toString().trim() || "";
            const referrerTransactionId =
              row["Referrer Transaction ID"]?.toString().trim() || undefined;
            const serialNumber = row["Serial Number"]?.toString().trim() || "";

            // First validate the data to determine if there are issues
            const tempReward = {
              serialNumber,
              transactionId,
              referrerTransactionId,
              rewardStatus: "PAID", // Temporary, will be overwritten
              sendingDate: rawSendingDate || defaultSendingDate,
              paymentMethod: normalizePaymentMethod(rawPaymentMethod),
            };

            const issues = validateReward(tempReward);

            // Determine payment status based on validation and transaction ID
            let rewardStatus: string;
            if (issues.length > 0) {
              // If there are validation errors, mark as FAILED
              rewardStatus = "FAILED";
            } else if (transactionId) {
              // If validation passes and transaction ID is provided, mark as PAID
              rewardStatus = "PAID";
            } else {
              // If validation passes but no transaction ID, mark as PENDING
              rewardStatus = "PENDING";
            }

            const reward = {
              serialNumber,
              transactionId,
              referrerTransactionId,
              rewardStatus,
              sendingDate: rawSendingDate || defaultSendingDate,
              paymentMethod: normalizePaymentMethod(rawPaymentMethod),
            };

            return {
              ...reward,
              issues,
              isValid: issues.length === 0,
            };
          });

          setFileReadProgress(98);
          await new Promise((resolve) => requestAnimationFrame(resolve));

          setFileReadProgress(100);
          setPreview(parsedRewards);
          setError("");

          // Check how many records had auto-filled dates
          const autoFilledCount = jsonData.filter(
            (row) => !row["Sending Date"]?.toString().trim(),
          ).length;

          if (autoFilledCount > 0) {
            toast.success(
              `Loaded ${parsedRewards.length} records. ${autoFilledCount} sending date(s) auto-filled with current date (${defaultSendingDate})`,
            );
          } else {
            toast.success(`Loaded ${parsedRewards.length} records from file`);
          }

          // Automatically validate against database
          setTimeout(() => {
            setFileReading(false);
            validateAgainstDatabase(parsedRewards);
          }, 300);
        } catch (err: unknown) {
          clearInterval(progressInterval);
          setFileReading(false);
          setFileReadProgress(0);
          const errorMsg =
            "Failed to parse Excel file: " +
            (err instanceof Error ? err.message : "Unknown error");
          setError(errorMsg);
          toast.error(errorMsg);
          setPreview([]);
        }
      };

      reader.onerror = () => {
        clearInterval(progressInterval);
        setFileReading(false);
        setFileReadProgress(0);
        const errorMsg = "Failed to read file";
        setError(errorMsg);
        toast.error(errorMsg);
      };

      reader.readAsArrayBuffer(file);
    },
    [validateReward],
  );

  const validateAgainstDatabase = async (rewards: RewardUpdate[]) => {
    setValidating(true);
    try {
      const response = await fetch("/api/rewards/validate-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewards }),
      });

      const data = await response.json();

      if (response.ok && data.data?.validatedRewards) {
        // Update payment status based on the validation results from backend
        const updatedRewards = data.data.validatedRewards.map(
          (reward: RewardUpdate) => {
            let rewardStatus: string;

            if (reward.issues && reward.issues.length > 0) {
              // If there are validation errors (including from backend), mark as FAILED
              rewardStatus = "FAILED";
            } else if (reward.transactionId) {
              // If validation passes and transaction ID is provided, mark as PAID
              rewardStatus = "PAID";
            } else {
              // If validation passes but no transaction ID, mark as PENDING
              rewardStatus = "PENDING";
            }

            return {
              ...reward,
              rewardStatus,
              isValid: !reward.issues || reward.issues.length === 0,
            };
          },
        );

        setPreview(updatedRewards);
      }
    } catch (err: unknown) {
      console.error("Validation error:", err);
    } finally {
      setValidating(false);
    }
  };

  const handleDeleteRow = (index: number) => {
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReset = () => {
    setFile(null);
    setPreview([]);
    setError("");
    setSuccess("");
    setValidating(false);
    setFileReading(false);
    setFileReadProgress(0);
    toast.success("Form reset successfully");
  };

  const handleTerminateInvalid = () => {
    const invalidRecords = preview.filter((p) => !p.isValid);
    if (invalidRecords.length === 0) {
      toast.info("No invalid records to terminate");
      return;
    }
    setTerminateDialogOpen(true);
  };

  const terminateInvalidRecords = () => {
    const validRecords = preview.filter((p) => p.isValid);
    const invalidCount = preview.length - validRecords.length;

    setPreview(validRecords);
    setTerminateDialogOpen(false);
    toast.success(
      `Terminated ${invalidCount} invalid record(s). ${validRecords.length} valid record(s) remaining.`,
    );
  };

  const downloadAndTerminateInvalid = () => {
    downloadInvalidRecords();

    // Wait a bit for download to start, then terminate
    setTimeout(() => {
      terminateInvalidRecords();
    }, 500);
  };

  const downloadInvalidRecords = async () => {
    setDownloadingInvalid(true);
    try {
      const invalidRecords = preview.filter((p) => !p.isValid);

      if (invalidRecords.length === 0) {
        return;
      }

      const excelData = invalidRecords.map((record) => ({
        "Serial Number": record.serialNumber,
        "Installer Transaction ID": record.transactionId,
        "Referrer Transaction ID": record.referrerTransactionId || "",
        "Payment Method": record.paymentMethod || "",
        ISSUES: record.issues.join(" | "),
      }));

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Invalid Records");
      ws.columns = [
        { header: "Serial Number", key: "Serial Number", width: 15 },
        {
          header: "Installer Transaction ID",
          key: "Installer Transaction ID",
          width: 25,
        },
        {
          header: "Referrer Transaction ID",
          key: "Referrer Transaction ID",
          width: 25,
        },
        { header: "Payment Method", key: "Payment Method", width: 25 },
        { header: "ISSUES", key: "ISSUES", width: 60 },
      ];
      ws.addRows(excelData);

      const timestamp = new Date().toISOString().slice(0, 10);
      await downloadWorkbook(wb, `invalid_rewards_${timestamp}.xlsx`);
    } finally {
      setTimeout(() => setDownloadingInvalid(false), 500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (preview.length === 0) {
      toast.error("No data to upload. Please select a valid Excel file.");
      return;
    }

    const invalidRows = preview.filter((p) => !p.isValid);
    if (invalidRows.length > 0) {
      toast.error(
        `Cannot upload: ${invalidRows.length} row(s) have validation issues. Please fix them first.`,
      );
      return;
    }

    const validRewards = preview.filter((p) => p.isValid);
    const totalRecords = validRewards.length;

    // Initialize progress modal
    setShowProgressModal(true);
    setProcessedRecords(0);
    setSuccessCount(0);
    setFailedCount(0);
    setLoading(true);
    setError("");
    setSuccess("");

    // Initialize steps
    const initialSteps: UploadStep[] = [
      {
        id: "validate",
        title: "Validating Data",
        description: "Checking serial numbers and validating reward data",
        status: "processing",
        progress: 0,
      },
      {
        id: "update",
        title: "Updating Rewards",
        description: `Processing 0 of ${totalRecords} reward(s)`,
        status: "pending",
        progress: 0,
      },
      {
        id: "activity",
        title: "Logging Activities",
        description: "Recording reward update activities",
        status: "pending",
        progress: 0,
      },
      {
        id: "complete",
        title: "Finalizing Upload",
        description: "Completing the bulk update process",
        status: "pending",
        progress: 0,
      },
    ];

    setUploadSteps(initialSteps);

    try {
      // Step 1: Validation
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "validate"
            ? {
                ...step,
                status: "completed",
                progress: 100,
                details: `Validated ${totalRecords} records`,
              }
            : step,
        ),
      );

      // Step 2: Start updating rewards in chunks
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "update" ? { ...step, status: "processing" } : step,
        ),
      );

      // Process in chunks for real-time progress
      const CHUNK_SIZE = 10; // Process 10 rewards at a time
      let totalSuccess = 0;
      let totalFailed = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < validRewards.length; i += CHUNK_SIZE) {
        const chunk = validRewards.slice(i, i + CHUNK_SIZE);
        const currentBatch = Math.min(i + CHUNK_SIZE, validRewards.length);

        // Filter out validation fields before sending to API
        const rewardsToUpdate = chunk.map((reward) => ({
          serialNumber: reward.serialNumber,
          transactionId: reward.transactionId,
          referrerTransactionId: reward.referrerTransactionId,
          rewardStatus: reward.rewardStatus,
          sendingDate: reward.sendingDate,
          paymentMethod: reward.paymentMethod,
        }));

        try {
          const response = await fetch("/api/rewards/bulk-update", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rewards: rewardsToUpdate }),
          });

          const data = await response.json();

          if (response.ok) {
            totalSuccess += data.data?.success || 0;
            totalFailed += data.data?.failed || 0;

            if (data.data?.errors && data.data.errors.length > 0) {
              allErrors.push(...data.data.errors);
            }
          } else {
            totalFailed += chunk.length;
            allErrors.push(data.error || "Chunk update failed");
          }
        } catch (err) {
          totalFailed += chunk.length;
          allErrors.push(
            `Chunk ${i / CHUNK_SIZE + 1} failed: ${
              err instanceof Error ? err.message : "Unknown error"
            }`,
          );
        }

        // Update progress in real-time
        const progress = Math.round((currentBatch / totalRecords) * 100);
        setProcessedRecords(currentBatch);
        setSuccessCount(totalSuccess);
        setFailedCount(totalFailed);

        setUploadSteps((prev) =>
          prev.map((step) =>
            step.id === "update"
              ? {
                  ...step,
                  status: "processing",
                  progress: progress,
                  description: `Processing ${currentBatch} of ${totalRecords} reward(s)`,
                  details: `Updated: ${totalSuccess} | Failed: ${totalFailed}`,
                }
              : step,
          ),
        );

        // Small delay between chunks to allow UI updates
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      // Step 2: Complete update
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "update"
            ? {
                ...step,
                status: totalSuccess > 0 ? "completed" : "error",
                progress: 100,
                details: `Updated ${totalSuccess} out of ${totalRecords} rewards`,
                error: totalFailed > 0 ? `${totalFailed} failed` : undefined,
              }
            : step,
        ),
      );

      if (totalSuccess === 0) {
        setUploadSteps((prev) =>
          prev.map((step) =>
            step.status === "pending" || step.status === "processing"
              ? {
                  ...step,
                  status: "error",
                  error: "No rewards were updated successfully",
                }
              : step,
          ),
        );
        setError(`Update failed. Errors: ${allErrors.join(", ")}`);
        return;
      }

      // Step 3: Activity Logging (already done during update)
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "activity" ? { ...step, status: "processing" } : step,
        ),
      );

      await new Promise((resolve) => setTimeout(resolve, 500));
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "activity"
            ? {
                ...step,
                status: "completed",
                progress: 100,
                details: `Logged ${totalSuccess} activities`,
              }
            : step,
        ),
      );

      // Step 4: Complete
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "complete"
            ? {
                ...step,
                status: "completed",
                progress: 100,
                details: `Update completed: ${totalSuccess} successful, ${totalFailed} failed`,
              }
            : {
                ...step,
                status: step.status === "pending" ? "completed" : step.status,
              },
        ),
      );

      setSuccess(`Successfully updated ${totalSuccess} reward(s)!`);

      if (totalFailed > 0) {
        setError(
          `${totalFailed} reward(s) failed. Check the logs for details.`,
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.status === "processing"
            ? { ...step, status: "error", error: errorMessage }
            : step,
        ),
      );
      setError("Failed to update rewards: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validCount = preview.filter((p) => p.isValid).length;
  const invalidCount = preview.filter((p) => !p.isValid).length;

  return (
    <div className="flex-1 overflow-auto space-y-4">
      <PageHeader
        iconFill
        Icon={IconLayer}
        title="Bulk Update Rewards"
        description="Update multiple reward records at once using an Excel file"
        action={
          <Button variant="ghost" onClick={() => router.push("/rewards")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Rewards
          </Button>
        }
      />
      {/* Instructions Card */}
      <Card className="grid grid-cols-1 lg:grid-cols-2">
        <div>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                1. Download the template file and fill in the reward update data
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                2. Upload the completed Excel file
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                3. Review the data and fix any validation issues
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                4. Click &quot;Update All Valid Records&quot; to finalize
              </p>
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  disabled={downloadingTemplate}
                  className="gap-2"
                >
                  {downloadingTemplate ? (
                    <Loading />
                  ) : (
                    <IconDownloadMinimalistic />
                  )}
                  {downloadingTemplate ? "Downloading..." : "Download Template"}
                </Button>
                <Button
                  onClick={downloadPaymentFormat}
                  variant="outline"
                  className="gap-2"
                  disabled={downloadingPaymentFormat}
                >
                  {downloadingPaymentFormat ? <Loading /> : <IconReward />}
                  {downloadingPaymentFormat
                    ? "Downloading..."
                    : "Payment Format"}
                </Button>
              </div>
            </div>

            {/* <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium mb-2">Validation Rules:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Serial number must exist in the system</li>
                <li>Installer Transaction ID is required</li>
                <li>Referrer Transaction ID is optional</li>
                <li>Payment method: UBANK, UPaisa, or NayaPay (optional)</li>
              </ul>
            </div> */}
          </CardContent>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-4 h-full">
          <div className="h-full p-6">
            <Card className="h-full p-6 squircle rounded-[4rem] space-y-4">
              <h3 className="mb-3">File Upload</h3>
              <div className="space-y-2">
                <FileDropzone
                  id="bulkUpdateRewardsDropzone"
                  label={
                    file
                      ? "FILE ALREADY SELECTED"
                      : fileReading
                        ? "READING FILE..."
                        : preview.length > 0
                          ? "RECORDS IN PROGRESS"
                          : "UPLOAD EXCEL FILE"
                  }
                  accept={{
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                      [".xlsx"],
                    "application/vnd.ms-excel": [".xls"],
                  }}
                  acceptedFileTypes={[".xlsx", ".xls"]}
                  fileTypeLabel="Excel files"
                  maxFiles={1}
                  onDrop={(files) => handleFileChange(files[0])}
                  disabled={
                    loading || fileReading || !!file || preview.length > 0
                  }
                  className="h-56 bg-muted/10"
                />
                {(file || preview.length > 0) && !fileReading && (
                  <p className="text-xs text-muted-foreground text-center">
                    <span className="inline-flex items-center gap-1">
                      <span>💡</span>
                      <span>
                        Click the delete/reset button below to upload a
                        different file
                      </span>
                    </span>
                  </p>
                )}
              </div>
              {file && (
                <div className="space-y-3">
                  <div className="relative text-sm text-foreground mt-2 py-5 px-4 border border-border bg-muted rounded-[4rem] squircle flex items-center gap-3">
                    <IconExcel />
                    <div className="leading-none">{file.name}</div>
                    <button
                      type="button"
                      onClick={handleReset}
                      disabled={loading || validating || fileReading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer"
                    >
                      <IconTrashBin2 className="size-5 text-destructive-text hover:text-destructive-text-hover transition-colors" />
                    </button>
                  </div>

                  {/* File Reading Progress */}
                  {fileReading && (
                    <div className="space-y-2 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground font-medium">
                          {fileReadProgress < 25
                            ? "Starting file upload..."
                            : fileReadProgress < 65
                              ? "Reading file data..."
                              : fileReadProgress < 80
                                ? "Parsing Excel workbook..."
                                : fileReadProgress < 90
                                  ? "Extracting records..."
                                  : fileReadProgress < 98
                                    ? "Processing and validating..."
                                    : "Finalizing..."}
                        </span>
                        <span className="font-semibold text-primary tabular-nums">
                          {fileReadProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-linear-to-r from-primary to-primary/80 transition-all duration-200 ease-out rounded-full relative overflow-hidden"
                          style={{ width: `${fileReadProgress}%` }}
                        >
                          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </form>
      </Card>

      <div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="whitespace-pre-wrap font-mono text-xs">
                {error}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {fileReading && (
          <Alert>
            <Loading />
            <AlertDescription>
              Reading and parsing Excel file...
            </AlertDescription>
          </Alert>
        )}

        {validating && (
          <Alert>
            <Loading />
            <AlertDescription>Validating against database...</AlertDescription>
          </Alert>
        )}

        {preview.length > 0 && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Badge variant="default">{validCount} Valid</Badge>
              {invalidCount > 0 && (
                <Badge variant="destructive">{invalidCount} Invalid</Badge>
              )}
            </div>
            {invalidCount > 0 && (
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={downloadInvalidRecords}
                  disabled={downloadingInvalid}
                >
                  {downloadingInvalid ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  {downloadingInvalid
                    ? "Downloading..."
                    : "Download Invalid Records"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleTerminateInvalid}
                  disabled={loading || validating || fileReading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Terminate Invalid
                </Button>
              </div>
            )}
          </div>
        )}

        {preview.length > 0 && (
          <div className="flex gap-2">
            <Button
              type="submit"
              onClick={handleSubmit}
              disabled={
                loading || invalidCount > 0 || validating || fileReading
              }
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {loading
                ? "Updating..."
                : validating
                  ? "Validating..."
                  : fileReading
                    ? "Reading file..."
                    : `Update ${validCount} Valid Record(s)`}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={loading || validating || fileReading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* Preview Table */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data ({preview.length} records)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Serial Number</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Ref. Transaction</TableHead>
                    <TableHead>Reward Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead className="w-12">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((reward, index) => (
                    <TableRow
                      key={index}
                      className={!reward.isValid ? "bg-destructive/10" : ""}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {reward.isValid ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Valid
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Invalid
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {reward.serialNumber}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {reward.transactionId}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {reward.referrerTransactionId || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            reward.rewardStatus === "PAID"
                              ? "default"
                              : reward.rewardStatus === "FAILED"
                                ? "destructive"
                                : "secondary"
                          }
                        >
                          {reward.rewardStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>{reward.paymentMethod || "-"}</TableCell>
                      <TableCell className="text-sm">
                        {reward.sendingDate || "-"}
                      </TableCell>
                      <TableCell>
                        {reward.issues.length > 0 ? (
                          <div className="space-y-1">
                            {reward.issues.map((issue, i) => (
                              <div
                                key={i}
                                className="text-xs text-destructive flex items-start gap-1"
                              >
                                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                                <span>{issue}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            No issues
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteRow(index)}
                          title="Delete row"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Terminate Invalid Records Dialog */}
      <AlertDialog
        open={terminateDialogOpen}
        onOpenChange={setTerminateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate Invalid Records?</AlertDialogTitle>
            <AlertDialogDescription>
              {invalidCount} invalid record(s) will be permanently removed from
              the preview list. You can download them first before terminating,
              or just terminate without downloading.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="outline" onClick={downloadAndTerminateInvalid}>
              <Download className="h-4 w-4 mr-2" />
              Download & Terminate
            </Button>
            <AlertDialogAction
              onClick={terminateInvalidRecords}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Just Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Progress Modal */}
      <BulkUploadProgressModal
        isOpen={showProgressModal}
        steps={uploadSteps}
        totalRecords={preview.filter((p) => p.isValid).length}
        processedRecords={processedRecords}
        successCount={successCount}
        failedCount={failedCount}
        onClose={() => {
          setShowProgressModal(false);
          if (success) {
            setTimeout(() => router.push("/rewards"), 500);
          }
        }}
      />
    </div>
  );
}
