import React from "react";
import { TrendingUp, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatisticsCardsProps {
  statistics: {
    totalRewards: number;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    uniqueInstallersCount: number;
    byStatus: {
      PAID: number;
      PENDING: number;
      FAILED: number;
    };
  };
}

export const RewardsStatisticsCards = React.memo<StatisticsCardsProps>(
  ({ statistics }) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalRewards}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Rs. {statistics.totalAmount.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rs. {statistics.paidAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.byStatus.PAID} paid rewards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Amount
            </CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              Rs. {statistics.pendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.byStatus.PENDING} pending rewards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unique Installers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statistics.uniqueInstallersCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.byStatus.FAILED > 0 &&
                `${statistics.byStatus.FAILED} failed`}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
);

RewardsStatisticsCards.displayName = "RewardsStatisticsCards";
