"use client";
import { useState, useCallback, useMemo } from "react";
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
import { BANKS } from "@/lib/constants";
import BulkUploadProgressModal, {
  UploadStep,
} from "@/components/BulkUploadProgressModal";
import { toast } from "sonner";
import { FileDropzone } from "@/components/ui/drop-zone";
import { IconTrashBin2 } from "@/components/icons";
import IconExcel from "@/components/icons/Excel";

interface InstallerUpload {
  installerCode: string;
  fullName: string;
  referrerCode?: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  province: string;
  trainingCenter: string;
  companyName?: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  certified: boolean;
  issues: string[];
  isValid: boolean;
}

export default function BulkUploadInstallersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingInvalid, setDownloadingInvalid] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<InstallerUpload[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [uploadSteps, setUploadSteps] = useState<UploadStep[]>([]);
  const [processedRecords, setProcessedRecords] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);

  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [fileReading, setFileReading] = useState(false);
  const [fileReadProgress, setFileReadProgress] = useState(0);
  const [terminateDialogOpen, setTerminateDialogOpen] = useState(false);

  type TemplateRow = {
    "Installer Code": string;
    "Full Name": string;
    "Referrer Code": string;
    CNIC: string;
    "Phone Number": string;
    "WhatsApp Number": string;
    Address: string;
    City: string;
    Province: string;
    "Training Center": string;
    "Company Name": string;
    "Bank Name": string;
    "Account Number": string;
    "Account Title": string;
    Certified: string;
  };

  const downloadTemplate = (
    setDownloadingTemplate: React.Dispatch<React.SetStateAction<boolean>>
  ): void => {
    setDownloadingTemplate(true);

    const generationPromise: Promise<{ name: string }> = new Promise(
      (resolve, reject) => {
        try {
          const template: TemplateRow[] = [
            {
              "Installer Code": "IP-0001",
              "Full Name": "John Doe",
              "Referrer Code": "IP-0000 (optional)",
              CNIC: "12345-1234567-1",
              "Phone Number": "03001234567",
              "WhatsApp Number": "03001234567",
              Address: "123 Main Street",
              City: "Karachi",
              Province: "Sindh",
              "Training Center": "Center A",
              "Company Name": "ABC Company (optional)",
              "Bank Name": "HBL/KONNECT",
              "Account Number": "12345678901234",
              "Account Title": "John Doe",
              Certified: "true",
            },
          ];

          const ws = XLSX.utils.json_to_sheet(template);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "Installers Template");

          // Set column widths
          ws["!cols"] = [
            { wch: 15 },
            { wch: 20 },
            { wch: 15 },
            { wch: 18 },
            { wch: 15 },
            { wch: 15 },
            { wch: 30 },
            { wch: 15 },
            { wch: 12 },
            { wch: 15 },
            { wch: 20 },
            { wch: 12 },
            { wch: 20 },
            { wch: 20 },
            { wch: 10 },
          ];

          // writeFile is synchronous in browser contexts (triggers download)
          XLSX.writeFile(wb, "installers_bulk_upload_template.xlsx");

          resolve({ name: "Installers Template" });
        } catch (error) {
          reject(error);
        }
      }
    );

    toast.promise(generationPromise, {
      loading: "Generating template...",
      success: (data: { name: string }) =>
        `${data.name} has be downloaded successfully!`,
      error: (err: unknown) =>
        typeof err === "string" ? err : `Failed to generate Installer Template`,
    });

    generationPromise
      .catch((err) => {
        // optional console logging for debugging; keep UI errors handled by toast
        // eslint-disable-next-line no-console
        console.error("downloadTemplate error:", err);
      })
      .finally(() => {
        // small timeout so UX shows the toast state transition smoothly
        setTimeout(() => setDownloadingTemplate(false), 300);
      });
  };

  // Formatting utilities
  const formatCNIC = (cnic: string): string => {
    // Remove all non-digit characters
    const cleaned = cnic.replace(/\D/g, "");

    // Format as #####-#######-#
    if (cleaned.length === 13) {
      return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 12)}-${cleaned.slice(
        12
      )}`;
    }

    return cnic; // Return original if not 13 digits
  };

  const formatPhoneNumber = (phone: string): string => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, "");

    // Remove leading 0 or 92
    if (cleaned.startsWith("0")) {
      cleaned = cleaned.substring(1);
    } else if (cleaned.startsWith("92")) {
      cleaned = cleaned.substring(2);
    }

    // Add +92 prefix
    if (cleaned.length === 10) {
      return `+92${cleaned}`;
    }

    return phone; // Return original if not valid
  };

  const capitalizeEachWord = (text: string): string => {
    return text
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const validateCNIC = (cnic: string): boolean => {
    // CNIC format: 12345-1234567-1 (13 digits with dashes)
    const cnicRegex = /^\d{5}-\d{7}-\d{1}$/;
    return cnicRegex.test(cnic);
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Pakistan phone format: +92XXXXXXXXXX (10 digits after +92)
    const phoneRegex = /^\+92\d{10}$/;
    return phoneRegex.test(phone);
  };

  const validateInstallerCode = (code: string): boolean => {
    // Format: IP-XXXX or similar
    return Boolean(code && code.length >= 3 && code.length <= 20);
  };

  const normalizeBankName = (bankName: string): string => {
    const trimmedInput = bankName.trim();

    // STRICTLY match using case-sensitive matchcase field ONLY
    // If matched, return the matchcase value (NOT label) for storage
    const matchedBank = BANKS.find((bank) => bank.matchcase === trimmedInput);

    return matchedBank ? matchedBank.matchcase : bankName;
  };

  const validateBankName = useCallback((bankName: string): boolean => {
    const trimmedInput = bankName.trim();

    // STRICTLY validate using case-sensitive matchcase field ONLY
    return BANKS.some((bank) => bank.matchcase === trimmedInput);
  }, []);

  const validateInstaller = useCallback(
    (installer: Omit<InstallerUpload, "issues" | "isValid">): string[] => {
      const issues: string[] = [];

      // Required field validations
      if (
        !installer.installerCode ||
        !validateInstallerCode(installer.installerCode)
      ) {
        issues.push("Invalid installer code format");
      }
      if (!installer.fullName || installer.fullName.length < 3) {
        issues.push("Full name must be at least 3 characters");
      }
      if (!installer.cnic || !validateCNIC(installer.cnic)) {
        issues.push("Invalid CNIC format (should be: 12345-1234567-1)");
      }
      if (
        !installer.phoneNumber ||
        !validatePhoneNumber(installer.phoneNumber)
      ) {
        issues.push("Invalid phone number format (should be: +92XXXXXXXXXX)");
      }
      if (
        !installer.whatsappNumber ||
        !validatePhoneNumber(installer.whatsappNumber)
      ) {
        issues.push(
          "Invalid WhatsApp number format (should be: +92XXXXXXXXXX)"
        );
      }
      if (!installer.address || installer.address.length < 5) {
        issues.push("Address must be at least 5 characters");
      }
      if (!installer.city || installer.city.length < 2) {
        issues.push("City is required");
      }
      if (!installer.province || installer.province.length < 2) {
        issues.push("Province is required");
      }
      if (!installer.trainingCenter || installer.trainingCenter.length < 2) {
        issues.push("Training center is required");
      }
      if (!installer.bankName || installer.bankName.length < 2) {
        issues.push("Bank name is required");
      } else if (!validateBankName(installer.bankName)) {
        issues.push(
          `Bank name "${installer.bankName}" must match exactly (case-sensitive) with approved list`
        );
      }
      if (!installer.accountNumber || installer.accountNumber.length < 10) {
        issues.push("Account number must be at least 10 characters");
      }
      if (!installer.accountTitle || installer.accountTitle.length < 3) {
        issues.push("Account title is required");
      }

      return issues;
    },
    [validateBankName]
  );

  const validateAgainstDatabase = useCallback(
    async (installers: InstallerUpload[]) => {
      setValidating(true);
      try {
        const response = await fetch("/api/installers/validate-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ installers }),
        });

        const data = await response.json();

        if (response.ok && data.data?.validatedInstallers) {
          setPreview(data.data.validatedInstallers);
        }
      } catch (err: unknown) {
        console.error("Validation error:", err);
      } finally {
        setValidating(false);
      }
    },
    []
  );

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

          // Process data in chunks to avoid blocking
          const parsedInstallers: InstallerUpload[] = [];
          const chunkSize = 50;

          for (let i = 0; i < jsonData.length; i += chunkSize) {
            const chunk = jsonData.slice(i, i + chunkSize);
            const chunkProgress = 90 + Math.round((i / jsonData.length) * 8);
            setFileReadProgress(chunkProgress);

            // Process chunk
            const processedChunk = chunk.map((row) => {
              const rawBankName = row["Bank Name"]?.toString().trim() || "";
              const rawFullName = row["Full Name"]?.toString().trim() || "";
              const rawAddress = row["Address"]?.toString().trim() || "";
              const rawCity = row["City"]?.toString().trim() || "";
              const rawProvince = row["Province"]?.toString().trim() || "";
              const rawTrainingCenter =
                row["Training Center"]?.toString().trim() || "";
              const rawCompanyName =
                row["Company Name"]?.toString().trim() || "";
              const rawAccountTitle =
                row["Account Title"]?.toString().trim() || "";
              const rawCNIC = row["CNIC"]?.toString().trim() || "";
              const rawPhoneNumber =
                row["Phone Number"]?.toString().trim() || "";
              const rawWhatsappNumber =
                row["WhatsApp Number"]?.toString().trim() || "";

              const installer = {
                // UPPERCASE fields
                installerCode:
                  row["Installer Code"]?.toString().trim().toUpperCase() || "",
                referrerCode:
                  row["Referrer Code"]?.toString().trim().toUpperCase() ||
                  undefined,
                accountNumber:
                  row["Account Number"]?.toString().trim().toUpperCase() || "",

                // Capitalize Each Word fields
                fullName: rawFullName ? capitalizeEachWord(rawFullName) : "",
                address: rawAddress ? capitalizeEachWord(rawAddress) : "",
                city: rawCity ? capitalizeEachWord(rawCity) : "",
                province: rawProvince ? capitalizeEachWord(rawProvince) : "",
                trainingCenter: rawTrainingCenter
                  ? capitalizeEachWord(rawTrainingCenter)
                  : "",
                companyName: rawCompanyName
                  ? capitalizeEachWord(rawCompanyName)
                  : undefined,
                accountTitle: rawAccountTitle
                  ? capitalizeEachWord(rawAccountTitle)
                  : "",

                // Formatted fields
                cnic: formatCNIC(rawCNIC),
                phoneNumber: formatPhoneNumber(rawPhoneNumber),
                whatsappNumber: formatPhoneNumber(rawWhatsappNumber),

                // Other fields
                bankName: normalizeBankName(rawBankName),
                certified:
                  row["Certified"]?.toString().toLowerCase() === "true"
                    ? true
                    : false,
              };

              const issues = validateInstaller(installer);

              return {
                ...installer,
                issues,
                isValid: issues.length === 0,
              };
            });

            parsedInstallers.push(...processedChunk);

            // Allow UI to update between chunks
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }

          setFileReadProgress(98);
          await new Promise((resolve) => requestAnimationFrame(resolve));

          setFileReadProgress(100);
          setPreview(parsedInstallers);
          setError("");
          toast.success(`Loaded ${parsedInstallers.length} records from file`);

          // Automatically validate against database after parsing
          setTimeout(() => {
            setFileReading(false);
            validateAgainstDatabase(parsedInstallers);
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
    [validateInstaller, validateAgainstDatabase]
  );

  const handleFileChange = (file: File) => {
    if (file) {
      setFile(file);
      parseExcelFile(file);
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

    // Reset file input
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }

    toast.success("Form reset successfully");
  };

  const downloadInvalidRecords = () => {
    setDownloadingInvalid(true);
    const toastId = toast.loading("Generating invalid records file...");
    try {
      const invalidRecords = preview.filter((p) => !p.isValid);

      if (invalidRecords.length === 0) {
        toast.dismiss(toastId);
        toast.error("No invalid records to download");
        return;
      }

      const excelData = invalidRecords.map((record) => ({
        "Installer Code": record.installerCode,
        "Full Name": record.fullName,
        "Referrer Code": record.referrerCode || "",
        CNIC: record.cnic,
        "Phone Number": record.phoneNumber,
        "WhatsApp Number": record.whatsappNumber,
        Address: record.address,
        City: record.city,
        Province: record.province,
        "Training Center": record.trainingCenter,
        "Company Name": record.companyName || "",
        "Bank Name": record.bankName,
        "Account Number": record.accountNumber,
        "Account Title": record.accountTitle,
        Certified: record.certified ? "true" : "false",
        ISSUES: record.issues.join(" | "),
      }));

      const ws = XLSX.utils.json_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Invalid Records");

      // Set column widths
      ws["!cols"] = [
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 18 },
        { wch: 15 },
        { wch: 15 },
        { wch: 30 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 20 },
        { wch: 12 },
        { wch: 20 },
        { wch: 20 },
        { wch: 10 },
        { wch: 60 },
      ];

      // Style the header row
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FFE0E0E0" } },
        };
      }

      const timestamp = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `invalid_installers_${timestamp}.xlsx`);
      toast.dismiss(toastId);
      toast.success(`Downloaded ${invalidRecords.length} invalid record(s)`);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error("Failed to download invalid records");
    } finally {
      setTimeout(() => setDownloadingInvalid(false), 500);
    }
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

    const validInstallers = preview.filter((p) => p.isValid);
    const totalRecords = validInstallers.length;

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
        description: "Checking for duplicates and validating installer data",
        status: "processing",
        progress: 0,
      },
      {
        id: "register",
        title: "Registering Installers",
        description: `Processing 0 of ${totalRecords} installer(s)`,
        status: "pending",
        progress: 0,
      },
      {
        id: "google",
        title: "Creating Google Contacts",
        description: "Syncing installer data with Google Contacts",
        status: "pending",
        progress: 0,
      },
      {
        id: "activity",
        title: "Logging Activities",
        description: "Recording installation activities",
        status: "pending",
        progress: 0,
      },
      {
        id: "complete",
        title: "Finalizing Upload",
        description: "Completing the bulk upload process",
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

      // Step 2: Start registering installers in chunks
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "register" ? { ...step, status: "processing" } : step
        )
      );

      // Process in chunks for real-time progress
      const CHUNK_SIZE = 10; // Process 10 installers at a time
      let totalSuccess = 0;
      let totalFailed = 0;
      let totalGoogleContacts = 0;
      const allErrors: string[] = [];

      for (let i = 0; i < validInstallers.length; i += CHUNK_SIZE) {
        const chunk = validInstallers.slice(i, i + CHUNK_SIZE);
        const currentBatch = Math.min(i + CHUNK_SIZE, validInstallers.length);

        try {
          const response = await fetch("/api/installers/bulk-register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ installers: chunk }),
          });

          const data = await response.json();

          if (response.ok) {
            totalSuccess += data.data.success || 0;
            totalFailed += data.data.failed || 0;
            totalGoogleContacts += data.data.googleContactsCreated || 0;

            if (data.data.errors && data.data.errors.length > 0) {
              allErrors.push(...data.data.errors);
            }
          } else {
            totalFailed += chunk.length;
            allErrors.push(data.error || "Chunk upload failed");
          }
        } catch (err) {
          totalFailed += chunk.length;
          allErrors.push(
            `Chunk ${i / CHUNK_SIZE + 1} failed: ${
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
                  description: `Processing ${currentBatch} of ${totalRecords} installer(s)`,
                  details: `Registered: ${totalSuccess} | Failed: ${totalFailed}`,
                }
              : step
          )
        );

        // Small delay between chunks to allow UI updates
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }

      // Step 2: Complete registration
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "register"
            ? {
                ...step,
                status: totalSuccess > 0 ? "completed" : "error",
                progress: 100,
                details: `Registered ${totalSuccess} out of ${totalRecords} installers`,
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
                  error: "No installers were registered successfully",
                }
              : step
          )
        );
        setError(`Registration failed. Errors: ${allErrors.join(", ")}`);
        return;
      }

      // Step 3: Google Contacts (already created during registration)
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "google" ? { ...step, status: "processing" } : step
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 500));
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "google"
            ? {
                ...step,
                status: "completed",
                progress: 100,
                details: `Created ${totalGoogleContacts} Google contacts`,
              }
            : step
        )
      );

      // Step 4: Activity Logging (already done during registration)
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

      // Step 5: Complete
      await new Promise((resolve) => setTimeout(resolve, 300));
      setUploadSteps((prev) =>
        prev.map((step) =>
          step.id === "complete"
            ? {
                ...step,
                status: "completed",
                progress: 100,
                details: `Upload completed: ${totalSuccess} successful, ${totalFailed} failed`,
              }
            : {
                ...step,
                status: step.status === "pending" ? "completed" : step.status,
              }
        )
      );

      setSuccess(`Successfully uploaded ${totalSuccess} installer(s)!`);

      if (totalFailed > 0) {
        setError(
          `${totalFailed} installer(s) failed. Check the logs for details.`
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
      setError("Failed to upload installers: " + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const validCount = useMemo(
    () => preview.filter((p) => p.isValid).length,
    [preview]
  );
  const invalidCount = useMemo(
    () => preview.filter((p) => !p.isValid).length,
    [preview]
  );

  return (
    <div className="flex-1 overflow-auto space-y-4">
      <PageHeader
        title="Bulk Upload Installers"
        description="Upload multiple installers at once using an Excel file"
        action={
          <Button variant="ghost" onClick={() => router.push("/installers")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Installers
          </Button>
        }
      />
      {/* Instructions Card */}
      <Card className="grid grid-cols-1 lg:grid-cols-2 ">
        <div>
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                1. Download the template file and fill in the installer data
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                2. Upload the completed Excel file
              </p>
              <p className="text-sm text-muted-foreground mb-2">
                3. Review the data and fix any validation issues
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                4. Click &quot;Upload All Valid Records&quot; to finalize
              </p>
              <Button
                onClick={() => downloadTemplate(setDownloadingTemplate)}
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

            {/* <div className="pt-4 border-t border-border">
              <p className="text-sm font-medium mb-2 mt-3">Validation Rules:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Installer code must be unique</li>
                <li>All required fields must be filled</li>
                <li>Bank name MUST match exactly (case-sensitive)</li>
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
                  className="bg-muted/10"
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
        </form>
      </Card>

      {/* Visual upload progress */}
      {uploading && (
        <div className="w-full bg-slate-200 rounded h-3 overflow-hidden mt-2">
          <div
            className="h-3 transition-all"
            style={{ width: `${uploadPercent}%` }}
            aria-valuenow={uploadPercent}
          />
        </div>
      )}

      <div>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
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
                ? "Uploading..."
                : validating
                ? "Validating..."
                : fileReading
                ? "Reading file..."
                : `Upload ${validCount} Valid Record(s)`}
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
                    <TableHead>Installer Code</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>CNIC</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Province</TableHead>
                    <TableHead>Bank</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead className="w-12">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((installer, index) => (
                    <TableRow
                      key={index}
                      className={!installer.isValid ? "bg-destructive/10" : ""}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {installer.isValid ? (
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
                        {installer.installerCode}
                      </TableCell>
                      <TableCell>{installer.fullName}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {installer.cnic}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {installer.phoneNumber}
                      </TableCell>
                      <TableCell>{installer.city}</TableCell>
                      <TableCell>{installer.province}</TableCell>
                      <TableCell>{installer.bankName}</TableCell>
                      <TableCell>
                        {installer.issues.length > 0 ? (
                          <div className="space-y-1">
                            {installer.issues.map((issue, i) => (
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
            setTimeout(() => router.push("/installers"), 500);
          }
        }}
      />
    </div>
  );
}
