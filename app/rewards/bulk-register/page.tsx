"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import * as XLSX from "xlsx";
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
import {
  PAYMENT_METHOD,
  PRODUCT_MODELS,
  BANKS,
  SERIAL_STATUSES,
} from "@/lib/constants";
import { FileDropzone } from "@/components/ui/drop-zone";
import { IconLayer, IconTrashBin2 } from "@/components/icons";
import IconExcel from "@/components/icons/Excel";
import { toast } from "sonner";
import BulkUploadProgressModal, {
  UploadStep,
} from "@/components/BulkUploadProgressModal";

interface RewardCreate {
  timestamp: string;
  teamMemberEmail: string;
  installerName: string;
  installerCode: string;
  referrerCode?: string;
  autoExtractedReferrer?: boolean;
  productModel: string;
  serialNumber: string;
  inverterSerialNumber?: string;
  serialNumberStatus: string;
  cityOfInstallation: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  paymentStatus: string;
  transactionId?: string;
  rewardAmount: string;
  referrerRewardAmount?: string;
  referrerTransactionId?: string;
  sendingDate?: string;
  paymentMethod: string;
  issues: string[];
  isValid: boolean;
}

export default function BulkCreateRewardsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<RewardCreate[]>([]);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingInvalid, setDownloadingInvalid] = useState(false);
  const [fileReading, setFileReading] = useState(false);
  const [fileReadProgress, setFileReadProgress] = useState(0);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);

  // Progress tracking state
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([]);
  const [processedRecords, setProcessedRecords] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const downloadTemplate = () => {
    setDownloadingTemplate(true);
    try {
      const template = [
        {
          Timestamp: "10/2/2025 17:21:47",
          "Team Member Email": "user@example.com",
          "Installer Name": "John Doe",
          "Installer Code": "IP-0001",
          "Product Model": "TP LD-51 Battery with Fronus Inverter",
          "Serial Number": "SN123456",
          "Inverter Serial Number":
            "INV123456 (required only for products with inverters)",
          "Serial Number Status": "2025",
          "City of Installation": "Karachi",
          "Bank Name": "Habib Bank Ltd",
          "Account Number": "1234567890",
          "Account Title": "John Doe",
          "Payment Status": "PENDING",
          "Transaction ID": "TXN123456 (optional)",
          "Reward Amount": "6500",
          "Referrer Reward Amount": "1000 (required if installer has referrer)",
          "Referrer Transaction ID":
            "REF_TXN123 (required if installer has referrer)",
          "Sending Date": "07 Oct 2025 (optional)",
          "Payment Method": "UBANK",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(template);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Rewards Template");

      ws["!cols"] = [
        { wch: 20 },
        { wch: 25 },
        { wch: 20 },
        { wch: 15 },
        { wch: 35 },
        { wch: 15 },
        { wch: 35 },
        { wch: 20 },
        { wch: 20 },
        { wch: 25 },
        { wch: 20 },
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 15 },
        { wch: 40 },
        { wch: 35 },
        { wch: 25 },
        { wch: 15 },
      ];

      XLSX.writeFile(wb, "rewards_bulk_register_template.xlsx");
    } finally {
      setTimeout(() => setDownloadingTemplate(false), 500);
    }
  };

  const validateRewardStatus = (status: string): boolean => {
    const validStatuses = ["PAID", "PENDING", "FAILED"];
    return validStatuses.includes(status.toUpperCase());
  };

  const validatePaymentMethod = (method: string): boolean => {
    if (!method) return true;
    const normalizedMethod = method.toUpperCase().trim();
    return PAYMENT_METHOD.some(
      (pm) =>
        pm.value.toUpperCase() === normalizedMethod ||
        pm.label.toUpperCase() === normalizedMethod
    );
  };

  const normalizePaymentMethod = (method: string): string => {
    if (!method) return "";
    const normalizedInput = method.toUpperCase().trim();
    const matched = PAYMENT_METHOD.find(
      (pm) =>
        pm.value.toUpperCase() === normalizedInput ||
        pm.label.toUpperCase() === normalizedInput
    );
    return matched ? matched.value : method;
  };

  const validateProductModel = (model: string): boolean => {
    return PRODUCT_MODELS.some(
      (pm) => pm.value === model || pm.label === model
    );
  };

  const normalizeProductModel = (model: string): string => {
    const matched = PRODUCT_MODELS.find(
      (pm) => pm.value === model || pm.label === model
    );
    return matched ? matched.value : model;
  };

  const normalizeBankName = (bankName: string): string => {
    if (!bankName) return "";
    const normalizedInput = bankName.toLowerCase().trim();
    const matchedBank = BANKS.find(
      (bank) =>
        bank.label.toLowerCase() === normalizedInput ||
        bank.value.toLowerCase() === normalizedInput ||
        bank.shortcut.toLowerCase() === normalizedInput
    );
    return matchedBank ? matchedBank.label : bankName;
  };

  const validateBankName = (bankName: string): boolean => {
    if (!bankName) return false;
    const normalizedInput = bankName.toLowerCase().trim();
    return BANKS.some(
      (bank) =>
        bank.label.toLowerCase() === normalizedInput ||
        bank.value.toLowerCase() === normalizedInput ||
        bank.shortcut.toLowerCase() === normalizedInput
    );
  };

  const validateSerialStatus = (status: string): boolean => {
    if (!status) return false;
    const normalizedInput = status.trim();
    return SERIAL_STATUSES.some(
      (s) => s.value === normalizedInput || s.label === normalizedInput
    );
  };

  const parseTimestamp = (timestampStr: string): string => {
    if (!timestampStr) return "";
    try {
      const date = new Date(timestampStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      return "";
    } catch {
      return "";
    }
  };

  const parseSendingDate = (dateStr: string): string => {
    if (!dateStr) return "";
    try {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      return "";
    } catch {
      return "";
    }
  };

  const validateDate = (dateStr: string): boolean => {
    if (!dateStr) return true;
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  };

  const validateReward = (
    reward: Omit<RewardCreate, "issues" | "isValid">
  ): string[] => {
    const issues: string[] = [];

    // Timestamp validation
    if (!reward.timestamp) {
      issues.push("Timestamp is required");
    }

    // Team member email validation
    if (
      !reward.teamMemberEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reward.teamMemberEmail)
    ) {
      issues.push("Valid team member email is required");
    }

    // Installer name validation
    if (!reward.installerName || reward.installerName.length < 2) {
      issues.push("Installer name is required");
    }

    // Installer code validation
    if (!reward.installerCode || reward.installerCode.length < 3) {
      issues.push("Installer code is required (min 3 characters)");
    }

    // Product model validation
    if (!reward.productModel) {
      issues.push("Product model is required");
    } else if (!validateProductModel(reward.productModel)) {
      issues.push(
        `Product model "${reward.productModel}" is not in the approved list`
      );
    } else {
      // Check if inverter serial is required based on product configuration
      const productConfig = PRODUCT_MODELS.find(
        (pm) => pm.value === reward.productModel
      );
      if (productConfig?.requiresInverter && !reward.inverterSerialNumber) {
        issues.push("Inverter serial number is required for this product");
      }
    }

    // Serial number validation
    if (!reward.serialNumber || reward.serialNumber.length < 3) {
      issues.push("Serial number is required (min 3 characters)");
    }

    // Serial number status validation
    if (!reward.serialNumberStatus) {
      issues.push("Serial number status is required");
    } else if (!validateSerialStatus(reward.serialNumberStatus)) {
      issues.push(
        `Invalid serial number status "${reward.serialNumberStatus}" (must be: 2025, 2025 - Not Found, 2024, or Not Found)`
      );
    }

    // City of installation validation
    if (!reward.cityOfInstallation || reward.cityOfInstallation.length < 2) {
      issues.push("City of installation is required");
    }

    // Bank name validation
    if (!reward.bankName) {
      issues.push("Bank name is required");
    } else if (!validateBankName(reward.bankName)) {
      issues.push(`Invalid bank name "${reward.bankName}"`);
    }

    // Account number validation
    if (!reward.accountNumber) {
      issues.push("Account number is required");
    }

    // Account title validation
    if (!reward.accountTitle) {
      issues.push("Account title is required");
    }

    // Payment status validation
    if (!reward.paymentStatus) {
      issues.push("Payment status is required");
    } else if (!validateRewardStatus(reward.paymentStatus)) {
      issues.push(
        `Invalid payment status "${reward.paymentStatus}" (must be: PAID, PENDING, or FAILED)`
      );
    }

    // Reward amount validation
    if (!reward.rewardAmount || isNaN(Number(reward.rewardAmount))) {
      issues.push("Valid reward amount is required");
    }

    // Payment method validation
    if (!reward.paymentMethod) {
      issues.push("Payment method is required");
    } else if (!validatePaymentMethod(reward.paymentMethod)) {
      issues.push(
        `Invalid payment method "${reward.paymentMethod}" (must be: UBANK, UPaisa, or NayaPay)`
      );
    }

    // Referrer validation (will be validated by backend after auto-extraction)
    // Frontend doesn't know if installer has referrer until after validation API call

    // Sending date validation
    if (reward.sendingDate && !validateDate(reward.sendingDate)) {
      issues.push(`Invalid sending date format "${reward.sendingDate}"`);
    }

    return issues;
  };

  const handleFileChange = (file: File) => {
    if (file) {
      setFile(file);
      parseExcelFile(file);
    }
  };

  const parseExcelFile = (file: File) => {
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

        const data = new Uint8Array(e.target?.result as ArrayBuffer);

        setFileReadProgress(75);
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const workbook = XLSX.read(data, { type: "array" });

        setFileReadProgress(80);
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        setFileReadProgress(85);
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<
          string,
          unknown
        >[];

        setFileReadProgress(90);
        await new Promise((resolve) => requestAnimationFrame(resolve));

        const parsedRewards: RewardCreate[] = jsonData.map((row) => {
          const rawPaymentMethod =
            row["Payment Method"]?.toString().trim() || "";
          const rawProductModel = row["Product Model"]?.toString().trim() || "";
          const rawBankName = row["Bank Name"]?.toString().trim() || "";
          const normalizedProductModel = normalizeProductModel(rawProductModel);

          // Check if product requires inverter (same logic as register page)
          const productConfig = PRODUCT_MODELS.find(
            (pm) => pm.value === normalizedProductModel
          );
          const requiresInverter = productConfig?.requiresInverter || false;

          const rawInverterSerial = row["Inverter Serial Number"]?.toString().trim() || "";

          const reward = {
            timestamp: parseTimestamp(row["Timestamp"]?.toString() || ""),
            teamMemberEmail: row["Team Member Email"]?.toString().trim() || "",
            installerName: row["Installer Name"]?.toString().trim() || "",
            installerCode:
              row["Installer Code"]?.toString().trim().toUpperCase() || "",
            productModel: normalizedProductModel,
            serialNumber: row["Serial Number"]?.toString().trim() || "",
            inverterSerialNumber: requiresInverter
              ? (rawInverterSerial || undefined)
              : "N/A",
            serialNumberStatus:
              row["Serial Number Status"]?.toString().trim() || "",
            cityOfInstallation:
              row["City of Installation"]?.toString().trim() || "",
            bankName: normalizeBankName(rawBankName),
            accountNumber: row["Account Number"]?.toString().trim() || "",
            accountTitle: row["Account Title"]?.toString().trim() || "",
            paymentStatus:
              row["Payment Status"]?.toString().toUpperCase().trim() ||
              "PENDING",
            transactionId:
              row["Transaction ID"]?.toString().trim() || undefined,
            rewardAmount: row["Reward Amount"]?.toString().trim() || "",
            referrerRewardAmount:
              row["Referrer Reward Amount"]?.toString().trim() || undefined,
            referrerTransactionId:
              row["Referrer Transaction ID"]?.toString().trim() || undefined,
            sendingDate: parseSendingDate(
              row["Sending Date"]?.toString() || ""
            ),
            paymentMethod: normalizePaymentMethod(rawPaymentMethod),
          };

          const issues = validateReward(reward);

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

        toast.success(`Loaded ${parsedRewards.length} records from file`);

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
  };

  const validateAgainstDatabase = async (rewards: RewardCreate[]) => {
    setValidating(true);
    try {
      const response = await fetch("/api/rewards/validate-bulk-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewards }),
      });

      const data = await response.json();

      if (response.ok && data.data?.validatedRewards) {
        setPreview(data.data.validatedRewards);
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
      `Terminated ${invalidCount} invalid record(s). ${validRecords.length} valid record(s) remaining.`
    );
  };

  const downloadAndTerminateInvalid = () => {
    downloadInvalidRecords();

    // Wait a bit for download to start, then terminate
    setTimeout(() => {
      terminateInvalidRecords();
    }, 500);
  };

  const downloadInvalidRecords = () => {
    setDownloadingInvalid(true);
    try {
      const invalidRecords = preview.filter((p) => !p.isValid);

      if (invalidRecords.length === 0) {
        return;
      }

      const excelData = invalidRecords.map((record) => ({
        Timestamp: record.timestamp,
        "Team Member Email": record.teamMemberEmail,
        "Installer Name": record.installerName,
        "Installer Code": record.installerCode,
        "Referrer Code": record.referrerCode || "",
        "Product Model": record.productModel,
        "Serial Number": record.serialNumber,
        "Inverter Serial Number": record.inverterSerialNumber || "",
        "Serial Number Status": record.serialNumberStatus,
        "City of Installation": record.cityOfInstallation,
        "Bank Name": record.bankName,
        "Account Number": record.accountNumber,
        "Account Title": record.accountTitle,
        "Payment Status": record.paymentStatus,
        "Transaction ID": record.transactionId || "",
        "Reward Amount": record.rewardAmount,
        "Referrer Reward Amount": record.referrerRewardAmount || "",
        "Referrer Transaction ID": record.referrerTransactionId || "",
        "Sending Date": record.sendingDate || "",
        "Payment Method": record.paymentMethod,
        ISSUES: record.issues.join(" | "),
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Invalid Records");

      ws["!cols"] = [
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 25 },
        { wch: 25 },
        { wch: 20 },
        { wch: 15 },
        { wch: 60 },
      ];

      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `invalid_rewards_register_${timestamp}.xlsx`);
    } finally {
      setTimeout(() => setDownloadingInvalid(false), 500);
    }
  };

  const handleSubmit = async () => {
    if (preview.length === 0) {
      toast.error("No data to upload. Please select a valid Excel file.");
      return;
    }

    const invalidRows = preview.filter((p) => !p.isValid);
    if (invalidRows.length > 0) {
      toast.error(
        `Cannot upload: ${invalidRows.length} row(s) have validation issues. Please fix them first.`
      );
      return;
    }

    const validRewards = preview.filter((p) => p.isValid);
    const totalRecords = validRewards.length;

    console.log(`Total records in preview: ${preview.length}`);
    console.log(`Valid records to upload: ${validRewards.length}`);
    console.log(`Invalid records: ${invalidRows.length}`);

    if (totalRecords === 0) {
      toast.error("No valid records to upload.");
      return;
    }

    toast.info(`Uploading ${totalRecords} valid record(s)...`);

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
        description: "Checking for duplicates and validating reward data",
        status: "processing",
        progress: 0,
      },
      {
        id: "register",
        title: "Registering Rewards",
        description: `Processing 0 of ${totalRecords} reward(s)`,
        status: "pending",
        progress: 0,
      },
      {
        id: "activity",
        title: "Logging Activities",
        description: "Recording reward registration activities",
        status: "pending",
        progress: 0,
      },
      {
        id: "complete",
        title: "Finalizing Upload",
        description: "Completing the bulk registration process",
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
            : step
        )
      );

      // Step 2: Start registering rewards in chunks
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "register" ? { ...step, status: "processing" } : step
        )
      );

      // Process in chunks for real-time progress
      const CHUNK_SIZE = 10; // Process 10 rewards at a time
      let totalSuccess = 0;
      let totalFailed = 0;
      const allErrors: string[] = [];

      console.log(`Starting bulk upload of ${totalRecords} rewards in ${Math.ceil(totalRecords / CHUNK_SIZE)} chunks`);

      for (let i = 0; i < validRewards.length; i += CHUNK_SIZE) {
        const chunk = validRewards.slice(i, i + CHUNK_SIZE);
        const currentBatch = Math.min(i + CHUNK_SIZE, validRewards.length);
        const chunkNumber = Math.floor(i / CHUNK_SIZE) + 1;

        console.log(`Processing chunk ${chunkNumber}: rewards ${i + 1} to ${currentBatch}`);

        try {
          const response = await fetch("/api/rewards/bulk-register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rewards: chunk }),
          });

          const data = await response.json();

          console.log(`Chunk ${chunkNumber} response:`, {
            ok: response.ok,
            success: data.data?.success,
            failed: data.data?.failed,
            errors: data.data?.errors?.length || 0
          });

          if (response.ok) {
            const chunkSuccess = data.data?.success || 0;
            const chunkFailed = data.data?.failed || 0;

            totalSuccess += chunkSuccess;
            totalFailed += chunkFailed;

            console.log(`Chunk ${chunkNumber}: ${chunkSuccess} succeeded, ${chunkFailed} failed. Total: ${totalSuccess}/${currentBatch}`);

            if (data.data?.errors && data.data.errors.length > 0) {
              allErrors.push(...data.data.errors);
            }
          } else {
            console.error(`Chunk ${chunkNumber} failed with error:`, data.error);
            totalFailed += chunk.length;
            allErrors.push(`Chunk ${chunkNumber}: ${data.error || "Chunk registration failed"}`);
          }
        } catch (err) {
          console.error(`Chunk ${chunkNumber} exception:`, err);
          totalFailed += chunk.length;
          allErrors.push(
            `Chunk ${chunkNumber} failed: ${
              err instanceof Error ? err.message : "Unknown error"
            }`
          );
        }

        // Update progress in real-time
        const progress = Math.round((currentBatch / totalRecords) * 100);
        setProcessedRecords(currentBatch);
        setSuccessCount(totalSuccess);
        setFailedCount(totalFailed);

        setUploadSteps((prev) =>
          prev.map((step) =>
            step.id === "register"
              ? {
                  ...step,
                  status: "processing",
                  progress: progress,
                  description: `Processing ${currentBatch} of ${totalRecords} reward(s)`,
                  details: `Registered: ${totalSuccess} | Failed: ${totalFailed}`,
                }
              : step
          )
        );

        // Small delay between chunks to allow UI updates
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      console.log(`Upload complete. Total processed: ${validRewards.length}, Success: ${totalSuccess}, Failed: ${totalFailed}`);

      // Step 2: Complete registration
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "register"
            ? {
                ...step,
                status: totalSuccess > 0 ? "completed" : "error",
                progress: 100,
                details: `Registered ${totalSuccess} out of ${totalRecords} rewards`,
                error: totalFailed > 0 ? `${totalFailed} failed` : undefined,
              }
            : step
        )
      );

      if (totalSuccess === 0) {
        setUploadSteps((prev) =>
          prev.map((step) =>
            step.status === "pending" || step.status === "processing"
              ? {
                  ...step,
                  status: "error",
                  error: "No rewards were registered successfully",
                }
              : step
          )
        );
        setError(`Registration failed. Errors: ${allErrors.join(", ")}`);
        return;
      }

      // Step 3: Activity Logging (already done during registration)
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "activity" ? { ...step, status: "processing" } : step
        )
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
            : step
        )
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
                details: `Registration completed: ${totalSuccess} successful, ${totalFailed} failed`,
              }
            : {
                ...step,
                status: step.status === "pending" ? "completed" : step.status,
              }
        )
      );

      setSuccess(`Successfully created ${totalSuccess} reward(s)!`);

      if (totalFailed > 0) {
        setError(
          `${totalFailed} reward(s) failed. Check the logs for details.`
        );
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.status === "processing"
            ? { ...step, status: "error", error: errorMessage }
            : step
        )
      );
      setError("Failed to create rewards: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validCount = preview.filter((p) => p.isValid).length;
  const invalidCount = preview.filter((p) => !p.isValid).length;

  return (
    <div className="flex-1 overflow-auto space-y-4">
      <PageHeader
        Icon={IconLayer}
        iconFill
        title="Bulk Register Rewards"
        description="Create multiple reward records at once using an Excel file"
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
                1. Download the template file and fill in the reward data
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                2. Upload the completed Excel file
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                3. Review the data and fix any validation issues
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                4. Click &quot;Create All Valid Records&quot; to finalize
              </p>
              <Button
                onClick={downloadTemplate}
                variant="outline"
                disabled={downloadingTemplate}
              >
                {downloadingTemplate ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {downloadingTemplate ? "Downloading..." : "Download Template"}
              </Button>
            </div>

            {/* <div className="pt-4 border-t">
              <p className="text-sm font-medium mb-2">Validation Rules:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>
                  Timestamp must be in valid date format (e.g., 10/2/2025
                  17:21:47)
                </li>
                <li>Team member email must be valid and exist in the system</li>
                <li>
                  Installer name must match the installer code in database
                </li>
                <li>Installer code must exist in the system</li>
                <li>
                  Referrer info is auto-extracted from installer record (no need
                  to enter)
                </li>
                <li>Product model must be from approved list</li>
                <li>Serial number must be unique (non-duplicate)</li>
                <li>
                  Inverter serial number required only for products with
                  inverters
                </li>
                <li>
                  Serial number status: 2025, 2025 - Not Found, 2024, or Not
                  Found
                </li>
                <li>City of installation is required</li>
                <li>Bank name must match the approved banks list</li>
                <li>Account number and account title are required</li>
                <li>Payment status: PAID, PENDING, or FAILED</li>
                <li>Reward amount must be a valid number</li>
                <li>
                  Referrer reward amount required if installer has a referrer
                </li>
                <li>
                  Referrer transaction ID required if installer has a referrer
                </li>
                <li>Payment method: UBANK, UPaisa, or NayaPay</li>
                <li>Sending date format: &quot;07 Oct 2025&quot; (optional)</li>
              </ul>
            </div> */}
          </CardContent>
        </div>

        {/* Upload Form */}
        <div className="h-full p-6">
          <Card className="h-full p-6 squircle rounded-[4rem] space-y-4">
            <h3 className="mb-3">File Upload</h3>
            <div className="space-y-2">
              <FileDropzone
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
                      Click the delete/reset button below to upload a different
                      file
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
                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-200 ease-out rounded-full relative overflow-hidden"
                        style={{ width: `${fileReadProgress}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
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
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Reading and parsing Excel file...
            </AlertDescription>
          </Alert>
        )}

        {validating && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
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
              type="button"
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
                ? "Creating..."
                : validating
                ? "Validating..."
                : fileReading
                ? "Reading file..."
                : `Create ${validCount} Valid Record(s)`}
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
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Team Member</TableHead>
                    <TableHead>Installer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Serial #</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Payment</TableHead>
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
                      <TableCell className="text-xs">
                        {reward.timestamp
                          ? new Date(reward.timestamp).toLocaleString()
                          : "-"}
                      </TableCell>
                      <TableCell
                        className="text-sm max-w-[150px] truncate"
                        title={reward.teamMemberEmail}
                      >
                        {reward.teamMemberEmail}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div>{reward.installerName}</div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {reward.installerCode}
                        </div>
                        {reward.autoExtractedReferrer && (
                          <div className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Referrer: {reward.referrerCode}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell
                        className="text-sm max-w-[200px] truncate"
                        title={reward.productModel}
                      >
                        {reward.productModel}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {reward.serialNumber}
                      </TableCell>
                      <TableCell
                        className="text-sm max-w-[150px] truncate"
                        title={reward.bankName}
                      >
                        {reward.bankName}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {reward.rewardAmount}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            reward.paymentStatus === "PAID"
                              ? "default"
                              : reward.paymentStatus === "FAILED"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {reward.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {reward.issues.length > 0 ? (
                          <div className="space-y-1">
                            {reward.issues.map((issue, i) => (
                              <div
                                key={i}
                                className="text-xs text-destructive flex items-start gap-1"
                              >
                                <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
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
