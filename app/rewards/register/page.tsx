"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  SERIAL_STATUSES,
  CITIES,
  CITY_TO_PROVINCE,
  PROVINCES,
} from "@/lib/constants";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import Loading from "@/components/ui/loading";
import { StepHeader } from "@/components/StepHeader";
import { FormField } from "@/components/ui/form-field";
import { FormStep } from "@/components/ui/FormStep";
import { cn } from "@/lib/utils";
import {
  IconCity,
  IconCompany,
  IconInstallerCode,
  IconProduct,
  IconReferrer,
  IconReward,
  IconSerialNumber,
  IconUser,
  IconAltArrowLeft,
  IconAltArrowRight,
  IconQRCode,
  IconLayer,
} from "@/components/icons";
import { ReviewStep } from "./ReviewStep";
import { RegistrationModal } from "./RegistrationModal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { HyperText } from "@/components/ui/hypertext";
import { ReviewItem } from "./ReviewItem";
import PageHeader from "@/components/PageHeader";
import {
  CARD_SECTION_CLASS,
  GRID_2_COL_CLASS,
} from "@/lib/registration-styles";

interface ValidationError {
  path?: string[];
  message: string;
}

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
  const [installerTouched, setInstallerTouched] = useState(false);
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
  const [serialTouched, setSerialTouched] = useState(false);
  const [serialValid, setSerialValid] = useState(false);

  // Step 1.5: Inverter Serial (moved to Step 2 for batteries)
  const [inverterSerialNumber, setInverterSerialNumber] = useState("");

  // Step 2: Product Details
  const [productModel, setProductModel] = useState("");
  const [cityOfInstallation, setCityOfInstallation] = useState("");
  const [serialNumberStatus, setSerialNumberStatus] = useState("");

  const { data: products = [] } = useProducts();

  // Memoize selected product details to avoid recalculation
  const selectedProduct = useMemo(
    () => products.find((p) => p.value === productModel),
    [products, productModel]
  );
  const rewardAmount = selectedProduct?.reward || 0;
  const isBatteryProduct =
    (selectedProduct?.isBattery && selectedProduct?.requiresInverter) || false;

  // Memoize product groups for select dropdown (expensive calculation)
  const productGroups = useMemo(() => {
    const map = new Map<string, typeof products>();

    for (const m of products) {
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
  }, [products]);

  // Memoize city groups for select dropdown
  const cityGroups = useMemo(
    () =>
      PROVINCES.map((province) => ({
        label: province,
        options: CITIES.filter((c) => CITY_TO_PROVINCE[c] === province)
          .sort()
          .map((c) => ({
            value: c,
            label: (
              <div className="flex items-end gap-2">
                {c}
                <p className="text-muted-foreground text-[10px]">{province}</p>
              </div>
            ),
          })),
      })),
    []
  );

  // Memoize serial status options
  const serialStatusOptions = useMemo(
    () =>
      SERIAL_STATUSES.map((status) => ({
        value: status.value,
        label: status.label,
      })),
    []
  );

  // Check if form has data (for unsaved changes warning)
  const hasFormData = useMemo(() => {
    return (
      installerCode.trim() !== "" ||
      serialNumber.trim() !== "" ||
      productModel !== "" ||
      cityOfInstallation !== "" ||
      serialNumberStatus !== "" ||
      inverterSerialNumber.trim() !== ""
    );
  }, [
    installerCode,
    serialNumber,
    productModel,
    cityOfInstallation,
    serialNumberStatus,
    inverterSerialNumber,
  ]);

  // Protect against accidental page reload/navigation
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasFormData && registrationStatus === "idle") {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasFormData, registrationStatus]);

  // Optimized validation for installer code
  const validateInstallerCode = useCallback(async (code: string) => {
    // Early return for empty or too short codes
    if (!code || code.length < 3) {
      setInstallerData(null);
      setInstallerValidating(false);
      return;
    }

    setInstallerValidating(true);
    setInstallerTouched(true);

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

  // Optimized validation for serial number using dedicated check-serial endpoint
  const validateSerialNumber = useCallback(async (serial: string) => {
    // Early return for empty or too short serials
    if (!serial || serial.length < 3) {
      setSerialValid(false);
      setSerialValidating(false);
      return;
    }

    setSerialValidating(true);
    setSerialTouched(true);

    try {
      const response = await fetch(
        `/api/rewards/check-serial?serialNumber=${encodeURIComponent(serial)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to validate serial number");
      }

      if (data.data.exists) {
        throw new Error("Serial number already exists in the system");
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

  // Memoize step completion checks
  const isStep1Complete = useMemo(
    () => installerData !== null && serialValid,
    [installerData, serialValid]
  );

  const isStep2Complete = useMemo(
    () =>
      productModel !== "" &&
      cityOfInstallation !== "" &&
      serialNumberStatus !== "" &&
      (!isBatteryProduct || inverterSerialNumber !== ""),
    [
      productModel,
      cityOfInstallation,
      serialNumberStatus,
      isBatteryProduct,
      inverterSerialNumber,
    ]
  );

  // Optimize navigation handlers with useCallback
  const handleStep1Next = useCallback(() => {
    if (!installerData) {
      toast.error(
        "Installer code not verified. Please enter a valid installer code and wait for the green 'Valid' indicator."
      );
      return;
    }
    if (!serialValid) {
      toast.error(
        "Product serial number not verified. Please enter a unique serial number that hasn't been registered before."
      );
      return;
    }
    setCurrentStep(2);
  }, [installerData, serialValid]);

  const handleStep2Next = useCallback(() => {
    if (!productModel || !cityOfInstallation || !serialNumberStatus) {
      toast.error(
        "Please complete all fields: Product Model, City of Installation, and Serial Number Status are required."
      );
      return;
    }
    if (isBatteryProduct && !inverterSerialNumber) {
      toast.error(
        "Battery products require Inverter Serial Number. Please enter the serial number of the inverter used."
      );
      return;
    }
    setCurrentStep(3);
  }, [
    productModel,
    cityOfInstallation,
    serialNumberStatus,
    isBatteryProduct,
    inverterSerialNumber,
  ]);

  const handleSubmit = useCallback(async () => {
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

      // Small delay to ensure smooth transition to 100%
      // This allows the progress bar to complete visually before switching screens
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (!response.ok) {
        let errorMessage = "Failed to register reward";

        // Handle validation errors array
        if (data.errors && Array.isArray(data.errors)) {
          const formattedErrors = data.errors.map((err: ValidationError) => {
            const field = err.path?.join(".") || "Unknown field";
            // Make field names more readable
            const readableField = field
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())
              .trim();
            return `• ${readableField}: ${err.message}`;
          });
          errorMessage = formattedErrors.join("\n");
        }
        // Handle single error message
        else if (data.error) {
          errorMessage = data.error;
        }
        // Handle message field
        else if (data.message) {
          errorMessage = data.message;
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
      // Handle network errors and other exceptions
      let errorMsg = "Network error: Unable to connect to the server";

      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === "string") {
        errorMsg = err;
      }

      // Make the error message more user-friendly
      if (errorMsg.includes("fetch")) {
        errorMsg =
          "Network error: Please check your internet connection and try again";
      }

      setRegistrationError(errorMsg);
      setRegistrationStatus("error");
    } finally {
      setLoading(false);
    }
  }, [
    installerData,
    serialNumber,
    isBatteryProduct,
    inverterSerialNumber,
    productModel,
    cityOfInstallation,
    serialNumberStatus,
    rewardAmount,
  ]);

  const handleRedirectAfterRegistration = useCallback(() => {
    // Reset form
    setCurrentStep(1);
    setInstallerCode("");
    setInstallerData(null);
    setInstallerTouched(false);
    setSerialNumber("");
    setSerialValid(false);
    setSerialTouched(false);
    setProductModel("");
    setCityOfInstallation("");
    setSerialNumberStatus("");
    setInverterSerialNumber("");
    setRegistrationStatus("idle");
    setRegisteredReward(null);
    setRegistrationError("");
  }, []);

  const handleViewReward = useCallback(() => {
    if (registeredReward?.id) {
      router.push(`/rewards/${registeredReward.id}`);
    }
  }, [registeredReward, router]);

  // Memoize steps array to prevent recreating on every render
  const steps = useMemo(
    () => [
      { number: 1, title: "Validation" },
      { number: 2, title: "Product Details" },
      { number: 3, title: "Review" },
    ],
    []
  );

  return (
    <>
      <PageHeader
        title="Register Product"
        Icon={IconReward}
        iconFill
        description="Register a new product for Rewards to the Installer Program"
        action={
          <Button
            onClick={() => router.push("/rewards/bulk-register")}
            variant="outline"
            disabled={loading}
            title="Bulk Register"
            className="gap-2"
          >
            Bulk Register
            <IconLayer width={2} />
          </Button>
        }
      />

      <Card className="mt-4">
        <div className="max-w-4xl mx-auto">
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
                    description="Enter the installer code and product serial number. The system will automatically verify if they are valid and not already registered."
                  />

                  <div
                    className={cn(
                      "text-card-foreground space-y-6",
                      CARD_SECTION_CLASS
                    )}
                  >
                    <div className="space-y-2">
                      <Label htmlFor="installer-code" className="block">
                        Installer Code{" "}
                        <span className="text-destructive-text">*</span>
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Enter the unique installer code (10 characters). Wait
                        for green &ldquo;Valid&rdquo; indicator.
                      </p>
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
                          className={`pl-10`}
                          aria-label="Installer unique code for identification"
                          aria-required="true"
                          aria-describedby="installer-code-hint"
                        />
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <IconInstallerCode />
                        </div>

                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          {installerValidating && <Loading />}
                          {!installerValidating && installerData && (
                            <HyperText className="tracking-widest leading-none text-xs uppercase text-success-text pointer-events-none select-none">
                              Valid
                            </HyperText>
                          )}
                          {!installerValidating &&
                            installerTouched &&
                            !installerData &&
                            installerCode.length >= 3 && (
                              <HyperText className="tracking-widest text-xs uppercase text-destructive-text pointer-events-none select-none">
                                Invalid
                              </HyperText>
                            )}
                        </div>
                      </div>
                      {!installerValidating &&
                        installerTouched &&
                        installerData === null &&
                        installerCode.length >= 3 && (
                          <div className="text-sm text-destructive-text bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                            <strong>Installer not found.</strong> Please check:
                            <ul className="list-disc list-inside mt-1 ml-2 space-y-0.5">
                              <li>Code is exactly 10 characters</li>
                              <li>
                                Code is spelled correctly (case-sensitive)
                              </li>
                              <li>Installer is registered in the system</li>
                            </ul>
                          </div>
                        )}
                    </div>

                    {installerData && (
                      <div className="rounded-2xl border border-border p-4">
                        <div className="col-span-2 text-primary flex items-center gap-2 py-2 rounded-2xl">
                          <div className="dark:bg-background bg-muted p-2.5 rounded-xl">
                            <IconUser fill />
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
                              <IconUser className="h-3.5 w-3.5 text-muted-foreground/90" />
                            }
                          />
                          <ReviewItem
                            label="Installer Code"
                            value={installerData.installerCode}
                            valueClass="font-mono tracking-wide"
                            isHighlighted={true}
                            icon={
                              <IconInstallerCode className="h-3.5 w-3.5 text-muted-foreground/90" />
                            }
                          />
                          <ReviewItem
                            label="Installer Code"
                            value={installerData.city as string}
                            isHighlighted={true}
                            valueClass="font-mono tracking-wide"
                            icon={
                              <IconCity className="h-3.5 w-3.5 text-muted-foreground/90" />
                            }
                          />
                          {installerData.companyName && (
                            <ReviewItem
                              label="Company Name"
                              value={installerData.companyName as string}
                              valueClass="font-mono tracking-wide"
                              isHighlighted={true}
                              icon={
                                <IconCompany className="h-3.5 w-3.5 text-muted-foreground/90" />
                              }
                            />
                          )}

                          {installerData.referrer && (
                            <>
                              <div className="col-span-2 text-primary flex items-center gap-2 rounded-2xl">
                                <div className="dark:bg-background bg-muted p-2.5 rounded-xl">
                                  <IconReferrer fill />{" "}
                                </div>
                                Referrer Installer
                              </div>
                              <ReviewItem
                                label="Referrer"
                                value={`${installerData.referrer.installerCode} - ${installerData.referrer.fullName}`}
                                valueClass="font-mono tracking-wide"
                                isHighlighted={true}
                                icon={
                                  <IconReferrer className="h-3.5 w-3.5 text-muted-foreground/90" />
                                }
                              />
                              <ReviewItem
                                label="Referrer Reward"
                                value={`500`}
                                valueClass="font-mono tracking-wide"
                                isHighlighted={true}
                                icon={
                                  <IconReward className="h-3.5 w-3.5 text-muted-foreground/90" />
                                }
                              />
                            </>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Serial Number - Only show after installer validation */}
                    {installerData && (
                      <div className="space-y-2">
                        <Label htmlFor="serial-number" className="block">
                          Product Serial Number{" "}
                          <span className="text-destructive-text">*</span>
                        </Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Enter the unique serial number from the product label.
                          This number must not be registered before.
                        </p>
                        <div className="relative">
                          <Input
                            id="serial-number"
                            type="text"
                            value={serialNumber}
                            onChange={(e) =>
                              setSerialNumber(e.target.value.toUpperCase())
                            }
                            placeholder="e.g., SN123456789ABC"
                            required
                            aria-label="Unique product serial number from label"
                            aria-required="true"
                            aria-describedby="serial-number-hint"
                            className={`pl-10`}
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            <IconSerialNumber />
                          </div>

                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {serialValidating && <Loading />}
                            {!serialValidating && serialValid && (
                              <HyperText className="tracking-widest leading-none text-xs uppercase text-success-text pointer-events-none select-none">
                                Valid
                              </HyperText>
                            )}
                            {!serialValidating &&
                              serialTouched &&
                              !serialValid &&
                              serialNumber.length >= 3 && (
                                <HyperText className="tracking-widest text-xs uppercase text-destructive-text pointer-events-none select-none">
                                  Invalid
                                </HyperText>
                              )}
                          </div>
                        </div>
                        {!serialValidating &&
                          serialTouched &&
                          !serialValid &&
                          serialNumber.length >= 3 && (
                            <div className="text-sm text-destructive-text bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                              <strong>
                                Serial number already registered or invalid.
                              </strong>
                              <p className="mt-1">
                                This serial number is already in the system.
                                Each product can only be registered once. Please
                                check the serial number or contact support if
                                you believe this is an error.
                              </p>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Product Details */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <StepHeader
                    icon={IconProduct}
                    title="Product & Installation Details"
                    description="Select the product model, installation city, and product condition. For battery products, inverter serial number is also required."
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
                        placeholder="Choose the installed product"
                        hint="Select the exact model of inverter or battery that was installed"
                        groups={productGroups}
                        searchable
                        searchPlaceholder="Type to search products..."
                        required
                        aria-label="Product model selection"
                        aria-required="true"
                      />

                      {/* Reward Amount (Auto-calculated) */}
                      <FormField
                        type="text"
                        label="Reward Amount"
                        id="reward-amount"
                        value={`Rs. ${rewardAmount.toLocaleString()}`}
                        hint="Automatically calculated based on selected product"
                        onChange={() => {}}
                        disabled
                        aria-label="Reward amount in Pakistani Rupees"
                        aria-readonly="true"
                      />

                      {/* City of Installation */}
                      <FormField
                        type="select"
                        label="City of Installation"
                        id="city"
                        value={cityOfInstallation}
                        onChange={setCityOfInstallation}
                        placeholder="Select installation city"
                        hint="City where the product was installed at customer location"
                        groups={cityGroups}
                        searchable
                        searchPlaceholder="Type city name..."
                        emptyMessage="City not found. Please try another spelling."
                        required
                        aria-label="City where product was installed"
                        aria-required="true"
                      />

                      {/* Serial Number Status */}
                      <FormField
                        type="select"
                        label="Serial Number Status"
                        id="serial-status"
                        value={serialNumberStatus}
                        onChange={setSerialNumberStatus}
                        placeholder="Select product condition"
                        hint="Choose the condition of the product serial number label"
                        options={serialStatusOptions}
                        required
                        aria-label="Product serial number label condition"
                        aria-required="true"
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
                          id="inverter-serial"
                          value={inverterSerialNumber}
                          onChange={(value) =>
                            setInverterSerialNumber(value.toUpperCase())
                          }
                          placeholder="e.g., INV987654321XYZ"
                          hint="Enter the serial number of the inverter connected to this battery"
                          required
                          aria-label="Serial number of connected inverter"
                          aria-required="true"
                          aria-describedby="inverter-serial-help"
                        />
                      </div>
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
                <IconAltArrowLeft width={2} />
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
                  <IconAltArrowRight width={2} />
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
                      <Loading className="fill-background" />
                    </>
                  ) : (
                    "Register Reward"
                  )}
                </Button>
              )}
            </CardFooter>
          </CardContent>

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
      </Card>
    </>
  );
}
