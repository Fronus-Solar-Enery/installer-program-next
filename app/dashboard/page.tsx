'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, Package, DollarSign, TrendingUp, Activity, UserCheck, MapPin, Award, CreditCard, Target, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/PageHeader';

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
  name: string;
  count: number;
}

interface CityData {
  city: string;
  count: number;
}

interface ActiveInstallersData {
  period: string;
  count: number;
  label: string;
}

interface TopInstaller {
  installerCode: string;
  fullName: string;
  city: string;
  totalRewards: number;
  totalAmount: number;
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

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

type TimePeriod = 'all' | 'last30days' | 'previousMonth' | 'lastYear' | 'previousYear';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('last30days');
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
  const [activeInstallersData, setActiveInstallersData] = useState<ActiveInstallersData[]>([]);
  const [topInstallers, setTopInstallers] = useState<TopInstaller[]>([]);
  const [recentInstallations, setRecentInstallations] = useState<RecentInstallation[]>([]);
  const [recentInstallers, setRecentInstallers] = useState<RecentInstaller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const getDateRange = (period: TimePeriod): { startDate: Date | null; endDate: Date | null } => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (period) {
      case 'all':
        return { startDate: null, endDate: null };

      case 'last30days':
        const last30 = new Date();
        last30.setDate(last30.getDate() - 30);
        return { startDate: last30, endDate: now };

      case 'previousMonth':
        const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const prevMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59);
        return { startDate: prevMonthStart, endDate: prevMonthEnd };

      case 'lastYear':
        const lastYearStart = new Date(currentYear - 1, 0, 1);
        const lastYearEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59);
        return { startDate: lastYearStart, endDate: lastYearEnd };

      case 'previousYear':
        const prevYearStart = new Date(currentYear - 1, 0, 1);
        const prevYearEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59);
        return { startDate: prevYearStart, endDate: prevYearEnd };

      default:
        return { startDate: null, endDate: null };
    }
  };

  const filterByDateRange = (items: any[], dateField: string = 'createdAt') => {
    const { startDate, endDate } = getDateRange(timePeriod);

    if (!startDate || !endDate) return items;

    return items.filter((item) => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const getPeriodLabel = (period: TimePeriod): string => {
    const now = new Date();
    const currentYear = now.getFullYear();

    switch (period) {
      case 'all':
        return 'All Time';
      case 'last30days':
        return 'Last 30 Days';
      case 'previousMonth':
        const prevMonth = new Date(currentYear, now.getMonth() - 1);
        return prevMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
      case 'lastYear':
        return `${currentYear - 1}`;
      case 'previousYear':
        return `${currentYear - 1}`;
      default:
        return 'Last 30 Days';
    }
  };

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session, timePeriod]);

  const fetchStats = async () => {
      try {
        setLoading(true);
        const [installersRes, rewardsRes, allRewardsRes, allInstallersRes] = await Promise.all([
          fetch('/api/installers?limit=5&sortBy=createdAt&sortOrder=desc'),
          fetch('/api/rewards?limit=5&sortBy=createdAt&sortOrder=desc'),
          fetch('/api/rewards?limit=5000'),
          fetch('/api/installers?limit=5000'),
        ]);

        const installersData = await installersRes.json();
        const rewardsData = await rewardsRes.json();
        const allRewards = await allRewardsRes.json();
        const allInstallers = await allInstallersRes.json();

        // Filter data by date range
        const filteredRewards = filterByDateRange(allRewards.data?.rewards || []);
        const filteredInstallers = filterByDateRange(allInstallers.data?.installers || []);

        // Calculate filtered statistics for installer rewards
        const totalAmount = filteredRewards.reduce((sum: number, reward: any) => sum + (reward.rewardAmount || 0), 0);
        const pendingAmount = filteredRewards
          .filter((r: any) => r.paymentStatus === 'PENDING')
          .reduce((sum: number, r: any) => sum + (r.rewardAmount || 0), 0);
        const paidAmount = filteredRewards
          .filter((r: any) => r.paymentStatus === 'PAID')
          .reduce((sum: number, r: any) => sum + (r.rewardAmount || 0), 0);
        const failedAmount = filteredRewards
          .filter((r: any) => r.paymentStatus === 'FAILED')
          .reduce((sum: number, r: any) => sum + (r.rewardAmount || 0), 0);

        // Calculate referrer rewards
        const referrerRewardsTotal = filteredRewards.reduce((sum: number, reward: any) => sum + (reward.referrerRewardAmount || 0), 0);
        const referrerRewardsPending = filteredRewards
          .filter((r: any) => r.paymentStatus === 'PENDING')
          .reduce((sum: number, r: any) => sum + (r.referrerRewardAmount || 0), 0);
        const referrerRewardsPaid = filteredRewards
          .filter((r: any) => r.paymentStatus === 'PAID')
          .reduce((sum: number, r: any) => sum + (r.referrerRewardAmount || 0), 0);

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
        filteredRewards.forEach((reward: any) => {
          const product = reward.productModel;
          productCounts[product] = (productCounts[product] || 0) + 1;
        });

        const productArray = Object.entries(productCounts)
          .map(([name, count]) => ({
            name: name.length > 25 ? name.substring(0, 25) + '...' : name,
            count: count as number,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 6);

        setProductData(productArray);

        // Process city data from filtered rewards (product installations by city)
        const cityCounts: { [key: string]: number } = {};
        filteredRewards.forEach((reward: any) => {
          const city = reward.cityOfInstallation;
          if (city && city !== 'undefined' && city !== 'null') {
            cityCounts[city] = (cityCounts[city] || 0) + 1;
          }
        });

        const cityArray = Object.entries(cityCounts)
          .map(([city, count]) => ({
            city,
            count: count as number,
          }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setCityData(cityArray);

        // Calculate Active Installers for different time periods
        const calculateActiveInstallers = (startDate: Date | null, endDate: Date | null) => {
          if (!startDate || !endDate) {
            // For "All Time", use all rewards
            const uniqueInstallers = new Set(
              allRewards.data?.rewards?.map((r: any) => r.installer?._id).filter(Boolean)
            );
            return uniqueInstallers.size;
          }

          const periodRewards = allRewards.data?.rewards?.filter((reward: any) => {
            const rewardDate = new Date(reward.createdAt);
            return rewardDate >= startDate && rewardDate <= endDate;
          }) || [];

          const uniqueInstallers = new Set(
            periodRewards.map((r: any) => r.installer?._id).filter(Boolean)
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
        const prevMonthCount = calculateActiveInstallers(prevMonthStart, prevMonthEnd);

        // Last 6 months
        const last6MonthsStart = new Date();
        last6MonthsStart.setMonth(last6MonthsStart.getMonth() - 6);
        const last6MonthsCount = calculateActiveInstallers(last6MonthsStart, now);

        // Last year (previous calendar year)
        const lastYearStart = new Date(currentYear - 1, 0, 1);
        const lastYearEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59);
        const lastYearCount = calculateActiveInstallers(lastYearStart, lastYearEnd);

        // Previous year (2024 or current - 1)
        const previousYearStart = new Date(currentYear - 1, 0, 1);
        const previousYearEnd = new Date(currentYear - 1, 11, 31, 23, 59, 59);
        const previousYearCount = calculateActiveInstallers(previousYearStart, previousYearEnd);

        const activeInstallersArray: ActiveInstallersData[] = [
          { period: 'last30days', count: last30Count, label: 'Last 30 Days' },
          {
            period: 'previousMonth',
            count: prevMonthCount,
            label: prevMonthStart.toLocaleString('default', { month: 'long', year: 'numeric' })
          },
          { period: 'last6months', count: last6MonthsCount, label: 'Last 6 Months' },
          { period: 'lastYear', count: lastYearCount, label: `${currentYear - 1}` },
          { period: 'previousYear', count: previousYearCount, label: `${currentYear - 1}` },
        ];

        setActiveInstallersData(activeInstallersArray);

        // Calculate top installers from filtered rewards
        const installerStats: { [key: string]: { installer: any; count: number; amount: number } } = {};
        filteredRewards.forEach((reward: any) => {
          const installerId = reward.installer?._id;
          if (!installerId) return;

          if (!installerStats[installerId]) {
            installerStats[installerId] = {
              installer: reward.installer,
              count: 0,
              amount: 0,
            };
          }
          installerStats[installerId].count += 1;
          installerStats[installerId].amount += reward.rewardAmount || 0;
        });

        const topInstallersArray = Object.values(installerStats)
          .map((stat) => ({
            installerCode: stat.installer.installerCode,
            fullName: stat.installer.fullName,
            city: stat.installer.city || 'N/A',
            totalRewards: stat.count,
            totalAmount: stat.amount,
          }))
          .sort((a, b) => b.totalRewards - a.totalRewards)
          .slice(0, 5);

        setTopInstallers(topInstallersArray);

        setRecentInstallations(rewardsData.data?.rewards || []);
        setRecentInstallers(installersData.data?.installers || []);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const pieData = [
    { name: 'Paid', value: stats.paidAmount, color: '#10b981' },
    { name: 'Pending', value: stats.pendingAmount, color: '#f59e0b' },
    { name: 'Failed', value: stats.failedAmount, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const totalRewardsCount = stats.totalRewards;
  const paidCount = stats.totalRewards > 0 ? Math.round((stats.paidAmount / stats.totalAmount) * stats.totalRewards) : 0;

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Dashboard"
        description="Overview of installer activity, rewards, and performance metrics"
        action={
          <div className="flex items-center gap-3">
            <Select value={timePeriod} onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
              <SelectTrigger className="w-[200px]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="last30days">Last 30 Days</SelectItem>
                <SelectItem value="previousMonth">Previous Month</SelectItem>
                <SelectItem value="lastYear">Last Year</SelectItem>
                <SelectItem value="previousYear">Previous Year (2024)</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="hidden sm:flex gap-1">
              {getPeriodLabel(timePeriod)}
            </Badge>
          </div>
        }
      />
      <div className="container mx-auto p-6 space-y-6">

        {/* Financial Highlight Section */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-primary/20">
          <CardContent className="p-6">
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
                    <span className="text-muted-foreground">Installer: Rs. {stats.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-muted-foreground">Referrer: Rs. {stats.referrerRewardsTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Paid Amount */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Paid</span>
                </div>
                <div className="text-4xl font-bold text-green-600 dark:text-green-500">
                  Rs. {stats.grandTotalPaid.toLocaleString()}
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Installer: Rs. {stats.paidAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-muted-foreground">Referrer: Rs. {stats.referrerRewardsPaid.toLocaleString()}</span>
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
                    <span className="text-muted-foreground">Installer: Rs. {stats.pendingAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-orange-500" />
                    <span className="text-muted-foreground">Referrer: Rs. {stats.referrerRewardsPending.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Payment Progress</span>
                <span>{stats.grandTotal > 0 ? Math.round((stats.grandTotalPaid / stats.grandTotal) * 100) : 0}% Completed</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div className="flex h-full">
                  <div
                    className="bg-green-500 transition-all duration-500"
                    style={{ width: `${stats.grandTotal > 0 ? (stats.grandTotalPaid / stats.grandTotal) * 100 : 0}%` }}
                  />
                  <div
                    className="bg-orange-500 transition-all duration-500"
                    style={{ width: `${stats.grandTotal > 0 ? (stats.grandTotalPending / stats.grandTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-muted-foreground">Paid {stats.grandTotal > 0 ? Math.round((stats.grandTotalPaid / stats.grandTotal) * 100) : 0}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-muted-foreground">Pending {stats.grandTotal > 0 ? Math.round((stats.grandTotalPending / stats.grandTotal) * 100) : 0}%</span>
                </div>
                {stats.failedAmount > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-muted-foreground">Failed Rs. {stats.failedAmount.toLocaleString()}</span>
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Installers
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalInstallers}</div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500 font-medium">+0%</span>
                <span className="text-muted-foreground">from last month</span>
              </div>
            </CardContent>
          </Card>

          {/* Total Installations */}
          <Card className="relative overflow-hidden transition-all hover:shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16" />
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-500/10 to-transparent rounded-full -mr-16 -mt-16" />
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
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Amount
              </CardTitle>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">Rs. {(stats.totalAmount / 1000).toFixed(0)}K</div>
              <div className="flex items-center gap-1 mt-2 text-xs">
                <span className="text-muted-foreground">Total rewards distributed</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 - Product Installations & Top Performers */}
        <div className="grid gap-4 lg:grid-cols-7">
          {/* Product Installations - Takes 4 columns */}
          <Card className="lg:col-span-4 transition-all hover:shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Product Installations
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Installation count by product type
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="ml-auto">Top 6</Badge>
              </div>
            </CardHeader>
            <CardContent>
              {productData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={productData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        angle={-15}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <span className="text-sm font-medium text-muted-foreground">Total Installations</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{stats.totalRewards}</div>
                      <div className="text-xs text-muted-foreground">
                        Avg: {productData.length > 0 ? Math.round(stats.totalRewards / productData.length) : 0} per product
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  No installation data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Performers - Takes 3 columns */}
          <Card className="lg:col-span-3 transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                Top Performers
              </CardTitle>
              <CardDescription>Best performing installers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topInstallers.length > 0 ? (
                  topInstallers.map((installer, index) => (
                    <div
                      key={installer.installerCode}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-colors",
                        index === 0 && "bg-gradient-to-r from-yellow-500/10 to-transparent",
                        index === 1 && "bg-gradient-to-r from-gray-400/10 to-transparent",
                        index === 2 && "bg-gradient-to-r from-orange-600/10 to-transparent",
                        index > 2 && "bg-muted/50 hover:bg-muted"
                      )}
                    >
                      <div className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold text-sm",
                        index === 0 && "bg-yellow-500/20 text-yellow-600 dark:text-yellow-500",
                        index === 1 && "bg-gray-400/20 text-gray-600 dark:text-gray-400",
                        index === 2 && "bg-orange-600/20 text-orange-600 dark:text-orange-500",
                        index > 2 && "bg-primary/10 text-primary"
                      )}>
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{installer.fullName}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <span className="truncate">{installer.installerCode}</span>
                          <span>•</span>
                          <span className="truncate">{installer.city}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-primary">{installer.totalRewards}</div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">rewards</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 - City Distribution & Active Installers */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* City Distribution */}
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                City Distribution
              </CardTitle>
              <CardDescription>Top 5 cities by product installations</CardDescription>
            </CardHeader>
            <CardContent>
              {cityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={cityData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis
                      dataKey="city"
                      type="category"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  No city data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Installers */}
          <Card className="transition-all hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Active Installers
              </CardTitle>
              <CardDescription>Installers with at least 1 installation in period</CardDescription>
            </CardHeader>
            <CardContent>
              {activeInstallersData.length > 0 ? (
                <div className="space-y-4">
                  {activeInstallersData.map((period, index) => (
                    <div key={period.period} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium flex-1">{period.label}</span>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="text-xs font-bold">
                            {period.count} installers
                          </Badge>
                          <span className="text-xs text-muted-foreground min-w-[50px] text-right">
                            {stats.totalInstallers > 0 ? Math.round((period.count / stats.totalInstallers) * 100) : 0}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${stats.totalInstallers > 0 ? (period.count / stats.totalInstallers) * 100 : 0}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Total Registered</span>
                      <span className="text-2xl font-bold">{stats.totalInstallers}</span>
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    Recent Installations
                  </CardTitle>
                  <CardDescription>Latest product installations</CardDescription>
                </div>
                <Badge variant="outline">{recentInstallations.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentInstallations.length > 0 ? (
                  recentInstallations.map((installation) => (
                    <div
                      key={installation._id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{installation.productModel}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {installation.installer?.installerCode || 'N/A'}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-sm whitespace-nowrap">Rs. {installation.rewardAmount}</div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(installation.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                    </div>
                  ))
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
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Recent Installers
                  </CardTitle>
                  <CardDescription>Newly registered installers</CardDescription>
                </div>
                <Badge variant="outline">{recentInstallers.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentInstallers.length > 0 ? (
                  recentInstallers.map((installer) => (
                    <div
                      key={installer._id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{installer.fullName}</div>
                        <div className="text-xs text-muted-foreground truncate">{installer.installerCode}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-medium text-sm whitespace-nowrap">{installer.city}</div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(installer.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
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
      </div>
    </div>
  );
}
