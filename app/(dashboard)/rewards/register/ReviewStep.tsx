import { motion } from "motion/react";
import { useProducts } from "@/hooks/useProducts";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HyperText } from "@/components/ui/hypertext";
import { cn } from "@/lib/utils";
import { getBankLabel } from "@/lib/constants";
import { StepHeader } from "@/components/StepHeader";
import { ReviewSectionHeader } from "./ReviewSectionHeader";
import { ReviewItem } from "./ReviewItem";
import {
  IconUserId,
  IconMapPoint,
  IconBank,
  IconCard,
  IconUserHeartRounded,
  IconBuildings,
  IconProduct,
  IconSerialNumber,
  IconCalendarMinimalistic,
} from "@/components/icons";
import IconUser from "@/components/icons/User";
import IconVerify from "@/components/icons/Verify";

interface InstallerData {
  _id: string;
  installerCode: string;
  fullName: string;
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
}

interface ReviewStepProps {
  serialNumber: string;
  inverterSerialNumber: string;
  isBatteryProduct: boolean;
  productModel: string;
  rewardAmount: number;
  cityOfInstallation: string;
  installerData: InstallerData | null;
  installationMonthYear: string;
}

const CARD_CLASS =
  "bg-card/95 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow duration-300 ring-1 ring-inset ring-border/5";

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

export function ReviewStep(props: ReviewStepProps) {
  const {
    serialNumber,
    inverterSerialNumber,
    isBatteryProduct,
    productModel,
    rewardAmount,
    cityOfInstallation,
    installerData,
    installationMonthYear,
  } = props;

  const { data: products = [] } = useProducts();
  const selectedProductLabel =
    products.find((p) => p.value === productModel)?.label || productModel;

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
          description="Verify all details before registering the new reward"
        />

        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2 xl:gap-6">
          {/* Serial Number Card */}
          <motion.div
            variants={itemVariants}
            className={cn(CARD_CLASS, "col-span-2")}
          >
            <ReviewSectionHeader
              className="p-6"
              title="Product Serial Number"
              icon={IconSerialNumber}
            />
            <div className="p-6">
              <div className="flex justify-center mb-4">
                <Card className="bg-background p-6 rounded-3xl relative flex items-center justify-center group gap-2">
                  <HyperText className="pointer-events-none leading-5 text-2xl tracking-widest">
                    {serialNumber}
                  </HyperText>
                </Card>
              </div>

              <div className="text-center text-sm text-muted-foreground">
                <p>
                  This serial number has been validated and is ready for reward
                  registration.
                </p>
                <p>
                  It will be linked to installer{" "}
                  <span className="font-medium text-foreground">
                    {installerData?.installerCode}
                  </span>{" "}
                  for reward tracking.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Installer Details */}
          <motion.div
            variants={itemVariants}
            className={cn(CARD_CLASS, "col-span-2")}
          >
            <ReviewSectionHeader
              title="Installer Details"
              icon={IconUser}
              className="p-6"
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-6">
              <ReviewItem
                label="Installer Code"
                value={installerData?.installerCode || "N/A"}
                valueClass="font-mono tracking-wide"
                isHighlighted={true}
                icon={
                  <IconUserId className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="Name"
                value={installerData?.fullName || "N/A"}
                icon={
                  <IconUser className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="City"
                value={installerData?.city || "N/A"}
                icon={
                  <IconMapPoint className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="Company"
                value={installerData?.companyName || "Not specified"}
                valueClass={
                  installerData?.companyName
                    ? ""
                    : "text-muted-foreground italic"
                }
                icon={
                  installerData?.companyName ? (
                    <IconBuildings className="h-3.5 w-3.5 text-muted-foreground/90" />
                  ) : undefined
                }
              />
            </div>
          </motion.div>

          {/* Product Details */}
          <motion.div
            variants={itemVariants}
            className={cn(CARD_CLASS, "col-span-2 lg:col-span-1")}
          >
            <ReviewSectionHeader
              className="p-6"
              title="Product Details"
              icon={IconVerify}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-6">
              <ReviewItem
                label="Product Model"
                value={selectedProductLabel}
                fullWidth={true}
                isHighlighted={true}
                icon={
                  <IconProduct className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              {isBatteryProduct && (
                <ReviewItem
                  label="Inverter Serial"
                  value={inverterSerialNumber}
                  valueClass="font-mono tracking-wide"
                  fullWidth={true}
                  icon={
                    <IconSerialNumber className="h-3.5 w-3.5 text-muted-foreground/90" />
                  }
                />
              )}
              <ReviewItem
                label="Installation City"
                value={cityOfInstallation}
                fullWidth={true}
                icon={
                  <IconMapPoint className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="Installation Date"
                value={installationMonthYear}
                valueClass="text-muted-foreground"
                icon={
                  <IconCalendarMinimalistic className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="Reward Amount"
                value={`Rs. ${rewardAmount.toLocaleString()}`}
                valueClass="text-green-600 font-semibold"
                icon={
                  <IconCard className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
            </div>
          </motion.div>

          {/* Banking Details */}
          <motion.div
            variants={itemVariants}
            className={cn(CARD_CLASS, "col-span-2 lg:col-span-1")}
          >
            <ReviewSectionHeader
              title="Payment Details"
              icon={IconBank}
              className="p-6"
            />
            <div className="grid gap-2 p-6">
              <ReviewItem
                label="Account Title"
                value={installerData?.accountTitle || "N/A"}
                fullWidth={true}
                icon={
                  <IconUser className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="Account Number"
                value={installerData?.accountNumber || "N/A"}
                valueClass="font-mono tracking-wide"
                icon={
                  <IconCard className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
              <ReviewItem
                label="Bank"
                value={getBankLabel(installerData?.bankName ?? "")}
                isHighlighted={true}
                icon={
                  <IconBank className="h-3.5 w-3.5 text-muted-foreground/90" />
                }
              />
            </div>
          </motion.div>

          {/* Referral Information (if applicable) */}
          {installerData?.referrer && (
            <motion.div variants={itemVariants} className={CARD_CLASS}>
              <ReviewSectionHeader
                title="Referral Details"
                icon={IconUserHeartRounded}
                className="p-6"
              />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-6">
                <ReviewItem
                  label="Referrer Name"
                  value={installerData?.referrer?.fullName}
                  fullWidth={true}
                  icon={
                    <IconUser className="h-3.5 w-3.5 text-muted-foreground/90" />
                  }
                />
                <ReviewItem
                  label="Referrer Code"
                  value={installerData?.referrer?.installerCode}
                  valueClass="font-mono tracking-wide"
                  isHighlighted={true}
                  icon={
                    <IconUserId className="h-3.5 w-3.5 text-muted-foreground/90" />
                  }
                />
                <ReviewItem
                  label="Referral Reward"
                  value="Rs. 500"
                  valueClass="text-green-600 font-semibold"
                  icon={
                    <IconCard className="h-3.5 w-3.5 text-muted-foreground/90" />
                  }
                />
              </div>
              <div className="px-6 pb-6">
                <p className="text-xs text-muted-foreground text-center">
                  The referrer will automatically receive Rs. 500 for this
                  product registration.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
