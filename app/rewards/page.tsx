"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
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

export default function RewardsPage() {
  const router = useRouter();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const { copiedText, copyToClipboard } = useCopyToClipboard();

  // Filter states
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("ALL");
  const [sendingDateFilter, setSendingDateFilter] = useState("");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("");
  const [serialNumberStatusFilter, setSerialNumberStatusFilter] = useState("");
  const [productModelFilter, setProductModelFilter] = useState("");
  const [teamMemberFilter, setTeamMemberFilter] = useState("");

  // Unique values for filters
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [serialNumberStatuses, setSerialNumberStatuses] = useState<string[]>(
    []
  );
  const [productModels, setProductModels] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState("");

  // Sorting state
  const [sortField, setSortField] = useState<string>("createdAt");
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

  useEffect(() => {
    fetchRewards();
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
      if (paymentMethodFilter) {
        params.append("paymentMethod", paymentMethodFilter);
      }
      if (serialNumberStatusFilter) {
        params.append("serialNumberStatus", serialNumberStatusFilter);
      }
      if (productModelFilter) {
        params.append("productModel", productModelFilter);
      }
      if (teamMemberFilter) {
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
            allRewards.map((r: any) => r.paymentMethod).filter(Boolean)
          ),
        ] as string[]);
        setSerialNumberStatuses([
          ...new Set(
            allRewards.map((r: any) => r.serialNumberStatus).filter(Boolean)
          ),
        ] as string[]);
        setProductModels([
          ...new Set(
            allRewards.map((r: any) => r.productModel).filter(Boolean)
          ),
        ] as string[]);

        // Get unique team members
        const uniqueTeamMembers = allRewards
          .map((r: any) => r.registeredBy)
          .filter(
            (value: any, index: number, self: any[]) =>
              value &&
              self.findIndex((t: any) => t?._id === value?._id) === index
          );
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

  const handleSort = (field: string) => {
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

  const sortedRewards = [...rewards].sort((a: any, b: any) => {
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

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this reward? This action cannot be undone."
      )
    )
      return;

    try {
      const response = await fetch(`/api/rewards/${id}`, {
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
    }
  };

  const CopyButton = ({ text, label }: { text: string; label: string }) => {
    const isCopied = copiedText === text;

    return (
      <button
        onClick={() => handleCopy(text)}
        className="ml-2 p-1 text-gray-400 hover:text-indigo-600 transition-colors"
        title={`Copy ${label}`}
      >
        {isCopied ? (
          <Check className="h-4 w-4 text-green-600" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    );
  };

  const clearFilters = () => {
    setPaymentStatusFilter("ALL");
    setSendingDateFilter("");
    setPaymentMethodFilter("");
    setSerialNumberStatusFilter("");
    setProductModelFilter("");
    setTeamMemberFilter("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rewards</h1>
          <div className="space-x-4">
            <button
              onClick={() => router.push("/rewards/new")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              + Register Reward
            </button>
            <button
              onClick={() => router.push("/rewards/bulk-upload")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Bulk Update
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <div className="flex gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowColumnMenu(!showColumnMenu)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2 text-sm"
                >
                  <Settings2 className="h-4 w-4" />
                  Columns
                </button>
                {showColumnMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    <div className="p-2 max-h-96 overflow-y-auto">
                      <div className="text-xs font-semibold text-gray-500 uppercase px-2 py-1">
                        Show/Hide Columns
                      </div>
                      {Object.entries(visibleColumns).map(([key, value]) => (
                        <label
                          key={key}
                          className="flex items-center px-2 py-2 hover:bg-gray-50 cursor-pointer rounded"
                        >
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={() => toggleColumn(key)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Status
              </label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* Sending Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sending Date
              </label>
              <input
                type="date"
                value={sendingDateFilter}
                onChange={(e) => setSendingDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Methods</option>
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>

            {/* Serial Number Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Serial Number Status
              </label>
              <select
                value={serialNumberStatusFilter}
                onChange={(e) => setSerialNumberStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Status</option>
                {serialNumberStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Model Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Model
              </label>
              <select
                value={productModelFilter}
                onChange={(e) => setProductModelFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Models</option>
                {productModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>

            {/* Team Member Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registered By
              </label>
              <select
                value={teamMemberFilter}
                onChange={(e) => setTeamMemberFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">All Team Members</option>
                {teamMembers.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-600">Loading rewards...</div>
            </div>
          ) : sortedRewards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-600">No rewards found</div>
              <button
                onClick={() => router.push("/rewards/new")}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Register First Reward
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {visibleColumns.serialNumber && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("serialNumber")}
                      >
                        Serial Number {getSortIcon("serialNumber")}
                      </th>
                    )}
                    {visibleColumns.installerCode && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("installerCode")}
                      >
                        Installer Code {getSortIcon("installerCode")}
                      </th>
                    )}
                    {visibleColumns.installer && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("installer")}
                      >
                        Installer {getSortIcon("installer")}
                      </th>
                    )}
                    {visibleColumns.productModel && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("productModel")}
                      >
                        Product Model {getSortIcon("productModel")}
                      </th>
                    )}
                    {visibleColumns.rewardAmount && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("rewardAmount")}
                      >
                        Amount {getSortIcon("rewardAmount")}
                      </th>
                    )}
                    {visibleColumns.paymentStatus && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("paymentStatus")}
                      >
                        Status {getSortIcon("paymentStatus")}
                      </th>
                    )}
                    {visibleColumns.paymentMethod && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Payment Method
                      </th>
                    )}
                    {visibleColumns.transactionId && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Transaction ID
                      </th>
                    )}
                    {visibleColumns.sendingDate && (
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort("sendingDate")}
                      >
                        Sending Date {getSortIcon("sendingDate")}
                      </th>
                    )}
                    {visibleColumns.inverterSerialNumber && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Inverter Serial
                      </th>
                    )}
                    {visibleColumns.registeredBy && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Registered By
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedRewards.map((reward: any) => (
                    <tr key={reward._id} className="hover:bg-gray-50">
                      {visibleColumns.serialNumber && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {reward.serialNumber}
                            <CopyButton
                              text={reward.serialNumber}
                              label="Serial Number"
                            />
                          </div>
                        </td>
                      )}
                      {visibleColumns.installerCode && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            {reward.installerCode}
                            <CopyButton
                              text={reward.installerCode}
                              label="Installer Code"
                            />
                          </div>
                        </td>
                      )}
                      {visibleColumns.installer && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reward.installer?.fullName || "N/A"}
                        </td>
                      )}
                      {visibleColumns.productModel && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reward.productModel}
                        </td>
                      )}
                      {visibleColumns.rewardAmount && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rs. {reward.rewardAmount.toLocaleString()}
                        </td>
                      )}
                      {visibleColumns.paymentStatus && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full leading-none ${
                              reward.paymentStatus === "PAID"
                                ? "bg-green-100 text-green-800"
                                : reward.paymentStatus === "PENDING"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {reward.paymentStatus}
                          </span>
                        </td>
                      )}
                      {visibleColumns.paymentMethod && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reward.paymentMethod || "N/A"}
                        </td>
                      )}
                      {visibleColumns.transactionId && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                        </td>
                      )}
                      {visibleColumns.sendingDate && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reward.sendingDate
                            ? new Date(reward.sendingDate).toLocaleDateString()
                            : "N/A"}
                        </td>
                      )}
                      {visibleColumns.inverterSerialNumber && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reward.inverterSerialNumber || "N/A"}
                        </td>
                      )}
                      {visibleColumns.registeredBy && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {reward.registeredBy?.name || "N/A"}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              router.push(`/rewards/${reward._id}`)
                            }
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRewardId(reward._id);
                              setEditModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(reward._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <RewardEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        rewardId={selectedRewardId}
        onSuccess={fetchRewards}
      />
    </div>
  );
}
