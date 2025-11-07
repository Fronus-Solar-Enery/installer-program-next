import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TableCell, TableRow } from "@/components/ui/table";
import { CopyButton } from "@/components/CopyButton";
import { IconEdit2, IconTrashBin2 } from "@/components/icons";
import type { RewardWithId } from "@/hooks/useOptimizedRewardsFilter";
import type { ColumnVisibility } from "@/hooks/useRewardsState";

interface RewardsTableRowProps {
  reward: RewardWithId;
  visibleColumns: ColumnVisibility;
  isSelected: boolean;
  onToggleSelection: (id: string) => void;
  onEditClick: (id: string) => void;
  onDeleteClick: (id: string, serialNumber: string) => void;
}

export const RewardsTableRow = React.memo<RewardsTableRowProps>(
  ({
    reward,
    visibleColumns,
    isSelected,
    onToggleSelection,
    onEditClick,
    onDeleteClick,
  }) => {
    const router = useRouter();

    const handleRowClick = React.useCallback(() => {
      router.push(`/rewards/${reward._id}`);
    }, [router, reward._id]);

    const handleToggleSelection = React.useCallback(() => {
      onToggleSelection(reward._id);
    }, [onToggleSelection, reward._id]);

    const handleEditClick = React.useCallback(() => {
      onEditClick(reward._id);
    }, [onEditClick, reward._id]);

    const handleDeleteClick = React.useCallback(() => {
      onDeleteClick(reward._id, reward.serialNumber);
    }, [onDeleteClick, reward._id, reward.serialNumber]);

    return (
      <TableRow id={`reward-${reward._id}`} className="transition-colors">
        <TableCell className="text-center w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={handleToggleSelection}
            aria-label={`Select ${reward.serialNumber}`}
          />
        </TableCell>
        {visibleColumns.serialNumber && (
          <TableCell className="font-medium">
            <div
              className="flex items-center cursor-pointer"
              onClick={handleRowClick}
            >
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
          <TableCell>{reward.installer?.fullName || "N/A"}</TableCell>
        )}
        {visibleColumns.productModel && (
          <TableCell>{reward.productModel}</TableCell>
        )}
        {visibleColumns.cityOfInstallation && (
          <TableCell>{reward.cityOfInstallation}</TableCell>
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
          <TableCell>{reward.paymentMethod || "N/A"}</TableCell>
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
          <TableCell>{reward.inverterSerialNumber || "N/A"}</TableCell>
        )}
        {visibleColumns.registeredBy && (
          <TableCell>{reward.registeredBy?.name || "N/A"}</TableCell>
        )}
        <TableCell>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEditClick}
              title="Edit"
            >
              <IconEdit2 />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDeleteClick}
              title="Delete"
            >
              <IconTrashBin2 className="text-destructive-text" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
      prevProps.reward._id === nextProps.reward._id &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.visibleColumns === nextProps.visibleColumns
    );
  }
);

RewardsTableRow.displayName = "RewardsTableRow";
