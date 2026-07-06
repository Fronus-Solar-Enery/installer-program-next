import React, { useCallback } from "react";
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
import { IconSquareShareLine } from "@/components/icons";
import Loading from "@/components/ui/loading";
import type { Filters } from "@/hooks/useRewardsState";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
}

interface RewardsFiltersSectionProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onClearFilters: () => void;
  onDownloadReport: () => void;
  uniqueValues: {
    paymentMethods: string[];
    serialNumberStatuses: string[];
    productModels: string[];
  };
  teamMembers: TeamMember[];
  hasResults: boolean;
  downloadingReport: boolean;
  loading: boolean;
}

export const RewardsFiltersSection = React.memo<RewardsFiltersSectionProps>(
  ({
    filters,
    onFilterChange,
    onClearFilters,
    onDownloadReport,
    uniqueValues,
    teamMembers,
    hasResults,
    downloadingReport,
    loading,
  }) => {
    // Memoize handlers to prevent recreating on every render
    const handleSearchChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange("search", e.target.value);
      },
      [onFilterChange]
    );

    const handleRewardStatusChange = useCallback(
      (value: string) => {
        onFilterChange("rewardStatus", value);
      },
      [onFilterChange]
    );

    const handleSendingDateChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        onFilterChange("sendingDate", e.target.value);
      },
      [onFilterChange]
    );

    const handlePaymentMethodChange = useCallback(
      (value: string) => {
        onFilterChange("paymentMethod", value);
      },
      [onFilterChange]
    );

    const handleSerialNumberStatusChange = useCallback(
      (value: string) => {
        onFilterChange("serialNumberStatus", value);
      },
      [onFilterChange]
    );

    const handleProductModelChange = useCallback(
      (value: string) => {
        onFilterChange("productModel", value);
      },
      [onFilterChange]
    );

    const handleTeamMemberChange = useCallback(
      (value: string) => {
        onFilterChange("teamMember", value);
      },
      [onFilterChange]
    );

    return (
      <Card className="dark:bg-transparent">
        <CardHeader className="flex-row items-center justify-between w-full bg-muted/70 border-b border-border">
          <CardTitle className="text-lg font-semibold">Filters</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onDownloadReport}
              disabled={!hasResults || downloadingReport || loading}
              className="gap-2"
            >
              {downloadingReport ? (
                <>
                  Downloading <Loading />
                </>
              ) : loading ? (
                <>
                  Generating <Loading />
                </>
              ) : (
                <>
                  Export
                  <IconSquareShareLine width={2} />
                </>
              )}
            </Button>

            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Clear All Filters
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Search Input */}
          <div className="mb-4">
            <Label htmlFor="search">Search</Label>
            <Input
              id="search"
              type="text"
              placeholder="Search by serial number, transaction ID, installer code, name, CNIC, phone..."
              value={filters.search}
              onChange={handleSearchChange}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Reward Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="reward-status">Reward Status</Label>
              <Select
                value={filters.rewardStatus}
                onValueChange={handleRewardStatusChange}
              >
                <SelectTrigger id="reward-status">
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
                value={filters.sendingDate}
                onChange={handleSendingDateChange}
              />
            </div>

            {/* Payment Method Filter */}
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select
                value={filters.paymentMethod}
                onValueChange={handlePaymentMethodChange}
              >
                <SelectTrigger id="payment-method">
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {uniqueValues.paymentMethods.map((method) => (
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
              <Select
                value={filters.serialNumberStatus}
                onValueChange={handleSerialNumberStatusChange}
              >
                <SelectTrigger id="serial-status">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {uniqueValues.serialNumberStatuses.map((status) => (
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
              <Select
                value={filters.productModel}
                onValueChange={handleProductModelChange}
              >
                <SelectTrigger id="product-model">
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Models</SelectItem>
                  {uniqueValues.productModels.map((model) => (
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
              <Select
                value={filters.teamMember}
                onValueChange={handleTeamMemberChange}
              >
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
    );
  }
);

RewardsFiltersSection.displayName = "RewardsFiltersSection";
