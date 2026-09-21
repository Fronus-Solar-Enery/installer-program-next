"use client";

import { useMemo, useState, type ComponentType } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHOD } from "@/lib/constants";
import {
  IconDocument,
  IconDocumentDownload,
  IconFilter,
  IconMoney,
  IconProfile2user,
  IconRefresh,
  IconShieldMinimalistic,
} from "@/components/icons";
import { toast } from "sonner";

type ReportScope = "reward" | "installer" | "nonCertified";
type ReportIcon = ComponentType<{ className?: string; duotone?: boolean }>;

interface ReportDefinition {
  id:
    | "installers"
    | "complete-installers"
    | "rewards"
    | "payment-format"
    | "bulk-update-template"
    | "non-certified-installers";
  title: string;
  description: string;
  scope: ReportScope;
  icon: ReportIcon;
}

interface ReportFilters {
  rewardStatus: string;
  paymentMethod: string;
  productModel: string;
  city: string;
  province: string;
  certified: string;
  startDate: string;
  endDate: string;
  sendingStart: string;
  sendingEnd: string;
}

const INITIAL_FILTERS: ReportFilters = {
  rewardStatus: "ALL",
  paymentMethod: "all",
  productModel: "",
  city: "",
  province: "",
  certified: "all",
  startDate: "",
  endDate: "",
  sendingStart: "",
  sendingEnd: "",
};

const REPORTS: ReportDefinition[] = [
  {
    id: "rewards",
    title: "Rewards ledger",
    description: "All reward records, payment details, and registration data.",
    scope: "reward",
    icon: IconDocument,
  },
  {
    id: "payment-format",
    title: "Payment file",
    description: "Bank-ready sheet for pending and failed reward payments.",
    scope: "reward",
    icon: IconMoney,
  },
  {
    id: "bulk-update-template",
    title: "Payment update template",
    description: "Pre-filled sheet for recording payment transaction IDs.",
    scope: "reward",
    icon: IconRefresh,
  },
  {
    id: "installers",
    title: "Installer directory",
    description: "Installer profiles, contact details, certification, and banking data.",
    scope: "installer",
    icon: IconProfile2user,
  },
  {
    id: "complete-installers",
    title: "Installer submissions",
    description: "Installer profiles joined with every registered product submission.",
    scope: "installer",
    icon: IconDocumentDownload,
  },
  {
    id: "non-certified-installers",
    title: "Non-certified contacts",
    description: "Contact list for installer certification follow-up.",
    scope: "nonCertified",
    icon: IconShieldMinimalistic,
  },
];

function localDayBoundary(value: string, endOfDay = false): string | null {
  if (!value) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00"}`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default function ReportsPage() {
  const [filters, setFilters] = useState<ReportFilters>(INITIAL_FILTERS);
  const [downloadingReport, setDownloadingReport] = useState<string | null>(
    null,
  );

  const activeFilterCount = useMemo(
    () =>
      Object.entries(filters).filter(([key, value]) => {
        if (key === "rewardStatus") return value !== "ALL";
        if (key === "paymentMethod" || key === "certified") {
          return value !== "all";
        }
        return Boolean(value);
      }).length,
    [filters],
  );

  const setFilter = <Key extends keyof ReportFilters>(
    key: Key,
    value: ReportFilters[Key],
  ) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const buildReportParams = (report: ReportDefinition) => {
    const params = new URLSearchParams({ format: "excel" });
    const startDate = localDayBoundary(filters.startDate);
    const endDate = localDayBoundary(filters.endDate, true);

    if (filters.city) params.set("city", filters.city);
    if (filters.province) params.set("province", filters.province);
    if (startDate) params.set("startDate", startDate);
    if (endDate) params.set("endDate", endDate);

    if (report.scope === "installer") {
      if (filters.certified !== "all") {
        params.set("certified", filters.certified);
      }
      return params;
    }

    if (report.scope === "nonCertified") return params;

    const isPaymentReport =
      report.id === "payment-format" || report.id === "bulk-update-template";
    if (
      filters.rewardStatus !== "ALL" &&
      (!isPaymentReport ||
        filters.rewardStatus === "PENDING" ||
        filters.rewardStatus === "FAILED")
    ) {
      params.set("rewardStatus", filters.rewardStatus);
    }
    if (filters.paymentMethod !== "all") {
      params.set("paymentMethod", filters.paymentMethod);
    }
    if (filters.productModel) params.set("productModel", filters.productModel);

    const sendingStart = localDayBoundary(filters.sendingStart);
    const sendingEnd = localDayBoundary(filters.sendingEnd, true);
    if (sendingStart) params.set("sendingStart", sendingStart);
    if (sendingEnd) params.set("sendingEnd", sendingEnd);

    return params;
  };

  const downloadReport = async (report: ReportDefinition) => {
    setDownloadingReport(report.id);
    try {
      const response = await fetch(
        `/api/reports/${report.id}?${buildReportParams(report).toString()}`,
      );
      if (!response.ok) throw new Error("Report download failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${report.id}_report.xlsx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${report.title} downloaded`);
    } catch {
      toast.error("The report could not be downloaded. Please try again.");
    } finally {
      setDownloadingReport(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Reports</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Export exactly the records you need for reward operations, payment
            processing, and installer follow-up.
          </p>
        </div>
        <Badge variant="outline" className="h-7 w-fit gap-1.5 px-2.5">
          <IconFilter className="size-4" />
          {activeFilterCount
            ? `${activeFilterCount} filter${activeFilterCount === 1 ? "" : "s"} applied`
            : "All records"}
        </Badge>
      </header>

      <Card className="border-primary/15 bg-primary/[0.025] dark:bg-primary/[0.04]">
        <CardHeader className="gap-2 border-b border-border/70">
          <div className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconFilter className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Export filters</CardTitle>
              <CardDescription>
                Filters are forwarded to each compatible export when you download it.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 pt-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="report-reward-status">Reward status</Label>
            <Select
              value={filters.rewardStatus}
              onValueChange={(value) => setFilter("rewardStatus", value)}
            >
              <SelectTrigger id="report-reward-status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-payment-method">Payment method</Label>
            <Select
              value={filters.paymentMethod}
              onValueChange={(value) => setFilter("paymentMethod", value)}
            >
              <SelectTrigger id="report-payment-method"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {PAYMENT_METHOD.map((method) => (
                  <SelectItem key={method.value} value={method.value}>{method.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-certification">Installer certification</Label>
            <Select value={filters.certified} onValueChange={(value) => setFilter("certified", value)}>
              <SelectTrigger id="report-certification"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any status</SelectItem>
                <SelectItem value="true">Certified</SelectItem>
                <SelectItem value="false">Not certified</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-product-model">Product model</Label>
            <Input id="report-product-model" value={filters.productModel} onChange={(event) => setFilter("productModel", event.target.value)} placeholder="Any product model" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-city">City</Label>
            <Input id="report-city" value={filters.city} onChange={(event) => setFilter("city", event.target.value)} placeholder="Any city" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-province">Province</Label>
            <Input id="report-province" value={filters.province} onChange={(event) => setFilter("province", event.target.value)} placeholder="Any province" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-start-date">Registered from</Label>
            <Input id="report-start-date" type="date" value={filters.startDate} max={filters.endDate || undefined} onChange={(event) => setFilter("startDate", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-end-date">Registered to</Label>
            <Input id="report-end-date" type="date" value={filters.endDate} min={filters.startDate || undefined} onChange={(event) => setFilter("endDate", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-sending-start">Sent from</Label>
            <Input id="report-sending-start" type="date" value={filters.sendingStart} max={filters.sendingEnd || undefined} onChange={(event) => setFilter("sendingStart", event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="report-sending-end">Sent to</Label>
            <Input id="report-sending-end" type="date" value={filters.sendingEnd} min={filters.sendingStart || undefined} onChange={(event) => setFilter("sendingEnd", event.target.value)} />
          </div>
          <div className="flex items-end xl:col-span-2">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setFilters(INITIAL_FILTERS)} disabled={!activeFilterCount}>Reset filters</Button>
          </div>
        </CardContent>
      </Card>

      <section aria-labelledby="available-reports" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 id="available-reports" className="text-lg font-semibold">Available exports</h2>
            <p className="text-sm text-muted-foreground">Payment exports include pending and failed rewards; choose one of those statuses to narrow them further.</p>
          </div>
          <Badge variant="secondary" className="shrink-0">{REPORTS.length} reports</Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {REPORTS.map((report) => {
            const Icon = report.icon;
            const isDownloading = downloadingReport === report.id;
            return (
              <Card key={report.id} className="flex min-h-56 flex-col transition-colors duration-200 hover:border-primary/35">
                <CardHeader className="gap-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-primary"><Icon className="size-5" duotone /></div>
                    <Badge variant="outline" className="text-xs">Excel</Badge>
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Button className="w-full gap-2" onClick={() => downloadReport(report)} disabled={Boolean(downloadingReport)}>
                    <IconDocumentDownload className="size-4" />
                    {isDownloading ? "Preparing export…" : "Download Excel"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
