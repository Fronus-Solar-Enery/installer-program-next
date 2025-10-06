'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, DollarSign, Wallet, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface Stats {
  totalInstallers: number;
  totalRewards: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  failedAmount: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalInstallers: 0,
    totalRewards: 0,
    totalAmount: 0,
    pendingAmount: 0,
    paidAmount: 0,
    failedAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [installersRes, rewardsRes] = await Promise.all([
          fetch('/api/installers?limit=1'),
          fetch('/api/rewards?limit=1'),
        ]);

        const installersData = await installersRes.json();
        const rewardsData = await rewardsRes.json();

        const totalAmount = rewardsData.data?.statistics?.reduce(
          (sum: number, stat: any) => sum + (stat.totalAmount || 0),
          0
        ) || 0;

        const pendingAmount = rewardsData.data?.statistics?.find(
          (stat: any) => stat._id === 'PENDING'
        )?.totalAmount || 0;

        const paidAmount = rewardsData.data?.statistics?.find(
          (stat: any) => stat._id === 'PAID'
        )?.totalAmount || 0;

        const failedAmount = rewardsData.data?.statistics?.find(
          (stat: any) => stat._id === 'FAILED'
        )?.totalAmount || 0;

        setStats({
          totalInstallers: installersData.data?.pagination?.total || 0,
          totalRewards: rewardsData.data?.pagination?.total || 0,
          totalAmount,
          pendingAmount,
          paidAmount,
          failedAmount,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-2">Welcome back, {session.user?.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Installers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInstallers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRewards}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rs. {stats.totalAmount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Pending Amount</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">Rs. {stats.pendingAmount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">Paid Amount</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">Rs. {stats.paidAmount.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-900 dark:text-red-100">Failed Amount</CardTitle>
              <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">Rs. {stats.failedAmount.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => router.push('/installers/new')}
                variant="outline"
                className="w-full justify-between"
              >
                <span>Register New Installer</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => router.push('/rewards/new')}
                variant="outline"
                className="w-full justify-between"
              >
                <span>Register New Reward</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => router.push('/reports')}
                variant="outline"
                className="w-full justify-between"
              >
                <span>View Reports</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Pending</span>
                  <span className="text-muted-foreground">
                    {stats.totalAmount > 0 ? Math.round((stats.pendingAmount / stats.totalAmount) * 100) : 0}%
                  </span>
                </div>
                <Progress
                  value={stats.totalAmount > 0 ? (stats.pendingAmount / stats.totalAmount) * 100 : 0}
                  className="h-2"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Paid</span>
                  <span className="text-muted-foreground">
                    {stats.totalAmount > 0 ? Math.round((stats.paidAmount / stats.totalAmount) * 100) : 0}%
                  </span>
                </div>
                <Progress
                  value={stats.totalAmount > 0 ? (stats.paidAmount / stats.totalAmount) * 100 : 0}
                  className="h-2 [&>div]:bg-green-500"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Failed</span>
                  <span className="text-muted-foreground">
                    {stats.totalAmount > 0 ? Math.round((stats.failedAmount / stats.totalAmount) * 100) : 0}%
                  </span>
                </div>
                <Progress
                  value={stats.totalAmount > 0 ? (stats.failedAmount / stats.totalAmount) * 100 : 0}
                  className="h-2 [&>div]:bg-red-500"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
