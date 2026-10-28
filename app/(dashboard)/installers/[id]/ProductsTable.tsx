"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Loading from "@/components/ui/loading";
import {
  IconBoxMinimalistic,
  IconDangerCircle,
  IconEdit2,
  IconEye,
} from "@/components/icons";
import {
  useBulkRejectRewards,
  type InstallerProduct,
} from "@/hooks/useInstallerDetails";
import Unavailable from "@/components/ui/not-avaiable";
import { toast } from "sonner";
import BulkAccountDialog from "./BulkAccountDialog";

function statusVariant(status: string) {
  if (status === "PAID") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  if (status === "REJECTED") return "outline" as const;
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

interface ProductsTableProps {
  products: InstallerProduct[];
  /** ADMIN/MANAGER only — matches the bulk-account route's role guard. */
  canBulkEdit?: boolean;
  /** Prefill for the bulk dialog: the installer's profile account details. */
  accountDefaults?: {
    bankName?: string;
    accountNumber?: string;
    accountTitle?: string;
  };
}

export default function ProductsTable({
  products,
  canBulkEdit = false,
  accountDefaults = {},
}: ProductsTableProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const bulkReject = useBulkRejectRewards();

  // PAID rewards keep their payee as a historical record — never selectable.
  const editable = useMemo(
    () => products.filter((p) => p.rewardStatus !== "PAID"),
    [products],
  );

  // Selected rewards that can actually be rejected (PENDING/FAILED); the
  // server applies the same rule and skips the rest.
  const rejectableIds = useMemo(
    () =>
      products
        .filter(
          (p) =>
            selected.has(p._id) &&
            (p.rewardStatus === "PENDING" || p.rewardStatus === "FAILED"),
        )
        .map((p) => p._id),
    [products, selected],
  );
  const alreadyRejected = selected.size - rejectableIds.length;

  const handleReject = () =>
    bulkReject.mutate(rejectableIds, {
      onSuccess: (result) => {
        toast.success(result.message);
        setRejectOpen(false);
        setSelected(new Set());
      },
      onError: (err) => toast.error(err.message || "Failed to reject rewards"),
    });

  const allSelected =
    editable.length > 0 && editable.every((p) => selected.has(p._id));

  const toggleOne = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((prev) =>
      prev.size === editable.length ? new Set() : new Set(editable.map((p) => p._id)),
    );
  }, [editable]);

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
    <>
      <Card className="relative">
        <CardContent className="p-0!">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {canBulkEdit && (
                    <TableHead className="w-12 pl-5">
                      <Checkbox
                        checked={allSelected}
                        disabled={editable.length === 0}
                        onCheckedChange={toggleAll}
                        aria-label="Select all editable products"
                      />
                    </TableHead>
                  )}
                  <TableHead className={canBulkEdit ? undefined : "pl-5"}>
                    Serial Number
                  </TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Reward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>TID</TableHead>
                  <TableHead>Installed in</TableHead>
                  <TableHead className="pr-5 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const isPaid = product.rewardStatus === "PAID";
                  const isSelected = selected.has(product._id);
                  return (
                    <TableRow
                      key={product._id}
                      data-state={isSelected ? "selected" : undefined}
                      className="cursor-pointer transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted/50"
                      onClick={() => router.push(`/rewards/${product._id}`)}
                    >
                      {canBulkEdit && (
                        <TableCell
                          className="w-12 pl-5"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        >
                          {isPaid ? (
                            <span
                              className="inline-flex"
                              title="PAID rewards cannot have their account details changed"
                            >
                              <Checkbox
                                checked={false}
                                disabled
                                aria-label={`${product.serialNumber} is PAID and cannot be edited`}
                              />
                            </span>
                          ) : (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleOne(product._id)}
                              aria-label={`Select ${product.serialNumber}`}
                            />
                          )}
                        </TableCell>
                      )}
                      <TableCell
                        className={`font-mono text-sm font-medium ${canBulkEdit ? "" : "pl-5"}`}
                      >
                        {product.serialNumber}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.productModel}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.cityOfInstallation || <Unavailable />}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.bankName ? (
                          <div className="min-w-0">
                            <div className="truncate text-sm text-foreground">
                              {product.bankName}
                            </div>
                            <div className="truncate font-mono text-xs">
                              {product.accountNumber || <Unavailable />}
                            </div>
                          </div>
                        ) : (
                          <Unavailable />
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success-text">
                        Rs. {product.rewardAmount?.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(product.rewardStatus)}>
                          {product.rewardStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {product.transactionId || <Unavailable />}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.installationDate
                          ? new Date(
                              product.installationDate,
                            ).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button
                          variant="secondary"
                          className="h-8 gap-2 pl-2 pr-3"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            router.push(`/rewards/${product._id}`);
                          }}
                        >
                          <IconEye /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>

        {/* Floating bulk action bar — mirrors the rewards list pattern. */}
        <div className="pointer-events-none sticky bottom-4 flex justify-center">
          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-border bg-background/70 p-2 shadow-lg backdrop-blur-md"
              >
                <span className="select-none rounded-xl bg-background px-4 py-2 text-sm leading-none">
                  Selected: {selected.size}
                </span>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setDialogOpen(true)}
                >
                  <IconEdit2 className="size-4" />
                  Edit account details
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  disabled={rejectableIds.length === 0}
                  title={
                    rejectableIds.length === 0
                      ? "Selected products are already rejected"
                      : undefined
                  }
                  onClick={() => setRejectOpen(true)}
                >
                  <IconDangerCircle className="size-4" />
                  Reject
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelected(new Set())}
                >
                  Clear
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      <BulkAccountDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rewardIds={[...selected]}
        defaults={accountDefaults}
        onSuccess={() => setSelected(new Set())}
      />

      <AlertDialog
        open={rejectOpen}
        onOpenChange={(open) => !bulkReject.isPending && setRejectOpen(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Reject {rejectableIds.length} product
              {rejectableIds.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Rejected rewards stay in the rewards list but are excluded from
              all stats, totals and payment files, and the installer won&apos;t
              see them. You can restore each one to Pending from its reward
              page.
              {alreadyRejected > 0 &&
                ` ${alreadyRejected} selected product${alreadyRejected === 1 ? " is" : "s are"} already rejected and will be skipped.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkReject.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkReject.isPending}
              onClick={(e) => {
                // Keep the dialog open until the request settles.
                e.preventDefault();
                handleReject();
              }}
            >
              {bulkReject.isPending ? (
                <>
                  <Loading /> Rejecting…
                </>
              ) : (
                "Reject"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
