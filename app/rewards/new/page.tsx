"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  PRODUCT_MODELS,
  SERIAL_STATUSES,
  CITIES,
  CITY_TO_PROVINCE,
  PROVINCES,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Loading from "@/components/ui/loading";
import { StepHeader } from "@/components/StepHeader";
import { FormField } from "@/components/ui/form-field";
import { FormStep } from "@/components/ui/FormStep";
import { cn } from "@/lib/utils";
import {
  IconCheckCircle,
  IconCity,
  IconCompany,
  IconInstallerCode,
  IconReferrer,
  IconReward,
  IconUser,
} from "@/components/icons";
import IconAltArrowRight from "@/components/icons/AltArrowRight";
import IconAltArrowLeft from "@/components/icons/AltArrowLeft";
import { ReviewStep } from "./ReviewStep";
import { RegistrationModal } from "./RegistrationModal";
import IconQRCode from "@/components/icons/QRCode";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HyperText } from "@/components/ui/hypertext";
import { ReviewItem } from "./ReviewItem";

interface ValidationError {
  path?: string[];
  message: string;
}

// Style constants
const CARD_SECTION_CLASS = "bg-card/30 border-border border p-6 rounded-3xl";
const GRID_2_COL_CLASS = "grid gap-6 md:grid-cols-2";

export default function NewRewardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Registration flow states
  const [registrationStatus, setRegistrationStatus] = useState<
    "idle" | "registering" | "success" | "error"
  >("idle");
  const [registeredReward, setRegisteredReward] = useState<{
    serialNumber: string;
    installerCode: string;
    rewardAmount: number;
    id?: string;
  } | null>(null);
  const [registrationError, setRegistrationError] = useState<string>("");

  // Step 1: Validation
  const [installerCode, setInstallerCode] = useState("");
  const [installerValidating, setInstallerValidating] = useState(false);
  const [installerData, setInstallerData] = useState<{
    _id: string;
    installerCode: string;
    fullName: string;
    referredBy?: string;
    city?: string;
    companyName?: string;
    bankName?: string;
    accountNumber?: string;
    accountTitle?: string;
    referrer?: {
      _id: string;
      installerCode: string;
      fullName: string;
    };
  } | null>(null);
  const [serialNumber, setSerialNumber] = useState("");
  const [serialValidating, setSerialValidating] = useState(false);
  const [serialValid, setSerialValid] = useState(false);

  // Step 1.5: Inverter Serial (moved to Step 2 for batteries)
  const [inverterSerialNumber, setInverterSerialNumber] = useState("");

  // Step 2: Product Details
  const [productModel, setProductModel] = useState("");
  const [cityOfInstallation, setCityOfInstallation] = useState("");
  const [serialNumberStatus, setSerialNumberStatus] = useState("");

  // Get selected product details
  const selectedProduct = PRODUCT_MODELS.find((p) => p.value === productModel);
  const rewardAmount = selectedProduct?.reward || 0;
  const isBatteryProduct = selectedProduct?.isBattery || false;

  // Debounced auto-validation for installer code
  const validateInstallerCode = useCallback(async (code: string) => {
    if (!code || code.length < 3) {
      setInstallerData(null);
      return;
    }

    setInstallerValidating(true);

    try {
      const response = await fetch(`/api/installers?search=${code}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error("Installer not found");
      }

      const installer = data.data.installers.find(
        (i: { installerCode: string }) =>
          i.installerCode.toUpperCase() === code.toUpperCase()
      );

      if (!installer) {
        throw new Error("Installer not found");
      }

      setInstallerData(installer);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to validate installer";
      toast.error(errorMsg);
      setInstallerData(null);
    } finally {
      setInstallerValidating(false);
    }
  }, []);

  // Debounced auto-validation for serial number
  const validateSerialNumber = useCallback(async (serial: string) => {
    if (!serial || serial.length < 3) {
      setSerialValid(false);
      return;
    }

    setSerialValidating(true);

    try {
      const response = await fetch(`/api/rewards?search=${serial}`);
      const data = await response.json();

      if (response.ok && data.success) {
        const exists = data.data.rewards.some(
          (r: { serialNumber: string }) =>
            r.serialNumber.toUpperCase() === serial.toUpperCase()
        );

        if (exists) {
          throw new Error("Serial number already exists in the system");
        }
      }

      setSerialValid(true);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to validate serial number";
      toast.error(errorMsg);
      setSerialValid(false);
    } finally {
      setSerialValidating(false);
    }
  }, []);

  // Debounce installer code validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (installerCode) {
        validateInstallerCode(installerCode);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [installerCode, validateInstallerCode]);

  // Debounce serial number validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (serialNumber && installerData) {
        validateSerialNumber(serialNumber);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [serialNumber, installerData, validateSerialNumber]);

  const handleStep1Next = () => {
    if (!installerData) {
      toast.error("Please validate installer code first");
      return;
    }
    if (!serialValid) {
      toast.error("Please validate serial number first");
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    if (!productModel || !cityOfInstallation || !serialNumberStatus) {
      toast.error("Please fill all required fields");
      return;
    }
    if (isBatteryProduct && !inverterSerialNumber) {
      toast.error("Please enter inverter serial number for battery product");
      return;
    }
    setCurrentStep(3);
  };

  // Check if Step 1 is complete
  const isStep1Complete = installerData && serialValid;

  // Check if Step 2 is complete
  const isStep2Complete =
    productModel &&
    cityOfInstallation &&
    serialNumberStatus &&
    (!isBatteryProduct || inverterSerialNumber);

  const handleSubmit = async () => {
    if (!installerData) {
      toast.error("Please validate installer code first");
      return;
    }

    setLoading(true);
    setRegistrationStatus("registering");

    try {
      // Get current date and time as installation date
      const currentDate = new Date().toISOString();

      const response = await fetch("/api/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installerCode: installerData.installerCode,
          serialNumber,
          inverterSerialNumber: isBatteryProduct ? inverterSerialNumber : "N/A",
          productModel,
          cityOfInstallation,
          serialNumberStatus,
          rewardAmount,
          installationDate: currentDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Failed to register reward";
        if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors
            .map((err: ValidationError) => {
              const field = err.path?.join(".") || "Unknown field";
              return `${field}: ${err.message}`;
            })
            .join("\n");
        } else if (data.error) {
          errorMessage = data.error;
        }
        setRegistrationError(errorMessage);
        setRegistrationStatus("error");
        return;
      }

      // Success
      setRegisteredReward({
        serialNumber,
        installerCode: installerData.installerCode,
        rewardAmount,
        id: data.data?._id,
      });
      setRegistrationStatus("success");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      setRegistrationError(errorMsg);
      setRegistrationStatus("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRedirectAfterRegistration = () => {
    // Reset form
    setCurrentStep(1);
    setInstallerCode("");
    setInstallerData(null);
    setSerialNumber("");
    setSerialValid(false);
    setProductModel("");
    setCityOfInstallation("");
    setSerialNumberStatus("");
    setInverterSerialNumber("");
    setRegistrationStatus("idle");
    setRegisteredReward(null);
    setRegistrationError("");
  };

  const handleViewReward = () => {
    if (registeredReward?.id) {
      router.push(`/rewards/${registeredReward.id}`);
    }
  };

  const steps = [
    { number: 1, title: "Validation" },
    { number: 2, title: "Product Details" },
    { number: 3, title: "Review" },
  ];

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card>
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

          <CardContent>
            <div className="space-y-6">
              {/* Step 1: Validation */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <StepHeader
                    icon={IconQRCode}
                    title="Installer & Product Validation"
                    description="Verify installer code and product serial number"
                  />

                  <div
                    className={cn(
                      "text-card-foreground space-y-6",
                      CARD_SECTION_CLASS
                    )}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="cnic" className="block">
                        Installer Code{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="installer-code"
                          type="text"
                          value={installerCode}
                          onChange={(e) =>
                            setInstallerCode(e.target.value.toUpperCase())
                          }
                          placeholder="e.g., PEWNADOEC3"
                          required
                          className={`pr-10 `}
                        />

                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {!installerValidating && installerData && (
                            <HyperText className="tracking-widest leading-none text-xs uppercase text-success-text pointer-events-none select-none">
                              Valid
                            </HyperText>
                          )}
                          {!installerValidating && !installerData && (
                            <HyperText className="tracking-widest text-xs uppercase text-destructive-text pointer-events-none select-none">
                              Invalid
                            </HyperText>
                          )}
                          {installerValidating && !installerData && (
                            <Loading className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      {!installerValidating && installerData === null && (
                        <div className="text-sm text-destructive-text">
                          Installer not found
                        </div>
                      )}

                      {installerData && (
                        <div className="rounded-2xl border border-border p-4">
                          <div className="col-span-2 text-primary flex items-center gap-2 py-2 rounded-2xl">
                            <div className="dark:bg-background bg-muted p-2.5 rounded-xl">
                              <IconUser
                                className="size-4"
                                fill
                                duotone={false}
                              />{" "}
                            </div>
                            Installer
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            <ReviewItem
                              label="Installer Name"
                              value={installerData.fullName}
                              valueClass="font-mono tracking-wide"
                              isHighlighted={true}
                              icon={
                                <IconUser
                                  duotone={false}
                                  className="h-3.5 w-3.5 text-muted-foreground/90"
                                />
                              }
                            />
                            <ReviewItem
                              label="Installer Code"
                              value={installerData.installerCode}
                              valueClass="font-mono tracking-wide"
                              isHighlighted={true}
                              icon={
                                <IconInstallerCode
                                  duotone={false}
                                  className="h-3.5 w-3.5 text-muted-foreground/90"
                                />
                              }
                            />
                            <ReviewItem
                              label="Installer Code"
                              value={installerData.city as string}
                              isHighlighted={true}
                              valueClass="font-mono tracking-wide"
                              icon={
                                <IconCity
                                  duotone={false}
                                  className="h-3.5 w-3.5 text-muted-foreground/90"
                                />
                              }
                            />
                            {installerData.companyName && (
                              <ReviewItem
                                label="Company Name"
                                value={installerData.companyName as string}
                                valueClass="font-mono tracking-wide"
                                isHighlighted={true}
                                icon={
                                  <IconCompany
                                    duotone={false}
                                    className="h-3.5 w-3.5 text-muted-foreground/90"
                                  />
                                }
                              />
                            )}

                            {installerData.referrer && (
                              <>
                                <div className="col-span-2 text-primary flex items-center gap-2 rounded-2xl">
                                  <div className="dark:bg-background bg-muted p-2.5 rounded-xl">
                                    <IconReferrer
                                      className="size-4"
                                      fill
                                      duotone={false}
                                    />{" "}
                                  </div>
                                  Referrer Installer
                                </div>
                                <ReviewItem
                                  label="Referrer"
                                  value={`${installerData.referrer.installerCode} - ${installerData.referrer.fullName}`}
                                  valueClass="font-mono tracking-wide"
                                  isHighlighted={true}
                                  icon={
                                    <IconReferrer
                                      duotone={false}
                                      className="h-3.5 w-3.5 text-muted-foreground/90"
                                    />
                                  }
                                />
                                <ReviewItem
                                  label="Referrer Reward"
                                  value={`500`}
                                  valueClass="font-mono tracking-wide"
                                  isHighlighted={true}
                                  icon={
                                    <IconReward
                                      duotone={false}
                                      className="h-3.5 w-3.5 text-muted-foreground/90"
                                    />
                                  }
                                />
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Serial Number - Only show after installer validation */}
                      {installerData && (
                        <div className="relative">
                          <Input
                            id="serial-number"
                            type="text"
                            value={serialNumber}
                            onChange={(e) =>
                              setSerialNumber(e.target.value.toUpperCase())
                            }
                            placeholder="e.g., SN123456"
                            required
                            aria-label="Product Serial Number"
                            className={`pr-10 `}
                          />

                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {serialValidating && (
                              <Loading className="h-4 w-4" />
                            )}
                            {serialValid && !serialValidating && (
                              <HyperText className="tracking-widest leading-none text-xs uppercase text-success-text pointer-events-none select-none">
                                Valid
                              </HyperText>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Product Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <StepHeader
                    icon={IconCheckCircle}
                    title="Product & Installation Details"
                    description="Enter product model and installation information"
                  />

                  <div
                    className={cn(
                      "text-card-foreground space-y-6",
                      CARD_SECTION_CLASS
                    )}
                  >
                    <div className={GRID_2_COL_CLASS}>
                      {/* Product Model */}
                      <FormField
                        type="select"
                        label="Product Model"
                        id="product-model"
                        value={productModel}
                        onChange={setProductModel}
                        placeholder="Select Product Model"
                        options={PRODUCT_MODELS.map((model) => ({
                          value: model.value,
                          label: `${
                            model.label
                          } - Rs. ${model.reward.toLocaleString()}`,
                        }))}
                        searchable
                        searchPlaceholder="Search products..."
                        required
                      />

                      {/* Reward Amount (Auto-calculated) */}
                      <FormField
                        type="text"
                        label="Reward Amount"
                        id="reward-amount"
                        value={`Rs. ${rewardAmount.toLocaleString()}`}
                        onChange={() => {}}
                        disabled
                      />

                      {/* City of Installation */}
                      <FormField
                        type="select"
                        label="City of Installation"
                        id="city"
                        value={cityOfInstallation}
                        onChange={setCityOfInstallation}
                        placeholder="Select City"
                        groups={PROVINCES.map((province) => ({
                          label: province,
                          options: CITIES.filter(
                            (c) => CITY_TO_PROVINCE[c] === province
                          )
                            .sort()
                            .map((c) => ({
                              value: c,
                              label: (
                                <div className="flex items-end gap-2">
                                  {c}
                                  <p className="text-muted-foreground text-[10px]">
                                    {province}
                                  </p>
                                </div>
                              ),
                            })),
                        }))}
                        searchable
                        searchPlaceholder="Search cities..."
                        emptyMessage="No city found."
                        required
                      />

                      {/* Serial Number Status */}
                      <FormField
                        type="select"
                        label="Serial Number Status"
                        id="serial-status"
                        value={serialNumberStatus}
                        onChange={setSerialNumberStatus}
                        placeholder="Select Status"
                        options={SERIAL_STATUSES.map((status) => ({
                          value: status.value,
                          label: status.label,
                        }))}
                        required
                      />
                    </div>

                    {/* Inverter Serial Number - Only for battery products */}
                    {isBatteryProduct && (
                      <FormField
                        type="text"
                        label="Inverter Serial Number"
                        id="inverter-serial"
                        value={inverterSerialNumber}
                        onChange={(value) =>
                          setInverterSerialNumber(value.toUpperCase())
                        }
                        placeholder="e.g., INV123456"
                        required
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 3 && (
                <ReviewStep
                  serialNumber={serialNumber}
                  inverterSerialNumber={inverterSerialNumber}
                  isBatteryProduct={isBatteryProduct}
                  productModel={productModel}
                  rewardAmount={rewardAmount}
                  cityOfInstallation={cityOfInstallation}
                  serialNumberStatus={serialNumberStatus}
                  installerData={installerData}
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <CardFooter
              className={cn(
                "flex justify-between items-center my-6",
                CARD_SECTION_CLASS
              )}
            >
              <Button
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1}
                variant="outline"
                className="gap-1"
              >
                <IconAltArrowLeft
                  width={2}
                  className="size-4"
                  duotone={false}
                />
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={
                    currentStep === 1 ? handleStep1Next : handleStep2Next
                  }
                  disabled={
                    (currentStep === 1 && !isStep1Complete) ||
                    (currentStep === 2 && !isStep2Complete)
                  }
                  className="gap-1"
                >
                  Next
                  <IconAltArrowRight
                    width={2}
                    className="size-4"
                    duotone={false}
                  />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      Submitting
                      <Loading className="h-4 w-4 fill-background" />
                    </>
                  ) : (
                    "Register Reward"
                  )}
                </Button>
              )}
            </CardFooter>
          </CardContent>
        </Card>

        {/* Registration Modal */}
        {registrationStatus !== "idle" && (
          <RegistrationModal
            open={true}
            onOpenChange={(open) => {
              if (!open) {
                setRegistrationStatus("idle");
              }
            }}
            status={registrationStatus}
            serialNumber={registeredReward?.serialNumber}
            installerCode={registeredReward?.installerCode}
            rewardAmount={registeredReward?.rewardAmount}
            errorMessage={registrationError}
            onRedirect={handleRedirectAfterRegistration}
            onViewReward={handleViewReward}
          />
        )}
      </div>
    </div>
  );
}
