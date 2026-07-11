"use client";

import { motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Loading from "@/components/ui/loading";
import { CopyButton } from "@/components/CopyButton";
import { InstallerAvatar } from "@/components/UserAvatar";
import { getBankLabel } from "@/lib/constants";
import {
  IconAward,
  IconBank,
  IconBuildings2,
  IconCalendar,
  IconEye,
  IconMapPoint,
  IconSmartphone2,
  IconWhatsapp,
} from "@/components/icons";
import IconUserPlus from "@/components/icons/UserPlus";
import type { InstallerDetails } from "@/hooks/useInstallerDetails";

function SectionHeading({
  Icon,
  children,
}: {
  Icon: React.ComponentType<IconProps>;
  children: React.ReactNode;
}) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="size-3.5" duotone />
      {children}
    </h3>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 first:pt-0 last:pb-0">
      <dt className="shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right text-sm font-medium">{children}</dd>
    </div>
  );
}

interface ProfileSidebarProps {
  installer: InstallerDetails;
  isAdmin: boolean;
  revealedPin: string | null;
  revealingPin: boolean;
  onRevealPin: () => void;
}

export default function ProfileSidebar({
  installer,
  isAdmin,
  revealedPin,
  revealingPin,
  onRevealPin,
}: ProfileSidebarProps) {
  const reduceMotion = useReducedMotion();
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <motion.aside
      aria-label="Installer profile"
      initial={reduceMotion ? false : { opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 220, damping: 26 }}
      className="lg:sticky lg:top-4 lg:self-start"
    >
      <Card className="overflow-hidden shadow-layered">
        {/* Identity */}
        <CardContent className="p-5">
          <div className="flex flex-col items-center gap-3 text-center">
            <InstallerAvatar
              user={installer.fullName}
              className="size-20 bg-muted/30"
            />
            <div className="min-w-0 space-y-1">
              <h2 className="text-lg font-semibold leading-tight">
                {installer.fullName}
              </h2>
              {installer.companyName && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                  <IconBuildings2 className="size-3.5" duotone />
                  {installer.companyName}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-bold">
                {installer.installerCode}
                <CopyButton
                  text={installer.installerCode}
                  label="Installer Code"
                />
              </span>
              {installer.certified && (
                <Badge variant="success" className="gap-1">
                  <IconAward className="size-3" fill />
                  Certified
                </Badge>
              )}
            </div>
            {isAdmin && (
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 font-mono text-xs font-bold tracking-widest">
                PIN: {revealedPin ?? "••••••"}
                {revealedPin ? (
                  <CopyButton text={revealedPin} label="PIN" />
                ) : (
                  <button
                    type="button"
                    onClick={onRevealPin}
                    disabled={revealingPin}
                    className="text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                    aria-label="Reveal PIN"
                  >
                    {revealingPin ? (
                      <Loading className="size-3.5" />
                    ) : (
                      <IconEye className="size-3.5" />
                    )}
                  </button>
                )}
              </span>
            )}
            <Badge variant="secondary" className="text-[10px]">
              CNIC: {installer.cnic}
            </Badge>
          </div>
        </CardContent>

        {/* Contact */}
        <CardContent className="border-t border-border p-5">
          <SectionHeading Icon={IconSmartphone2}>Contact</SectionHeading>
          <div className="mt-3 space-y-2">
            <a
              href={`tel:${installer.phoneNumber}`}
              className="group flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <IconSmartphone2
                  className="size-4 shrink-0 text-muted-foreground"
                  duotone
                />
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground">Phone</div>
                  <div className="truncate text-sm font-medium">
                    {installer.phoneNumber}
                  </div>
                </div>
              </div>
              <CopyButton text={installer.phoneNumber} label="Phone Number" />
            </a>
            <a
              href={`https://wa.me/${installer.whatsappNumber?.replace(/\+/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-between gap-3 rounded-lg bg-muted/30 p-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-ring"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <IconWhatsapp
                  className="size-4 shrink-0 text-success-text"
                  duotone
                />
                <div className="min-w-0">
                  <div className="text-[11px] text-muted-foreground">
                    WhatsApp
                  </div>
                  <div className="truncate text-sm font-medium">
                    {installer.whatsappNumber}
                  </div>
                </div>
              </div>
              <CopyButton
                text={installer.whatsappNumber}
                label="WhatsApp Number"
              />
            </a>
          </div>
        </CardContent>

        {/* Location */}
        <CardContent className="border-t border-border p-5">
          <SectionHeading Icon={IconMapPoint}>Location</SectionHeading>
          <dl className="mt-2 divide-y divide-border">
            <FieldRow label="City">{installer.city}</FieldRow>
            <FieldRow label="District">{installer.district}</FieldRow>
            <FieldRow label="Province">{installer.province}</FieldRow>
            <FieldRow label="Address">
              <span className="block break-words text-sm font-normal leading-snug">
                {installer.address}
              </span>
            </FieldRow>
          </dl>
        </CardContent>

        {/* Banking */}
        <CardContent className="border-t border-border p-5">
          <SectionHeading Icon={IconBank}>Banking</SectionHeading>
          <dl className="mt-2 divide-y divide-border">
            <FieldRow label="Bank">
              {getBankLabel(installer.bankName) || "-"}
            </FieldRow>
            <FieldRow label="Account #">
              <span className="inline-flex items-center gap-1.5 font-mono">
                {installer.accountNumber}
                <CopyButton
                  text={installer.accountNumber}
                  label="Account Number"
                />
              </span>
            </FieldRow>
            <FieldRow label="Title">{installer.accountTitle}</FieldRow>
          </dl>
        </CardContent>

        {/* Referrer */}
        {installer.referrer && (
          <CardContent className="border-t border-border p-5">
            <SectionHeading Icon={IconUserPlus}>Referred By</SectionHeading>
            <div className="mt-3 flex items-center gap-3 rounded-lg bg-muted/30 p-2.5">
              <InstallerAvatar
                user={installer.referrer.fullName}
                className="size-9 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">
                  {installer.referrer.fullName}
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                  {installer.referrer.installerCode}
                  <CopyButton
                    text={installer.referrer.installerCode}
                    label="Referrer Code"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}

        {/* Registration meta */}
        <CardContent className="border-t border-border bg-muted/20 p-5">
          <SectionHeading Icon={IconCalendar}>Registration</SectionHeading>
          <dl className="mt-2 divide-y divide-border">
            <FieldRow label="Registered By">
              {installer.registeredBy?.name || "N/A"}
              {installer.registeredBy?.email && (
                <span className="block text-xs font-normal text-muted-foreground">
                  {installer.registeredBy.email}
                </span>
              )}
            </FieldRow>
            <FieldRow label="Created">
              {formatDate(installer.createdAt)}
            </FieldRow>
            {installer.updatedAt && (
              <FieldRow label="Updated">
                {formatDate(installer.updatedAt)}
              </FieldRow>
            )}
          </dl>
        </CardContent>
      </Card>
    </motion.aside>
  );
}
