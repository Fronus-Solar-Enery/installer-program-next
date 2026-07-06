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

interface SimpleDeleteDialogProps {
  open: boolean;
  deleting: boolean;
  itemName: string;
  entityType: "installer" | "reward";
  warningMessage?: string;
  additionalWarning?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
}

export function SimpleDeleteDialog({
  open,
  deleting,
  itemName,
  entityType,
  warningMessage,
  additionalWarning,
  onConfirm,
  onClose,
}: SimpleDeleteDialogProps) {
  const entityLabel = entityType === "installer" ? "Installer" : "Reward";
  const entityLabelLower = entityLabel.toLowerCase();

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
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription className="w-19/20 flex flex-col items-center text-balance">
            This will permanently delete the {entityLabelLower}{" "}
            <span className="flex items-center gap-2">
              <strong>{itemName}</strong>
            </span>
            <span className="mt-6 flex gap-2 text-destructive-text">
              <IconInfoCircle className="size-6" />
              <span>
                This action cannot be undone.
                {warningMessage && (
                  <>
                    {" "}
                    <br />
                    {warningMessage}
                  </>
                )}
              </span>
            </span>
            {additionalWarning}
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
              `Delete ${entityLabel}`
            )}
          </AlertDialogAction>
          <AlertDialogCancel className="w-full">Cancel</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
