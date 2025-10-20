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
import { CheckCircle2 } from "lucide-react";
import { StepHeader } from "@/components/StepHeader";
import { FormField } from "@/components/ui/form-field";
import { FormStep } from "@/components/ui/FormStep";
import { cn } from "@/lib/utils";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheckCircle,
} from "@/components/icons";
import IconAltArrowRight from "@/components/icons/AltArrowRight";
import IconAltArrowLeft from "@/components/icons/AltArrowLeft";

// Style constants
const CARD_SECTION_CLASS = "bg-card/30 border-border border p-6 rounded-3xl";
const GRID_2_COL_CLASS = "grid gap-6 md:grid-cols-2";

export default function NewRewardPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
        throw new Error(data.error || "Failed to register reward");
      }

      toast.success("Reward registered successfully!");
      router.push("/rewards");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
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
                    icon={IconCheckCircle}
                    title="Installer & Product Validation"
                    description="Verify installer code and product serial number"
                  />

                  <div
                    className={cn(
                      "text-card-foreground space-y-6",
                      CARD_SECTION_CLASS
                    )}
                  >
                    {/* Installer Code */}
                    <FormField
                      type="text"
                      label="Installer Code"
                      id="installer-code"
                      value={installerCode}
                      onChange={(value) =>
                        setInstallerCode(value.toUpperCase())
                      }
                      placeholder="e.g., INS001"
                      required
                    />

                    {installerValidating && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loading className="h-4 w-4" />
                        <span>Validating installer...</span>
                      </div>
                    )}

                    {installerData && (
                      <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                          <h3 className="font-medium text-green-900">
                            Installer Found
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-green-900">
                          <div>
                            <span className="text-muted-foreground">Name:</span>
                            <span className="ml-2 font-medium">
                              {installerData.fullName}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Code:</span>
                            <span className="ml-2 font-medium">
                              {installerData.installerCode}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">City:</span>
                            <span className="ml-2 font-medium">
                              {installerData.city}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Company:
                            </span>
                            <span className="ml-2 font-medium">
                              {installerData.companyName}
                            </span>
                          </div>
                          {installerData.referrer && (
                            <div className="col-span-2">
                              <span className="text-muted-foreground">
                                Referrer:
                              </span>
                              <span className="ml-2 font-medium text-blue-600">
                                {installerData.referrer.installerCode} -{" "}
                                {installerData.referrer.fullName}
                              </span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                (Will receive Rs. 500)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Serial Number - Only show after installer validation */}
                    {installerData && (
                      <>
                        <FormField
                          type="text"
                          label="Product Serial Number"
                          id="serial-number"
                          value={serialNumber}
                          onChange={(value) =>
                            setSerialNumber(value.toUpperCase())
                          }
                          placeholder="e.g., SN123456"
                          required
                        />

                        {serialValidating && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loading className="h-4 w-4" />
                            <span>Validating serial number...</span>
                          </div>
                        )}

                        {serialValid && !serialValidating && (
                          <div className="flex items-center gap-1 text-sm text-green-600">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Serial number is available</span>
                          </div>
                        )}
                      </>
                    )}
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
                <div className="space-y-4">
                  <StepHeader
                    icon={IconCheckCircle}
                    title="Review Details"
                    description="Verify all information before submitting"
                  />

                  <div className="space-y-4">
                    {/* Installer Information */}
                    <div className="rounded-2xl border p-4 bg-muted/50">
                      <h3 className="font-medium mb-3">
                        Installer Information
                      </h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Code:</span>
                          <span className="ml-2 font-medium">
                            {installerData?.installerCode}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <span className="ml-2 font-medium">
                            {installerData?.fullName}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Company:
                          </span>
                          <span className="ml-2 font-medium">
                            {installerData?.companyName}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">City:</span>
                          <span className="ml-2 font-medium">
                            {installerData?.city}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bank:</span>
                          <span className="ml-2 font-medium">
                            {installerData?.bankName}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Account:
                          </span>
                          <span className="ml-2 font-medium">
                            {installerData?.accountNumber}
                          </span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground">
                            Account Title:
                          </span>
                          <span className="ml-2 font-medium">
                            {installerData?.accountTitle}
                          </span>
                        </div>
                        {installerData?.referrer && (
                          <div className="col-span-2 pt-2 border-t border-border">
                            <span className="text-muted-foreground">
                              Referrer:
                            </span>
                            <span className="ml-2 font-medium text-blue-600">
                              {installerData.referrer.installerCode} -{" "}
                              {installerData.referrer.fullName}
                            </span>
                            <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Will receive Rs. 500
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Product Information */}
                    <div className="rounded-2xl border p-4 bg-muted/50">
                      <h3 className="font-medium mb-3">Product Information</h3>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Serial Number:
                          </span>
                          <span className="ml-2 font-medium">
                            {serialNumber}
                          </span>
                        </div>
                        {isBatteryProduct && (
                          <div>
                            <span className="text-muted-foreground">
                              Inverter Serial:
                            </span>
                            <span className="ml-2 font-medium">
                              {inverterSerialNumber}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">
                            Product Model:
                          </span>
                          <span className="ml-2 font-medium">
                            {productModel}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Installer Reward:
                          </span>
                          <span className="ml-2 font-medium text-green-600">
                            Rs. {rewardAmount.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Installation City:
                          </span>
                          <span className="ml-2 font-medium">
                            {cityOfInstallation}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <span className="ml-2 font-medium">
                            {serialNumberStatus}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Installation Date:
                          </span>
                          <span className="ml-2 font-medium">
                            {new Date().toLocaleDateString()} (Auto-generated)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Referral Reward Information */}
                    {installerData?.referrer && (
                      <div className="rounded-2xl bg-blue-50 border border-blue-200 p-4">
                        <h3 className="font-medium text-blue-900 mb-3">
                          Referral Reward
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-blue-700">
                              Referrer Code:
                            </span>
                            <span className="ml-2 font-medium text-blue-900">
                              {installerData.referrer.installerCode}
                            </span>
                          </div>
                          <div>
                            <span className="text-blue-700">
                              Referrer Name:
                            </span>
                            <span className="ml-2 font-medium text-blue-900">
                              {installerData.referrer.fullName}
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-blue-700">
                              Referral Reward Amount:
                            </span>
                            <span className="ml-2 font-bold text-green-600">
                              Rs. 500
                            </span>
                            <span className="ml-2 text-xs text-blue-600">
                              (Automatically credited for each product
                              registration)
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
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
                  className="gap-2 bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      Submitting
                      <Loading className="h-4 w-4 fill-background" />
                    </>
                  ) : (
                    "Submit Reward Registration"
                  )}
                </Button>
              )}
            </CardFooter>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
