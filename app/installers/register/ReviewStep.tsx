import { motion, type Variants } from "framer-motion";
import { BANKS } from "@/lib/constants";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HyperText } from "@/components/ui/hypertext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { StepHeader } from "@/components/StepHeader";
import { ReviewSectionHeader } from "@/app/installers/register/ReviewSectionHeader";
import { ReviewItem } from "@/app/installers/register/ReviewItem";
import {
  IconCheck,
  IconCopy,
  IconShieldMinimalistic,
  IconShieldStar,
  IconBuildings,
  IconUserHeartRounded,
  IconSmartphone2,
  IconMapPoint,
  IconBank,
  IconCard,
  IconUserId,
} from "@/components/icons";
import IconUser from "@/components/icons/User";
import IconKey from "@/components/icons/Key";
import IconVerify from "@/components/icons/Verify";
import { CopyButton } from "@/components/CopyButton";

interface InstallerResponse {
  _id: string;
  cnic?: string;
  installerCode?: string;
  fullName?: string;
  createdAt?: string;
  city?: string;
  certified?: boolean;
}

interface ReviewStepProps {
  installerCode: string;
  fullName: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  city: string;
  province: string;
  district: string;
  address: string;
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
  isAutoGen?: boolean;
}

const CARD_CLASS =
  "bg-card/95 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-inset ring-border/5";

export function ReviewStep(props: ReviewStepProps) {
  const {
    installerCode,
    fullName,
    cnic,
    phoneNumber,
    whatsappNumber,
    city,
    province,
    district,
    address,
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
    isAutoGen,
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
            className={cn(CARD_CLASS, "xl:col-span-2")}
          >
            <ReviewSectionHeader
              className="p-6"
              title="Installer Code"
              icon={IconKey}
              badge={
                <Badge
                  variant={isAutoGen ? "success" : "secondary"}
                  className="rounded-full px-2.5 uppercase text-[10px] font-bold tracking-wider"
                >
                  {isAutoGen ? "Auto-Generated" : "Custom"}
                </Badge>
              }
            />
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <Card className="bg-background p-6 rounded-3xl relative flex items-center justify-center group gap-2">
                  <HyperText className="pointer-events-none leading-5 text-2xl tracking-widest">
                    {installerCode}
                  </HyperText>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CopyButton text={installerCode} />
                      </TooltipTrigger>
                      <TooltipContent>
                        {copied
                          ? "Copied to clipboard!"
                          : "Copy Installer Code"}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Card>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                {isAutoGen ? (
                  <p>
                    This unique installer code is generated based on the
                    installer&apos;s district ({district}).
                  </p>
                ) : (
                  <>This installer code is entered manually.</>
                )}

                <p>
                  It will be used for all installations and rewards linked to
                  this installer.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Personal Details */}
          <motion.div variants={itemVariants} className={CARD_CLASS}>
            <ReviewSectionHeader
              title="Personal Details"
              icon={IconUser}
              className="p-6"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-6">
              <ReviewItem
                label="Name"
                value={fullName}
                icon={
                  <IconUser className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="CNIC"
                value={cnic}
                valueClass="font-mono tracking-wide"
                isHighlighted={true}
                icon={
                  <IconKey className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="Phone"
                value={phoneNumber}
                icon={
                  <IconSmartphone2 className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="WhatsApp"
                value={whatsappNumber || "(Same as phone)"}
                valueClass={
                  whatsappNumber ? "" : "text-muted-foreground italic"
                }
                icon={
                  <IconSmartphone2 className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
            </div>
          </motion.div>

          {/* Address Details */}
          <motion.div variants={itemVariants} className={CARD_CLASS}>
            <ReviewSectionHeader
              className="p-6"
              title="Address Details"
              icon={IconMapPoint}
            />
            <div className="space-y-2 p-6">
              <ReviewItem
                label="Address"
                value={address}
                fullWidth={true}
                icon={
                  <IconMapPoint className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <ReviewItem label="City" value={city} />
                <ReviewItem label="District" value={district} />
                <ReviewItem label="Province" value={province} />
              </div>
            </div>
          </motion.div>

          {/* Banking Details */}
          <motion.div variants={itemVariants} className={CARD_CLASS}>
            <ReviewSectionHeader
              title="Bank Details"
              icon={IconBank}
              className="p-6"
            />
            <div className="grid grid-cols-2 gap-2 p-6">
              <ReviewItem
                label="Account Title"
                value={accountTitle}
                fullWidth={true}
                icon={
                  <IconUser className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="Account Number"
                value={accountNumber}
                valueClass="font-mono tracking-wide"
                icon={
                  <IconCard className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="Bank"
                value={BANKS.find((b) => b.value === bankName)?.label as string}
                isHighlighted={true}
                icon={
                  <IconBank className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
            </div>
          </motion.div>

          {/* Certification Details */}
          <motion.div variants={itemVariants} className={CARD_CLASS}>
            <ReviewSectionHeader
              title="Additional Details"
              icon={IconVerify}
              className="p-6"
              badge={
                <>
                  {certified ? (
                    <IconShieldStar className="w-7 h-7 text-cyan-400" />
                  ) : (
                    <IconShieldMinimalistic className="w-7 h-7 text-muted-foreground" />
                  )}
                </>
              }
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-6">
              <ReviewItem
                label="Company"
                value={companyName || "Not specified"}
                valueClass={companyName ? "" : "text-muted-foreground italic"}
                icon={
                  companyName ? (
                    <IconBuildings className="h-3.5 w-3.5 text-muted-foreground/90" />
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
                    <IconUserHeartRounded className="h-3.5 w-3.5 text-muted-foreground/90" />
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
