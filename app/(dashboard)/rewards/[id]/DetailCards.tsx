"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CopyButton } from "@/components/CopyButton";
import { InstallerAvatar } from "@/components/UserAvatar";
import { getBankLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  IconArrowRightUp,
  IconAward,
  IconBank,
  IconBoxMinimalistic,
  IconCheckCircle,
  IconClockCircle,
  IconEdit2,
} from "@/components/icons";
import IconUserPlus from "@/components/icons/UserPlus";
import DetailRow from "./DetailRow";
import type { RewardDetails } from "@/hooks/useRewardDetails";
import { RewardStatus } from "@/types/rewards";

function formatDate(
  date?: string,
  opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  },
) {
  if (!date) return undefined;
  return new Date(date).toLocaleDateString("en-US", opts);
}

function SectionCard({
  title,
  Icon,
  children,
  className,
}: {
  title: string;
  Icon: React.ComponentType<IconProps>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("transition-shadow duration-300 hover:shadow-layered", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="size-4 text-muted-foreground" duotone />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function PaymentLedgerCard({ reward }: { reward: RewardDetails }) {
  const isPaid = reward.rewardStatus === RewardStatus.PAID;
  return (
    <SectionCard title="Payment" Icon={IconBank}>
      <dl className="divide-y divide-border">
        <DetailRow
          label="Reward Amount"
          value={`Rs. ${(reward.rewardAmount ?? 0).toLocaleString()}`}
          valueClassName="text-base font-semibold text-success-text tabular-nums"
        />
        <DetailRow label="Bank" value={getBankLabel(reward.bankName || "")} />
        <DetailRow
          label="Account #"
          value={reward.accountNumber}
          mono
          copyLabel="Account Number"
        />
        <DetailRow label="Account Title" value={reward.accountTitle} />
        <DetailRow
          label="Transaction ID"
          value={reward.transactionId}
          mono
          copyLabel="Transaction ID"
          valueClassName={isPaid ? "font-medium" : undefined}
        />
        <DetailRow label="Payment Method" value={reward.paymentMethod} />
        <DetailRow label="Sending Date" value={formatDate(reward.sendingDate)} />
      </dl>
    </SectionCard>
  );
}

export function ProductPassportCard({ reward }: { reward: RewardDetails }) {
  return (
    <SectionCard title="Product" Icon={IconBoxMinimalistic}>
      <dl className="divide-y divide-border">
        <DetailRow label="Product Model" value={reward.productModel} valueClassName="font-medium" />
        <DetailRow
          label="Serial #"
          value={reward.serialNumber}
          mono
          copyLabel="Serial Number"
        />
        <DetailRow
          label="Inverter Serial"
          value={reward.inverterSerialNumber}
          mono
          copyLabel="Inverter Serial Number"
        />
        <DetailRow label="City" value={reward.cityOfInstallation} />
        <DetailRow
          label="Installation Date"
          value={formatDate(reward.installationDate, {
            month: "long",
            year: "numeric",
          })}
        />
      </dl>
    </SectionCard>
  );
}

export function InstallerCapsule({ reward }: { reward: RewardDetails }) {
  const installer = reward.installer;
  const code = reward.installerCode || installer?.installerCode;

  return (
    <Card className="group relative transition-shadow duration-300 hover:shadow-layered">
      <CardContent className="p-5">
        <div className="flex items-center gap-4">
          <InstallerAvatar
            user={installer?.fullName || code || "?"}
            className="size-12 shrink-0 bg-muted/30"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold leading-tight">
              {installer ? (
                <Link
                  href={`/installers/${installer._id}`}
                  className="after:absolute after:inset-0"
                >
                  {installer.fullName}
                </Link>
              ) : (
                "Installer not linked"
              )}
            </p>
            {code && (
              <div className="mt-0.5 flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                {code}
                {/* CopyButton sits above the stretched link */}
                <span className="relative z-10">
                  <CopyButton text={code} label="Installer Code" />
                </span>
              </div>
            )}
          </div>
          {installer && (
            <IconArrowRightUp
              className="size-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              duotone
            />
          )}
        </div>
        {installer && (
          <dl className="mt-4 divide-y divide-border border-t border-border pt-1">
            <DetailRow label="CNIC" value={installer.cnic} mono />
            <DetailRow label="Phone" value={installer.phoneNumber} />
            <DetailRow label="District" value={installer.district} />
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

export function ReferrerSplitCard({ reward }: { reward: RewardDetails }) {
  const referrer = reward.referrer;
  if (!referrer) return null;

  return (
    <SectionCard title="Referrer Split" Icon={IconUserPlus}>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              <Link
                href={`/installers/${referrer._id}`}
                className="underline-offset-4 hover:underline"
              >
                {referrer.fullName}
              </Link>
            </p>
            <p className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              {reward.referrerCode || referrer.installerCode}
              <CopyButton
                text={reward.referrerCode || referrer.installerCode || ""}
                label="Referrer Code"
              />
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-semibold text-success-text tabular-nums">
              Rs. {(reward.referrerRewardAmount ?? 0).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Referral reward</p>
          </div>
        </div>
        {reward.referrerTransactionId && (
          <dl className="border-t border-border pt-1">
            <DetailRow
              label="Transaction ID"
              value={reward.referrerTransactionId}
              mono
              copyLabel="Referrer Transaction ID"
            />
          </dl>
        )}
      </div>
    </SectionCard>
  );
}

export function AuditTrail({ reward }: { reward: RewardDetails }) {
  const events: {
    key: string;
    Icon: React.ComponentType<IconProps>;
    title: string;
    by?: string;
    date?: string;
    tone: string;
  }[] = [];

  events.push({
    key: "registered",
    Icon: IconAward,
    title: "Claim registered",
    by: reward.registeredBy?.name,
    date: reward.createdAt,
    tone: "bg-muted text-muted-foreground ring-border",
  });

  if (
    reward.updatedAt &&
    reward.createdAt &&
    reward.updatedAt !== reward.createdAt
  ) {
    events.push({
      key: "updated",
      Icon: IconEdit2,
      title: "Last updated",
      by: reward.updatedBy?.name,
      date: reward.updatedAt,
      tone: "bg-brandsec-500/20 text-brandsec-800 dark:text-brandsec-300 ring-brandsec-500/20",
    });
  }

  if (reward.rewardStatus === RewardStatus.PAID && reward.sendingDate) {
    events.push({
      key: "paid",
      Icon: IconCheckCircle,
      title: "Payment sent",
      date: reward.sendingDate,
      tone: "bg-success/10 text-success-text ring-success/20",
    });
  }

  return (
    <SectionCard title="History" Icon={IconClockCircle}>
      <ol className="relative space-y-4" aria-label="Reward history">
        <div
          aria-hidden
          className="absolute bottom-3 left-[15px] top-3 w-px bg-border"
        />
        {events.map(({ key, Icon, title, by, date, tone }) => (
          <li key={key} className="flex items-center gap-3">
            <span
              className={cn(
                "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-background",
                tone,
              )}
            >
              <Icon className="size-4" duotone />
            </span>
            <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
              <p className="text-sm font-medium">
                {title}
                {by && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    by {by}
                  </span>
                )}
              </p>
              {date && (
                <time
                  dateTime={date}
                  className="text-xs text-muted-foreground"
                >
                  {formatDate(date, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              )}
            </div>
          </li>
        ))}
      </ol>
    </SectionCard>
  );
}
