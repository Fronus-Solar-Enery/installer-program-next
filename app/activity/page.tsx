"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Activity,
  Clock,
  User,
  FileText,
  UserPlus,
  Check,
  Edit,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";

interface ActivityData {
  _id: string;
  type: string;
  description: string;
  performedBy?: {
    name: string;
  };
  createdAt: string;
  targetName?: string;
  entityType?: string;
  entityId?: string;
  metadata?: {
    changes?: Record<
      string,
      { before: string | number | boolean; after: string | number | boolean }
    >;
    whatsappNumber?: string;
    errorMessage?: string;
    code?: string;
    name?: string;
    [key: string]: unknown;
  };
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/activities?limit=200");
      const data = await response.json();

      if (data.success) {
        setActivities(data.data.activities);
      }
    } catch (error) {
      console.error("Failed to fetch activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    if (type.includes("INSTALLER_REGISTERED"))
      return <UserPlus className="h-4 w-4" />;
    if (type.includes("INSTALLER")) return <User className="h-4 w-4" />;
    if (type.includes("REWARD")) return <Activity className="h-4 w-4" />;
    if (type.includes("TEAM")) return <User className="h-4 w-4" />;
    if (type.includes("UPDATED")) return <Edit className="h-4 w-4" />;
    if (type.includes("DELETED")) return <Trash2 className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getActivityVariant = (
    type: string
  ): "default" | "destructive" | "outline" | "secondary" => {
    if (type.includes("DELETED")) return "destructive";
    if (type.includes("REGISTERED") || type.includes("PAID")) return "default";
    if (type.includes("UPDATED")) return "secondary";
    return "outline";
  };

  const getActivityBgColor = (type: string) => {
    if (type.includes("DELETED"))
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    if (type.includes("REGISTERED"))
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (type.includes("PAID"))
      return "bg-green-500/10 text-green-600 dark:text-green-400";
    if (type.includes("UPDATED"))
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
    if (type.includes("FAILED"))
      return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
    return "bg-muted text-muted-foreground";
  };

  const formatActivityType = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getActivityTitle = (activity: ActivityData) => {
    // For installer registration, show a custom format
    if (activity.type === "INSTALLER_REGISTERED" && activity.metadata) {
      const installerName =
        activity.metadata.name || activity.targetName || "Unknown";
      const installerCode = activity.metadata.code || "";
      return `Created new installer: ${installerName} (${installerCode})`;
    }
    return activity.description;
  };

  const getMetadataDisplay = (activity: ActivityData) => {
    if (!activity.metadata) return null;

    const items: { label: string; value: string }[] = [];

    // Extract metadata items based on activity type
    if (activity.type === "INSTALLER_REGISTERED") {
      if (activity.metadata.entityId)
        items.push({
          label: "entityId",
          value: `"${activity.metadata.entityId}"`,
        });
      if (activity.metadata.code)
        items.push({ label: "code", value: `"${activity.metadata.code}"` });
      if (activity.metadata.name)
        items.push({ label: "name", value: `"${activity.metadata.name}"` });
    }

    return items.length > 0 ? items : null;
  };

  const filteredActivities =
    filter === "ALL"
      ? activities
      : activities.filter((a) => a.type.includes(filter));

  // Pagination logic
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredActivities.slice(startIndex, endIndex);
  }, [filteredActivities, currentPage, itemsPerPage]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Activity Log"
        description="Track all system activities and changes"
      />
      <div className="container mx-auto space-y-4">
        {/* Filter Tabs */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2">
              {["ALL", "INSTALLER", "REWARD", "TEAM", "WHATSAPP"].map(
                (filterType) => (
                  <Button
                    key={filterType}
                    onClick={() => setFilter(filterType)}
                    variant={filter === filterType ? "default" : "outline"}
                    size="sm"
                  >
                    {filterType}
                  </Button>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activities List */}
        <div className="space-y-1">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="p-12">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <div className="text-muted-foreground">
                    No activities found
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {paginatedActivities.map((activity) => {
                const metadataItems = getMetadataDisplay(activity);
                const isCreated =
                  activity.type.includes("REGISTERED") ||
                  activity.type.includes("CREATED");

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
                            className={`p-2 rounded-lg ${getActivityBgColor(
                              activity.type
                            )}`}
                          >
                            {getActivityIcon(activity.type)}
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
                                {getActivityTitle(activity)}
                              </p>
                            </div>

                            {/* Activity Type Badge */}
                            <Badge
                              variant={getActivityVariant(activity.type)}
                              className="shrink-0"
                            >
                              {formatActivityType(activity.type)}
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
                                      ).map(([key, value]) => (
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
                                      ))}
                                    </dl>
                                  </AlertDescription>
                                </Alert>
                              </details>
                            )}

                          {/* WhatsApp Metadata */}
                          {activity.metadata?.whatsappNumber && (
                            <div className="mt-2 text-xs">
                              <Badge variant="outline" className="font-mono">
                                {activity.metadata.whatsappNumber}
                              </Badge>
                              {activity.metadata.errorMessage && (
                                <span className="ml-2 text-destructive">
                                  Error: {activity.metadata.errorMessage}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Pagination Controls */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(
                          currentPage * itemsPerPage,
                          filteredActivities.length
                        )}{" "}
                        of {filteredActivities.length} activities
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select
                        value={String(itemsPerPage)}
                        onValueChange={(value) => {
                          setItemsPerPage(Number(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className="w-[100px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 / page</SelectItem>
                          <SelectItem value="10">10 / page</SelectItem>
                          <SelectItem value="20">20 / page</SelectItem>
                          <SelectItem value="50">50 / page</SelectItem>
                        </SelectContent>
                      </Select>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm px-3">
                          Page {currentPage} of {totalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setCurrentPage(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronsRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Footer Section */}
              <Card className="bg-muted/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div>Total: {filteredActivities.length} activities</div>
                    <div>Last updated: {new Date().toLocaleString()}</div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
