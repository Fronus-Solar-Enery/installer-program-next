"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Check,
  Edit,
  Trash2,
  Award,
  TrendingUp,
  Activity as ActivityIcon,
  Package,
  UserPlus,
  User,
  Clock,
  AlertCircle,
  Phone,
  MapPin,
  Landmark,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { TeamRole } from "@/types/roles";
import PageHeader from "@/components/PageHeader";
import InstallerEditModal from "@/components/InstallerEditModal";
import { useBreadcrumb } from "@/contexts/BreadcrumbContext";
import IconUser from "@/components/icons/User";
import Loading from "@/components/ui/loading";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/CopyButton";
import { IconArrowLeft, IconEdit2, IconTrashBin2 } from "@/components/icons";
import { InstallerAvatar } from "@/components/UserAvatar";
import { SimpleDeleteDialog } from "@/components/SimpleDeleteDialog";

interface InstallerDetails {
  _id: string;
  installerCode: string;
  fullName: string;
  cnic: string;
  phoneNumber: string;
  whatsappNumber: string;
  address: string;
  city: string;
  province: string;
  district: string;
  companyName?: string;
  bankName: string;
  accountNumber: string;
  accountTitle: string;
  certified: boolean;
  referrerCode?: string;
  createdAt: string;
  updatedAt?: string;
  referrer?: {
    installerCode: string;
    fullName: string;
  };
  registeredBy?: {
    name: string;
    email: string;
  };
}

interface Statistics {
  totalRewards: number;
  pendingRewards: number;
  paidRewards: number;
  failedRewards: number;
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  failedAmount: number;
}

interface ActivityLog {
  _id: string;
  type: string;
  description: string;
  createdAt: string;
  targetName?: string;
  metadata?: {
    changes?: Record<string, { before: unknown; after: unknown }>;
    whatsappNumber?: string;
    errorMessage?: string;
    [key: string]: unknown;
  };
  performedBy?: {
    name: string;
  };
}

interface Product {
  _id: string;
  serialNumber: string;
  productModel: string;
  cityOfInstallation?: string;
  installationDate?: string;
  rewardAmount: number;
  rewardStatus: string;
  transactionId?: string;
  createdAt: string;
}

export default function InstallerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const installerId = params.id as string;

  const { data: session } = useSession();

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [installer, setInstaller] = useState<InstallerDetails | null>(null);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resendingPin, setResendingPin] = useState(false);

  const handleResendPin = async () => {
    setResendingPin(true);
    try {
      const res = await fetch(`/api/installers/${installerId}/resend-pin`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("New PIN sent via WhatsApp");
      } else {
        toast.error(data.error || data.message || "Failed to resend PIN");
      }
    } catch {
      toast.error("Failed to resend PIN");
    } finally {
      setResendingPin(false);
    }
  };

  const fetchInstaller = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/installers/${installerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch installer");
      }

      setInstaller(data.data.installer);
      setStatistics(data.data.statistics);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch installer",
      );
    } finally {
      setLoading(false);
    }
  }, [installerId]);

  useEffect(() => {
    fetchInstaller();
  }, [fetchInstaller]);

  const fetchActivities = async () => {
    if (!installer) return;

    try {
      setLoadingActivities(true);

      // Fetch installer-specific activities using the MongoDB _id
      const installerActivitiesRes = await fetch(
        `/api/activities?targetType=Installer&targetId=${installer._id}&limit=100`,
      );
      const installerActivitiesData = await installerActivitiesRes.json();

      // Fetch all reward activities for this installer's rewards
      const productsRes = await fetch(
        `/api/rewards?installer=${installer._id}&limit=1000`,
      );
      const productsData = await productsRes.json();

      let allActivities: ActivityLog[] = [];

      // Add installer activities
      if (installerActivitiesData.success) {
        allActivities = [...installerActivitiesData.data.activities];
      }

      // Fetch reward activities for each product
      if (productsData.success && productsData.data.rewards.length > 0) {
        const rewardIds = productsData.data.rewards.map((r: Product) => r._id);

        // Fetch activities for all rewards
        const rewardActivitiesPromises = rewardIds.map((rewardId: string) =>
          fetch(
            `/api/activities?targetType=InstallerReward&targetId=${rewardId}&limit=100`,
          ).then((res) => res.json()),
        );

        const rewardActivitiesResults = await Promise.all(
          rewardActivitiesPromises,
        );

        rewardActivitiesResults.forEach((result) => {
          if (result.success) {
            allActivities = [...allActivities, ...result.data.activities];
          }
        });
      }

      // Sort all activities by date (newest first)
      allActivities.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setActivities(allActivities);
    } catch (err) {
      console.error("Failed to fetch activities:", err);
    } finally {
      setLoadingActivities(false);
    }
  };

  const fetchProducts = async () => {
    if (!installer) return;

    try {
      setLoadingProducts(true);
      const response = await fetch(
        `/api/rewards?installer=${installer._id}&limit=1000`,
      );
      const data = await response.json();

      if (data.success) {
        setProducts(data.data.rewards);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`/api/installers/${installerId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Installer deleted successfully!");
        router.push("/installers");
      } else {
        toast.error(data.error || "Failed to delete installer");
      }
    } catch (error) {
      console.error("Failed to delete installer:", error);
      toast.error("An error occurred while deleting the installer");
    } finally {
      setDeleting(false);
    }
  };

  // Check if user is admin
  const isAdmin =
    session?.user?.role === TeamRole.ADMIN ||
    session?.user?.role === TeamRole.MANAGER;

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

  if (loading) {
    return (
      <div className="flex-1 overflow-auto space-y-4">
        <div className="flex items-center gap-4 py-6 ml-6">
          <Skeleton round className="size-16" />
          <div className="space-y-3">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !installer) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                {error || "Installer not found"}
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
    <div className="flex-1 overflow-auto space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            {installer.fullName}
            {installer.certified && (
              <Badge
                variant="default"
                className="bg-brand-700 hover:bg-brand-800 gap-1.5 px-3 py-1"
              >
                <Award className="h-3.5 w-3.5" />
                Certified
              </Badge>
            )}
          </span>
        }
        description={`Installer Code: ${installer.installerCode}`}
        action={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleResendPin}
              disabled={resendingPin}
              title="Generate a new login PIN and send it to the installer via WhatsApp (also unlocks a locked account)"
            >
              {resendingPin ? "Sending…" : "Reset PIN"}
            </Button>
            <Button onClick={() => setEditModalOpen(true)} variant="default">
              <IconEdit2 className="mr-2" />
              Edit
            </Button>
            <Button
              variant="destructive"
              disabled={!isAdmin}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <IconTrashBin2 className="h-4.5 w-4.5 mr-2" />
              Delete
            </Button>
          </div>
        }
        Icon={
          <>
            <Button
              onClick={() => router.push("/installers")}
              variant={"outline"}
              className="flex items-center justify-center size-16 rounded-full nosquircle"
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

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                    Total Rewards
                  </p>
                  <p className="text-2xl font-semibold tracking-tight">
                    Rs. {statistics.totalAmount?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {statistics.totalRewards} reward
                    {statistics.totalRewards !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="shrink-0 p-3 rounded-xl bg-muted">
                  <TrendingUp className="h-5 w-5 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                    Pending
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-muted-foreground">
                    Rs. {statistics.pendingAmount?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {statistics.pendingRewards} reward
                    {statistics.pendingRewards !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="shrink-0 p-3 rounded-xl bg-muted">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                    Paid
                  </p>
                  <p className="text-2xl font-semibold tracking-tight text-success-text">
                    Rs. {statistics.paidAmount?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {statistics.paidRewards} reward
                    {statistics.paidRewards !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="shrink-0 p-3 rounded-xl bg-muted">
                  <Check className="h-5 w-5 text-success-text" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
                    Total Products
                  </p>
                  <p className="text-2xl font-semibold tracking-tight">
                    {statistics.totalRewards}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    product{statistics.totalRewards !== 1 ? "s" : ""} installed
                  </p>
                </div>
                <div className="shrink-0 p-3 rounded-xl bg-muted">
                  <Package className="h-5 w-5 text-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">
            <Edit className="h-4 w-4 mr-2" />
            Details
          </TabsTrigger>
          <TabsTrigger
            value="activity"
            onClick={() => activities.length === 0 && fetchActivities()}
          >
            <ActivityIcon className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
          <TabsTrigger
            value="products"
            onClick={() => products.length === 0 && fetchProducts()}
          >
            <Package className="h-4 w-4 mr-2" />
            Products ({statistics?.totalRewards || 0})
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="space-y-4">
            {/* Profile Header */}
            <Card className="shadow-layered bg-muted/20">
              <CardContent className="p-5 lg:p-6">
                <div className="flex items-start gap-5">
                  <InstallerAvatar
                    user={installer.fullName}
                    className="size-16 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-semibold leading-tight">
                          {installer.fullName}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-muted font-mono text-xs font-bold">
                            {installer.installerCode}
                            <CopyButton
                              text={installer.installerCode}
                              label="Installer Code"
                            />
                          </span>
                          {installer.certified && (
                            <Badge variant="success" className="gap-1">
                              <Award className="h-3 w-3" />
                              Certified
                            </Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">
                            CNIC: {installer.cnic}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0 leading-relaxed">
                        <div>
                          Joined{" "}
                          {new Date(installer.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </div>
                        {installer.registeredBy && (
                          <div>by {installer.registeredBy.name}</div>
                        )}
                      </div>
                    </div>
                    {/* Quick stats row */}
                    {statistics && (
                      <div className="mt-4 pt-4 border-t border-border flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          <span className="font-medium text-foreground">
                            {statistics.totalRewards}
                          </span>{" "}
                          total rewards
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5 text-success-text" />
                          <span className="font-medium text-success-text">
                            {statistics.paidRewards}
                          </span>{" "}
                          paid
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-muted-foreground">
                            {statistics.pendingRewards}
                          </span>{" "}
                          pending
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Location */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="transition-all duration-300 hover:shadow-layered">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <a
                    href={`tel:${installer.phoneNumber}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">Phone</div>
                      <div className="text-sm font-medium group-hover:text-foreground transition-colors">
                        {installer.phoneNumber}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <CopyButton
                        text={installer.phoneNumber}
                        label="Phone Number"
                      />
                    </div>
                  </a>
                  <a
                    href={`https://wa.me/${installer.whatsappNumber?.replace(/\+/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors group"
                  >
                    <div className="min-w-0">
                      <div className="text-xs text-muted-foreground">
                        WhatsApp
                      </div>
                      <div className="text-sm font-medium group-hover:text-foreground transition-colors">
                        {installer.whatsappNumber}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <CopyButton
                        text={installer.whatsappNumber}
                        label="WhatsApp Number"
                      />
                    </div>
                  </a>
                </CardContent>
              </Card>

              <Card className="transition-all duration-300 hover:shadow-layered">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-0 divide-y divide-border">
                    <div className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                      <dt className="text-xs text-muted-foreground">City</dt>
                      <dd className="text-sm font-medium">{installer.city}</dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-xs text-muted-foreground">
                        District
                      </dt>
                      <dd className="text-sm font-medium">
                        {installer.district}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-xs text-muted-foreground">
                        Province
                      </dt>
                      <dd className="text-sm font-medium">
                        {installer.province}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5 last:pb-0">
                      <dt className="text-xs text-muted-foreground">Address</dt>
                      <dd className="text-sm text-right max-w-[60%]">
                        {installer.address}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Banking */}
              <Card className="transition-all duration-300 hover:shadow-layered">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-muted-foreground" />
                    Banking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-0 divide-y divide-border">
                    <div className="flex items-center justify-between py-2.5 first:pt-0">
                      <dt className="text-xs text-muted-foreground">Bank</dt>
                      <dd className="text-sm font-medium">
                        {installer.bankName}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-xs text-muted-foreground">
                        Account #
                      </dt>
                      <dd className="text-sm font-mono flex items-center gap-1.5">
                        {installer.accountNumber}
                        <CopyButton
                          text={installer.accountNumber}
                          label="Account Number"
                        />
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5 last:pb-0">
                      <dt className="text-xs text-muted-foreground">Title</dt>
                      <dd className="text-sm font-medium text-right max-w-[60%]">
                        {installer.accountTitle}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              {/* Registration */}
              <Card className="transition-all duration-300 hover:shadow-layered">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Registration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-0 divide-y divide-border">
                    <div className="flex items-center justify-between py-2.5 first:pt-0">
                      <dt className="text-xs text-muted-foreground">
                        Registered By
                      </dt>
                      <dd className="text-sm text-right max-w-[60%]">
                        {installer.registeredBy?.name || "N/A"}
                        {installer.registeredBy?.email && (
                          <span className="block text-xs text-muted-foreground">
                            {installer.registeredBy.email}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-xs text-muted-foreground">Created</dt>
                      <dd className="text-sm">
                        {new Date(installer.createdAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" },
                        )}
                      </dd>
                    </div>
                    {installer.updatedAt && (
                      <div className="flex items-center justify-between py-2.5 last:pb-0">
                        <dt className="text-xs text-muted-foreground">
                          Updated
                        </dt>
                        <dd className="text-sm">
                          {new Date(installer.updatedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>

              {/* Referrer (if exists) */}
              {installer.referrer && (
                <Card className="lg:col-span-2 transition-all duration-300 hover:shadow-layered">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <UserPlus className="h-4 w-4 text-muted-foreground" />
                      Referred By
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                      <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">
                          {installer.referrer.fullName}
                        </div>
                        <div className="text-xs text-muted-foreground font-mono flex items-center gap-1.5">
                          {installer.referrer.installerCode}
                          <CopyButton
                            text={installer.referrer.installerCode}
                            label="Referrer Code"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity">
          <div className="space-y-3">
            {loadingActivities ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Skeleton round className="h-10 w-10 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-1/2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <Card>
                <CardContent className="p-12">
                  <div className="text-center">
                    <ActivityIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <div className="text-muted-foreground">
                      No activities found
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              activities.map((activity: ActivityLog) => {
                const isCreated =
                  activity.type.includes("REGISTERED") ||
                  activity.type.includes("CREATED");
                const isUpdated = activity.type.includes("UPDATED");
                const isDeleted = activity.type.includes("DELETED");
                const isPaid = activity.type.includes("PAID");
                const isFailed = activity.type.includes("FAILED");

                const getActivityIcon = () => {
                  if (activity.type.includes("INSTALLER_REGISTERED"))
                    return <UserPlus className="h-4 w-4" />;
                  if (isUpdated) return <Edit className="h-4 w-4" />;
                  if (isDeleted) return <Trash2 className="h-4 w-4" />;
                  return <ActivityIcon className="h-4 w-4" />;
                };

                const getActivityColorClass = () => {
                  if (isDeleted)
                    return "bg-destructive/10 text-destructive-text";
                  if (isCreated || isPaid)
                    return "bg-success/10 text-success-text";
                  if (isUpdated)
                    return "bg-brandsec-500/20 text-brandsec-800 dark:text-brandsec-300";
                  if (isFailed)
                    return "bg-destructive/10 text-destructive-text";
                  return "bg-muted text-muted-foreground";
                };

                const getActivityBorderClass = () => {
                  if (isDeleted) return "border-l-destructive-text";
                  if (isCreated || isPaid) return "border-l-success-text";
                  if (isUpdated) return "border-l-brandsec-600";
                  if (isFailed) return "border-l-destructive-text";
                  return "border-l-muted-foreground";
                };

                const getActivityVariant = ():
                  | "default"
                  | "destructive"
                  | "outline"
                  | "secondary" => {
                  if (isDeleted) return "destructive";
                  if (isCreated || isPaid) return "default";
                  if (isUpdated) return "secondary";
                  return "outline";
                };

                const getActivityTitle = () => {
                  if (
                    activity.type === "INSTALLER_REGISTERED" &&
                    activity.metadata
                  ) {
                    const installerName =
                      activity.metadata.name ||
                      activity.targetName ||
                      "Unknown";
                    const installerCode = activity.metadata.code || "";
                    return `Created new installer: ${installerName} (${installerCode})`;
                  }
                  return activity.description;
                };

                const getMetadataDisplay = () => {
                  if (!activity.metadata) return null;
                  const items: { label: string; value: string }[] = [];

                  if (activity.type === "INSTALLER_REGISTERED") {
                    if (activity.metadata.entityId)
                      items.push({
                        label: "entityId",
                        value: `"${activity.metadata.entityId}"`,
                      });
                    if (activity.metadata.code)
                      items.push({
                        label: "code",
                        value: `"${activity.metadata.code}"`,
                      });
                    if (activity.metadata.name)
                      items.push({
                        label: "name",
                        value: `"${activity.metadata.name}"`,
                      });
                  }

                  return items.length > 0 ? items : null;
                };

                const metadataItems = getMetadataDisplay();

                return (
                  <Card
                    key={activity._id}
                    className={`transition-all hover:shadow-md border-l-4 ${getActivityBorderClass()}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon with Status Indicator */}
                        <div className="relative shrink-0">
                          <div
                            className={`p-2 rounded-lg ${getActivityColorClass()}`}
                          >
                            {getActivityIcon()}
                          </div>
                          {isCreated && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-success flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">
                                {getActivityTitle()}
                              </p>
                            </div>

                            {/* Activity Type Badge */}
                            <Badge
                              variant={getActivityVariant()}
                              className="shrink-0"
                            >
                              {activity.type
                                .replace(/_/g, " ")
                                .toLowerCase()
                                .replace(/\b\w/g, (l: string) =>
                                  l.toUpperCase(),
                                )}
                            </Badge>
                          </div>

                          {/* Metadata Display */}
                          {metadataItems && metadataItems.length > 0 && (
                            <div className="mb-2 text-xs font-mono text-muted-foreground">
                              {"{ "}
                              {metadataItems.map((item, idx) => (
                                <span key={idx}>
                                  <span className="text-muted-foreground/70">
                                    {item.label}:
                                  </span>{" "}
                                  <span className="text-foreground/80">
                                    {item.value}
                                  </span>
                                  {idx < metadataItems.length - 1 && ", "}
                                </span>
                              ))}
                              {" }"}
                            </div>
                          )}

                          {/* User and Time Info */}
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {activity.performedBy?.name || "Unknown"}
                            </span>
                            <span className="text-muted-foreground/50">•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {new Date(activity.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>
                            {activity.targetName &&
                              !activity.type.includes(
                                "INSTALLER_REGISTERED",
                              ) && (
                                <>
                                  <span className="text-muted-foreground/50">
                                    •
                                  </span>
                                  <span>Target: {activity.targetName}</span>
                                </>
                              )}
                          </div>

                          {/* Changes Details */}
                          {activity.metadata?.changes &&
                            Object.keys(activity.metadata.changes).length >
                              0 && (
                              <details className="mt-3">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  View Changes
                                </summary>
                                <Alert className="mt-2">
                                  <AlertDescription>
                                    <dl className="space-y-2">
                                      {Object.entries(
                                        activity.metadata.changes,
                                      ).map(
                                        ([key, value]: [
                                          string,
                                          {
                                            before: unknown;
                                            after: unknown;
                                          },
                                        ]) => (
                                          <div key={key} className="text-xs">
                                            <dt className="font-medium capitalize">
                                              {key
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}
                                              :
                                            </dt>
                                            <dd className="ml-4">
                                              <span className="text-destructive-text line-through">
                                                {String(value.before || "N/A")}
                                              </span>
                                              {" → "}
                                              <span className="text-success-text">
                                                {String(value.after || "N/A")}
                                              </span>
                                            </dd>
                                          </div>
                                        ),
                                      )}
                                    </dl>
                                  </AlertDescription>
                                </Alert>
                              </details>
                            )}

                          {/* WhatsApp Metadata */}
                          {activity.metadata?.whatsappNumber && (
                            <div className="mt-2 text-xs">
                              <Badge variant="outline" className="font-mono">
                                {String(activity.metadata.whatsappNumber)}
                              </Badge>
                              {activity.metadata.errorMessage && (
                                <span className="ml-2 text-destructive-text">
                                  Error:{" "}
                                  {String(activity.metadata.errorMessage)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>Installed Products</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="space-y-3 py-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-5 w-24 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No products found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Product Model</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Reward Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Installation Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: Product) => (
                      <TableRow
                        key={product._id}
                        className="transition-colors hover:bg-muted/30"
                      >
                        <TableCell className="font-medium">
                          {product.serialNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.productModel}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.cityOfInstallation}
                        </TableCell>
                        <TableCell className="font-semibold text-success-text">
                          Rs. {product.rewardAmount?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.rewardStatus === "PAID"
                                ? "success"
                                : product.rewardStatus === "PENDING"
                                  ? "warning"
                                  : "destructive"
                            }
                          >
                            {product.rewardStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.installationDate
                            ? new Date(
                                product.installationDate,
                              ).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="link"
                            onClick={() =>
                              router.push(`/rewards/${product._id}`)
                            }
                            className="p-0 h-auto"
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {/* Edit Modal */}
      <InstallerEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        installerId={installerId}
        onSuccess={fetchInstaller}
      />

      {/* Delete Confirmation Dialog */}
      <SimpleDeleteDialog
        open={deleteDialogOpen}
        deleting={deleting}
        itemName={`${installer.fullName} (${installer.installerCode})`}
        entityType="installer"
        warningMessage="Installer with rewards cannot be deleted."
        additionalWarning={
          statistics && statistics.totalRewards > 0 ? (
            <span className="block mt-2 text-destructive font-medium">
              ⚠️ This installer has {statistics.totalRewards} reward(s). You
              must delete all rewards first.
            </span>
          ) : undefined
        }
        onConfirm={handleDelete}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </div>
  );
}
