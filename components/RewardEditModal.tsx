"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Modal from "./Modal";
import { PRODUCT_MODELS, PAYMENT_METHOD, ProductModels } from "@/lib/constants";
import { PaymentStatus } from "@/types/rewards";
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
const CARD_SECTION_CLASS = "bg-card border-border border p-6 rounded-3xl";
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

  // Form fields
  const [serialNumber, setSerialNumber] = useState("");
  const [productModel, setProductModel] = useState("");
  const [inverterSerialNumber, setInverterSerialNumber] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    PaymentStatus.PENDING
  );
  const [transactionId, setTransactionId] = useState("");
  const [referrerTransactionId, setReferrerTransactionId] = useState("");
  const [sendingDate, setSendingDate] = useState("");
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
      { value: PaymentStatus.PENDING, label: "Pending" },
      { value: PaymentStatus.PAID, label: "Paid" },
      { value: PaymentStatus.FAILED, label: "Failed" },
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

      // Populate form fields
      setSerialNumber(r.serialNumber || "");
      setProductModel(r.productModel || "");
      setInverterSerialNumber(r.inverterSerialNumber || "");
      setPaymentStatus(r.paymentStatus);
      setTransactionId(r.transactionId || "");
      setReferrerTransactionId(r.referrerTransactionId || "");
      setSendingDate(
        r.sendingDate
          ? new Date(r.sendingDate as string).toISOString().split("T")[0]
          : ""
      );
      setPaymentMethod(r.paymentMethod || "");
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

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setLoading(true);
      setCurrentStep(1);
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
    return (
      serialNumber.trim() !== "" &&
      productModel !== "" &&
      (!isBatteryProduct || inverterSerialNumber.trim() !== "")
    );
  }, [serialNumber, productModel, isBatteryProduct, inverterSerialNumber]);

  const isStep2Valid = useMemo(() => {
    return (
      paymentStatus &&
      (paymentStatus === PaymentStatus.PENDING || paymentMethod !== "")
    );
  }, [paymentStatus, paymentMethod]);

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
      toast.error("Please select payment status and method");
      return;
    }
    setCurrentStep(currentStep + 1);
  }, [currentStep, isStep1Valid, isStep2Valid, isBatteryProduct]);

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

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
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
              reward?.serialNumber
            )}{" "}
            details
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
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>

          {/* Installer Info Skeleton */}
          <div className={cn("mb-6", CARD_SECTION_CLASS)}>
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className={GRID_2_COL_CLASS}>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-5 w-full" />
              </div>
            </div>
          </div>

          {/* Product Details Skeleton */}
          <div className="space-y-4 mb-6">
            <div className="p-6 rounded-3xl border text-card-foreground bg-card border-border">
              <div className="text-base flex items-center gap-2">
                <Skeleton className="h-12 w-12 mr-2 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
            </div>

            <div className={cn(GRID_2_COL_CLASS, CARD_SECTION_CLASS)}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </div>

          {/* Payment Details Skeleton */}
          <div className="space-y-4">
            <div className="p-6 rounded-3xl border text-card-foreground bg-card border-border">
              <div className="text-base flex items-center gap-2">
                <Skeleton className="h-12 w-12 mr-2 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
            </div>

            <div className={cn(GRID_2_COL_CLASS, CARD_SECTION_CLASS)}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-11 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <CardFooter
            className={cn("flex justify-end gap-3 mt-6", CARD_SECTION_CLASS)}
          >
            <Skeleton className="h-10 w-24" />
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
              <div>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1">
                  <IconReward className="h-3.5 w-3.5" />
                  Reward Amount
                </span>
                <p className="font-mono font-medium text-sm text-success-text">
                  Rs. {reward?.rewardAmount?.toLocaleString()}
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

          {/* Step 1: Product Details */}
          {currentStep === 1 && (
            <div className="space-y-4 mb-6">
            <StepHeader
              icon={IconProduct}
              title="Product Details"
              description="Update product information and serial numbers"
            />

            <div className="space-y-6">
              <div className={cn(GRID_2_COL_CLASS, CARD_SECTION_CLASS)}>
                <FormField
                  type="text"
                  label="Serial Number"
                  id="serialNumber"
                  value={serialNumber}
                  onChange={setSerialNumber}
                  placeholder="e.g., SN123456789ABC"
                  hint="Product serial number from the label"
                  icon={IconSerialNumber}
                  required
                />

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

                <FormField
                  type="text"
                  label="Reward Amount"
                  id="rewardAmount"
                  value={`Rs. ${(selectedProduct?.reward || reward?.rewardAmount || 0).toLocaleString()}`}
                  onChange={() => {}}
                  disabled
                  hint="Based on product model"
                  icon={IconReward}
                />
              </div>

              {/* Inverter Serial Number - Only for battery products */}
              {isBatteryProduct && (
                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3 flex items-start gap-2">
                    <span className="text-lg">ℹ️</span>
                    <span>
                      <strong>Battery Installation:</strong> For battery
                      products, you must also provide the serial number of
                      the inverter that the battery is connected to.
                    </span>
                  </p>
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
                </div>
              )}
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

            <div className={cn(GRID_2_COL_CLASS, CARD_SECTION_CLASS)}>
              <FormField
                type="select"
                label="Payment Status"
                id="paymentStatus"
                value={paymentStatus}
                onChange={(value) => setPaymentStatus(value as PaymentStatus)}
                placeholder="Select status"
                hint="Current payment status"
                icon={IconBank}
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
                hint="Transaction ID for installer payment"
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
                />
              )}

              <FormField
                type="date"
                label="Sending Date"
                id="sendingDate"
                value={sendingDate}
                onChange={setSendingDate}
                hint="Date when payment was sent"
                icon={IconCalendar}
              />
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
                    <div>
                      <span className="text-muted-foreground">
                        Inverter Serial:
                      </span>
                      <p className="font-medium">
                        {inverterSerialNumber || "N/A"}
                      </p>
                    </div>
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
                        {paymentStatusOptions.find(
                          (o) => o.value === paymentStatus
                        )?.label}
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
            className={cn("flex justify-between items-center mt-6", CARD_SECTION_CLASS)}
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
  );
}
