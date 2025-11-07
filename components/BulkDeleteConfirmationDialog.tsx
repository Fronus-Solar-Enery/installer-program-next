import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { IconInfoCircle, IconTrashBin2 } from "@/components/icons";

interface BulkDeleteConfirmationDialogProps {
  open: boolean;
  deleting: boolean;
  count: number;
  entityType: "installer" | "reward";
  warningMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function BulkDeleteConfirmationDialog({
  open,
  deleting,
  count,
  entityType,
  warningMessage,
  onConfirm,
  onClose,
}: BulkDeleteConfirmationDialogProps) {
  const entityLabel = entityType === "installer" ? "Installer" : "Reward";
  const entityLabelPlural = entityType === "installer" ? "Installers" : "Rewards";
  const pluralSuffix = count > 1 ? "s" : "";

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-4xl">
        <AlertDialogHeader className="flex flex-col items-center">
          <IconTrashBin2
            className="size-32 text-destructive-text"
            fill
            opacity={"0.2"}
            duotone={true}
          />
          <AlertDialogTitle>
            Delete {count} {entityLabel}
            {pluralSuffix}?
          </AlertDialogTitle>
          <AlertDialogDescription className="w-19/20 flex flex-col items-center text-balance">
            This will permanently delete the selected {entityType}
            {pluralSuffix}
            {entityType === "installer" && " and their Google Contacts"}.
            <span className="mt-6 flex gap-2 text-destructive-text">
              <IconInfoCircle className="size-6" />
              <span>
                This action cannot be undone. <br />
                {warningMessage ||
                  `${entityLabelPlural} with rewards cannot be deleted.`}
              </span>
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-4">
          <AlertDialogAction
            onClick={onConfirm}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              `Delete ${count} ${entityLabel}${pluralSuffix}`
            )}
          </AlertDialogAction>
          <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
