"use client";

import { useEffect, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { TeamRole } from "@/types/roles";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import Loading from "@/components/ui/loading";
import PageHeader from "@/components/PageHeader";
import InstallerEditModal from "@/components/InstallerEditModal";
import { SimpleDeleteDialog } from "@/components/SimpleDeleteDialog";
import { InstallerAvatar } from "@/components/UserAvatar";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import IconUser from "@/components/icons/User";
import {
  IconActivity,
  IconArrowLeft,
  IconAward,
  IconBoxMinimalistic,
  IconEdit2,
  IconKey,
  IconTrashBin2,
} from "@/components/icons";
import IconUserPlus from "@/components/icons/UserPlus";
import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
  useDropdown,
} from "@/components/ui/dropdown";
import { cn } from "@/lib/utils";
import {
  useInstallerActivities,
  useInstallerDetails,
  useInstallerRewards,
  useResendInstallerPin,
  useRevealInstallerPin,
  useSyncInstallerContact,
  type ResendPinResult,
} from "@/hooks/useInstallerDetails";
import { useDeleteInstaller } from "@/hooks/useInstallers";
import ProfileSidebar from "./ProfileSidebar";
import StatsRow from "./StatsRow";
import ProductsTable, { ProductsTableSkeleton } from "./ProductsTable";
import ActivityTimeline, { ActivityTimelineSkeleton } from "./ActivityTimeline";
import PinDialog from "./PinDialog";

function PageSkeleton() {
  return (
    <div className="flex-1 space-y-6 overflow-auto">
      <div className="ml-6 flex items-center gap-4 py-6">
        <Skeleton round className="size-16" />
        <div className="space-y-3">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[340px_1fr]">
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-col items-center gap-3">
              <Skeleton round className="size-20" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-6 w-32" />
            </div>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2 pt-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="space-y-3 p-5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-28" />
                  <Skeleton className="h-3 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Skeleton className="h-10 w-64 rounded-2xl" />
          <Card>
            <CardContent className="space-y-3 p-5">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KebabIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("size-5", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="5" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="12" cy="19" r="1.75" />
    </svg>
  );
}

// Rendered inside <Dropdown> so it can close the menu after an action fires.
function MenuItem({
  icon,
  label,
  onSelect,
  disabled,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const { close } = useDropdown();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={disabled}
      onClick={() => {
        close();
        onSelect();
      }}
      className={cn(
        "w-full justify-start px-2 py-2 text-sm bg-transparent rounded-lg",
        className,
      )}
    >
      {icon}
      {label}
    </Button>
  );
}

interface InstallerActionsMenuProps {
  showCreateContact: boolean;
  creatingContact: boolean;
  onCreateContact: () => void;
  resendingPin: boolean;
  onResetPin: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isAdmin: boolean;
}

function InstallerActionsMenu({
  showCreateContact,
  creatingContact,
  onCreateContact,
  resendingPin,
  onResetPin,
  onEdit,
  onDelete,
  isAdmin,
}: InstallerActionsMenuProps) {
  return (
    <Dropdown>
      <DropdownTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Installer actions"
          className="border border-border"
        >
          <KebabIcon />
        </Button>
      </DropdownTrigger>
      <DropdownContent align="right" className="w-52">
        <div className="space-y-1 p-2">
          {showCreateContact && (
            <MenuItem
              icon={<IconUserPlus className="mr-2" />}
              label={creatingContact ? "Creating…" : "Create Google Contact"}
              onSelect={onCreateContact}
              disabled={creatingContact}
            />
          )}
          <MenuItem
            icon={<IconKey className="mr-2" />}
            label={resendingPin ? "Sending…" : "Reset PIN"}
            onSelect={onResetPin}
            disabled={resendingPin}
          />
          <MenuItem
            icon={<IconEdit2 className="mr-2" />}
            label="Edit"
            onSelect={onEdit}
          />
        </div>
        {isAdmin && (
          <div className="border-t border-border p-2">
            <MenuItem
              icon={<IconTrashBin2 className="mr-2" />}
              label="Delete"
              onSelect={onDelete}
              className="text-destructive-text hover:bg-red-50 hover:text-destructive-text-hover dark:hover:bg-red-900/20"
            />
          </div>
        )}
      </DropdownContent>
    </Dropdown>
  );
}

export default function InstallerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const installerId = params.id as string;
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pinResult, setPinResult] = useState<ResendPinResult | null>(null);
  const [revealedPin, setRevealedPin] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const detailsQuery = useInstallerDetails(installerId);
  const installer = detailsQuery.data?.installer;
  const statistics = detailsQuery.data?.statistics;

  const rewardsQuery = useInstallerRewards(installer?._id);
  const activitiesQuery = useInstallerActivities(installer?._id);

  const resendPin = useResendInstallerPin(installerId);
  const revealPin = useRevealInstallerPin(installerId);
  const syncContact = useSyncInstallerContact(installerId);
  const deleteInstaller = useDeleteInstaller();

  const isAdmin =
    session?.user?.role === TeamRole.ADMIN ||
    session?.user?.role === TeamRole.MANAGER;

  const handleRevealPin = () => {
    revealPin.mutate(undefined, {
      onSuccess: (pin) => {
        if (!pin) {
          toast.info("No stored PIN — use Reset PIN to generate a new one");
          return;
        }
        setRevealedPin(pin);
      },
      onError: (err) => toast.error(err.message || "Failed to reveal PIN"),
    });
  };

  const handleResendPin = () => {
    resendPin.mutate(undefined, {
      onSuccess: (result) => {
        setPinResult(result);
        setPinDialogOpen(true);
        setRevealedPin(null);
      },
      onError: (err) => toast.error(err.message || "Failed to resend PIN"),
    });
  };

  const handleCreateContact = () => {
    syncContact.mutate(undefined, {
      onSuccess: () => {
        toast.success("Google contact created");
        queryClient.invalidateQueries({ queryKey: ["installer", installerId] });
      },
      onError: (err) =>
        toast.error(err.message || "Failed to create Google contact"),
    });
  };

  const handleDelete = () => {
    deleteInstaller.mutate(installerId, {
      onSuccess: () => {
        toast.success("Installer deleted successfully!");
        router.push("/installers");
      },
      onError: (err) =>
        toast.error(err.message || "Failed to delete installer"),
    });
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["installer", installerId] });
    queryClient.invalidateQueries({ queryKey: ["installers"] });
  };

  // Global refresh (TopNavbar button) — flash the page skeleton, refetch this
  // page's queries, then signal done so the navbar spinner stops.
  useEffect(() => {
    const handleRefresh = async () => {
      setRefreshing(true);
      try {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: ["installer", installerId],
          }),
          queryClient.invalidateQueries({ queryKey: ["installer-rewards"] }),
          queryClient.invalidateQueries({ queryKey: ["installer-activities"] }),
        ]);
      } finally {
        setRefreshing(false);
        window.dispatchEvent(new Event("app:refresh:done"));
      }
    };
    window.addEventListener("app:refresh", handleRefresh);
    return () => window.removeEventListener("app:refresh", handleRefresh);
  }, [queryClient, installerId]);

  const pathname = usePathname();
  const { setOverride, clearOverride } = useBreadcrumb();
  useEffect(() => {
    if (!pathname) return;

    const isLoading = !installer?.installerCode || !installer?.fullName;
    const label = isLoading ? (
      <div className="flex items-center gap-2">
        Loading <Loading />
      </div>
    ) : (
      `${installer.installerCode} ${installer.fullName}`
    );

    setOverride(pathname, {
      label,
      icon: isLoading ? undefined : IconUser,
    });

    return () => clearOverride(pathname);
  }, [pathname, installer, setOverride, clearOverride]);

  if (detailsQuery.isPending || refreshing) {
    return <PageSkeleton />;
  }

  if (detailsQuery.isError || !installer) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex h-96 items-center justify-center">
          <div className="space-y-4 text-center">
            <Alert variant="destructive">
              <AlertDescription>
                {detailsQuery.error?.message || "Installer not found"}
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push("/installers")}>
              Back to Installers
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {installer.fullName}
            {installer.certified && (
              <Badge
                variant="default"
                className="gap-1.5 bg-brand-700 px-3 py-1 hover:bg-brand-800"
              >
                <IconAward className="size-3.5" fill />
                Certified
              </Badge>
            )}
          </span>
        }
        description={`Installer Code: ${installer.installerCode}`}
        action={
          <InstallerActionsMenu
            showCreateContact={!installer.googleContactId}
            creatingContact={syncContact.isPending}
            onCreateContact={handleCreateContact}
            resendingPin={resendPin.isPending}
            onResetPin={handleResendPin}
            onEdit={() => setEditModalOpen(true)}
            onDelete={() => setDeleteDialogOpen(true)}
            isAdmin={isAdmin}
          />
        }
        Icon={
          <>
            <Button
              onClick={() => router.push("/installers")}
              variant="outline"
              aria-label="Back to installers"
              className="nosquircle flex size-16 items-center justify-center rounded-full"
            >
              <IconArrowLeft className="size-5" />
            </Button>
            <InstallerAvatar
              user={installer.fullName}
              className="size-16 bg-muted/30"
            />
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[320px_1fr] xl:grid-cols-[340px_1fr]">
        {/* Left: profile sidebar */}
        <ProfileSidebar
          installer={installer}
          isAdmin={isAdmin}
          revealedPin={revealedPin}
          revealingPin={revealPin.isPending}
          onRevealPin={handleRevealPin}
        />

        {/* Right: stats + tabs */}
        <main className="min-w-0 space-y-6">
          {statistics && <StatsRow statistics={statistics} />}

          <Tabs defaultValue="products">
            <TabsList>
              <TabsTrigger value="products">
                <IconBoxMinimalistic className="mr-2 size-4" duotone />
                Products ({statistics?.totalRewards ?? 0})
              </TabsTrigger>
              <TabsTrigger value="activity">
                <IconActivity className="mr-2 size-4" duotone />
                Activity
              </TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              {rewardsQuery.isPending ? (
                <ProductsTableSkeleton />
              ) : rewardsQuery.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {rewardsQuery.error.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <ProductsTable products={rewardsQuery.data} />
              )}
            </TabsContent>

            <TabsContent value="activity">
              {activitiesQuery.isPending ? (
                <ActivityTimelineSkeleton />
              ) : activitiesQuery.isError ? (
                <Alert variant="destructive">
                  <AlertDescription>
                    {activitiesQuery.error.message}
                  </AlertDescription>
                </Alert>
              ) : (
                <ActivityTimeline activities={activitiesQuery.data} />
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Edit Modal */}
      <InstallerEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        installerId={installerId}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <SimpleDeleteDialog
        open={deleteDialogOpen}
        deleting={deleteInstaller.isPending}
        itemName={`${installer.fullName} (${installer.installerCode})`}
        entityType="installer"
        warningMessage="Installer with rewards cannot be deleted."
        additionalWarning={
          statistics && statistics.totalRewards > 0 ? (
            <span className="mt-2 block font-medium text-destructive">
              ⚠️ This installer has {statistics.totalRewards} reward(s). You
              must delete all rewards first.
            </span>
          ) : undefined
        }
        onConfirm={handleDelete}
        onClose={() => setDeleteDialogOpen(false)}
      />

      {/* PIN Dialog */}
      <PinDialog
        open={pinDialogOpen}
        onOpenChange={setPinDialogOpen}
        pin={pinResult?.pin ?? null}
        whatsappMessage={pinResult?.whatsappMessage ?? null}
        whatsappUrl={pinResult?.whatsappUrl ?? null}
      />
    </div>
  );
}
