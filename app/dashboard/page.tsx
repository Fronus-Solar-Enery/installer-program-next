"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo, FC } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  DollarSign,
  Activity,
  UserCheck,
  Target,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/PageHeader";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import IconClockCircle from "@/components/icons/ClockCircle";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import IconChart from "@/components/icons/Chart";
import IconCourseUp from "@/components/icons/CourseUp";
import IconUserCheckRounded from "@/components/icons/UserCheckRounded";
import {
  IconArrowRightUp,
  IconCheck,
  IconCity,
  IconCopy,
  IconGift,
  IconPackage,
  IconProduct,
  IconReferrer,
  IconUser,
  IconUserCog,
} from "@/components/icons";
import { useRelativeTime } from "@/lib/getRelativeTime";
import IconFileSmile from "@/components/icons/FileSmile";
import IconRoundArrowRightUp from "@/components/icons/RoundArrowRightUp";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { InstallerAvatar, UserAvatar } from "@/components/UserAvatar";
import { formatNumber } from "@/lib/formatNumber";
import { useClipboard } from "@/hooks/useCopyToClipboard";

interface Stats {
  totalInstallers: number;
  totalRewards: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  failedAmount: number;
  referrerRewardsTotal: number;
  referrerRewardsPending: number;
  referrerRewardsPaid: number;
  grandTotal: number;
  grandTotalPending: number;
  grandTotalPaid: number;
}

interface ProductData {
  model: string;
  installations: number;
}

interface CityData {
  city: string;
  installations: number;
}

interface ActiveInstallersData {
  period: string;
  count: number;
  label: string;
}

interface ActiveInstaller {
  installerName: string;
  installerCode: string;
  totalProducts: number;
  rewardAmount: number;
  referralRewardAmount: number;
}

interface TrainingCenterActive {
  trainingCenter: string;
  activeInstallersCount: number;
  totalInstallations: number;
}

interface InstallerByCenter {
  installerName: string;
  installerCode: string;
  trainingCenter: string;
  city: string;
  totalProducts: number;
  rewardAmount: number;
  referralRewardAmount: number;
}

interface RecentInstallation {
  _id: string;
  productModel: string;
  serialNumber: string;
  rewardAmount: number;
  installer: {
    installerCode: string;
    fullName: string;
  };
  createdAt: string;
}

interface RecentInstaller {
  _id: string;
  installerCode: string;
  fullName: string;
  city: string;
  createdAt: string;
}

interface ItemWithDate {
  createdAt: string;
  [key: string]: unknown;
}

interface DashboardReward extends ItemWithDate {
  _id: string;
  rewardAmount: number;
  referrerRewardAmount?: number;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  productModel: string;
  cityOfInstallation: string;
  createdAt: string;
  installer?: {
    _id: string;
    installerCode: string;
    fullName: string;
    city: string;
  };
}

interface DashboardInstaller extends ItemWithDate {
  _id: string;
  installerCode: string;
  fullName: string;
  city: string;
  createdAt: string;
}

type TimePeriod =
  | "all"
  | "lastWeek"
  | "last30days"
  | "previousMonth"
  | "thisYear"
  | "previousYear"
  | "custom";

const timeLabels: Record<TimePeriod, string> = {
  all: "All Time",
  lastWeek: "Last Week",
  last30days: "Last 30 Days",
  previousMonth: "Previous Month",
  thisYear: "This Year",
  previousYear: "Previous Year",
  custom: "Custom Range",
};

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("last30days");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalInstallers: 0,
    totalRewards: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
    failedAmount: 0,
    referrerRewardsTotal: 0,
    referrerRewardsPending: 0,
    referrerRewardsPaid: 0,
    grandTotal: 0,
    grandTotalPending: 0,
    grandTotalPaid: 0,
  });
  const [productData, setProductData] = useState<ProductData[]>([]);
  const [cityData, setCityData] = useState<CityData[]>([]);
  const [activeInstallersData, setActiveInstallersData] = useState<
    ActiveInstallersData[]
  >([]);
  const [activeInstallers, setActiveInstallers] = useState<ActiveInstaller[]>(
    []
  );
  const [trainingCenterActive, setTrainingCenterActive] = useState<
    TrainingCenterActive[]
  >([]);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [centerInstallers, setCenterInstallers] = useState<InstallerByCenter[]>(
    []
  );
  const [recentInstallations, setRecentInstallations] = useState<
    RecentInstallation[]
  >([]);
  const [recentInstallers, setRecentInstallers] = useState<RecentInstaller[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const getDateRange = useCallback(
    (period: TimePeriod): { startDate: Date | null; endDate: Date | null } => {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      switch (period) {
        case "all":
          return { startDate: null, endDate: null };

        case "lastWeek":
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          return { startDate: lastWeek, endDate: now };

        case "last30days":
          const last30 = new Date();
          last30.setDate(last30.getDate() - 30);
          return { startDate: last30, endDate: now };

        case "previousMonth":
          const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
          const prevMonthEnd = new Date(
            currentYear,
            currentMonth,
            0,
            23,
            59,
            59
          );
          return { startDate: prevMonthStart, endDate: prevMonthEnd };

        case "thisYear":
          const thisYearStart = new Date(currentYear, 0, 1);
          return { startDate: thisYearStart, endDate: now };

        case "previousYear":
          const prevYearStart = new Date(currentYear - 1, 0, 1);
          const prevYearEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59);
          return { startDate: prevYearStart, endDate: prevYearEnd };

        case "custom":
          if (customStartDate && customEndDate) {
            const start = new Date(customStartDate);
            const end = new Date(customEndDate);
            end.setHours(23, 59, 59, 999);
            return { startDate: start, endDate: end };
          }
          return { startDate: null, endDate: null };

        default:
          return { startDate: null, endDate: null };
      }
    },
    [customStartDate, customEndDate]
  );

  const filterByDateRange = useCallback(
    <T extends ItemWithDate>(
      items: T[],
      dateField: keyof T = "createdAt" as keyof T
    ): T[] => {
      const { startDate, endDate } = getDateRange(timePeriod);

      if (!startDate || !endDate) return items;

      return items.filter((item) => {
        const fieldValue = item[dateField];
        const itemDate = new Date(String(fieldValue));
        return itemDate >= startDate && itemDate <= endDate;
      });
    },
    [timePeriod, getDateRange]
  );

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);

      // Build date range params for active installers API
      const { startDate, endDate } = getDateRange(timePeriod);
      const dateParams =
        startDate && endDate
          ? `?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
          : "";

      const [
        installersRes,
        rewardsRes,
        allRewardsRes,
        allInstallersRes,
        activeInstallersRes,
        trainingCenterRes,
      ] = await Promise.all([
        fetch("/api/installers?limit=5&sortBy=createdAt&sortOrder=desc"),
        fetch("/api/rewards?limit=5&sortBy=createdAt&sortOrder=desc"),
        fetch("/api/rewards?limit=5000"),
        fetch("/api/installers?limit=5000"),
        fetch(`/api/dashboard/active-installers${dateParams}`),
        fetch(`/api/dashboard/active-by-training-center${dateParams}`),
      ]);

      const installersData = await installersRes.json();
      const rewardsData = await rewardsRes.json();
      const allRewards = await allRewardsRes.json();
      const allInstallers = await allInstallersRes.json();
      const activeInstallersData = await activeInstallersRes.json();
      const trainingCenterData = await trainingCenterRes.json();

      // Filter data by date range
      const filteredRewards = filterByDateRange(
        allRewards.data?.rewards || []
      ) as DashboardReward[];
      const filteredInstallers = filterByDateRange(
        allInstallers.data?.installers || []
      ) as DashboardInstaller[];

      // Calculate filtered statistics for installer rewards
      const totalAmount = filteredRewards.reduce(
        (sum: number, reward: DashboardReward) =>
          sum + (reward.rewardAmount || 0),
        0
      );
      const pendingAmount = filteredRewards
        .filter((r: DashboardReward) => r.paymentStatus === "PENDING")
        .reduce(
          (sum: number, r: DashboardReward) => sum + (r.rewardAmount || 0),
          0
        );
      const paidAmount = filteredRewards
        .filter((r: DashboardReward) => r.paymentStatus === "PAID")
        .reduce(
          (sum: number, r: DashboardReward) => sum + (r.rewardAmount || 0),
          0
        );
      const failedAmount = filteredRewards
        .filter((r: DashboardReward) => r.paymentStatus === "FAILED")
        .reduce(
          (sum: number, r: DashboardReward) => sum + (r.rewardAmount || 0),
          0
        );

      // Calculate referrer rewards
      const referrerRewardsTotal = filteredRewards.reduce(
        (sum: number, reward: DashboardReward) =>
          sum + (reward.referrerRewardAmount || 0),
        0
      );
      const referrerRewardsPending = filteredRewards
        .filter((r: DashboardReward) => r.paymentStatus === "PENDING")
        .reduce(
          (sum: number, r: DashboardReward) =>
            sum + (r.referrerRewardAmount || 0),
          0
        );
      const referrerRewardsPaid = filteredRewards
        .filter((r: DashboardReward) => r.paymentStatus === "PAID")
        .reduce(
          (sum: number, r: DashboardReward) =>
            sum + (r.referrerRewardAmount || 0),
          0
        );

      // Calculate grand totals (installer rewards + referrer rewards)
      const grandTotal = totalAmount + referrerRewardsTotal;
      const grandTotalPending = pendingAmount + referrerRewardsPending;
      const grandTotalPaid = paidAmount + referrerRewardsPaid;

      setStats({
        totalInstallers: filteredInstallers.length,
        totalRewards: filteredRewards.length,
        totalAmount,
        pendingAmount,
        paidAmount,
        failedAmount,
        referrerRewardsTotal,
        referrerRewardsPending,
        referrerRewardsPaid,
        grandTotal,
        grandTotalPending,
        grandTotalPaid,
      });

      // Process product installation data from filtered rewards
      const productCounts: { [key: string]: number } = {};
      filteredRewards.forEach((reward: DashboardReward) => {
        const product = reward.productModel;
        productCounts[product] = (productCounts[product] || 0) + 1;
      });

      const productArray = Object.entries(productCounts)
        .map(([model, installations]) => ({
          model: model.length > 25 ? model.substring(0, 25) + "..." : model,
          installations: installations as number,
        }))
        .sort((a, b) => b.installations - a.installations)
        .slice(0, 6);

      setProductData(productArray);

      // Process city data from filtered rewards (product installations by city)
      const cityCounts: { [key: string]: number } = {};
      filteredRewards.forEach((reward: DashboardReward) => {
        const city = reward.cityOfInstallation;
        if (city && city !== "undefined" && city !== "null") {
          cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
      });

      const cityArray = Object.entries(cityCounts)
        .map(([city, installations]) => ({
          city,
          installations: installations as number,
        }))
        .sort((a, b) => b.installations - a.installations)
        .slice(0, 5);

      setCityData(cityArray);

      // Calculate Active Installers for different time periods
      const calculateActiveInstallers = (
        startDate: Date | null,
        endDate: Date | null
      ) => {
        if (!startDate || !endDate) {
          // For "All Time", use all rewards
          const uniqueInstallers = new Set(
            allRewards.data?.rewards
              ?.map((r: DashboardReward) => r.installer?._id)
              .filter(Boolean)
          );
          return uniqueInstallers.size;
        }

        const periodRewards =
          allRewards.data?.rewards?.filter((reward: DashboardReward) => {
            const rewardDate = new Date(reward.createdAt);
            return rewardDate >= startDate && rewardDate <= endDate;
          }) || [];

        const uniqueInstallers = new Set(
          periodRewards
            .map((r: DashboardReward) => r.installer?._id)
            .filter(Boolean)
        );
        return uniqueInstallers.size;
      };

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Last 30 days
      const last30Start = new Date();
      last30Start.setDate(last30Start.getDate() - 30);
      const last30Count = calculateActiveInstallers(last30Start, now);

      // Previous month
      const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
      const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
      const prevMonthCount = calculateActiveInstallers(
        prevMonthStart,
        prevMonthEnd
      );

      // Last 6 months
      const last6MonthsStart = new Date();
      last6MonthsStart.setMonth(last6MonthsStart.getMonth() - 6);
      const last6MonthsCount = calculateActiveInstallers(last6MonthsStart, now);

      // Last year (previous calendar year)
      const lastYearStart = new Date(currentYear - 1, 0, 1);
      const lastYearEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59);
      const lastYearCount = calculateActiveInstallers(
        lastYearStart,
        lastYearEnd
      );

      // Previous year (2024 or current - 1)
      const previousYearStart = new Date(currentYear - 1, 0, 1);
      const previousYearEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59);
      const previousYearCount = calculateActiveInstallers(
        previousYearStart,
        previousYearEnd
      );

      const activeInstallersArray: ActiveInstallersData[] = [
        { period: "last30days", count: last30Count, label: "Last 30 Days" },
        {
          period: "previousMonth",
          count: prevMonthCount,
          label: prevMonthStart.toLocaleString("default", {
            month: "long",
            year: "numeric",
          }),
        },
        {
          period: "last6months",
          count: last6MonthsCount,
          label: "Last 6 Months",
        },
        {
          period: "lastYear",
          count: lastYearCount,
          label: `${currentYear - 1}`,
        },
        {
          period: "previousYear",
          count: previousYearCount,
          label: `${currentYear - 1}`,
        },
      ];

      setActiveInstallersData(activeInstallersArray);

      // Set active installers from API
      setActiveInstallers(activeInstallersData.data || []);

      // Set training center active data
      setTrainingCenterActive(trainingCenterData.data || []);

      setRecentInstallations(rewardsData.data?.rewards || []);
      setRecentInstallers(installersData.data?.installers || []);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  }, [filterByDateRange, getDateRange, timePeriod]);

  const paidCount = useMemo(
    () =>
      stats.totalRewards > 0
        ? Math.round(
            (stats.paidAmount / stats.totalAmount) * stats.totalRewards
          )
        : 0,
    [stats.totalRewards, stats.paidAmount, stats.totalAmount]
  );

  const avgPerProduct = useMemo(
    () =>
      productData.length > 0
        ? Math.round(stats.totalRewards / productData.length)
        : 0,
    [productData.length, stats.totalRewards]
  );

  const grandTotalPaidPercentage = useMemo(
    () =>
      stats.grandTotal > 0
        ? Math.round((stats.grandTotalPaid / stats.grandTotal) * 100)
        : 0,
    [stats.grandTotal, stats.grandTotalPaid]
  );

  const grandTotalPendingPercentage = useMemo(
    () =>
      stats.grandTotal > 0
        ? Math.round((stats.grandTotalPending / stats.grandTotal) * 100)
        : 0,
    [stats.grandTotal, stats.grandTotalPending]
  );

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session, fetchStats]);

  if (!session) {
    return null;
  }

  const chartConfig = {
    installations: {
      label: "Installations",
      color: "var(--color-foreground)",
    },
  } satisfies ChartConfig;

  return (
    <div className="flex-1 overflow-auto space-y-4 mx-auto">
      <PageHeader
        title="Dashboard"
        description="Overview of installer activity, rewards, and performance metrics"
        action={
          <div className="flex items-center gap-3">
            <ToggleGroup
              type="single"
              defaultValue={timePeriod}
              // value={timePeriod}
              onValueChange={(value) => {
                if (!value) return;
                if (value === "custom") {
                  setIsCustomDateOpen(true);
                }
                setTimePeriod(value as TimePeriod);
              }}
            >
              <ToggleGroupItem value="all">ALL</ToggleGroupItem>
              <ToggleGroupItem value="lastWeek">1W</ToggleGroupItem>
              <ToggleGroupItem value="last30days">30D</ToggleGroupItem>
              <ToggleGroupItem value="previousMonth">1M</ToggleGroupItem>
              <ToggleGroupItem value="thisYear">1Y</ToggleGroupItem>
              <ToggleGroupItem value="previousYear">PY</ToggleGroupItem>

              <Popover
                open={isCustomDateOpen}
                onOpenChange={setIsCustomDateOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "hidden sm:flex gap-2 rounded-xl text-zinc-400 px-2"
                    )}
                  >
                    <IconClockCircle className="h-5 w-5" duotone={false} />
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Custom Date Range</h4>
                      <p className="text-xs text-muted-foreground">
                        Select a custom date range for filtering dashboard data
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="start-date" className="text-xs">
                          Start Date
                        </Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          max={customEndDate || undefined}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="end-date" className="text-xs">
                          End Date
                        </Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          min={customStartDate || undefined}
                          max={new Date().toISOString().split("T")[0]}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          if (customStartDate && customEndDate) {
                            setTimePeriod("custom");
                            setIsCustomDateOpen(false);
                          }
                        }}
                        disabled={!customStartDate || !customEndDate}
                      >
                        Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCustomStartDate("");
                          setCustomEndDate("");
                          setTimePeriod("last30days");
                          setIsCustomDateOpen(false);
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </ToggleGroup>
          </div>
        }
      />
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Skeleton className="h-8 w-32" />
        </div>
      ) : (
        <>
          {/* Financial Highlight Section */}
          <Card className="relative overflow-hidden border-border ">
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                {/* Grand Total */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Target className="h-4 w-4" />
                    <span>Total Rewards (Installer + Referrer)</span>
                  </div>
                  <div className="text-4xl font-bold text-primary">
                    Rs. {stats.grandTotal.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">
                        Installer: Rs. {stats.totalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      <span className="text-muted-foreground">
                        Referrer: Rs.{" "}
                        {stats.referrerRewardsTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Paid Amount */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Total Paid</span>
                  </div>
                  <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-500">
                    Rs. {stats.grandTotalPaid.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">
                        Installer: Rs. {stats.paidAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-muted-foreground">
                        Referrer: Rs.{" "}
                        {stats.referrerRewardsPaid.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pending Amount */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Package className="h-4 w-4" />
                    <span>Total Pending</span>
                  </div>
                  <div className="text-4xl font-bold text-orange-600 dark:text-orange-500">
                    Rs. {stats.grandTotalPending.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-muted-foreground">
                        Installer: Rs. {stats.pendingAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      <span className="text-muted-foreground">
                        Referrer: Rs.{" "}
                        {stats.referrerRewardsPending.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Payment Progress</span>
                  <span>{grandTotalPaidPercentage}% Completed</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div className="flex h-full">
                    <div
                      className="bg-emerald-500 transition-all duration-500"
                      style={{ width: `${grandTotalPaidPercentage}%` }}
                    />
                    <div
                      className="bg-orange-500 transition-all duration-500"
                      style={{ width: `${grandTotalPendingPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-muted-foreground">
                      Paid {grandTotalPaidPercentage}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">
                      Pending {grandTotalPendingPercentage}%
                    </span>
                  </div>
                  {stats.failedAmount > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-muted-foreground">
                        Failed Rs. {stats.failedAmount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Grid - Flexible 4 columns */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Total Installers */}
            <Card className="relative overflow-hidden transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Installers
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.totalInstallers}
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">+0%</span>
                  <span className="text-muted-foreground">from last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Installations */}
            <Card className="relative overflow-hidden transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Installations
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalRewards}</div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">+0%</span>
                  <span className="text-muted-foreground">from last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Paid Rewards */}
            <Card className="relative overflow-hidden transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Paid Rewards
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{paidCount}</div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  <ArrowUpRight className="h-3 w-3 text-green-500" />
                  <span className="text-green-500 font-medium">+0%</span>
                  <span className="text-muted-foreground">from last month</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Amount */}
            <Card className="relative overflow-hidden transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Amount
                </CardTitle>
                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  Rs. {(stats.totalAmount / 1000).toFixed(0)}K
                </div>
                <div className="flex items-center gap-1 mt-2 text-xs">
                  <span className="text-muted-foreground">
                    Total rewards distributed
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 1 - Product Installations & Top Performers */}
          <div className="grid gap-4 lg:grid-cols-6">
            {/* Product Installations - Takes 4 columns */}
            <Card className="lg:col-span-3 transition-all hover:shadow-lg">
              <DashboardCardHeader
                title="Product Installations"
                description={`Installation count by product type in ${timeLabels[timePeriod]}`}
                Icon={IconChart}
              />
              <CardContent>
                {productData.length > 0 ? (
                  <>
                    <ChartContainer
                      config={chartConfig}
                      className="min-h-[250px] max-h-[400px] w-full"
                    >
                      <BarChart
                        accessibilityLayer
                        data={productData}
                        layout="vertical"
                        margin={{
                          right: 16,
                        }}
                      >
                        <CartesianGrid horizontal={false} />
                        <YAxis
                          dataKey="model"
                          type="category"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tickFormatter={(value) => value.slice(0, 3)}
                          hide
                        />
                        <XAxis dataKey="installations" type="number" hide />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent indicator="line" hideLabel />
                          }
                        />
                        <Bar
                          dataKey="installations"
                          radius={16}
                          className="fill-primary"
                        >
                          <LabelList
                            dataKey="model"
                            position="insideLeft"
                            offset={14}
                            className="fill-primary-foreground font-semibold"
                            fontSize={12}
                          />
                          <LabelList
                            dataKey="installations"
                            position="right"
                            offset={8}
                            className="fill-foreground"
                            fontSize={12}
                          />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <IconFileSmile
                        fill
                        className="size-20 text-muted-foreground"
                      />
                      <h3 className="text-xl text-primary">
                        No Installation Found
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4 text-center text-balance">
                        You haven&rsquo;t registered any installations. Add
                        first installation to get started.
                      </p>
                      <Button href="/rewards/new" className="gap-2">
                        Add Installation
                        <IconArrowRightUp
                          className="size-4"
                          width={2}
                          duotone={false}
                        />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Installations
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {stats.totalInstallers}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {avgPerProduct} per product
                  </div>
                </div>
              </CardFooter>
            </Card>

            {/* City Wise Installations */}
            <Card className="lg:col-span-3 transition-all hover:shadow-lg">
              <DashboardCardHeader
                title="City Wise Installations"
                description={`Top 5 cities by product installations in ${timeLabels[timePeriod]}`}
                Icon={IconCity}
              />
              <CardContent>
                {cityData.length > 0 ? (
                  <>
                    <ChartContainer
                      config={chartConfig}
                      className="min-h-[250px] max-h-[400px] w-full"
                    >
                      <BarChart
                        accessibilityLayer
                        data={cityData}
                        layout="vertical"
                        margin={{
                          right: 16,
                        }}
                      >
                        <CartesianGrid horizontal={false} />
                        <YAxis
                          dataKey="city"
                          type="category"
                          tickLine={false}
                          tickMargin={10}
                          axisLine={false}
                          tickFormatter={(value) => value.slice(0, 3)}
                          hide
                        />
                        <XAxis dataKey="installations" type="number" hide />
                        <ChartTooltip
                          cursor={false}
                          content={
                            <ChartTooltipContent indicator="line" hideLabel />
                          }
                        />
                        <Bar
                          dataKey="installations"
                          radius={16}
                          className="fill-primary"
                        >
                          <LabelList
                            dataKey="city"
                            position="insideLeft"
                            offset={14}
                            className="fill-primary-foreground font-semibold"
                            fontSize={12}
                          />
                          <LabelList
                            dataKey="installations"
                            position="right"
                            offset={8}
                            className="fill-foreground"
                            fontSize={12}
                          />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <IconFileSmile
                        fill
                        className="size-20 text-muted-foreground"
                      />
                      <h3 className="text-xl text-primary">
                        No City Data Available
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4 text-center text-balance lg:w-3/4">
                        There are no performance records from the previous year
                        yet. Check back once installers start registering
                        installations.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Installations
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold">
                    {stats.totalInstallers}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {avgPerProduct} per product
                  </div>
                </div>
              </CardFooter>
            </Card>
          </div>

          {/* Active Installers by Training Center */}
          <Card className="transition-all hover:shadow-lg">
            <DashboardCardHeader
              title="Active Installers by Training Center"
              description={`Installers with at least 1 installation in ${timeLabels[timePeriod]}`}
              Icon={IconUserCheckRounded}
            />
            <CardContent>
              {trainingCenterActive.length > 0 ? (
                trainingCenterActive.map((center, index) => (
                  <div
                    key={center.trainingCenter}
                    onClick={async () => {
                      setSelectedCenter(center.trainingCenter);
                      setModalOpen(true);

                      // Fetch installers for this training center
                      const { startDate, endDate } = getDateRange(timePeriod);
                      const dateParams =
                        startDate && endDate
                          ? `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
                          : "";

                      const res = await fetch(
                        `/api/dashboard/installers-by-center?trainingCenter=${encodeURIComponent(
                          center.trainingCenter
                        )}${dateParams}`
                      );
                      const data = await res.json();
                      setCenterInstallers(data.data || []);
                    }}
                    className="flex items-center gap-3 p-4 squircle rounded-2xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-full font-bold border border-border shadow-xs",
                        "bg-primary/10 text-primary"
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-base truncate">
                        {center.trainingCenter}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Click to view installers
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-right">
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Active
                        </div>
                        <div className="font-bold text-lg text-primary">
                          {center.activeInstallersCount}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">
                          Installations
                        </div>
                        <div className="font-bold text-lg text-green-600 dark:text-green-500">
                          {center.totalInstallations}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No active installers in selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Charts Row 2 - City Distribution & Active Installers */}
          <div className="grid gap-4 lg:grid-cols-7">
            {/* Active Installers Timeline */}
            {/* Top Performers - Takes 3 columns */}
            <Card className="lg:col-span-3 transition-all hover:shadow-lg flex flex-col">
              <DashboardCardHeader
                title="Top Performers"
                description={`Top 5 installers by installations in ${timeLabels[timePeriod]}`}
                Icon={IconCourseUp}
              />
              <CardContent>
                {activeInstallers.length > 0 ? (
                  <div className="w-full flex items-center">
                    <TopInstallerCarousel activeInstallers={activeInstallers} />
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <IconFileSmile
                        fill
                        className="size-20 text-muted-foreground"
                      />
                      <h3 className="text-xl text-primary">
                        No Data Available
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4 text-center text-balance">
                        There are no performance records from the previous year
                        yet. Check back once installers start registering
                        installations.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-4 border-t border-border flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Total Installations
                </span>
                <div className="text-right">
                  <div className="text-2xl font-bold">{stats.totalRewards}</div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {avgPerProduct} per product
                  </div>
                </div>
              </CardFooter>
            </Card>
            <Card className="transition-all hover:shadow-lg lg:col-span-4 ">
              <DashboardCardHeader
                title="Active Installers Timeline"
                description={`Historical view of installer activity in ${timeLabels[timePeriod]}`}
                Icon={IconUserCheckRounded}
              />
              <CardContent>
                {activeInstallersData.length > 0 ? (
                  <div className="space-y-4">
                    {activeInstallersData.map((period, index) => (
                      <div key={period.period} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium flex-1">
                            {period.label}
                          </span>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="secondary"
                              className="text-xs font-bold"
                            >
                              {period.count} installers
                            </Badge>
                            <span className="text-xs text-muted-foreground min-w-[50px] text-right">
                              {stats.totalInstallers > 0
                                ? Math.round(
                                    (period.count / stats.totalInstallers) * 100
                                  )
                                : 0}
                              %
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                          <div
                            className="h-2 rounded-full transition-all duration-500"
                            style={{
                              width: `${
                                stats.totalInstallers > 0
                                  ? (period.count / stats.totalInstallers) * 100
                                  : 0
                              }%`,
                              backgroundColor: "var(--color-primary)",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="mt-6 pt-4 border-t border-border">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">
                          Total Registered
                        </span>
                        <span className="text-2xl font-bold">
                          {stats.totalInstallers}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                    No active installer data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Activity Row - Recent Activities */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Installations */}
            <Card className="transition-all hover:shadow-lg">
              <DashboardCardHeader
                title="Recent Installations"
                description={`Recent product installations`}
                Icon={IconProduct}
                badge={String(recentInstallations.length)}
              />
              <CardContent>
                <div className="space-y-3">
                  {recentInstallations.length > 0 ? (
                    recentInstallations.map((installation) => {
                      return (
                        <div
                          key={installation._id}
                          className="flex items-center gap-3 p-4 squircle rounded-2xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                        >
                          <div className="h-10 w-10 rounded-full border border-border bg-primary/10 flex items-center justify-center shrink-0">
                            <IconPackage className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {installation.productModel}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {installation.installer?.installerCode || "N/A"}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="font-bold text-sm whitespace-nowrap">
                              Rs. {installation.rewardAmount}
                            </div>
                            <div className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(
                                installation.createdAt
                              ).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No recent installations
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recent Installers */}
            <Card className="transition-all hover:shadow-lg">
              <DashboardCardHeader
                title="Recent Installers"
                description={`Newly registered installers in ${timeLabels[timePeriod]}`}
                Icon={IconUserCog}
                badge={String(recentInstallers.length)}
              />
              <CardContent>
                <div className="space-y-3">
                  {recentInstallers.length > 0 ? (
                    recentInstallers.map((installer) => (
                      <div
                        key={installer._id}
                        className="flex items-center gap-3 p-4 squircle rounded-2xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shrink-0">
                          <IconUser
                            duotone={false}
                            className="size-5 text-blue-500"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {installer.fullName}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {installer.installerCode}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-medium text-sm whitespace-nowrap">
                            {installer.city}
                          </div>
                          <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(installer.createdAt).toLocaleDateString(
                              "en-GB",
                              { day: "numeric", month: "short" }
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No recent installers
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Training Center Installers Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-background rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">{selectedCenter}</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Active installers in selected period
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  ✕
                </Button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <div className="space-y-3">
                {centerInstallers.length > 0 ? (
                  centerInstallers.map((installer, index) => (
                    <div
                      key={installer.installerCode}
                      className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold bg-primary/10 text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base truncate">
                          {installer.installerName}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span className="truncate">
                            {installer.installerCode}
                          </span>
                          <span>•</span>
                          <span className="truncate">{installer.city}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-right">
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Products
                          </div>
                          <div className="font-bold text-lg text-primary">
                            {installer.totalProducts}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">
                            Reward
                          </div>
                          <div className="font-bold text-sm text-green-600 dark:text-green-500">
                            Rs. {installer.rewardAmount.toLocaleString()}
                          </div>
                        </div>
                        {installer.referralRewardAmount > 0 && (
                          <div className="col-span-2">
                            <div className="text-xs text-muted-foreground">
                              Referral Reward
                            </div>
                            <div className="font-semibold text-sm text-purple-600 dark:text-purple-500">
                              Rs.{" "}
                              {installer.referralRewardAmount.toLocaleString()}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading installers...
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DashboardCardHeaderProps {
  title: string;
  description: string;
  Icon: FC<IconProps> | string;
  badge?: string;
}

const DashboardCardHeader: FC<DashboardCardHeaderProps> = ({
  title,
  description,
  Icon,
  badge,
}) => {
  return (
    <CardHeader className="flex flex-row items-center gap-2 border-b border-border text- md:text-left ">
      <div className="flex-1 flex items-center gap-4 mb-0">
        <div className="hidden md:block">
          <Icon className="w-12 h-12 mb-0 text-primary" fill />
        </div>
        <div>
          <CardTitle className="flex items-center font-normal text-xl justify- md:justify-start">
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
      {badge ? (
        <Badge className="hidden md:block" variant={"outline"}>
          {badge}
        </Badge>
      ) : (
        <div className="squircle rounded-xl bg-emerald-100 dark:bg-emerald-950 p-2 hidden md:block">
          <Icon
            duotone={false}
            fill
            className="h-5 w-5 text-emerald-600 dark:text-emerald-400"
          />
        </div>
      )}
    </CardHeader>
  );
};

interface TopInstallerCarouselProps {
  activeInstallers: ActiveInstaller[];
}
const bgVariants = [
  "dark:from-yellow-500/10 from-yellow-200 to-yellow-50/70 dark:to-yellow-500/1",
  "dark:from-slate-500/30 from-slate-200 to-slate-50/70 dark:to-slate-300/1",
  "dark:from-orange-500/10 from-orange-200 to-orange-50/70 dark:to-orange-500/1",
];

const avatarVariants = [
  "dark:bg-yellow-600/50 dark:border-yellow-600 border-yellow-500/60 bg-yellow-400",
  "dark:bg-slate-600 dark:border-slate-400 border-slate-400/40 bg-slate-300",
  "dark:bg-orange-950 dark:border-orange-800 border-orange-400/60 bg-orange-300",
];

const titleColorVariants = [
  "text-yellow-600 dark:text-yellow-400",
  "text-slate-600 dark:text-slate-300",
  "text-orange-600 dark:text-orange-500",
];

const toneVariants = [
  "text-yellow-800/50 dark:text-yellow-300/60",
  "text-slate-800/50 dark:text-slate-300/60",
  "text-orange-800/50 dark:text-orange-500/60",
];

const iconColorVariants = [
  "text-yellow-500 dark:text-yellow-400",
  "text-slate-600 dark:text-slate-400",
  "text-orange-600 dark:text-orange-500",
];

const iconProductTextVariants = [
  "text-yellow-700 dark:text-yellow-200",
  "text-slate-700 dark:text-slate-200",
  "text-orange-700 dark:text-orange-200",
];

const giftIconVariants = [
  "text-yellow-600",
  "text-slate-500",
  "text-orange-600",
];

export const TopInstallerCarousel: FC<TopInstallerCarouselProps> = ({
  activeInstallers,
}) => {
  const { copyToClipboard, copied } = useClipboard();

  // Memoize installers list to avoid re-renders when parent changes unrelated state
  const installers = activeInstallers;

  // Stable click handler factory to avoid inline recreation in map
  const handleCopy = useCallback(
    (code: string) => () => void copyToClipboard(code),
    [copyToClipboard]
  );

  return (
    <Carousel
      opts={{ align: "start" }}
      className="w-full p-4 [&>*]:select-none"
    >
      <CarouselContent>
        {installers.map((installer, index) => {
          const idx = index;
          const isVariant = idx < 3;

          return (
            <CarouselItem
              key={installer.installerCode}
              className="md:basis-1/3 lg:basis-1/2 xl:basis-1/3"
            >
              <Card
                className={cn(
                  "transition-colors flex flex-col items-center py-4 px-2 border-none bg-gradient-to-b",
                  isVariant
                    ? bgVariants[idx]
                    : "from-muted dark:from-muted/70 to-muted/20 dark:to-muted/10"
                )}
              >
                <InstallerAvatar
                  user={installer.installerName}
                  className={cn(
                    "mb-4 size-18 shadow-md font-black font-sans text-xl",
                    isVariant ? avatarVariants[idx] : "bg-muted/50"
                  )}
                />

                <h2
                  className={cn(
                    "text-md font-semibold text-center text-balance mb-6 leading-none",
                    isVariant
                      ? titleColorVariants[idx]
                      : "text-muted-foreground"
                  )}
                >
                  <p>{installer.installerName}</p>

                  <div
                    className={cn(
                      "text-xs text-muted-foreground font-light font-mono",
                      isVariant ? toneVariants[idx] : "text-muted-foreground"
                    )}
                  >
                    <div className="inline-flex items-center">
                      {installer.installerCode}

                      <Button
                        size={"icon"}
                        onClick={handleCopy(installer.installerCode)}
                        className="!p-1 !size-max rounded-sm"
                        variant={"ghost"}
                      >
                        {copied === installer.installerCode ? (
                          <IconCheck className="size-3" duotone={false} />
                        ) : (
                          <IconCopy className="size-3" duotone={false} />
                        )}
                      </Button>
                    </div>
                  </div>
                </h2>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <IconProduct
                      className={cn(
                        "size-10",
                        isVariant
                          ? iconColorVariants[idx]
                          : "text-muted-foreground"
                      )}
                      fill
                    />

                    <div className="space-y-1">
                      <h3
                        className={cn(
                          "text-xs flex items-center gap-2 text-muted-foreground",
                          idx > 2 && "text-muted-foreground"
                        )}
                      >
                        Products
                      </h3>

                      <p
                        className={cn(
                          "text-primary text-xl leading-none font-number",
                          isVariant
                            ? iconProductTextVariants[idx]
                            : "text-muted-foreground"
                        )}
                      >
                        {installer.totalProducts}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <IconGift
                      className={cn(
                        "size-10",
                        isVariant
                          ? giftIconVariants[idx]
                          : "text-muted-foreground"
                      )}
                      fill
                    />

                    <div className="space-y-1">
                      <h3
                        className={cn(
                          "text-xs flex items-center gap-2 text-muted-foreground",
                          idx > 2 && "text-muted-foreground"
                        )}
                      >
                        Rewards
                      </h3>

                      <p
                        className={cn(
                          "text-primary text-xl leading-none font-number",
                          isVariant
                            ? iconProductTextVariants[idx]
                            : "text-muted-foreground"
                        )}
                      >
                        {formatNumber(installer.rewardAmount)}
                      </p>
                    </div>
                  </div>

                  {/* {installer.referralRewardAmount > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <IconReferrer
                          className={cn(
                            "size-10",
                            isVariant
                              ? giftIconVariants[idx]
                              : "text-muted-foreground"
                          )}
                          fill
                        />

                        <div className="space-y-1">
                          <h3
                            className={cn(
                              "text-xs flex items-center gap-2 text-muted-foreground",
                              idx > 2 && "text-muted-foreground"
                            )}
                          >
                            Rewards
                          </h3>

                          <p
                            className={cn(
                              "text-primary text-xl leading-none font-number",
                              isVariant
                                ? iconProductTextVariants[idx]
                                : "text-muted-foreground"
                            )}
                          >
                            {formatNumber(installer.referralRewardAmount)}
                          </p>
                        </div>
                      </div>
                    </>
                  )} */}
                </div>
              </Card>
            </CarouselItem>
          );
        })}
      </CarouselContent>
    </Carousel>
  );
};
