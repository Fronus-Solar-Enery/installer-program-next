"use client";

import { useState, useEffect } from "react";
import {
  CITIES,
  CITY_TO_PROVINCE,
  TRAINING_CENTER,
  BANKS,
  PROVINCES,
} from "@/lib/constants";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HyperText } from "@/components/ui/hypertext";
import { FormField } from "@/components/ui/form-field";
import { useCNICValidation } from "@/hooks/useCNICValidation";
import { useReferrerValidation } from "@/hooks/useReferrerValidation";
import { useInstallerCodeGeneration } from "@/hooks/useInstallerCodeGeneration";
import { usePhoneInput } from "@/hooks/usePhoneInput";
import { phoneNumberToDBFormat } from "@/lib/validation-helpers";
import {
  IconBank,
  IconBuildings,
  IconCity,
  IconLocation,
  IconMapPoint,
  IconShieldMinimalistic,
  IconShieldStar,
  IconStar,
  IconTeacher,
  IconUserHeartRounded,
  IconUserOctagon,
  IconAltArrowRight,
  IconAltArrowLeft,
} from "@/components/icons";
import Loading from "@/components/ui/loading";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/getInitials";
import { useRelativeTime } from "@/lib/getRelativeTime";
import { useClipboard } from "@/hooks/useCopyToClipboard";
import { StepHeader } from "@/components/StepHeader";
import { CNICInput } from "@/app/installers/new/CNICInput";
import { InstallerCodeDisplay } from "@/app/installers/new/InstallerCodeDisplay";
import { FormStep } from "@/components/ui/FormStep";
import { ReviewStep } from "./ReviewStep";
import { RegistrationModal } from "@/app/installers/new/RegistrationModal";

interface Settings {
  allowInstallerCodeEdit?: boolean;
}

interface ValidationError {
  path?: string[];
  message: string;
}

// Style constants
const CARD_SECTION_CLASS = "bg-card/30 border-border border p-6 rounded-3xl";
const GRID_2_COL_CLASS = "grid gap-6 md:grid-cols-2";

export default function NewInstallerPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Registration flow states
  const [registrationStatus, setRegistrationStatus] = useState<
    "idle" | "registering" | "success" | "error"
  >("idle");
  const [registeredInstaller, setRegisteredInstaller] = useState<{
    code: string;
    name: string;
    id?: string;
  } | null>(null);
  const [registrationError, setRegistrationError] = useState<string>("");

  const { copyToClipboard, copied } = useClipboard();

  // Custom hooks
  const {
    cnic,
    cnicDisplay,
    cnicChecked,
    cnicValidating,
    cnicError,
    handleCNICChange,
  } = useCNICValidation();

  const {
    referrerCode,
    referrerValidating,
    referrerData,
    referrerError,
    handleReferrerChange,
  } = useReferrerValidation();

  // Step 1 - Basic Info
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(true);

  // Phone input with debounce and auto-masking
  const phoneInput = usePhoneInput(setPhoneNumber, { debounceMs: 300 });
  const whatsappInput = usePhoneInput(setWhatsappNumber, { debounceMs: 300 });

  // Step 2 - Location & Training
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");
  const [trainingCenter, setTrainingCenter] = useState("");

  const {
    installerCode,
    codeGenerating,
    codeValidating,
    codeError,
    codeValid,
    handleInstallerCodeChange,
  } = useInstallerCodeGeneration(
    trainingCenter,
    settings?.allowInstallerCodeEdit || false
  );

  const installerCodeAutoGen = !settings?.allowInstallerCodeEdit;

  // Step 3 - Banking Details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [sameAsName, setSameAsName] = useState(true);

  // Digital payment account number with debounce and auto-masking
  const accountNumberInput = usePhoneInput(setAccountNumber, {
    debounceMs: 300,
  });

  // Step 4 - Additional Info
  const [certified, setCertified] = useState(false);
  const [companyName, setCompanyName] = useState("");

  // Load settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        const data = await response.json();
        if (data.success) {
          setSettings(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };
    fetchSettings();
  }, []);

  // Auto-sync effects
  useEffect(() => {
    if (sameAsPhone) {
      setWhatsappNumber(phoneNumber);
      whatsappInput.setValue(phoneInput.value);
    }
  }, [sameAsPhone, phoneNumber, phoneInput.value, whatsappInput]);

  useEffect(() => {
    if (sameAsName) setAccountTitle(fullName);
  }, [sameAsName, fullName]);

  useEffect(() => {
    if (city) {
      const cityProvince = CITY_TO_PROVINCE[city];
      if (cityProvince) setProvince(cityProvince);
    }
  }, [city]);

  // Validation
  const isStep1Valid = () => {
    const phoneDigits = phoneNumber.replace(/\D/g, "");
    const whatsappDigits = whatsappNumber.replace(/\D/g, "");
    return (
      cnicChecked &&
      cnic.length === 13 &&
      !cnicError &&
      fullName.trim() &&
      phoneDigits.length === 11 &&
      phoneDigits.startsWith("03") &&
      whatsappDigits.length === 11 &&
      whatsappDigits.startsWith("03")
    );
  };

  const isStep2Valid = () => {
    if (!city || !address.trim() || !trainingCenter || !installerCode.trim()) {
      return false;
    }
    // For manual edit mode, code must be valid
    if (!installerCodeAutoGen) {
      return codeValid && !codeError;
    }
    // For auto-generated mode, just check if code exists
    return true;
  };

  const isStep3Valid = () => {
    if (!bankName || !accountTitle.trim()) return false;
    const selectedBank = BANKS.find((b) => b.value === bankName);
    const isDigital = selectedBank?.mobile || false;
    if (isDigital) {
      const accountDigits = accountNumber.replace(/\D/g, "");
      return accountDigits.length === 11 && accountDigits.startsWith("03");
    }
    return accountNumber.trim().length > 0;
  };

  const isStep4Valid = () => {
    if (referrerCode.trim() && !referrerData && !referrerError) return false;
    if (referrerError) return false;
    return true;
  };

  // Navigation
  const handleNext = () => {
    if (currentStep === 1 && !isStep1Valid()) {
      toast.error("Please fill all required fields correctly");
      return;
    }
    if (currentStep === 2 && !isStep2Valid()) {
      toast.error("Please fill all required fields");
      return;
    }
    if (currentStep === 3 && !isStep3Valid()) {
      toast.error("Please fill all banking details correctly");
      return;
    }
    if (currentStep === 4 && !isStep4Valid()) {
      toast.error("Please verify the referrer code or leave it empty");
      return;
    }
    setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => setCurrentStep(currentStep - 1);

  const handleSubmit = async () => {
    setLoading(true);
    setRegistrationStatus("registering");

    // Calculate minimum progress time (sum of all step durations)
    const minProgressTime = 800 + 700 + 1000 + 600; // 3100ms total
    const startTime = Date.now();

    try {
      // Use the hook values (which are already masked) for conversion
      const payload = {
        installerCode,
        fullName,
        cnic: cnicDisplay,
        phoneNumber: phoneNumberToDBFormat(phoneInput.value || phoneNumber),
        whatsappNumber: phoneNumberToDBFormat(
          whatsappInput.value || whatsappNumber
        ),
        address,
        city,
        province,
        trainingCenter,
        companyName,
        bankName,
        accountNumber: isDigitalPayment
          ? phoneNumberToDBFormat(accountNumberInput.value || accountNumber)
          : accountNumber,
        accountTitle,
        certified,
        referrerCode: referrerCode.trim() || undefined,
      };

      const response = await fetch("/api/installers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      // Calculate elapsed time and wait for remaining progress time
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minProgressTime - elapsed);

      // Wait for remaining time to ensure smooth progress animation completion
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      if (data.success) {
        setRegisteredInstaller({
          code: installerCode,
          name: fullName,
        });
        setRegistrationStatus("success");
      } else {
        // Format error message
        let errorMessage = "Failed to register installer";
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

        // Also show toast for immediate feedback
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err: ValidationError) => {
            toast.error(`${err.path?.join(".")}: ${err.message}`);
          });
        } else {
          toast.error(data.error || "Failed to register installer");
        }
      }
    } catch (error) {
      console.error("Error registering installer:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Network error occurred";
      setRegistrationError(errorMsg);
      setRegistrationStatus("error");
      toast.error("Failed to register installer");
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = () => {
    // Completely reset the page by reloading
    // This ensures all hooks (CNIC validation, referrer validation, installer code generation)
    // are completely reset to their initial state
    window.location.href = "/installers/new";
  };

  const selectedBank = BANKS.find((b) => b.value === bankName);
  const isDigitalPayment = selectedBank?.mobile || false;

  const steps = [
    { number: 1, title: "Personal Info" },
    { number: 2, title: "Location & Training" },
    { number: 3, title: "Banking Details" },
    { number: 4, title: "Additional Info" },
    { number: 5, title: "Review" },
  ];

  const referrerJoined = useRelativeTime(referrerData?.createdAt || "");

  // Animated container variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      {/* Registration Modal */}
      <RegistrationModal
        open={registrationStatus !== "idle"}
        onOpenChange={(open) => {
          if (!open && registrationStatus !== "registering") {
            setRegistrationStatus("idle");
          }
        }}
        status={
          registrationStatus === "idle" ? "registering" : registrationStatus
        }
        installerCode={registeredInstaller?.code}
        installerName={registeredInstaller?.name}
        errorMessage={registrationError}
        onRedirect={handleRedirect}
        onViewInstaller={
          registeredInstaller?.code
            ? () => {
                window.location.href = `/installers/${registeredInstaller?.code}`;
              }
            : undefined
        }
      />

      {/* Main Form */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
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
              {/* Step Content */}
              <div className="space-y-6">
                {/* Step 1: Personal Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <StepHeader
                      icon={IconUserOctagon}
                      title="Basic Information"
                      description="Enter the installer's personal details and contact information"
                    />

                    <div
                      className={cn(
                        "text-card-foreground",
                        GRID_2_COL_CLASS,
                        CARD_SECTION_CLASS
                      )}
                    >
                      <CNICInput
                        value={cnicDisplay}
                        onChange={handleCNICChange}
                        isValidating={cnicValidating}
                        isChecked={cnicChecked}
                        error={cnicError}
                        cnicLength={cnic.length}
                      />

                      {cnicChecked && (
                        <>
                          <FormField
                            type="text"
                            label="Full Name"
                            id="fullName"
                            value={fullName}
                            onChange={setFullName}
                            placeholder="Enter full name"
                            labelClassName="block"
                            required
                          />

                          <FormField
                            type="text"
                            label="Phone Number"
                            id="phoneNumber"
                            value={phoneInput.value}
                            onChange={phoneInput.onChange}
                            onFocus={phoneInput.onFocus}
                            onBlur={phoneInput.onBlur}
                            placeholder="03##-#######"
                            maxLength={12}
                            required
                          />

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="whatsappNumber">
                                WhatsApp Number
                              </Label>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="sameAsPhone"
                                  checked={sameAsPhone}
                                  onCheckedChange={(checked) =>
                                    setSameAsPhone(checked as boolean)
                                  }
                                />
                                <Label
                                  htmlFor="sameAsPhone"
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  Same as phone
                                </Label>
                              </div>
                            </div>
                            <Input
                              id="whatsappNumber"
                              type="text"
                              value={whatsappInput.value}
                              onChange={(e) => {
                                whatsappInput.onChange(e.target.value);
                                setSameAsPhone(false);
                              }}
                              onFocus={whatsappInput.onFocus}
                              onBlur={whatsappInput.onBlur}
                              maxLength={12}
                              placeholder="03##-#######"
                              disabled={sameAsPhone}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 2: Location & Training */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <StepHeader
                      icon={IconLocation}
                      title="Location Information"
                      description="Enter the installer's address and location details"
                    />

                    <Card className={CARD_SECTION_CLASS}>
                      <CardContent className="space-y-4 p-0">
                        <div className={GRID_2_COL_CLASS}>
                          <FormField
                            type="select"
                            label="City"
                            id="city"
                            value={city}
                            onChange={setCity}
                            placeholder="Select City"
                            icon={IconCity}
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

                          <FormField
                            type="text"
                            label="Province"
                            id="province"
                            value={province}
                            onChange={() => {}}
                            icon={IconMapPoint}
                            disabled
                          />

                          <div className="col-span-2">
                            <FormField
                              type="text"
                              label="Address"
                              id="address"
                              value={address}
                              onChange={setAddress}
                              placeholder="Enter complete address"
                              icon={IconMapPoint}
                              autocomplete={"on"}
                              required
                            />
                          </div>

                          <div className="grid grid-cols-2 col-span-2 gap-4">
                            <FormField
                              type="select"
                              label="Training Center"
                              id="trainingCenter"
                              value={trainingCenter}
                              onChange={setTrainingCenter}
                              placeholder="Select Training Center"
                              icon={IconTeacher}
                              options={TRAINING_CENTER.map((tc) => ({
                                value: tc.city,
                                label: tc.city,
                              }))}
                              searchable
                              searchPlaceholder="Search training centers..."
                              emptyMessage="No training center found."
                              required
                            />

                            {trainingCenter && (
                              <InstallerCodeDisplay
                                code={installerCode}
                                isGenerating={codeGenerating}
                                isManualEdit={!installerCodeAutoGen}
                                onCodeChange={handleInstallerCodeChange}
                                isValidating={codeValidating}
                                error={codeError}
                                isValid={codeValid}
                              />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Step 3: Banking Details */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <StepHeader
                      icon={IconBank}
                      title="Payment Information"
                      description="Enter installer's bank details for reward payments"
                    />

                    <Card className="space-y-4 p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          type="select"
                          label="Bank / Payment Method"
                          id="bankName"
                          value={bankName}
                          onChange={(value) => {
                            setBankName(value);
                            setAccountNumber("");
                          }}
                          placeholder="Select Bank / Payment Method"
                          groups={[
                            {
                              label: "Digital Payment Methods",
                              options: BANKS.filter((b) => b.mobile).map(
                                (b) => ({
                                  value: b.value,
                                  label: b.label,
                                })
                              ),
                            },
                            {
                              label: "Commercial Banks",
                              options: BANKS.filter((b) => !b.mobile).map(
                                (b) => ({
                                  value: b.value,
                                  label: b.label,
                                })
                              ),
                            },
                          ]}
                          searchable
                          searchPlaceholder="Search banks..."
                          emptyMessage="No bank found."
                          required
                        />

                        {bankName && (
                          <>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="accountTitle">
                                  Account Title{" "}
                                  <span className="text-destructive">*</span>
                                </Label>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="sameAsName"
                                    checked={sameAsName}
                                    onCheckedChange={(checked) =>
                                      setSameAsName(checked as boolean)
                                    }
                                  />
                                  <Label
                                    htmlFor="sameAsName"
                                    className="text-sm font-normal cursor-pointer"
                                  >
                                    Same as Name
                                  </Label>
                                </div>
                              </div>
                              <Input
                                id="accountTitle"
                                type="text"
                                value={accountTitle}
                                onChange={(e) => {
                                  setAccountTitle(e.target.value);
                                  setSameAsName(false);
                                }}
                                disabled={sameAsName}
                                placeholder="Account holder name"
                              />
                            </div>

                            <FormField
                              type="text"
                              className="col-span-2"
                              label={
                                isDigitalPayment
                                  ? "Mobile Number"
                                  : "Account Number / IBAN"
                              }
                              id="accountNumber"
                              value={
                                isDigitalPayment
                                  ? accountNumberInput.value
                                  : accountNumber
                              }
                              onChange={(val) =>
                                isDigitalPayment
                                  ? accountNumberInput.onChange(val)
                                  : setAccountNumber(val)
                              }
                              onFocus={
                                isDigitalPayment
                                  ? accountNumberInput.onFocus
                                  : undefined
                              }
                              onBlur={
                                isDigitalPayment
                                  ? accountNumberInput.onBlur
                                  : undefined
                              }
                              placeholder={
                                isDigitalPayment
                                  ? "03##-#######"
                                  : "IBAN or Account Number"
                              }
                              maxLength={isDigitalPayment ? 12 : undefined}
                              hint={
                                isDigitalPayment
                                  ? "Enter mobile number in format: 03##-#######"
                                  : undefined
                              }
                              required
                            />
                          </>
                        )}
                      </div>
                    </Card>
                  </div>
                )}

                {/* Step 4: Additional Info */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <StepHeader
                      icon={IconShieldStar}
                      title="Additional Information"
                      description="Enter certification status and optional information"
                    />

                    <CardContent
                      className={cn("flex flex-col gap-6", CARD_SECTION_CLASS)}
                    >
                      <div className="flex items-center justify-between p-6 rounded-3xl border border-border bg-muted/40">
                        <div className="flex items-center gap-2">
                          {certified ? (
                            <IconShieldStar className="w-7 h-7 text-cyan-400" />
                          ) : (
                            <IconShieldMinimalistic
                              duotone={false}
                              className="w-7 h-7 text-muted-foreground"
                            />
                          )}
                          <Label
                            htmlFor="certified"
                            className="font-medium cursor-pointer"
                          >
                            Certified Installer
                          </Label>
                        </div>

                        <Switch
                          name="certified"
                          id="certified"
                          checked={certified}
                          onCheckedChange={(checked) =>
                            setCertified(checked as boolean)
                          }
                        />
                      </div>

                      <div className={GRID_2_COL_CLASS}>
                        <FormField
                          type="text"
                          label="Company Name"
                          id="companyName"
                          value={companyName}
                          onChange={setCompanyName}
                          placeholder="Enter company name (if any)"
                          icon={IconBuildings}
                          hint="Optional"
                        />

                        <div className="space-y-2">
                          <Label htmlFor="referrerCode" className="block">
                            Referrer Code{" "}
                            <span className="text-xs text-muted-foreground">
                              (Optional)
                            </span>
                          </Label>
                          <div className="relative">
                            <Input
                              id="referrerCode"
                              type="text"
                              value={referrerCode}
                              onChange={(e) =>
                                handleReferrerChange(e.target.value)
                              }
                              className="pl-10"
                              placeholder="Enter referrer installer code"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2">
                              <IconUserHeartRounded
                                duotone={false}
                                className="size-4.5"
                              />
                            </div>
                            {referrerValidating && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loading className="h-4 w-4" />
                              </div>
                            )}
                            {!referrerValidating &&
                              referrerData &&
                              referrerCode && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <HyperText className="tracking-widest text-xs uppercase text-success-text pointer-events-none select-none">
                                    Valid
                                  </HyperText>
                                </div>
                              )}
                          </div>
                          {referrerError && !referrerValidating && (
                            <p className="text-sm text-destructive">
                              {referrerError}
                            </p>
                          )}
                        </div>

                        {referrerData && !referrerValidating && (
                          <Link
                            href={
                              referrerData
                                ? `/installers/${referrerData._id}`
                                : "#"
                            }
                            target={referrerData ? "_blank" : undefined}
                            className="col-span-2"
                          >
                            <div
                              className={cn(
                                "mt-2 p-4 border pointer-events-none select-none border-border group rounded-3xl bg-muted/50 hover:bg-muted/70 transition-colors duration-300 flex items-center justify-between",
                                referrerData && "pointer-events-auto"
                              )}
                            >
                              {referrerData && (
                                <div className="flex items-center gap-4 w-full">
                                  <div className="relative">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-sm font-medium text-muted-foreground">
                                      {getInitials(
                                        referrerData.fullName as string
                                      ) || "?"}
                                    </div>
                                    {referrerData.certified && (
                                      <div className="absolute top-0 -right-2 p-1 flex items-center justify-center bg-muted/30 group-hover:bg-muted/50 backdrop-blur-2xl rounded-full transition-colors duration-300">
                                        <IconStar
                                          fill
                                          className="w-3 h-3 text-cyan-500 group-hover:text-cyan-400 transition-colors duration-300"
                                        />
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-left leading-0">
                                    <kbd className="font-mono text-accent-foreground/50 text-xs">
                                      {referrerData.installerCode}
                                    </kbd>
                                    <div className="text-sm font-medium">
                                      {referrerData.fullName}
                                    </div>
                                  </div>
                                  <div className="text-right ml-auto text-xs">
                                    <div className="font-medium">
                                      {referrerData.city}
                                    </div>
                                    <kbd className="text-accent-foreground">
                                      {referrerData.createdAt && referrerJoined}
                                    </kbd>
                                  </div>
                                </div>
                              )}
                            </div>
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </div>
                )}

                {/* Step 5: Review - Keep existing implementation */}
                {currentStep === 5 && (
                  <ReviewStep
                    installerCode={installerCode}
                    fullName={fullName}
                    cnic={cnic}
                    phoneNumber={phoneNumber}
                    whatsappNumber={whatsappNumber}
                    city={city}
                    province={province}
                    address={address}
                    trainingCenter={trainingCenter}
                    bankName={bankName}
                    accountNumber={accountNumber}
                    accountTitle={accountTitle}
                    isDigitalPayment={isDigitalPayment}
                    certified={certified}
                    companyName={companyName}
                    referrerCode={referrerCode}
                    referrerData={referrerData}
                    copyToClipboard={copyToClipboard}
                    copied={copied}
                    containerVariants={containerVariants}
                    itemVariants={itemVariants}
                    isAutoGen={installerCodeAutoGen}
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
                  onClick={handlePrev}
                  disabled={currentStep === 1}
                  variant="outline"
                  className="gap-1 pl-2"
                >
                  <IconAltArrowLeft
                    width={2}
                    className="size-4"
                    duotone={false}
                  />
                  Previous
                </Button>

                {currentStep < 5 ? (
                  <Button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 1 && !isStep1Valid()) ||
                      (currentStep === 2 && !isStep2Valid()) ||
                      (currentStep === 3 && !isStep3Valid()) ||
                      (currentStep === 4 && !isStep4Valid()) ||
                      codeGenerating ||
                      codeValidating
                    }
                    className="gap-1 pr-3"
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
                        Registering
                        <Loading className="h-4 w-4 fill-background" />
                      </>
                    ) : (
                      "Register Installer"
                    )}
                  </Button>
                )}
              </CardFooter>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
