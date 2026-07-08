"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Modal from "./Modal";
import {
  CITIES,
  CITY_TO_PROVINCE,
  CITY_TO_DISTRICT,
  BANKS,
  PROVINCES,
} from "@/lib/constants";
import { toast } from "sonner";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  IconEdit2,
} from "@/components/icons";
import Loading from "@/components/ui/loading";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/getInitials";
import { useRelativeTime } from "@/lib/getRelativeTime";
import { StepHeader } from "@/components/StepHeader";
import { CNICInput } from "@/app/installers/register/CNICInput";
import { InstallerCodeDisplay } from "@/app/installers/register/InstallerCodeDisplay";
import { FormStep } from "@/components/ui/FormStep";
import PageHeader from "./PageHeader";
import IconDanger from "./icons/Danger";

interface InstallerEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installerId: string;
  onSuccess?: () => void;
}

interface Settings {
  allowInstallerCodeEdit?: boolean;
}

interface InstallerData {
  installerCode: string;
  fullName: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  province: string;
  district: string;
  companyName: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  certified: boolean;
  referrerCode?: string;
}

// Style constants
const CARD_SECTION_CLASS = "bg-card border-border border p-6 rounded-3xl";
const GRID_2_COL_CLASS = "grid gap-6 md:grid-cols-2";

export default function InstallerEditModal({
  open,
  onOpenChange,
  installerId,
  onSuccess,
}: InstallerEditModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] =
    useState<Partial<InstallerData> | null>(null);
  const [originalCnic, setOriginalCnic] = useState<string>("");
  const [showCloseAlert, setShowCloseAlert] = useState(false);

  // Custom hooks - pass original CNIC to skip validation for unchanged CNIC
  const {
    cnic,
    cnicDisplay,
    cnicChecked,
    cnicValidating,
    cnicError,
    handleCNICChange,
    setCnicDisplay,
    setCnic,
    setCnicChecked,
  } = useCNICValidation(originalCnic);

  const {
    referrerCode,
    referrerValidating,
    referrerData,
    referrerError,
    handleReferrerChange,
    setReferrerCode,
  } = useReferrerValidation();

  // Step 1 - Basic Info
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [sameAsPhone, setSameAsPhone] = useState(false);

  // Phone input with debounce and auto-masking
  const phoneInput = usePhoneInput(setPhoneNumber, { debounceMs: 300 });
  const whatsappInput = usePhoneInput(setWhatsappNumber, { debounceMs: 300 });

  // Step 2 - Location & Training
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [initialDistrict, setInitialDistrict] = useState("");
  const [originalInstallerCode, setOriginalInstallerCode] = useState("");

  const {
    installerCode,
    codeGenerating,
    codeValidating,
    codeError,
    codeValid,
    handleInstallerCodeChange,
    setInstallerCode,
  } = useInstallerCodeGeneration(
    district,
    settings?.allowInstallerCodeEdit || false,
    originalInstallerCode,
  );

  const installerCodeAutoGen = !settings?.allowInstallerCodeEdit;

  // Step 3 - Banking Details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [sameAsName, setSameAsName] = useState(false);

  // Digital payment account number with debounce and auto-masking
  const accountNumberInput = usePhoneInput(setAccountNumber, {
    debounceMs: 300,
  });

  // Step 4 - Additional Info
  const [certified, setCertified] = useState(false);
  const [companyName, setCompanyName] = useState("");

  // Track if form has changes
  useEffect(() => {
    if (!originalData || loading) return;

    const currentData = {
      fullName,
      cnic: cnicDisplay,
      phoneNumber,
      whatsappNumber,
      city,
      province,
      district,
      address,
      installerCode,
      bankName,
      accountNumber,
      accountTitle,
      certified,
      companyName,
      referrerCode: referrerCode || "",
    };

    const hasChanges = Object.keys(currentData).some((key) => {
      const k = key as keyof typeof currentData;
      return currentData[k] !== (originalData[k] || "");
    });

    setHasUnsavedChanges(hasChanges);
  }, [
    originalData,
    loading,
    fullName,
    cnicDisplay,
    phoneNumber,
    whatsappNumber,
    city,
    province,
    district,
    address,
    installerCode,
    bankName,
    accountNumber,
    accountTitle,
    certified,
    companyName,
    referrerCode,
  ]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch installer and settings in parallel
      const [installerRes, settingsRes] = await Promise.all([
        fetch(`/api/installers/${installerId}`),
        fetch("/api/settings"),
      ]);

      const installerData = await installerRes.json();
      const settingsData = await settingsRes.json();

      if (installerData.success) {
        // The API returns { installer, statistics }, we need the installer object
        const inst = installerData.data.installer || installerData.data;

        // Store original data for change detection
        const data = {
          installerCode: inst.installerCode || "",
          fullName: inst.fullName || "",
          cnic: inst.cnic || "",
          phoneNumber: inst.phoneNumber || "",
          whatsappNumber: inst.whatsappNumber || "",
          address: inst.address || "",
          city: inst.city || "",
          province: inst.province || "",
          district: inst.district || "",
          companyName: inst.companyName || "",
          bankName: inst.bankName || "",
          accountNumber: inst.accountNumber || "",
          accountTitle: inst.accountTitle || "",
          certified: inst.certified || false,
          referrerCode: inst.referrerCode || "",
        };

        setOriginalData(data);

        // Store original CNIC and installer code for validation exclusion
        setOriginalCnic(data.cnic);
        setOriginalInstallerCode(data.installerCode);

        // Populate form fields with existing values
        setInstallerCode(data.installerCode);
        setFullName(data.fullName);

        // Set CNIC with validation bypassed for existing data
        setCnic(data.cnic.replace(/-/g, ""));
        setCnicDisplay(data.cnic);
        setCnicChecked(true);

        // Set phone numbers
        phoneInput.setValue(data.phoneNumber);
        setPhoneNumber(data.phoneNumber);
        whatsappInput.setValue(data.whatsappNumber);
        setWhatsappNumber(data.whatsappNumber);
        setSameAsPhone(data.phoneNumber === data.whatsappNumber);

        setAddress(data.address);
        setCity(data.city);
        setProvince(data.province);
        setDistrict(data.district);
        setInitialDistrict(data.district);
        setCompanyName(data.companyName);
        setBankName(data.bankName);

        // Handle account number - check if it's a digital payment
        const selectedBank = BANKS.find((b) => b.label === data.bankName);
        if (selectedBank?.mobile) {
          accountNumberInput.setValue(data.accountNumber);
        }
        setAccountNumber(data.accountNumber);

        setAccountTitle(data.accountTitle);
        setSameAsName(data.accountTitle === data.fullName);
        setCertified(data.certified);

        if (data.referrerCode) {
          setReferrerCode(data.referrerCode);
        }
      } else {
        toast.error("Failed to load installer data");
      }

      if (settingsData.success) {
        setSettings(settingsData.data);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load installer data");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installerId]);

  useEffect(() => {
    if (open && installerId) {
      fetchData();
    }
  }, [open, installerId, fetchData]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setLoading(true);
      setCurrentStep(1);
      setHasUnsavedChanges(false);
      setCnic("");
      setCnicDisplay("");
      setCnicChecked(false);
      setOriginalCnic("");
      setOriginalInstallerCode("");
    }
  }, [open, setCnic, setCnicDisplay, setCnicChecked]);

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
      const cityDistrict = CITY_TO_DISTRICT[city];
      if (cityDistrict) setDistrict(cityDistrict);
    }
  }, [city]);

  // Handle district change and installer code regeneration
  useEffect(() => {
    if (
      district &&
      installerCodeAutoGen &&
      !loading &&
      initialDistrict // Only if we have an initial value (edit mode)
    ) {
      if (district === initialDistrict) {
        // District changed back to original, restore original installer code
        setInstallerCode(originalInstallerCode);
      } else if (district !== initialDistrict) {
        // District changed to something different, clear code to trigger regeneration
        setInstallerCode("");
      }
    }
  }, [
    district,
    initialDistrict,
    installerCodeAutoGen,
    loading,
    originalInstallerCode,
    setInstallerCode,
  ]);

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
    if (!city || !address.trim() || !district || !installerCode.trim()) {
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
    district,
    installerCode,
    installerCodeAutoGen,
    codeValid,
    codeError,
  ]);

  const isStep3Valid = useCallback(() => {
    if (!bankName || !accountTitle.trim()) return false;
    const selectedBank = BANKS.find((b) => b.label === bankName);
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
        "Please check: CNIC must be 13 digits, Phone numbers must start with 03 and be 11 digits long",
      );
      return;
    }
    if (currentStep === 2 && !isStep2Valid()) {
      toast.error(
        "Please complete: City, Address, District, and Installer Code must all be filled",
      );
      return;
    }
    if (currentStep === 3 && !isStep3Valid()) {
      toast.error(
        "Please verify: Bank Name, Account Title, and correct Account Number format",
      );
      return;
    }
    if (currentStep === 4 && !isStep4Valid()) {
      toast.error(
        "Referrer code is not valid. You can leave it empty if you don't have a referrer.",
      );
      return;
    }
    setCurrentStep(currentStep + 1);
  }, [currentStep, isStep1Valid, isStep2Valid, isStep3Valid, isStep4Valid]);

  const handlePrev = useCallback(() => {
    setCurrentStep(currentStep - 1);
  }, [currentStep]);

  const handleSaveChanges = async () => {
    setSaving(true);

    try {
      // Use the hook values (which are already masked) for conversion
      const updateData: Partial<InstallerData> = {
        fullName,
        cnic: cnicDisplay,
        phoneNumber: phoneNumberToDBFormat(phoneInput.value || phoneNumber),
        whatsappNumber: phoneNumberToDBFormat(
          whatsappInput.value || whatsappNumber,
        ),
        address,
        city,
        province,
        district,
        companyName,
        bankName,
        accountNumber: isDigitalPayment
          ? phoneNumberToDBFormat(accountNumberInput.value || accountNumber)
          : accountNumber,
        accountTitle,
        certified,
      };

      // Always include installerCode to ensure it's synced with database and Google Contacts
      // The backend will validate if the change is allowed
      if (installerCode) {
        updateData.installerCode = installerCode;
      }

      // Include referrer code if provided
      if (referrerCode.trim()) {
        updateData.referrerCode = referrerCode.trim();
      }

      const response = await fetch(`/api/installers/${installerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Installer updated successfully");
        setHasUnsavedChanges(false);
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(data.error || "Failed to update installer");
      }
    } catch (error) {
      console.error("Failed to update installer:", error);
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

  // Memoize selected bank and digital payment check
  const selectedBank = useMemo(
    () => BANKS.find((b) => b.label === bankName),
    [bankName],
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
    [],
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
    [],
  );

  // Memoize bank groups
  const bankGroups = useMemo(
    () => [
      {
        label: "Digital Payment Methods",
        options: BANKS.filter((b) => b.mobile).map((b) => ({
          value: b.label,
          label: b.label,
        })),
      },
      {
        label: "Commercial Banks",
        options: BANKS.filter((b) => !b.mobile).map((b) => ({
          value: b.label,
          label: b.label,
        })),
      },
    ],
    [],
  );

  const referrerJoined = useRelativeTime(referrerData?.createdAt || "");

  return (
    <Modal
      open={open}
      onOpenChange={handleModalClose}
      title="Edit Installer"
      description="Update installer information"
      size="lg"
    >
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            Edit {loading ? <Skeleton className="h-6 w-20" /> : fullName}{" "}
            details
          </span>
        }
        Icon={IconEdit2}
        description={
          <>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage installers, view details, and add new entries
            </p>
          </>
        }
        titleClassName="text-xl"
        iconFill
      />
      {loading ? (
        <div>
          {/* Step Progress Skeleton */}
          <div className="flex justify-between items-center my-8 mx-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>

          {/* Step 1 Skeleton */}
          <div className="space-y-4">
            {/* Step Header Skeleton - matches StepHeader component structure */}
            <div className="p-6 rounded-3xl border text-card-foreground bg-card border-border">
              <div className="text-base flex items-center gap-2">
                <Skeleton className="h-12 w-12 mr-2 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-96" />
                </div>
              </div>
            </div>

            {/* Form Fields Skeleton - matches Step 1 structure */}
            <div
              className={cn(
                "text-card-foreground",
                GRID_2_COL_CLASS,
                CARD_SECTION_CLASS,
              )}
            >
              {/* CNIC Field */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 squircle-icon" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-4 w-48 squircle-icon" />
              </div>

              {/* Full Name Field */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-24 squircle-icon" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-4 w-56 squircle-icon" />
              </div>

              {/* Phone Number Field */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 squircle-icon" />
                <Skeleton className="h-11 w-full" />
                <Skeleton className="h-4 w-64 squircle-icon" />
              </div>

              {/* WhatsApp Number Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-36 squircle-icon" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-3 w-24 squircle-icon" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-56 squircle-icon" />
              </div>
            </div>
          </div>
          {/* Navigation Buttons Skeleton */}
          <CardFooter
            className={cn(
              "flex justify-between items-center mt-6",
              CARD_SECTION_CLASS,
            )}
          >
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-20" />
          </CardFooter>
        </div>
      ) : (
        <form onSubmit={(e) => e.preventDefault()}>
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
                  CARD_SECTION_CLASS,
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
                        <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
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
                <CardContent className="space-y-4 !p-0">
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

                    <FormField
                      type="text"
                      label="District"
                      id="district"
                      value={district}
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

                    {district && (
                      <div className="col-span-2">
                        <InstallerCodeDisplay
                          code={installerCode}
                          isGenerating={codeGenerating}
                          isManualEdit={!installerCodeAutoGen}
                          onCodeChange={handleInstallerCodeChange}
                          isValidating={codeValidating}
                          error={codeError}
                          isValid={codeValid}
                        />
                      </div>
                    )}
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
                        onChange={(e) => handleReferrerChange(e.target.value)}
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
                      {!referrerValidating && referrerData && referrerCode && (
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
                        referrerData ? `/installers/${referrerData._id}` : "#"
                      }
                      target={referrerData ? "_blank" : undefined}
                      className="col-span-2"
                    >
                      <div
                        className={cn(
                          "mt-2 p-4 border pointer-events-none select-none border-border group rounded-3xl bg-muted/50 hover:bg-muted/70 transition-colors duration-300 flex items-center justify-between",
                          referrerData && "pointer-events-auto",
                        )}
                      >
                        {referrerData && (
                          <div className="flex items-center gap-4 w-full">
                            <div className="relative">
                              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-card text-sm font-medium text-muted-foreground">
                                {getInitials(referrerData.fullName as string) ||
                                  "?"}
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

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <StepHeader
                icon={IconShieldStar}
                title="Review & Confirm"
                description="Please review all information before updating"
              />

              <Card className={CARD_SECTION_CLASS}>
                <CardContent className="space-y-6 !p-6">
                  {/* Personal Info */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Installer Code:
                        </span>
                        <p className="font-medium">{installerCode}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Full Name:
                        </span>
                        <p className="font-medium">{fullName}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CNIC:</span>
                        <p className="font-medium">{cnicDisplay}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Phone:</span>
                        <p className="font-medium">
                          {phoneInput.value || phoneNumber}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">WhatsApp:</span>
                        <p className="font-medium">
                          {whatsappInput.value || whatsappNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Location & Training
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">City:</span>
                        <p className="font-medium">{city}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Province:</span>
                        <p className="font-medium">{province}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Address:</span>
                        <p className="font-medium">{address}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">District:</span>
                        <p className="font-medium">{district}</p>
                      </div>
                    </div>
                  </div>

                  {/* Banking */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Banking Details
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Bank:</span>
                        <p className="font-medium">{selectedBank?.label}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Account Title:
                        </span>
                        <p className="font-medium">{accountTitle}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">
                          {isDigitalPayment
                            ? "Mobile Number:"
                            : "Account Number:"}
                        </span>
                        <p className="font-medium">
                          {isDigitalPayment
                            ? accountNumberInput.value
                            : accountNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional */}
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Certified:
                        </span>
                        <p className="font-medium">
                          {certified ? "Yes" : "No"}
                        </p>
                      </div>
                      {companyName && (
                        <div>
                          <span className="text-muted-foreground">
                            Company:
                          </span>
                          <p className="font-medium">{companyName}</p>
                        </div>
                      )}
                      {referrerCode && (
                        <div>
                          <span className="text-muted-foreground">
                            Referrer:
                          </span>
                          <p className="font-medium">{referrerCode}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <CardFooter
            className={cn(
              "flex justify-between items-center mt-6",
              CARD_SECTION_CLASS,
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

            {currentStep < 5 ? (
              <Button
                type="button"
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
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="gap-2"
              >
                {saving ? (
                  <>
                    Updating Installer
                    <Loading className="fill-background" />
                  </>
                ) : (
                  "Update Installer"
                )}
              </Button>
            )}
          </CardFooter>
        </form>
      )}
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
              className="w-full"
              variant="destructive"
            >
              Discard Changes
            </AlertDialogAction>
            <AlertDialogCancel onClick={cancelClose} className="w-full">
              Continue Editing
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Modal>
  );
}
