import { memo, useCallback } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/CopyButton";
import { IconEdit2, IconTrashBin2 } from "@/components/icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { InstallerWithId } from "@/hooks/useInstallers";
import type { ColumnVisibility } from "@/hooks/useInstallersState";

interface InstallerTableRowProps {
  installer: InstallerWithId;
  isSelected: boolean;
  isAdmin: boolean;
  isDeleting: boolean;
  visibleColumns: ColumnVisibility;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  formatRelativeTime: (date: string) => string;
}

function InstallerTableRowComponent({
  installer,
  isSelected,
  isAdmin,
  isDeleting,
  visibleColumns,
  onSelect,
  onEdit,
  onDelete,
  formatRelativeTime,
}: InstallerTableRowProps) {
  const handleCheckboxChange = useCallback(
    (checked: boolean) => {
      onSelect(installer._id, checked);
    },
    [installer._id, onSelect]
  );

  const handleEdit = useCallback(() => {
    onEdit(installer._id);
  }, [installer._id, onEdit]);

  const handleDelete = useCallback(() => {
    onDelete(installer._id, installer.fullName);
  }, [installer._id, installer.fullName, onDelete]);

  return (
    <TableRow
      id={`installer-${installer._id}`}
      className={cn(
        "hover:bg-muted/50 transition-colors",
        isSelected && "bg-primary/5"
      )}
    >
      {/* Checkbox */}
      <TableCell className="text-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          aria-label={`Select ${installer.fullName}`}
          disabled={isDeleting}
        />
      </TableCell>

      {/* Installer Code */}
      {visibleColumns.installerCode && (
        <TableCell className="font-mono text-xs">
          <div className="flex items-center gap-2">
            <Link
              href={`/installers/${installer._id}`}
              className="hover:text-primary transition-colors"
            >
              {installer.installerCode}
            </Link>
            <CopyButton text={installer.installerCode} />
          </div>
        </TableCell>
      )}

      {/* Full Name */}
      {visibleColumns.fullName && (
        <TableCell className="font-medium">
          <Link
            href={`/installers/${installer._id}`}
            className="hover:text-primary transition-colors"
          >
            {installer.fullName}
          </Link>
        </TableCell>
      )}

      {/* CNIC */}
      {visibleColumns.cnic && (
        <TableCell className="font-mono text-xs">
          <div className="flex items-center gap-2">
            {installer.cnic}
            <CopyButton text={installer.cnic} />
          </div>
        </TableCell>
      )}

      {/* Phone Number */}
      {visibleColumns.phoneNumber && (
        <TableCell className="font-mono text-xs">
          <div className="flex items-center gap-2">
            {installer.phoneNumber}
            <CopyButton text={installer.phoneNumber} />
          </div>
        </TableCell>
      )}

      {/* City */}
      {visibleColumns.city && <TableCell>{installer.city || "-"}</TableCell>}

      {/* Province */}
      {visibleColumns.province && (
        <TableCell>{installer.province || "-"}</TableCell>
      )}

      {/* District */}
      {visibleColumns.district && (
        <TableCell>{installer.district || "-"}</TableCell>
      )}

      {/* Company Name */}
      {visibleColumns.companyName && (
        <TableCell>{installer.companyName || "-"}</TableCell>
      )}

      {/* Certified */}
      {visibleColumns.certified && (
        <TableCell>
          <Badge
            variant={installer.certified ? "default" : "secondary"}
            className={cn(
              "font-medium",
              installer.certified
                ? "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                : "bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20"
            )}
          >
            {installer.certified ? "Certified" : "Not Certified"}
          </Badge>
        </TableCell>
      )}

      {/* Bank Name */}
      {visibleColumns.bankName && (
        <TableCell>{installer.bankName || "-"}</TableCell>
      )}

      {/* Account Number */}
      {visibleColumns.accountNumber && (
        <TableCell className="font-mono text-xs">
          {installer.accountNumber ? (
            <div className="flex items-center gap-2">
              {installer.accountNumber}
              <CopyButton text={installer.accountNumber} />
            </div>
          ) : (
            "-"
          )}
        </TableCell>
      )}

      {/* Date Joined */}
      <TableCell className="text-xs text-muted-foreground">
        {formatRelativeTime(installer.createdAt)}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="Edit"
            onClick={handleEdit}
            disabled={isDeleting}
          >
            <IconEdit2 />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            title="Delete"
            disabled={!isAdmin || isDeleting}
            className="group"
            onClick={handleDelete}
          >
            <IconTrashBin2 className="h-4.5 w-4.5 text-destructive-text group-hover:text-destructive-text-hover transition-colors duration-300" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export const InstallerTableRow = memo(InstallerTableRowComponent);
