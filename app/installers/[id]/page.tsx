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
import { CopyButton } from "@/components/CopyButton";
import {
  IconArrowLeft,
  IconEdit2,
  IconStar,
  IconTrashBin2,
} from "@/components/icons";
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
  trainingCenter: string;
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
        err instanceof Error ? err.message : "Failed to fetch installer"
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
        `/api/activities?targetType=Installer&targetId=${installer._id}&limit=100`
      );
      const installerActivitiesData = await installerActivitiesRes.json();

      // Fetch all reward activities for this installer's rewards
      const productsRes = await fetch(
        `/api/rewards?installer=${installer._id}&limit=1000`
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
            `/api/activities?targetType=InstallerReward&targetId=${rewardId}&limit=100`
          ).then((res) => res.json())
        );

        const rewardActivitiesResults = await Promise.all(
          rewardActivitiesPromises
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
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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
        `/api/rewards?installer=${installer._id}&limit=1000`
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
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">Loading installer details...</p>
        </div>
      </div>
    );
  }

  if (error || !installer) {
    return (
      <div className="p-6">
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
    <div className="flex-1 overflow-auto space-y-4">
      <PageHeader
        title={installer.fullName}
        description={`Installer Code: ${installer.installerCode}`}
        action={
          <div className="flex gap-3">
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
      {/* Certified Badge */}
      {installer.certified && (
        <Badge
          variant="default"
          className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700"
        >
          <Award className="h-4 w-4 mr-2" />
          Certified Installer
        </Badge>
      )}

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="shrink-0">
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Rewards
                  </p>
                  <p className="text-2xl font-semibold">
                    Rs. {statistics.totalAmount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="h-8 w-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                    <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                      P
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Pending
                  </p>
                  <p className="text-2xl font-semibold text-yellow-600 dark:text-yellow-500">
                    Rs. {statistics.pendingAmount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Paid
                  </p>
                  <p className="text-2xl font-semibold text-green-600 dark:text-green-500">
                    Rs. {statistics.paidAmount?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="shrink-0">
                  <div className="h-8 w-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <span className="text-red-600 dark:text-red-400 font-bold">
                      F
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    Failed
                  </p>
                  <p className="text-2xl font-semibold text-red-600 dark:text-red-500">
                    Rs. {statistics.failedAmount?.toLocaleString() || 0}
                  </p>
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
            <ActivityIcon className="h-4 w-4 mr-2"/>
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
          <div className="flex flex-wrap gap-4">
            {/* Personal Information */}
            <Card className="min-w-[350px] flex-1">
              <CardHeader className="flex gap-4 flex-col items-center text-center">
                <div className="relative">
                  <InstallerAvatar
                    user={installer.fullName}
                    className="size-24 shrink-0 border-none bg-background"
                  />
                  {installer.certified && (
                    <div className="absolute top-0 right-0 p-1 flex items-center justify-center bg-card backdrop-blur-xl group-hover/row:bg-muted/30 rounded-full transition-colors duration-300">
                      <IconStar
                        fill
                        className="size-5 text-cyan-500 group-hover:text-cyan-400 transition-colors duration-300"
                      />
                    </div>
                  )}
                </div>
                <CardTitle className="text-lg font-semibold">
                  {installer.fullName}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Full Name
                    </dt>
                    <dd className="mt-1 text-sm">{installer.fullName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      CNIC
                    </dt>
                    <dd className="mt-1 text-sm flex items-center">
                      {installer.cnic}
                      <CopyButton text={installer.cnic} label="CNIC" />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Phone Number
                    </dt>
                    <dd className="mt-1 text-sm flex items-center">
                      {installer.phoneNumber}
                      <CopyButton
                        text={installer.phoneNumber}
                        label="Phone Number"
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      WhatsApp Number
                    </dt>
                    <dd className="mt-1 text-sm flex items-center">
                      {installer.whatsappNumber}
                      <CopyButton
                        text={installer.whatsappNumber}
                        label="WhatsApp Number"
                      />
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card className="min-w-[350px] flex-1">
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      City
                    </dt>
                    <dd className="mt-1 text-sm">{installer.city}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Province
                    </dt>
                    <dd className="mt-1 text-sm">{installer.province}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Address
                    </dt>
                    <dd className="mt-1 text-sm">{installer.address}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Training Center
                    </dt>
                    <dd className="mt-1 text-sm">{installer.trainingCenter}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Banking Information */}
            <Card className="min-w-[350px] flex-1">
              <CardHeader>
                <CardTitle>Banking Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Bank Name
                    </dt>
                    <dd className="mt-1 text-sm">{installer.bankName}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Account Number
                    </dt>
                    <dd className="mt-1 text-sm flex items-center">
                      {installer.accountNumber}
                      <CopyButton
                        text={installer.accountNumber}
                        label="Account Number"
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Account Title
                    </dt>
                    <dd className="mt-1 text-sm">{installer.accountTitle}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="min-w-[350px] flex-1">
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Installer Code
                    </dt>
                    <dd className="mt-1 text-sm font-mono font-bold flex items-center">
                      {installer.installerCode}
                      <CopyButton
                        text={installer.installerCode}
                        label="Installer Code"
                      />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Certified
                    </dt>
                    <dd className="mt-1 text-sm">
                      {installer.certified ? (
                        <Badge variant="default" className="bg-green-600">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="secondary">No</Badge>
                      )}
                    </dd>
                  </div>
                  {installer.companyName && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Company Name
                      </dt>
                      <dd className="mt-1 text-sm">{installer.companyName}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Referrer Information */}
            {installer.referrer && (
              <Card className="min-w-[350px] flex-1">
                <CardHeader>
                  <CardTitle>Referrer Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Referrer Code
                      </dt>
                      <dd className="mt-1 text-sm flex items-center">
                        {installer.referrer.installerCode}
                        <CopyButton
                          text={installer.referrer.installerCode}
                          label="Referrer Code"
                        />
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Referrer Name
                      </dt>
                      <dd className="mt-1 text-sm">
                        {installer.referrer.fullName}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* Registration Information */}
            <Card className="min-w-[350px] flex-1">
              <CardHeader>
                <CardTitle>Registration Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Registered By
                    </dt>
                    <dd className="mt-1 text-sm">
                      {installer.registeredBy?.name || "N/A"} (
                      {installer.registeredBy?.email || "N/A"})
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">
                      Created At
                    </dt>
                    <dd className="mt-1 text-sm">
                      {new Date(installer.createdAt).toLocaleString()}
                    </dd>
                  </div>
                  {installer.updatedAt && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Last Updated
                      </dt>
                      <dd className="mt-1 text-sm">
                        {new Date(installer.updatedAt).toLocaleString()}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>
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
                        <div className="h-10 w-10 rounded-lg bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-3/4 bg-muted rounded" />
                          <div className="h-3 w-1/2 bg-muted rounded" />
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

                const getActivityBgColor = () => {
                  if (isDeleted)
                    return "bg-red-500/10 text-red-600 dark:text-red-400";
                  if (isCreated || isPaid)
                    return "bg-green-500/10 text-green-600 dark:text-green-400";
                  if (isUpdated)
                    return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
                  if (isFailed)
                    return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
                  return "bg-muted text-muted-foreground";
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
                    className="transition-all hover:shadow-md"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Icon with Status Indicator */}
                        <div className="relative shrink-0">
                          <div
                            className={`p-2 rounded-lg ${getActivityBgColor()}`}
                          >
                            {getActivityIcon()}
                          </div>
                          {isCreated && (
                            <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                              <Check className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4 mb-2">
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
                                  l.toUpperCase()
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
                                }
                              )}
                            </span>
                            {activity.targetName &&
                              !activity.type.includes(
                                "INSTALLER_REGISTERED"
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
                                        activity.metadata.changes
                                      ).map(
                                        ([key, value]: [
                                          string,
                                          {
                                            before: unknown;
                                            after: unknown;
                                          }
                                        ]) => (
                                          <div key={key} className="text-xs">
                                            <dt className="font-medium capitalize">
                                              {key
                                                .replace(/([A-Z])/g, " $1")
                                                .trim()}
                                              :
                                            </dt>
                                            <dd className="ml-4">
                                              <span className="text-destructive line-through">
                                                {String(value.before || "N/A")}
                                              </span>
                                              {" → "}
                                              <span className="text-green-600 dark:text-green-400">
                                                {String(value.after || "N/A")}
                                              </span>
                                            </dd>
                                          </div>
                                        )
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
                                <span className="ml-2 text-destructive">
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
                <p className="text-center text-muted-foreground py-8">
                  Loading products...
                </p>
              ) : products.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No products found
                </p>
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
                      <TableRow key={product._id}>
                        <TableCell className="font-medium">
                          {product.serialNumber}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.productModel}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.cityOfInstallation}
                        </TableCell>
                        <TableCell className="font-semibold text-green-600 dark:text-green-500">
                          Rs. {product.rewardAmount?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              product.rewardStatus === "PAID"
                                ? "default"
                                : product.rewardStatus === "PENDING"
                                ? "secondary"
                                : "destructive"
                            }
                            className={
                              product.rewardStatus === "PAID"
                                ? "bg-green-600"
                                : product.rewardStatus === "PENDING"
                                ? "bg-yellow-600"
                                : ""
                            }
                          >
                            {product.rewardStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {product.installationDate
                            ? new Date(
                                product.installationDate
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
