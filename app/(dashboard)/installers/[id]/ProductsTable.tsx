"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { IconBoxMinimalistic } from "@/components/icons";
import type { InstallerProduct } from "@/hooks/useInstallerDetails";

function statusVariant(status: string) {
  if (status === "PAID") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  return "destructive" as const;
}

export function ProductsTableSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 p-5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="ml-auto h-5 w-24" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export default function ProductsTable({
  products,
}: {
  products: InstallerProduct[];
}) {
  const router = useRouter();

  if (products.length === 0) {
    return (
      <Card className="min-h-72 flex items-center justify-center">
        <CardContent className="p-12 text-center">
          <IconBoxMinimalistic
            className="mx-auto mb-4 size-12 text-muted-foreground"
            duotone
          />
          <p className="text-muted-foreground">No products installed yet</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Reward claims submitted by this installer will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0!">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-5">Serial Number</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="text-right">Reward</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Installed</TableHead>
                <TableHead className="pr-5 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow
                  key={product._id}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                  onClick={() => router.push(`/rewards/${product._id}`)}
                >
                  <TableCell className="pl-5 font-mono text-sm font-medium">
                    {product.serialNumber}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.productModel}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.cityOfInstallation || "—"}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-success-text">
                    Rs. {product.rewardAmount?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(product.rewardStatus)}>
                      {product.rewardStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.installationDate
                      ? new Date(product.installationDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    <Button
                      variant="link"
                      className="h-auto p-0"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        router.push(`/rewards/${product._id}`);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
