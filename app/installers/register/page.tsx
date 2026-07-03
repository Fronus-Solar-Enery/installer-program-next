"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
  IconUserHeartRounded,
  IconUserOctagon,
  IconAltArrowRight,
  IconAltArrowLeft,
  IconTrainingCenter,
  IconLayer,
} from "@/components/icons";
import Loading from "@/components/ui/loading";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/getInitials";
import { useRelativeTime } from "@/lib/getRelativeTime";
import { useClipboard } from "@/hooks/useCopyToClipboard";
import { StepHeader } from "@/components/StepHeader";
import { CNICInput } from "@/app/installers/register/CNICInput";
import { InstallerCodeDisplay } from "@/app/installers/register/InstallerCodeDisplay";
import { FormStep } from "@/components/ui/FormStep";
import { ReviewStep } from "./ReviewStep";
import { RegistrationModal } from "@/app/installers/register/RegistrationModal";
import IconUserPlus from "@/components/icons/UserPlus";
import PageHeader from "@/components/PageHeader";
import {
  CARD_SECTION_CLASS,
  GRID_2_COL_CLASS,
} from "@/lib/registration-styles";

interface Settings {
  allowInstallerCodeEdit?: boolean;
}

interface ValidationError {
  path?: string[];
  message: string;
}

export default function NewInstallerPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Google Auth Status
  const [googleAuthStatus, setGoogleAuthStatus] = useState<{
    isAuthenticated: boolean;
    needsReauth?: boolean;
    configError?: boolean;
    configErrorReason?: string;
    hasRefreshToken: boolean;
    accountEmail: string | null;
  } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

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
  const prevTrainingCenterRef = useRef("");

  const {
    installerCode,
    codeGenerating,
    codeValidating,
    codeError,
    codeValid,
    handleInstallerCodeChange,
    setInstallerCode,
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

  // Check if form has data (for unsaved changes warning)
  const hasFormData = useMemo(() => {
    return (
      cnic.length > 0 ||
      fullName.trim() !== "" ||
      phoneNumber.trim() !== "" ||
      city !== "" ||
      address.trim() !== "" ||
      trainingCenter !== "" ||
      bankName !== "" ||
      accountNumber.trim() !== "" ||
      companyName.trim() !== "" ||
      referrerCode.trim() !== ""
    );
  }, [
    cnic,
    fullName,
    phoneNumber,
    city,
    address,
    trainingCenter,
    bankName,
    accountNumber,
    companyName,
    referrerCode,
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

  // Check Google Auth Status
  useEffect(() => {
    const checkGoogleAuth = async () => {
      try {
        setAuthLoading(true);
        const response = await fetch("/api/google-auth/status");
        const data = await response.json();
        setGoogleAuthStatus(data);
      } catch (error) {
        console.error("Failed to check Google auth status:", error);
        toast.error("Failed to check Google Contacts authentication status");
      } finally {
        setAuthLoading(false);
      }
    };
    checkGoogleAuth();
  }, []);

  // Handle Google Authentication
  const handleAuthenticateGoogle = async () => {
    if (!isAdmin) {
      toast.error("Only administrators can authenticate Google Contacts");
      return;
    }

    try {
      setAuthLoading(true);
      const response = await fetch("/api/google-auth/initiate");
      const data = await response.json();

      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        toast.error("Failed to initiate authentication");
      }
    } catch (error) {
      console.error("Error initiating Google auth:", error);
      toast.error("Failed to start authentication process");
      setAuthLoading(false);
    }
  };

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

  // Handle training center change - clear installer code to trigger regeneration
  // This is for NEW installer registration only (no initial training center)
  useEffect(() => {
    if (
      trainingCenter &&
      installerCodeAutoGen &&
      prevTrainingCenterRef.current &&
      prevTrainingCenterRef.current !== trainingCenter
    ) {
      // Training center changed, clear the code to trigger regeneration
      setInstallerCode("");
    }
    prevTrainingCenterRef.current = trainingCenter;
  }, [trainingCenter, installerCodeAutoGen, setInstallerCode]);

  // Memoize validation functions
  const isStep1Valid = useCallback(() => {
    const phoneDigits = phoneNumber.replace(/\D/g, "");
    const whatsappDigits = whatsappNumber.replace(/\D/g, "");
    return (
      cnicChecked &&
      cnic.length === 13 &&
      !cnicError &&
      fullName.trim() !== "" &&
      phoneDigits.length === 11 &&
      phoneDigits.startsWith("03") &&
      whatsappDigits.length === 11 &&
      whatsappDigits.startsWith("03")
    );
  }, [cnicChecked, cnic, cnicError, fullName, phoneNumber, whatsappNumber]);

  const isStep2Valid = useCallback(() => {
    if (!city || !address.trim() || !trainingCenter || !installerCode.trim()) {
      return false;
    }
    // For manual edit mode, code must be valid
    if (!installerCodeAutoGen) {
      return codeValid && !codeError;
    }
    // For auto-generated mode, just check if code exists
    return true;
  }, [
    city,
    address,
    trainingCenter,
    installerCode,
    installerCodeAutoGen,
    codeValid,
    codeError,
  ]);

  const isStep3Valid = useCallback(() => {
    if (!bankName || !accountTitle.trim()) return false;
    const selectedBank = BANKS.find((b) => b.value === bankName);
    const isDigital = selectedBank?.mobile || false;
    if (isDigital) {
      const accountDigits = accountNumber.replace(/\D/g, "");
      return accountDigits.length === 11 && accountDigits.startsWith("03");
    }
    return accountNumber.trim().length > 0;
  }, [bankName, accountTitle, accountNumber]);

  const isStep4Valid = useCallback(() => {
    if (referrerCode.trim() && !referrerData && !referrerError) return false;
    if (referrerError) return false;
    return true;
  }, [referrerCode, referrerData, referrerError]);

  // Optimize navigation handlers with better error messages
  const handleNext = useCallback(() => {
    if (currentStep === 1 && !isStep1Valid()) {
      toast.error(
        "Please check: CNIC must be 13 digits, Phone numbers must start with 03 and be 11 digits long"
      );
      return;
    }
    if (currentStep === 2 && !isStep2Valid()) {
      toast.error(
        "Please complete: City, Address, Training Center, and Installer Code must all be filled"
      );
      return;
    }
    if (currentStep === 3 && !isStep3Valid()) {
      toast.error(
        "Please verify: Bank Name, Account Title, and correct Account Number format"
      );
      return;
    }
    if (currentStep === 4 && !isStep4Valid()) {
      toast.error(
        "Referrer code is not valid. You can leave it empty if you don't have a referrer."
      );
      return;
    }
    setCurrentStep(currentStep + 1);
  }, [currentStep, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);

  const handlePrev = useCallback(() => {
    setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const handleSubmit = async () => {
    setLoading(true);
    setRegistrationStatus("registering");

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

      // Small delay to ensure smooth transition to 100%
      // This allows the progress bar to complete visually before switching screens
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (data.success) {
        setRegisteredInstaller({
          code: installerCode,
          name: fullName,
        });
        setRegistrationStatus("success");
      } else {
        // Format error message with better readability
        let errorMessage = "Failed to register installer";

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

        // Also show toast for immediate feedback
        if (data.errors && Array.isArray(data.errors)) {
          data.errors.forEach((err: ValidationError) => {
            toast.error(`${err.path?.join(".")}: ${err.message}`);
          });
        } else {
          toast.error(
            data.error || data.message || "Failed to register installer"
          );
        }
      }
    } catch (error) {
      console.error("Error registering installer:", error);

      // Handle network errors and other exceptions
      let errorMsg = "Network error: Unable to connect to the server";

      if (error instanceof Error) {
        errorMsg = error.message;
      } else if (typeof error === "string") {
        errorMsg = error;
      }

      // Make the error message more user-friendly
      if (errorMsg.includes("fetch")) {
        errorMsg =
          "Network error: Please check your internet connection and try again";
      }

      setRegistrationError(errorMsg);
      setRegistrationStatus("error");
      toast.error("Failed to register installer");
    } finally {
      setLoading(false);
    }
  };

  const handleRedirect = useCallback(() => {
    // Completely reset the page by reloading
    // This ensures all hooks (CNIC validation, referrer validation, installer code generation)
    // are completely reset to their initial state
    window.location.href = "/installers/register";
  }, []);

  // Memoize selected bank and digital payment check
  const selectedBank = useMemo(
    () => BANKS.find((b) => b.value === bankName),
    [bankName]
  );
  const isDigitalPayment = selectedBank?.mobile || false;

  // Memoize steps array
  const steps = useMemo(
    () => [
      { number: 1, title: "Personal Info" },
      { number: 2, title: "Location & Training" },
      { number: 3, title: "Banking Details" },
      { number: 4, title: "Additional Info" },
      { number: 5, title: "Review" },
    ],
    []
  );

  // Memoize city groups for dropdown
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

  // Memoize training center options
  const trainingCenterOptions = useMemo(
    () =>
      TRAINING_CENTER.map((tc) => ({
        value: tc.city,
        label: tc.city,
      })),
    []
  );

  // Memoize bank groups
  const bankGroups = useMemo(
    () => [
      {
        label: "Digital Payment Methods",
        options: BANKS.filter((b) => b.mobile).map((b) => ({
          value: b.value,
          label: b.label,
        })),
      },
      {
        label: "Commercial Banks",
        options: BANKS.filter((b) => !b.mobile).map((b) => ({
          value: b.value,
          label: b.label,
        })),
      },
    ],
    []
  );

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
    <div className="flex-1 overflow-auto space-y-4">
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

      <PageHeader
        title="Register Installer"
        Icon={IconUserPlus}
        iconFill
        description="Register a new Installer to the Installer Program"
        action={
          <Button
            onClick={() => router.push("/installers/bulk-register")}
            variant="outline"
            disabled={loading || !googleAuthStatus?.isAuthenticated}
            title={
              !googleAuthStatus?.isAuthenticated
                ? "Google Contacts authentication required"
                : "Bulk Register"
            }
            className="gap-2"
          >
            Bulk Register
            <IconLayer width={2} className="h-3.5 w-3.5" />
          </Button>
        }
      />
      {/* Main Form */}
      <Card>
        <div className="max-w-4xl mx-auto">
          {/* Google Auth Warning Banner */}
          {!authLoading && !googleAuthStatus?.isAuthenticated && (
            <Card className="mb-6 bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <CardContent className="py-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-6 h-6 text-yellow-600 shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-1">
                        {googleAuthStatus?.configError
                          ? "Google Contacts Misconfigured"
                          : googleAuthStatus?.needsReauth
                          ? "Google Contacts Token Expired"
                          : "Google Contacts Authentication Required"}
                      </h3>
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {googleAuthStatus?.configError
                          ? `Google Contacts is misconfigured on the server${
                              googleAuthStatus.configErrorReason
                                ? ` (${googleAuthStatus.configErrorReason})`
                                : ""
                            }, so contacts are not syncing. This is a server configuration issue that re-authenticating cannot fix — please contact the system administrator.`
                          : googleAuthStatus?.needsReauth
                          ? isAdmin
                            ? "The Google Contacts token has expired or been revoked, so contacts are no longer syncing. Please reconnect before registering installers."
                            : "The Google Contacts token has expired — contacts are not syncing. Please contact an administrator to reconnect."
                          : isAdmin
                          ? "Please authenticate Google Contacts before registering installers. This allows automatic contact creation in Google Contacts."
                          : "Google Contacts is not authenticated. Please contact an administrator to authenticate Google Contacts before registering installers."}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAuthenticateGoogle}
                      disabled={
                        !isAdmin || authLoading || googleAuthStatus?.configError
                      }
                      className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-300"
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      {authLoading
                        ? "Authenticating..."
                        : "Authenticate Google Contacts"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/installers")}
                    >
                      Back to Installers
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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
          <CardContent
            className={cn(
              !googleAuthStatus?.isAuthenticated &&
                "opacity-50 pointer-events-none select-none"
            )}
          >
            {/* Step Content */}
            <div className="space-y-6">
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <StepHeader
                    icon={IconUserOctagon}
                    title="Basic Information"
                    description="Please provide the installer's CNIC, full name, and contact numbers. All fields are required."
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
                          placeholder="e.g., Muhammad Ahmed Khan"
                          hint="Enter the full name as it appears on the CNIC"
                          labelClassName="block"
                          required
                          aria-label="Installer's full name as on CNIC"
                          aria-required="true"
                        />

                        <FormField
                          type="text"
                          label="Phone Number"
                          id="phoneNumber"
                          value={phoneInput.value}
                          onChange={phoneInput.onChange}
                          onFocus={phoneInput.onFocus}
                          onBlur={phoneInput.onBlur}
                          placeholder="0300-1234567"
                          hint="Enter 11-digit mobile number starting with 03"
                          maxLength={12}
                          required
                          aria-label="Mobile phone number for contact"
                          aria-required="true"
                          aria-describedby="phone-hint"
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
                    <CardContent className="space-y-4 p-0!">
                      <div className={GRID_2_COL_CLASS}>
                        <FormField
                          type="select"
                          label="City"
                          id="city"
                          value={city}
                          onChange={setCity}
                          placeholder="Select City"
                          icon={IconCity}
                          groups={cityGroups}
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
                            icon={IconTrainingCenter}
                            options={trainingCenterOptions}
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
                        groups={bankGroups}
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
                          <IconShieldMinimalistic className="w-7 h-7 text-muted-foreground" />
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
                            <IconUserHeartRounded className="size-4.5" />
                          </div>
                          {referrerValidating && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loading />
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
                <IconAltArrowLeft width={2} />
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
                      Registering
                      <Loading className="fill-background" />
                    </>
                  ) : (
                    "Register Installer"
                  )}
                </Button>
              )}
            </CardFooter>
          </CardContent>
        </div>
      </Card>
    </div>
  );
}
