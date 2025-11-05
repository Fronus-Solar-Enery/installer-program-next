import { memo } from "react";
import { Users, CheckCircle, XCircle, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface Statistics {
  total: number;
  certified: number;
  notCertified: number;
  cities: number;
  provinces: number;
  trainingCenters: number;
  filtered: number;
}

interface StatisticsCardsProps {
  statistics: Statistics;
}

function StatisticsCardsComponent({ statistics }: StatisticsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Installers
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.total}</div>
          {statistics.total !== statistics.filtered && (
            <p className="text-xs text-muted-foreground mt-1">
              {statistics.filtered} filtered
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Certified</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.certified}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {statistics.total > 0
              ? Math.round((statistics.certified / statistics.total) * 100)
              : 0}
            % of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Not Certified</CardTitle>
          <XCircle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.notCertified}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {statistics.total > 0
              ? Math.round((statistics.notCertified / statistics.total) * 100)
              : 0}
            % of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Locations</CardTitle>
          <MapPin className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{statistics.cities}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {statistics.provinces} provinces, {statistics.trainingCenters}{" "}
            training centers
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export const StatisticsCards = memo(StatisticsCardsComponent);
