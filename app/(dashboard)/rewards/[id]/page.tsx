"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Loading from "@/components/ui/loading";
import PageHeader from "@/components/PageHeader";
import { CopyButton } from "@/components/CopyButton";
import { SimpleDeleteDialog } from "@/components/SimpleDeleteDialog";
import RewardEditModal from "@/components/RewardEditModal";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import { TeamRole } from "@/types/roles";
import {
  IconArrowLeft,
  IconAward,
  IconEdit2,
  IconTrashBin2,
} from "@/components/icons";
import { useDeleteReward, useRewardDetails } from "@/hooks/useRewardDetails";
import {
  deriveRewardPageState,
  getPaymentBlockers,
  getPendingDays,
} from "@/lib/rewardPageState";
import RewardStatusHero from "./RewardStatusHero";
import MarkPaidDialog from "./MarkPaidDialog";
import {
  AuditTrail,
  InstallerCapsule,
  PaymentLedgerCard,
  ProductPassportCard,
  ReferrerSplitCard,
} from "./DetailCards";

const SPRING = { type: "spring", stiffness: 260, damping: 28 } as const;

function PageSkeleton() {
  return (
    <div className="flex-1 space-y-6 overflow-auto">
      <div className="ml-6 flex items-center gap-4 py-6">
        <Skeleton round className="size-16" />
        <div className="space-y-3">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      {/* Hero */}
      <Card>
        <CardContent className="space-y-5 p-5 lg:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-4 w-56" />
            </div>
            <Skeleton className="h-11 w-40 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
      {/* Two-column body */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="lg:self-start">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-4">
              <Skeleton round className="size-12" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RewardDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const rewardId = params.id as string;
  const { data: session } = useSession();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [markPaidOpen, setMarkPaidOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const rewardQuery = useRewardDetails(rewardId);
  const reward = rewardQuery.data;
  const deleteReward = useDeleteReward(rewardId);
  const reduceMotion = useReducedMotion();

  const canDelete =
    session?.user?.role === TeamRole.ADMIN ||
    session?.user?.role === TeamRole.MANAGER;

  const pathname = usePathname();
  const { setOverride, clearOverride } = useBreadcrumb();
  useEffect(() => {
    if (!pathname) return;
    const label = reward ? (
      `${reward.productModel} ${reward.serialNumber}`
    ) : (
      <div className="flex items-center gap-2">
        Loading <Loading />
      </div>
    );
    setOverride(pathname, { label, icon: reward ? IconAward : undefined });
    return () => clearOverride(pathname);
  }, [pathname, reward, setOverride, clearOverride]);

  if (rewardQuery.isPending) {
    return <PageSkeleton />;
  }

  if (rewardQuery.isError || !reward) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex h-96 items-center justify-center">
          <div className="space-y-4 text-center">
            <Alert variant="destructive">
              <AlertDescription>
                {rewardQuery.error?.message || "Reward not found"}
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/rewards")}>
              Back to Rewards
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const pageState = deriveRewardPageState(reward);
  const blockers = getPaymentBlockers(reward);
  const pendingDays = getPendingDays(reward);

  const handleDeleteConfirm = () => {
    deleteReward.mutate(undefined, {
      onSuccess: () => router.push("/rewards"),
      onSettled: () => setDeleteDialogOpen(false),
    });
  };

  return (
    <div className="flex-1 space-y-6">
      <PageHeader
        title={reward.productModel}
        description={
          <span className="flex items-center gap-2 font-mono text-muted-foreground">
            <CopyButton text={reward.serialNumber} label="Serial Number" />
            {reward.serialNumber}
          </span>
        }
        action={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setEditModalOpen(true)}
              className="pl-3"
            >
              <IconEdit2 className="mr-2" />
              Edit
            </Button>
            {canDelete && (
              <Button
                variant="destructive"
                onClick={() => setDeleteDialogOpen(true)}
                className="pl-3"
              >
                <IconTrashBin2 className="mr-2 size-4" />
                Delete
              </Button>
            )}
          </div>
        }
        Icon={
          <Button
            onClick={() => router.push("/rewards")}
            variant="outline"
            aria-label="Back to rewards"
            className="nosquircle flex size-16 items-center justify-center rounded-full"
          >
            <IconArrowLeft className="size-5" />
          </Button>
        }
      />

      <RewardStatusHero
        reward={reward}
        state={pageState}
        pendingDays={pendingDays}
        blockers={blockers}
        onMarkPaid={() => setMarkPaidOpen(true)}
        onEdit={() => setEditModalOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main: the money story */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING}
          className="min-w-0 space-y-6"
        >
          <PaymentLedgerCard reward={reward} />
          <ProductPassportCard reward={reward} />
          <AuditTrail reward={reward} />
        </motion.div>

        {/* Context rail: who */}
        <motion.aside
          aria-label="Reward context"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: reduceMotion ? 0 : 0.05 }}
          className="space-y-6 lg:sticky lg:top-4 lg:self-start"
        >
          <InstallerCapsule reward={reward} />
          <ReferrerSplitCard reward={reward} />
        </motion.aside>
      </div>

      <RewardEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        rewardId={rewardId}
        onSuccess={() =>
          queryClient.invalidateQueries({ queryKey: ["reward", rewardId] })
        }
      />

      <MarkPaidDialog
        open={markPaidOpen}
        onOpenChange={setMarkPaidOpen}
        reward={reward}
        retry={pageState === "failed"}
        edit={pageState === "paid"}
      />

      <SimpleDeleteDialog
        open={deleteDialogOpen}
        deleting={deleteReward.isPending}
        itemName={reward.serialNumber}
        entityType="reward"
        warningMessage="The reward will be permanently removed from the database."
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
