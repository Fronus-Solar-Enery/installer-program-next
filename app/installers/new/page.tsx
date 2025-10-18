"use client";

import { motion, type Variants } from "framer-motion";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CITIES,
  CITY_TO_PROVINCE,
  TRAINING_CENTER,
  BANKS,
} from "@/lib/constants";
import {
  CheckCircle,
  Loader2,
  Check,
  Key,
  User,
  Smartphone,
  BuildingIcon,
  CreditCard,
  Building,
  FileText,
  BadgeCheck,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { HyperText } from "@/components/ui/hypertext";
import { FormField } from "@/components/ui/form-field";
import { useCNICValidation } from "@/hooks/useCNICValidation";
import { useReferrerValidation } from "@/hooks/useReferrerValidation";
import { useInstallerCodeGeneration } from "@/hooks/useInstallerCodeGeneration";
import { formatPhoneNumber } from "@/lib/validation-helpers";
import {
  IconArrowRight,
  IconBank,
  IconBuildings,
  IconCity,
  IconCopy,
  IconCopySuccess,
  IconLocation,
  IconMapPoint,
  IconShieldMinimalistic,
  IconShieldStar,
  IconStar,
  IconTeacher,
  IconUserCog,
  IconUserHeartRounded,
  IconUserId,
  IconUserOctagon,
} from "@/components/icons";
import IconArrowLeft from "@/components/icons/ArrowLeft";
import Loading from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/getInitials";
import { useRelativeTime } from "@/lib/getRelativeTime";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useClipboard } from "@/hooks/useCopyToClipboard";
import { StepHeader } from "@/components/StepHeader";
import { CNICInput } from "@/components/CNICInput";
import { InstallerCodeDisplay } from "@/components/InstallerCodeDisplay";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FormStep } from "@/components/ui/FormStep";

interface Settings {
  allowInstallerCodeEdit?: boolean;
}

interface ValidationError {
  path?: string[];
  message: string;
}

interface InstallerResponse {
  _id: string;
  cnic?: string;
  installerCode?: string;
  fullName?: string;
  createdAt?: string;
  city?: string;
  certified?: boolean;
}

export default function NewInstallerPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

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

  // Step 2 - Location & Training
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [address, setAddress] = useState("");
  const [trainingCenter, setTrainingCenter] = useState("");

  const { installerCode, codeGenerating, handleInstallerCodeChange } =
    useInstallerCodeGeneration(
      trainingCenter,
      settings?.allowInstallerCodeEdit || false
    );

  // Step 3 - Banking Details
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountTitle, setAccountTitle] = useState("");
  const [sameAsName, setSameAsName] = useState(true);

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
    if (sameAsPhone) setWhatsappNumber(phoneNumber);
  }, [sameAsPhone, phoneNumber]);

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
  const isStep1Valid = () =>
    cnicChecked &&
    cnic.length === 13 &&
    !cnicError &&
    fullName.trim() &&
    phoneNumber.length === 11 &&
    whatsappNumber.length === 11;

  const isStep2Valid = () =>
    city && address.trim() && trainingCenter && installerCode.trim();

  const isStep3Valid = () => {
    if (!bankName || !accountTitle.trim()) return false;
    const selectedBank = BANKS.find((b) => b.value === bankName);
    const isDigital = selectedBank?.mobile || false;
    if (isDigital) {
      return accountNumber.length === 11 && accountNumber.startsWith("03");
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
    try {
      const payload = {
        installerCode,
        fullName,
        cnic: cnicDisplay,
        phoneNumber,
        whatsappNumber,
        address,
        city,
        province,
        trainingCenter,
        companyName,
        bankName,
        accountNumber,
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

      if (data.success) {
        toast.success("Installer registered successfully!");
        router.push("/installers");
      } else {
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
      toast.error("Failed to register installer");
    } finally {
      setLoading(false);
    }
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

                  <div className="text-card-foreground grid gap-6 md:grid-cols-2 bg-card/30 border-border border p-6 rounded-3xl">
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
                          value={phoneNumber}
                          onChange={(val) =>
                            setPhoneNumber(formatPhoneNumber(val))
                          }
                          placeholder="03001234567"
                          maxLength={11}
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
                            value={whatsappNumber}
                            onChange={(e) => {
                              setWhatsappNumber(
                                formatPhoneNumber(e.target.value)
                              );
                              setSameAsPhone(false);
                            }}
                            maxLength={11}
                            placeholder="03001234567"
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

                  <Card className="border-border bg-card/30">
                    <CardContent className="space-y-4 p-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <FormField
                          type="select"
                          label="City"
                          id="city"
                          value={city}
                          onChange={setCity}
                          placeholder="Select City"
                          icon={IconCity}
                          options={CITIES.sort().map((c) => ({
                            value: c,
                            label: `${c} (${CITY_TO_PROVINCE[c]})`,
                          }))}
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
                            required
                          />

                          {trainingCenter && (
                            <InstallerCodeDisplay
                              code={installerCode}
                              isGenerating={codeGenerating}
                              isManualEdit={
                                settings?.allowInstallerCodeEdit || false
                              }
                              onCodeChange={handleInstallerCodeChange}
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
                            options: BANKS.filter((b) => b.mobile).map((b) => ({
                              value: b.value,
                              label: b.label,
                            })),
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
                            value={accountNumber}
                            onChange={(val) =>
                              isDigitalPayment
                                ? setAccountNumber(formatPhoneNumber(val))
                                : setAccountNumber(val)
                            }
                            placeholder={
                              isDigitalPayment
                                ? "03XXXXXXXXX"
                                : "IBAN or Account Number"
                            }
                            maxLength={isDigitalPayment ? 11 : undefined}
                            hint={
                              isDigitalPayment
                                ? "Enter 11-digit mobile number starting with 03"
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

                  <CardContent className="flex flex-col gap-6 bg-card/30 border-border border p-6 rounded-3xl">
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

                    <div className="grid gap-6 md:grid-cols-2">
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
                />
              )}
            </div>

            {/* Navigation Buttons */}
            <CardFooter className="flex justify-between items-center bg-card/30 border-border border p-6 rounded-3xl my-6">
              <Button
                onClick={handlePrev}
                disabled={currentStep === 1}
                variant="outline"
                className="gap-1"
              >
                <IconArrowLeft width={2} className="size-4" duotone={false} />
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
                    codeGenerating
                  }
                  className="gap-1"
                >
                  Next
                  <IconArrowRight
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
                      <Loading className="h-5 w-5" />
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
  );
}

// Review Step Component
interface ReviewStepProps {
  installerCode: string;
  fullName: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  city: string;
  province: string;
  address: string;
  trainingCenter: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  isDigitalPayment: boolean;
  certified: boolean;
  companyName: string;
  referrerCode: string;
  referrerData: InstallerResponse | null;
  copyToClipboard: (text: string, label: string) => void;
  copied: string | null;
  containerVariants: Variants;
  itemVariants: Variants;
}

function ReviewStep(props: ReviewStepProps) {
  const {
    installerCode,
    fullName,
    cnic,
    phoneNumber,
    whatsappNumber,
    city,
    province,
    address,
    trainingCenter,
    bankName,
    accountNumber,
    accountTitle,
    certified,
    companyName,
    referrerCode,
    copyToClipboard,
    copied,
    containerVariants,
    itemVariants,
  } = props;

  return (
    <div className="space-y-6">
      <motion.div
        className="space-y-8"
        initial="hidden"
        animate="show"
        variants={containerVariants}
      >
        <StepHeader
          icon={IconUserId}
          title="Review Information"
          description="Verify all details before registering the new installer"
        />

        <div className="grid gap-8 md:grid-cols-1 xl:grid-cols-2 xl:gap-6">
          {/* Installer Code Card */}
          <motion.div
            variants={itemVariants}
            className="bg-card/95 rounded-3xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-inset ring-border/5 xl:col-span-2"
          >
            <div className="flex items-center justify-between border-b border-border/30 pb-6 mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2.5 rounded-xl">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base">Installer Code</h3>
              </div>
              <Badge variant="info" className="rounded-full px-2 py-1">
                Auto-Generated
              </Badge>
            </div>

            <div className="flex justify-center mb-4">
              <Card className="bg-muted p-6 rounded-3xl relative flex items-center justify-center group gap-2">
                <HyperText className="pointer-events-none leading-5 text-2xl tracking-widest">
                  {installerCode}
                </HyperText>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        onClick={() =>
                          copyToClipboard(installerCode, `Installer Code`)
                        }
                        className={cn(
                          "transition-colors duration-200 flex items-center justify-center cursor-pointer hover:bg-background/50 p-1 rounded-sm",
                          copied === "Installer Code" &&
                            "text-emerald-500 opacity-100"
                        )}
                      >
                        {copied === "Installer Code" ? (
                          <IconCopySuccess className="w-4.5 h-4.5" />
                        ) : (
                          <IconCopy className="w-4.5 h-4.5" />
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      {copied ? "Copied to clipboard!" : "Copy Installer Code"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Card>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              <p>
                This unique installer code is based on the selected training
                center ({trainingCenter})
              </p>
              <p>
                This code will be used for all installations and rewards
                associated with this installer.
              </p>
            </div>
          </motion.div>

          {/* Personal Details */}
          <motion.div
            variants={itemVariants}
            className="bg-card/95 rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-inset ring-border/5"
          >
            <div className="flex items-center gap-3 mb-5 pb-2 border-b border-border/30">
              <div className="bg-muted p-2.5 rounded-xl">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base">Personal Details</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div className="col-span-2">
                <ReviewItem label="Name" value={fullName} />
              </div>
              <div className="col-span-2">
                <ReviewItem
                  label="CNIC"
                  value={cnic}
                  valueClass="font-mono tracking-wide"
                  isHighlighted={true}
                  icon={<Key className="h-3.5 w-3.5 text-primary/70" />}
                />
              </div>
              <ReviewItem
                label="Phone"
                value={phoneNumber}
                icon={
                  <Smartphone className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="WhatsApp"
                value={whatsappNumber || "(Same as phone)"}
                valueClass={
                  whatsappNumber ? "" : "text-muted-foreground italic"
                }
                icon={
                  <Smartphone className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
            </div>
          </motion.div>

          {/* Address Details */}
          <motion.div
            variants={itemVariants}
            className="bg-card/95 rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-inset ring-border/5"
          >
            <div className="flex items-center gap-3 mb-5 pb-2 border-b border-border/30">
              <div className="bg-muted p-2.5 rounded-xl">
                <IconMapPoint className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-base">Address Details</h3>
            </div>
            <div className="space-y-6">
              {trainingCenter && (
                <div className="bg-primary/5 dark:bg-primary/10 py-3.5 px-4 rounded-lg border border-primary/10">
                  <ReviewItem
                    label="Training Center"
                    value={trainingCenter}
                    icon={
                      <BuildingIcon className="h-3.5 w-3.5 text-primary/80" />
                    }
                    isHighlighted={true}
                  />
                </div>
              )}
              <ReviewItem
                label="Address"
                value={address}
                fullWidth={true}
                icon={
                  <IconMapPoint className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                <ReviewItem label="City" value={city} />
                <ReviewItem label="Province" value={province} />
              </div>
            </div>
          </motion.div>

          {/* Banking Details */}
          <motion.div
            variants={itemVariants}
            className="bg-card/95 rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-inset ring-border/5 xl:col-span-2"
          >
            <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2.5 rounded-xl">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base">Banking Details</h3>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <ReviewItem
                  label="Bank"
                  value={
                    BANKS.find((b) => b.value === bankName)?.label as string
                  }
                  fullWidth={true}
                  isHighlighted={true}
                  icon={<Building className="h-3.5 w-3.5 text-primary/70" />}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 md:col-span-2">
                <ReviewItem
                  label="Account Number"
                  value={accountNumber}
                  valueClass="font-mono tracking-wide"
                  icon={
                    <FileText className="h-3.5 w-3.5 text-muted-foreground/90" />
                  }
                />
                <ReviewItem
                  label="Account Title"
                  value={accountTitle}
                  icon={
                    <User className="h-3.5 w-3.5 text-muted-foreground/90" />
                  }
                />
              </div>
            </div>
          </motion.div>

          {/* Certification Details */}
          <motion.div
            variants={itemVariants}
            className="bg-card/95 rounded-xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-inset ring-border/5 xl:col-span-2"
          >
            <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-5">
              <div className="flex items-center gap-3">
                <div className="bg-muted p-2.5 rounded-xl">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-base">
                  Certification Details
                </h3>
              </div>
              <Badge
                variant={certified ? "default" : "outline"}
                className={cn(
                  "rounded-full px-3 py-1",
                  certified
                    ? "bg-primary/15 text-primary border-primary/20"
                    : "text-muted-foreground border-muted-foreground/30"
                )}
              >
                <Shield className="h-3 w-3 mr-1.5" />
                {certified ? "Certified" : "Not Certified"}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <ReviewItem
                label="Company"
                value={companyName || "Not specified"}
                valueClass={companyName ? "" : "text-muted-foreground italic"}
                icon={
                  companyName ? (
                    <Building className="h-3.5 w-3.5 text-muted-foreground/90" />
                  ) : undefined
                }
              />
              <ReviewItem
                label="Referred By"
                value={referrerCode || "No referrer"}
                valueClass={
                  referrerCode
                    ? "font-mono tracking-wide"
                    : "text-muted-foreground italic"
                }
                icon={
                  referrerCode ? (
                    <User className="h-3.5 w-3.5 text-muted-foreground/90" />
                  ) : undefined
                }
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

// Review Item Component
interface ReviewItemProps {
  label: string;
  value: string;
  valueClass?: string;
  icon?: React.ReactNode;
  isHighlighted?: boolean;
  fullWidth?: boolean;
}

function ReviewItem({
  label,
  value,
  valueClass = "",
  icon,
  isHighlighted = false,
  fullWidth = false,
}: ReviewItemProps) {
  return (
    <div className={`${fullWidth ? "col-span-full" : ""} group`}>
      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
        {icon}
        {label}
      </p>
      <p
        className={cn(
          "text-sm font-medium transition-colors group-hover:text-foreground/90",
          isHighlighted ? "text-primary" : "",
          valueClass
        )}
      >
        {value}
      </p>
    </div>
  );
}
