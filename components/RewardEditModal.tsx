"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Modal from "./Modal";
import { PRODUCT_MODELS, PAYMENT_METHOD, ProductModels } from "@/lib/constants";
import { RewardStatus } from "@/types/rewards";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { StepHeader } from "@/components/StepHeader";
import { FormField } from "@/components/ui/form-field";
import { FormStep } from "@/components/ui/FormStep";
import {
  IconProduct,
  IconSerialNumber,
  IconReward,
  IconUser,
  IconInstallerCode,
  IconEdit2,
  IconBank,
  IconCalendar,
  IconAltArrowLeft,
  IconAltArrowRight,
} from "@/components/icons";
import Loading from "@/components/ui/loading";
import PageHeader from "./PageHeader";
import { HyperText } from "./ui/hypertext";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
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
import IconDanger from "./icons/Danger";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface RewardData {
  serialNumber: string;
  rewardAmount: number;
  productModel: string;
  inverterSerialNumber?: string;
  paymentStatus: string;
  transactionId?: string;
  referrerTransactionId?: string;
  sendingDate?: string;
  paymentMethod?: string;
  installer?: {
    installerCode: string;
    fullName: string;
  };
  referrer?: {
    installerCode: string;
    fullName: string;
  };
}

interface RewardEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rewardId: string;
  onSuccess?: () => void;
}

// Style constants - matching InstallerEditModal
const CARD_SECTION_CLASS =
  "bg-card border-border border p-6 rounded-3xl squircle";
const GRID_2_COL_CLASS = "grid gap-6 md:grid-cols-2";

export default function RewardEditModal({
  open,
  onOpenChange,
  rewardId,
  onSuccess,
}: RewardEditModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reward, setReward] = useState<RewardData | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseAlert, setShowCloseAlert] = useState(false);
  const [originalData, setOriginalData] = useState<Partial<RewardData> | null>(
    null
  );

  // Form fields
  const [serialNumber, setSerialNumber] = useState("");
  const [originalSerialNumber, setOriginalSerialNumber] = useState(""); // Track original value
  const [serialNumberValidation, setSerialNumberValidation] = useState<{
    isChecking: boolean;
    isValid: boolean;
    message: string;
  }>({
    isChecking: false,
    isValid: true,
    message: "",
  });
  const [productModel, setProductModel] = useState("");
  const [inverterSerialNumber, setInverterSerialNumber] = useState("");
  const [paymentStatus, setRewardStatus] = useState<RewardStatus>(
    RewardStatus.PENDING
  );
  const [transactionId, setTransactionId] = useState("");
  const [referrerTransactionId, setReferrerTransactionId] = useState("");
  const [sendingDate, setSendingDate] = useState("");

  const [openSendingDate, setOpenSendingDate] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");

  // Memoize selected product to avoid recalculation
  const selectedProduct = useMemo(
    () => PRODUCT_MODELS.find((p) => p.value === productModel),
    [productModel]
  );

  const isBatteryProduct = useMemo(
    () =>
      (selectedProduct?.isBattery && selectedProduct?.requiresInverter) ||
      false,
    [selectedProduct]
  );

  // Memoize product groups for select dropdown
  const productGroups = useMemo(() => {
    const map = new Map<string, ProductModels[]>();

    for (const m of PRODUCT_MODELS as ProductModels[]) {
      const key = m.isBattery ? "Batteries" : "Inverters";
      const arr = map.get(key);
      if (arr) arr.push(m);
      else map.set(key, [m]);
    }

    return Array.from(map, ([label, items]) => ({
      label,
      options: items
        .slice()
        .sort((a, b) => a.label.localeCompare(b.label))
        .map((item) => ({
          value: item.value,
          label: (
            <div className="flex items-end gap-2">
              <span className="truncate">{item.label}</span>
              {item.reward != null && (
                <p className="text-muted-foreground text-[10px]">
                  Rs {item.reward}
                </p>
              )}
            </div>
          ),
        })),
    }));
  }, []);

  // Memoize payment method options
  const paymentMethodOptions = useMemo(
    () =>
      PAYMENT_METHOD.map((method) => ({
        value: method.value,
        label: method.label,
      })),
    []
  );

  // Memoize payment status options
  const paymentStatusOptions = useMemo(
    () => [
      { value: RewardStatus.PENDING, label: "Pending" },
      { value: RewardStatus.PAID, label: "Paid" },
      { value: RewardStatus.FAILED, label: "Failed" },
    ],
    []
  );

  const fetchReward = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/rewards/${rewardId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch reward");
      }

      const r = data.data;
      setReward(r);

      // Default values
      const todayDate = new Date().toISOString().split("T")[0];
      const defaultPaymentMethod = "UBANK";
      const defaultSendingDate = r.sendingDate
        ? new Date(r.sendingDate as string).toISOString().split("T")[0]
        : todayDate;
      const defaultPaymentMethodValue = r.paymentMethod || defaultPaymentMethod;

      // Store original data for change detection
      const originalRewardData = {
        serialNumber: r.serialNumber || "",
        productModel: r.productModel || "",
        inverterSerialNumber: r.inverterSerialNumber || "",
        paymentStatus: r.paymentStatus,
        transactionId: r.transactionId || "",
        referrerTransactionId: r.referrerTransactionId || "",
        sendingDate: defaultSendingDate,
        paymentMethod: defaultPaymentMethodValue,
      };
      setOriginalData(originalRewardData);

      // Populate form fields
      setSerialNumber(r.serialNumber || "");
      setOriginalSerialNumber(r.serialNumber || ""); // Store original value
      setProductModel(r.productModel || "");
      setInverterSerialNumber(r.inverterSerialNumber || "");
      setRewardStatus(r.paymentStatus);
      setTransactionId(r.transactionId || "");
      setReferrerTransactionId(r.referrerTransactionId || "");
      setSendingDate(defaultSendingDate);
      setPaymentMethod(defaultPaymentMethodValue);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load reward";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [rewardId]);

  useEffect(() => {
    if (open && rewardId) {
      fetchReward();
    }
  }, [open, rewardId, fetchReward]);

  // Track changes to form fields
  useEffect(() => {
    if (!originalData || loading) return;

    const currentData = {
      serialNumber,
      productModel,
      inverterSerialNumber,
      paymentStatus,
      transactionId,
      referrerTransactionId,
      sendingDate,
      paymentMethod,
    };

    const hasChanges = Object.keys(currentData).some((key) => {
      const k = key as keyof typeof currentData;
      return currentData[k] !== (originalData[k] || "");
    });

    setHasUnsavedChanges(hasChanges);
  }, [
    originalData,
    loading,
    serialNumber,
    productModel,
    inverterSerialNumber,
    paymentStatus,
    transactionId,
    referrerTransactionId,
    sendingDate,
    paymentMethod,
  ]);

  // Warn on browser close/reload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Validate serial number - check for duplicates
  const checkSerialNumberExists = useCallback(
    async (newSerialNumber: string) => {
      // Don't check if empty or same as original
      if (!newSerialNumber.trim() || newSerialNumber === originalSerialNumber) {
        setSerialNumberValidation({
          isChecking: false,
          isValid: true,
          message: "",
        });
        return;
      }

      setSerialNumberValidation({
        isChecking: true,
        isValid: true,
        message: "Checking serial number...",
      });

      try {
        const response = await fetch(
          `/api/rewards/check-serial?serialNumber=${encodeURIComponent(
            newSerialNumber
          )}&excludeRewardId=${encodeURIComponent(rewardId)}`
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to validate serial number");
        }

        // Check data.data.exists (API returns { success: true, data: { exists: boolean } })
        if (data.data && data.data.exists) {
          setSerialNumberValidation({
            isChecking: false,
            isValid: false,
            message: "Serial number already exists",
          });
        } else {
          setSerialNumberValidation({
            isChecking: false,
            isValid: true,
            message: "Serial number is available",
          });
        }
      } catch (error) {
        console.error("Error checking serial number:", error);
        setSerialNumberValidation({
          isChecking: false,
          isValid: true,
          message: "",
        });
      }
    },
    [originalSerialNumber, rewardId]
  );

  // Immediately show checking state when serial number changes
  useEffect(() => {
    if (serialNumber !== originalSerialNumber && serialNumber.trim() !== "") {
      setSerialNumberValidation((prev) => ({
        ...prev,
        isChecking: true,
        message: "Checking serial number...",
      }));
    } else {
      // Reset validation when serial number is same as original or empty
      setSerialNumberValidation({
        isChecking: false,
        isValid: true,
        message: "",
      });
    }
  }, [serialNumber, originalSerialNumber]);

  // Debounce serial number validation - perform actual API check after 500ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (serialNumber !== originalSerialNumber && serialNumber.trim() !== "") {
        checkSerialNumberExists(serialNumber);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [serialNumber, originalSerialNumber, checkSerialNumberExists]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setLoading(true);
      setCurrentStep(1);
      setHasUnsavedChanges(false);
      setSerialNumberValidation({
        isChecking: false,
        isValid: true,
        message: "",
      });
    }
  }, [open]);

  // Memoize steps array to prevent recreating on every render
  const steps = useMemo(
    () => [
      { number: 1, title: "Product Details" },
      { number: 2, title: "Payment Info" },
      { number: 3, title: "Review" },
    ],
    []
  );

  // Step validation
  const isStep1Valid = useMemo(() => {
    // Check if inverter serial is valid (not empty and not "N/A")
    const isInverterSerialValid =
      !isBatteryProduct ||
      (inverterSerialNumber.trim() !== "" &&
        inverterSerialNumber.trim().toLowerCase() !== "n/a");

    return (
      serialNumber.trim() !== "" &&
      productModel !== "" &&
      isInverterSerialValid &&
      serialNumberValidation.isValid &&
      !serialNumberValidation.isChecking
    );
  }, [
    serialNumber,
    productModel,
    isBatteryProduct,
    inverterSerialNumber,
    serialNumberValidation,
  ]);

  const isStep2Valid = useMemo(() => {
    // If status is PAID, transaction ID is required
    const isTransactionIdValid =
      paymentStatus !== RewardStatus.PAID || transactionId.trim() !== "";

    return (
      paymentStatus &&
      (paymentStatus === RewardStatus.PENDING || paymentMethod !== "") &&
      isTransactionIdValid
    );
  }, [paymentStatus, paymentMethod, transactionId]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (currentStep === 1 && !isStep1Valid) {
      toast.error(
        "Please complete all required fields: Serial Number, Product Model" +
          (isBatteryProduct ? ", and Inverter Serial Number" : "")
      );
      return;
    }
    if (currentStep === 2 && !isStep2Valid) {
      if (paymentStatus === RewardStatus.PAID && transactionId.trim() === "") {
        toast.error("Transaction ID is required when reward status is PAID");
      } else {
        toast.error("Please select payment status and method");
      }
      return;
    }
    setCurrentStep(currentStep + 1);
  }, [
    currentStep,
    isStep1Valid,
    isStep2Valid,
    isBatteryProduct,
    paymentStatus,
    transactionId,
  ]);

  const handlePrev = useCallback(() => {
    setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const handleSaveChanges = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/rewards/${rewardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNumber,
          productModel,
          inverterSerialNumber,
          paymentStatus,
          transactionId: transactionId || undefined,
          referrerTransactionId: reward?.referrer
            ? referrerTransactionId || undefined
            : undefined,
          sendingDate: sendingDate || undefined,
          paymentMethod: paymentMethod || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Reward updated successfully");
        setHasUnsavedChanges(false);
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(data.error || "Failed to update reward");
      }
    } catch (error) {
      console.error("Failed to update reward:", error);
      toast.error("An error occurred while updating");
    } finally {
      setSaving(false);
    }
  };

  // Handle modal close with unsaved changes warning
  const handleModalClose = (open: boolean) => {
    if (!open && hasUnsavedChanges) {
      setShowCloseAlert(true);
      return;
    }
    onOpenChange(open);
  };

  const confirmClose = () => {
    setShowCloseAlert(false);
    setHasUnsavedChanges(false);
    onOpenChange(false);
  };

  const cancelClose = () => {
    setShowCloseAlert(false);
  };

  return (
    <>
      <Modal
        open={open}
        onOpenChange={handleModalClose}
        title="Edit Reward"
        description="Update reward information"
        size="lg"
      >
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              Edit{" "}
              {loading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                reward?.installer?.fullName
              )}
              &apos;s Reward details
            </span>
          }
          Icon={IconEdit2}
          description={
            <>
              <p className="mt-1 text-sm text-muted-foreground">
                Update reward details and payment information
              </p>
            </>
          }
          titleClassName="text-xl"
          iconFill
        />

        {loading ? (
          <div>
            {/* Step Progress Skeleton */}
            <div className="flex justify-between items-center my-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex flex-col items-center w-full gap-2"
                >
                  <Skeleton className="h-8 w-8" round />
                  <div className="flex flex-col items-center">
                    <Skeleton className="h-4 w-24 mt-1" round />
                    <Skeleton className="h-3 w-20 mt-1" round />
                  </div>
                </div>
              ))}
            </div>

            {/* StepHeader Skeleton */}
            <div className="p-6 rounded-3xl border text-card-foreground bg-card border-border mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-muted">
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
                <div className="flex-1">
                  <Skeleton className="h-5 w-36 mb-2" />
                  <Skeleton className="h-3 w-64" />
                </div>
              </div>
            </div>

            {/* Product Details Skeleton */}
            <div className="space-y-4 mb-6">
              {/* Installer Info Skeleton */}
              <div className={cn("mb-6", CARD_SECTION_CLASS)}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 rounded-xl bg-muted">
                    <Skeleton className="h-6 w-6 rounded" />
                  </div>
                  <div className="flex-1">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className={GRID_2_COL_CLASS}>
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" round />
                    <Skeleton className="h-5 w-full" round />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" round />
                    <Skeleton className="h-5 w-full" round />
                  </div>
                </div>
              </div>

              {/* Product Fields Skeleton */}
              <div className="space-y-6">
                <div className={cn(GRID_2_COL_CLASS, CARD_SECTION_CLASS)}>
                  {/* Serial Number */}
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-28 mb-2" />
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  {/* Product Model */}
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-28 mb-2" />
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  {/* Inverter Serial */}
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-28 mb-2" />
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  {/* Reward Amount */}
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-28 mb-2" />
                    <Skeleton className="h-11 w-full" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                </div>
              </div>
            </div>
            {/* Action Buttons Skeleton */}
            <CardFooter
              className={cn(
                "flex justify-between items-center mt-6",
                CARD_SECTION_CLASS
              )}
            >
              <Skeleton className="h-10 w-28" />
              <Skeleton className="h-10 w-32" />
            </CardFooter>
          </div>
        ) : (
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Progress Steps */}
            <div className="flex justify-between items-center my-8">
              {steps.map((s, i) => (
                <FormStep
                  key={i}
                  step={i}
                  currentStep={currentStep}
                  name={s.title}
                  description={s.title}
                  totalSteps={steps.length}
                />
              ))}
            </div>

            {/* Step 1: Product Details */}
            {currentStep === 1 && (
              <div className="space-y-4 mb-6">
                <StepHeader
                  icon={IconProduct}
                  title="Product Details"
                  description="Update product information and serial numbers"
                />

                {/* Reward Summary - Always visible */}
                <div className={cn("mb-6", CARD_SECTION_CLASS)}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-muted">
                      <IconUser className="h-6 w-6 text-primary" fill />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Installer Information
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Reward owner details
                      </p>
                    </div>
                  </div>
                  <div className={GRID_2_COL_CLASS}>
                    <div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <IconInstallerCode className="h-3.5 w-3.5" />
                        Installer Code
                      </span>
                      <p className="font-mono font-medium text-sm">
                        {reward?.installer?.installerCode}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <IconUser className="h-3.5 w-3.5" />
                        Full Name
                      </span>
                      <p className="font-medium text-sm">
                        {reward?.installer?.fullName}
                      </p>
                    </div>
                    {reward?.referrer && (
                      <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                          <IconUser className="h-3.5 w-3.5" />
                          Referrer
                        </span>
                        <p className="font-mono font-medium text-sm">
                          {reward.referrer.installerCode} -{" "}
                          {reward.referrer.fullName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className={cn(GRID_2_COL_CLASS, CARD_SECTION_CLASS)}>
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber" className="block">
                        Serial Number
                        <span className="text-destructive-text text-[10px] ml-1">
                          ✱
                        </span>
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          id="serialNumber"
                          value={serialNumber}
                          onChange={(e) => setSerialNumber(e.target.value)}
                          placeholder="e.g., SN123456789ABC"
                          required
                          className="pl-10 uppercase"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <IconSerialNumber />
                        </div>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {serialNumberValidation.isChecking ? (
                            <Loading />
                          ) : serialNumber !== originalSerialNumber &&
                            serialNumber.trim() !== "" ? (
                            serialNumberValidation.isValid ? (
                              <HyperText className="tracking-widest text-xs uppercase text-success-text pointer-events-none select-none leading-none">
                                Valid
                              </HyperText>
                            ) : (
                              <HyperText className="tracking-widest text-xs uppercase text-destructive-text pointer-events-none select-none leading-none">
                                Invalid
                              </HyperText>
                            )
                          ) : null}
                        </div>
                      </div>
                      {/* HINT OR ERROR */}
                      <p
                        className={cn(
                          "text-xs",
                          !serialNumberValidation.isValid &&
                            serialNumber !== originalSerialNumber &&
                            serialNumber.trim() !== ""
                            ? "text-destructive-text"
                            : "text-muted-foreground"
                        )}
                      >
                        {serialNumberValidation.isChecking
                          ? "⏳ Checking serial number..."
                          : serialNumber !== originalSerialNumber &&
                            serialNumber.trim() !== ""
                          ? serialNumberValidation.isValid
                            ? `✓ ${serialNumberValidation.message}`
                            : `✗ ${serialNumberValidation.message}`
                          : "Product serial number from the label"}
                      </p>
                    </div>

                    <FormField
                      type="select"
                      label="Product Model"
                      id="productModel"
                      value={productModel}
                      onChange={setProductModel}
                      placeholder="Select product model"
                      hint="Choose the product model"
                      icon={IconProduct}
                      groups={productGroups}
                      searchable
                      searchPlaceholder="Type to search products..."
                      required
                    />

                    {/* Inverter Serial Number - Only for battery products */}
                    {isBatteryProduct && (
                      <FormField
                        type="text"
                        label="Inverter Serial Number"
                        id="inverterSerialNumber"
                        value={inverterSerialNumber}
                        onChange={(value) =>
                          setInverterSerialNumber(value.toUpperCase())
                        }
                        placeholder="e.g., INV987654321XYZ"
                        hint="Enter the serial number of the inverter connected to this battery"
                        icon={IconSerialNumber}
                        required
                      />
                    )}
                    <FormField
                      type="text"
                      label="Reward Amount"
                      id="rewardAmount"
                      value={`Rs. ${(
                        selectedProduct?.reward ||
                        reward?.rewardAmount ||
                        0
                      ).toLocaleString()}`}
                      onChange={() => {}}
                      disabled
                      hint="Based on product model"
                      icon={IconReward}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <StepHeader
                  icon={IconBank}
                  title="Payment Information"
                  description="Update payment status and transaction details"
                />

                {/* Reward Summary - Always visible */}
                <div className={cn("mb-6", CARD_SECTION_CLASS)}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-muted">
                      <IconUser className="h-6 w-6 text-primary" fill />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Installer Information
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Reward owner details
                      </p>
                    </div>
                  </div>
                  <div className={GRID_2_COL_CLASS}>
                    <div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <IconInstallerCode className="h-3.5 w-3.5" />
                        Installer Code
                      </span>
                      <p className="font-mono font-medium text-sm">
                        {reward?.installer?.installerCode}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <IconUser className="h-3.5 w-3.5" />
                        Full Name
                      </span>
                      <p className="font-medium text-sm">
                        {reward?.installer?.fullName}
                      </p>
                    </div>
                    {reward?.referrer && (
                      <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                          <IconUser className="h-3.5 w-3.5" />
                          Referrer
                        </span>
                        <p className="font-mono font-medium text-sm">
                          {reward.referrer.installerCode} -{" "}
                          {reward.referrer.fullName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className={cn(GRID_2_COL_CLASS, CARD_SECTION_CLASS)}>
                  <FormField
                    type="select"
                    label="Reward Status"
                    id="rewardStatus"
                    value={paymentStatus}
                    onChange={(value) => setRewardStatus(value as RewardStatus)}
                    placeholder="Select status"
                    hint="Current payment status"
                    icon={IconReward}
                    options={paymentStatusOptions}
                    required
                  />

                  <FormField
                    type="select"
                    label="Payment Method"
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    placeholder="Select payment method"
                    hint="How the payment was sent"
                    icon={IconBank}
                    options={paymentMethodOptions}
                  />

                  <FormField
                    type="text"
                    label="Installer Transaction ID"
                    id="transactionId"
                    value={transactionId}
                    onChange={setTransactionId}
                    placeholder="e.g., TXN123456"
                    hint={
                      paymentStatus === RewardStatus.PAID
                        ? "Required when reward status is PAID"
                        : "Transaction ID for installer payment"
                    }
                    required={paymentStatus === RewardStatus.PAID}
                  />

                  {!!reward?.referrer && (
                    <FormField
                      type="text"
                      label="Referrer Transaction ID"
                      id="referrerTransactionId"
                      value={referrerTransactionId}
                      onChange={setReferrerTransactionId}
                      placeholder="e.g., TXN789012"
                      hint="Transaction ID for referrer payment"
                      required={paymentStatus === RewardStatus.PAID}
                    />
                  )}

                  <div className="space-y-2">
                    <Label
                      htmlFor="sendingDate"
                      className="flex items-center gap-2"
                    >
                      Sending Date
                    </Label>
                    <Popover
                      open={openSendingDate}
                      onOpenChange={setOpenSendingDate}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          id="sendingDate"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal pl-3",
                            !sendingDate && "text-muted-foreground"
                          )}
                        >
                          <IconCalendar className="mr-2 size-5" />
                          {sendingDate ? (
                            format(new Date(sendingDate), "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-auto p-0 squircle rounded-2xl overflow-hidden"
                        align="start"
                      >
                        <Calendar
                          mode="single"
                          selected={
                            sendingDate ? new Date(sendingDate) : undefined
                          }
                          onSelect={(date) => {
                            if (date) {
                              setSendingDate(format(date, "yyyy-MM-dd"));
                              setOpenSendingDate(false);
                            }
                          }}
                          captionLayout="dropdown"
                          disabled={(date) => {
                            const today = new Date();
                            today.setHours(23, 59, 59, 999);
                            const oneMonthAgo = new Date();
                            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                            oneMonthAgo.setHours(0, 0, 0, 0);
                            return date > today || date < oneMonthAgo;
                          }}
                          defaultMonth={new Date()}
                          startMonth={new Date(2022, 0, 1)}
                        />
                      </PopoverContent>
                    </Popover>
                    <p className="text-xs text-muted-foreground">
                      Date when payment was sent
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <StepHeader
                  icon={IconReward}
                  title="Review & Confirm"
                  description="Review all changes before saving"
                />

                {/* Reward Summary - Always visible */}
                <div className={cn("mb-6", CARD_SECTION_CLASS)}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 rounded-xl bg-muted">
                      <IconUser className="h-6 w-6 text-primary" fill />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Installer Information
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Reward owner details
                      </p>
                    </div>
                  </div>
                  <div className={GRID_2_COL_CLASS}>
                    <div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <IconInstallerCode className="h-3.5 w-3.5" />
                        Installer Code
                      </span>
                      <p className="font-mono font-medium text-sm">
                        {reward?.installer?.installerCode}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                        <IconUser className="h-3.5 w-3.5" />
                        Full Name
                      </span>
                      <p className="font-medium text-sm">
                        {reward?.installer?.fullName}
                      </p>
                    </div>
                    {reward?.referrer && (
                      <div>
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                          <IconUser className="h-3.5 w-3.5" />
                          Referrer
                        </span>
                        <p className="font-mono font-medium text-sm">
                          {reward.referrer.installerCode} -{" "}
                          {reward.referrer.fullName}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className={cn("space-y-6", CARD_SECTION_CLASS)}>
                  {/* Product Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Product Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Serial Number:
                        </span>
                        <p className="font-medium">{serialNumber}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Product Model:
                        </span>
                        <p className="font-medium">{selectedProduct?.label}</p>
                      </div>
                      {isBatteryProduct && (
                        <div>
                          <span className="text-muted-foreground">
                            Inverter Serial:
                          </span>
                          <p className="font-medium">{inverterSerialNumber}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">
                          Reward Amount:
                        </span>
                        <p className="font-medium text-success-text">
                          Rs.{" "}
                          {(
                            selectedProduct?.reward ||
                            reward?.rewardAmount ||
                            0
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Payment Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Payment Status:
                        </span>
                        <p className="font-medium">
                          {
                            paymentStatusOptions.find(
                              (o) => o.value === paymentStatus
                            )?.label
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Payment Method:
                        </span>
                        <p className="font-medium">
                          {paymentMethodOptions.find(
                            (o) => o.value === paymentMethod
                          )?.label || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Installer Transaction ID:
                        </span>
                        <p className="font-medium">
                          {transactionId || "Not provided"}
                        </p>
                      </div>
                      {!!reward?.referrer && (
                        <div>
                          <span className="text-muted-foreground">
                            Referrer Transaction ID:
                          </span>
                          <p className="font-medium">
                            {referrerTransactionId || "Not provided"}
                          </p>
                        </div>
                      )}
                      <div>
                        <span className="text-muted-foreground">
                          Sending Date:
                        </span>
                        <p className="font-medium">
                          {sendingDate || "Not specified"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <CardFooter
              className={cn(
                "flex justify-between items-center mt-6",
                CARD_SECTION_CLASS
              )}
            >
              <Button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                variant="outline"
                className="gap-1 pl-2"
              >
                <IconAltArrowLeft width={2} />
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid)
                  }
                  className="gap-1 pr-3"
                >
                  Next
                  <IconAltArrowRight width={2} />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <>
                      Saving Changes
                      <Loading className="fill-background" />
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              )}
            </CardFooter>
          </form>
        )}
      </Modal>

      <AlertDialog open={showCloseAlert} onOpenChange={setShowCloseAlert}>
        <AlertDialogContent className="rounded-4xl">
          <AlertDialogHeader className="flex flex-col items-center">
            <IconDanger
              className="size-32 text-destructive-text"
              fill
              opacity={"0.1"}
              duotone={true}
            />
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription className="w-19/20 text-center">
              You have unsaved changes. Are you sure you want to close? All
              changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogAction
              onClick={confirmClose}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 w-full"
            >
              Discard Changes
            </AlertDialogAction>
            <AlertDialogCancel onClick={cancelClose} className="w-full">
              Continue Editing
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
