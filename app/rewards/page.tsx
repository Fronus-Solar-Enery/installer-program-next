"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RewardEditModal from "@/components/RewardEditModal";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import {
  Copy,
  Check,
  Trash2,
  Edit,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Settings2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageHeader from "@/components/PageHeader";
import { IInstallerReward } from "@/models/InstallerReward";

interface RewardWithId extends Omit<IInstallerReward, 'installer' | 'registeredBy' | 'referrer'> {
  _id: string;
  installer?: {
    _id: string;
    installerCode: string;
    fullName: string;
    cnic: string;
    phoneNumber: string;
    whatsappNumber: string;
  };
  registeredBy?: {
    _id: string;
    name: string;
    email: string;
  };
  referrer?: {
    _id: string;
    installerCode: string;
    fullName: string;
  };
}

interface TeamMember {
  _id: string;
  name: string;
  email: string;
}

export default function RewardsPage() {
  const router = useRouter();
  const [rewards, setRewards] = useState<RewardWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const { copiedText, copyToClipboard } = useCopyToClipboard();

  // Filter states
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [sendingDateFilter, setSendingDateFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [serialNumberStatusFilter, setSerialNumberStatusFilter] = useState("all");
  const [productModelFilter, setProductModelFilter] = useState("all");
  const [teamMemberFilter, setTeamMemberFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Unique values for filters
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [serialNumberStatuses, setSerialNumberStatuses] = useState<string[]>(
    []
  );
  const [productModels, setProductModels] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState("");

  // Sorting state
  const [sortField, setSortField] = useState<keyof RewardWithId | 'installer' | 'registeredBy'>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    serialNumber: true,
    installerCode: true,
    installer: true,
    productModel: true,
    rewardAmount: true,
    paymentStatus: true,
    paymentMethod: false,
    transactionId: false,
    sendingDate: false,
    inverterSerialNumber: false,
    registeredBy: false,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [rewardToDelete, setRewardToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchRewards();

    // Check for search result ID from navbar
    const params = new URLSearchParams(window.location.search);
    const searchId = params.get('id');
    if (searchId) {
      setSelectedRewardId(searchId);
      // Scroll to the row after rewards are loaded
      setTimeout(() => {
        const element = document.getElementById(`reward-${searchId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-primary/10');
          setTimeout(() => element.classList.remove('bg-primary/10'), 2000);
        }
      }, 500);
    }
  }, [
    paymentStatusFilter,
    sendingDateFilter,
    paymentMethodFilter,
    serialNumberStatusFilter,
    productModelFilter,
    teamMemberFilter,
  ]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (paymentStatusFilter && paymentStatusFilter !== "ALL") {
        params.append("paymentStatus", paymentStatusFilter);
      }
      if (sendingDateFilter) {
        params.append("sendingDate", sendingDateFilter);
      }
      if (paymentMethodFilter && paymentMethodFilter !== "all") {
        params.append("paymentMethod", paymentMethodFilter);
      }
      if (serialNumberStatusFilter && serialNumberStatusFilter !== "all") {
        params.append("serialNumberStatus", serialNumberStatusFilter);
      }
      if (productModelFilter && productModelFilter !== "all") {
        params.append("productModel", productModelFilter);
      }
      if (teamMemberFilter && teamMemberFilter !== "all") {
        params.append("registeredBy", teamMemberFilter);
      }

      const response = await fetch(`/api/rewards?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRewards(data.data.rewards);

        // Extract unique values for filters
        const allRewards = data.data.rewards;
        setPaymentMethods([
          ...new Set(
            allRewards.map((r: RewardWithId) => r.paymentMethod).filter(Boolean)
          ),
        ] as string[]);
        setSerialNumberStatuses([
          ...new Set(
            allRewards.map((r: RewardWithId) => r.serialNumberStatus).filter(Boolean)
          ),
        ] as string[]);
        setProductModels([
          ...new Set(
            allRewards.map((r: RewardWithId) => r.productModel).filter(Boolean)
          ),
        ] as string[]);

        // Get unique team members
        const uniqueTeamMembers = allRewards
          .map((r: RewardWithId) => r.registeredBy)
          .filter(
            (value: TeamMember | undefined, index: number, self: (TeamMember | undefined)[]) =>
              value &&
              self.findIndex((t: TeamMember | undefined) => t?._id === value?._id) === index
          ) as TeamMember[];
        setTeamMembers(uniqueTeamMembers);
      }
    } catch (error) {
      console.error("Failed to fetch rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string) => {
    await copyToClipboard(text);
  };

  const handleSort = (field: keyof RewardWithId | 'installer' | 'registeredBy') => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns((prev) => ({
      ...prev,
      [column]: !prev[column as keyof typeof prev],
    }));
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4 ml-1 inline" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1 inline" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1 inline" />
    );
  };

  const filteredRewards = rewards.filter((reward: RewardWithId) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      reward.serialNumber?.toLowerCase().includes(searchLower) ||
      reward.transactionId?.toLowerCase().includes(searchLower) ||
      reward.referrerTransactionId?.toLowerCase().includes(searchLower) ||
      reward.installer?.installerCode?.toLowerCase().includes(searchLower) ||
      reward.installer?.fullName?.toLowerCase().includes(searchLower) ||
      reward.installer?.cnic?.includes(searchQuery) ||
      reward.installer?.phoneNumber?.includes(searchQuery) ||
      reward.installer?.whatsappNumber?.includes(searchQuery)
    );
  });

  const sortedRewards = [...filteredRewards].sort((a: RewardWithId, b: RewardWithId) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    // Handle nested fields
    if (sortField === "installer") {
      aVal = a.installer?.fullName;
      bVal = b.installer?.fullName;
    } else if (sortField === "installerCode") {
      aVal = a.installerCode;
      bVal = b.installerCode;
    }

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });

  const handleDeleteClick = (id: string) => {
    setRewardToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!rewardToDelete) return;

    try {
      const response = await fetch(`/api/rewards/${rewardToDelete}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Reward deleted successfully");
        fetchRewards();
      } else {
        toast.error(data.error || "Failed to delete reward");
      }
    } catch (error) {
      console.error("Failed to delete reward:", error);
      toast.error("An error occurred while deleting the reward");
    } finally {
      setDeleteDialogOpen(false);
      setRewardToDelete(null);
    }
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => {
    const isCopied = copiedText === text;

    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleCopy(text)}
        className="ml-2 h-8 w-8 p-0"
        title={`Copy ${label}`}
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    );
  };

  const clearFilters = () => {
    setPaymentStatusFilter("ALL");
    setSendingDateFilter("");
    setPaymentMethodFilter("all");
    setSerialNumberStatusFilter("all");
    setProductModelFilter("all");
    setTeamMemberFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="flex-1 overflow-auto">
      <PageHeader
        title="Rewards & Installations"
        description="Manage product installations and reward distributions"
        action={
          <div className="flex gap-3">
            <Button onClick={() => router.push("/rewards/new")}>
              + Add Installation
            </Button>
            <Button onClick={() => router.push("/rewards/bulk-upload")} variant="secondary">
              Bulk Update
            </Button>
          </div>
        }
      />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">

        {/* Filters Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Filters</CardTitle>
              <div className="flex gap-3">
                <DropdownMenu open={showColumnMenu} onOpenChange={setShowColumnMenu}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings2 className="h-4 w-4 mr-2" />
                      Columns
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Show/Hide Columns</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {Object.entries(visibleColumns).map(([key, value]) => (
                      <DropdownMenuCheckboxItem
                        key={key}
                        checked={value}
                        onCheckedChange={() => toggleColumn(key)}
                      >
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>

          {/* Search Input */}
          <div className="mb-4">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by serial number, transaction ID, installer code, name, CNIC, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Payment Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="payment-status">Payment Status</Label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger id="payment-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sending Date Filter */}
            <div className="space-y-2">
              <Label htmlFor="sending-date">Sending Date</Label>
              <Input
                id="sending-date"
                type="date"
                value={sendingDateFilter}
                onChange={(e) => setSendingDateFilter(e.target.value)}
              />
            </div>

            {/* Payment Method Filter */}
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Serial Number Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="serial-status">Serial Number Status</Label>
              <Select value={serialNumberStatusFilter} onValueChange={setSerialNumberStatusFilter}>
                <SelectTrigger id="serial-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {serialNumberStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Model Filter */}
            <div className="space-y-2">
              <Label htmlFor="product-model">Product Model</Label>
              <Select value={productModelFilter} onValueChange={setProductModelFilter}>
                <SelectTrigger id="product-model">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {productModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Team Member Filter */}
            <div className="space-y-2">
              <Label htmlFor="team-member">Registered By</Label>
              <Select value={teamMemberFilter} onValueChange={setTeamMemberFilter}>
                <SelectTrigger id="team-member">
                  <SelectValue placeholder="All Team Members" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Team Members</SelectItem>
                  {teamMembers.map((member) => (
                    <SelectItem key={member._id} value={member._id}>
                      {member.name} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">Loading rewards...</div>
            </div>
          ) : sortedRewards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">No rewards found</div>
              <Button onClick={() => router.push("/rewards/new")}>
                Register First Reward
              </Button>
            </div>
          ) : (
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {visibleColumns.serialNumber && (
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("serialNumber")}
                      >
                        Serial Number {getSortIcon("serialNumber")}
                      </TableHead>
                    )}
                    {visibleColumns.installerCode && (
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("installerCode")}
                      >
                        Installer Code {getSortIcon("installerCode")}
                      </TableHead>
                    )}
                    {visibleColumns.installer && (
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("installer")}
                      >
                        Installer {getSortIcon("installer")}
                      </TableHead>
                    )}
                    {visibleColumns.productModel && (
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("productModel")}
                      >
                        Product Model {getSortIcon("productModel")}
                      </TableHead>
                    )}
                    {visibleColumns.rewardAmount && (
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("rewardAmount")}
                      >
                        Amount {getSortIcon("rewardAmount")}
                      </TableHead>
                    )}
                    {visibleColumns.paymentStatus && (
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("paymentStatus")}
                      >
                        Status {getSortIcon("paymentStatus")}
                      </TableHead>
                    )}
                    {visibleColumns.paymentMethod && (
                      <TableHead>Payment Method</TableHead>
                    )}
                    {visibleColumns.transactionId && (
                      <TableHead>Transaction ID</TableHead>
                    )}
                    {visibleColumns.sendingDate && (
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => handleSort("sendingDate")}
                      >
                        Sending Date {getSortIcon("sendingDate")}
                      </TableHead>
                    )}
                    {visibleColumns.inverterSerialNumber && (
                      <TableHead>Inverter Serial</TableHead>
                    )}
                    {visibleColumns.registeredBy && (
                      <TableHead>Registered By</TableHead>
                    )}
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRewards.map((reward: RewardWithId) => (
                    <TableRow
                      key={reward._id}
                      id={`reward-${reward._id}`}
                      className="transition-colors"
                    >
                      {visibleColumns.serialNumber && (
                        <TableCell className="font-medium">
                          <div className="flex items-center">
                            {reward.serialNumber}
                            <CopyButton
                              text={reward.serialNumber}
                              label="Serial Number"
                            />
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.installerCode && (
                        <TableCell>
                          <div className="flex items-center">
                            {reward.installerCode}
                            <CopyButton
                              text={reward.installerCode}
                              label="Installer Code"
                            />
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.installer && (
                        <TableCell>
                          {reward.installer?.fullName || "N/A"}
                        </TableCell>
                      )}
                      {visibleColumns.productModel && (
                        <TableCell>
                          {reward.productModel}
                        </TableCell>
                      )}
                      {visibleColumns.rewardAmount && (
                        <TableCell>
                          Rs. {reward.rewardAmount.toLocaleString()}
                        </TableCell>
                      )}
                      {visibleColumns.paymentStatus && (
                        <TableCell>
                          <Badge
                            variant={
                              reward.paymentStatus === "PAID"
                                ? "default"
                                : reward.paymentStatus === "PENDING"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {reward.paymentStatus}
                          </Badge>
                        </TableCell>
                      )}
                      {visibleColumns.paymentMethod && (
                        <TableCell>
                          {reward.paymentMethod || "N/A"}
                        </TableCell>
                      )}
                      {visibleColumns.transactionId && (
                        <TableCell>
                          <div className="flex items-center">
                            {reward.transactionId ? (
                              <>
                                {reward.transactionId}
                                <CopyButton
                                  text={reward.transactionId}
                                  label="Transaction ID"
                                />
                              </>
                            ) : (
                              "N/A"
                            )}
                          </div>
                        </TableCell>
                      )}
                      {visibleColumns.sendingDate && (
                        <TableCell>
                          {reward.sendingDate
                            ? new Date(reward.sendingDate).toLocaleDateString()
                            : "N/A"}
                        </TableCell>
                      )}
                      {visibleColumns.inverterSerialNumber && (
                        <TableCell>
                          {reward.inverterSerialNumber || "N/A"}
                        </TableCell>
                      )}
                      {visibleColumns.registeredBy && (
                        <TableCell>
                          {reward.registeredBy?.name || "N/A"}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              router.push(`/rewards/${reward._id}`)
                            }
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRewardId(reward._id);
                              setEditModalOpen(true);
                            }}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(reward._id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <RewardEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        rewardId={selectedRewardId}
        onSuccess={fetchRewards}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the reward
              and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
