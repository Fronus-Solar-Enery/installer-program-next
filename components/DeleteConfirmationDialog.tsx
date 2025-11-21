import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  IconCheckCircle,
  IconCloseCircle,
  IconInfoCircle,
  IconTrashBin2,
} from "@/components/icons";
import Loading from "@/components/ui/loading";

export type DeleteStatus = "confirm" | "deleting" | "success" | "error";

export interface DeleteDialogState {
  open: boolean;
  status: DeleteStatus;
  itemId?: string;
  itemName?: string;
  message?: string;
}

interface DeleteConfirmationDialogProps {
  open: boolean;
  status: DeleteStatus;
  itemName?: string;
  message?: string;
  entityType: "installer" | "reward" | "batch-job";
  warningMessage?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmationDialog({
  open,
  status,
  itemName,
  message,
  entityType,
  warningMessage,
  onConfirm,
  onClose,
}: DeleteConfirmationDialogProps) {
  const entityLabel =
    entityType === "installer"
      ? "Installer"
      : entityType === "reward"
      ? "Reward"
      : "Batch Job";
  const entityLabelLower = entityLabel.toLowerCase();

  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        // Prevent closing while deleting
        if (!open && status !== "deleting") {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="rounded-4xl">
        <AlertDialogHeader className="flex flex-col items-center">
          {status === "confirm" && (
            <>
              <IconTrashBin2
                className="size-32 text-destructive-text"
                fill
                opacity={"0.2"}
                duotone={true}
              />
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="w-19/20 flex flex-col text-center items-center text-balance">
                This will permanently delete the {entityLabelLower}{" "}
                <span className="flex items-center gap-2">
                  <strong className="whitespace-nowrap">{itemName}</strong>
                </span>
                <span className="mt-6 flex gap-2 text-destructive-text text-left">
                  <IconInfoCircle className="size-6 shrink-0" duotone />
                  <span>
                    {warningMessage ||
                      `${entityLabel} with rewards cannot be deleted.`}
                  </span>
                </span>
              </AlertDialogDescription>
            </>
          )}

          {status === "deleting" && (
            <>
              <div className="size-32 flex items-center justify-center">
                <Loading className="size-24" />
              </div>
              <AlertDialogTitle>Deleting...</AlertDialogTitle>
              <AlertDialogDescription className="w-19/20 text-center text-balance">
                Please wait while we delete {entityLabelLower}{" "}
                <strong>{itemName}</strong>
              </AlertDialogDescription>
            </>
          )}

          {status === "success" && (
            <>
              <IconCheckCircle
                duotone
                fill
                opacity={0.1}
                className="size-32 text-green-500"
              />
              <AlertDialogTitle>Success!</AlertDialogTitle>
              <AlertDialogDescription className="w-19/20 text-center text-balance">
                {message}
              </AlertDialogDescription>
            </>
          )}

          {status === "error" && (
            <>
              <IconCloseCircle
                className="size-32 text-destructive-text"
                fill
                duotone
                opacity={0.1}
              />
              <AlertDialogTitle>Deletion Failed</AlertDialogTitle>
              <AlertDialogDescription className="w-19/20 flex flex-col items-center text-balance">
                <span className="mb-2">
                  Failed to delete {entityLabelLower}{" "}
                  <strong>{itemName}</strong>
                </span>
                <span className="mt-4 flex gap-2 text-destructive-text items-start justify-center">
                  <IconInfoCircle className="mt-0.5 shrink-0" />
                  <span className="text-left">
                    <strong>Reason:</strong> {message}
                  </span>
                </span>
              </AlertDialogDescription>
            </>
          )}
        </AlertDialogHeader>

        <AlertDialogFooter className="mt-4">
          {(status === "confirm" || status === "deleting") && (
            <>
              <Button
                onClick={onConfirm}
                className="w-full rounded-full"
                size="icon"
                variant={"destructive"}
                disabled={status === "deleting"}
              >
                {status === "confirm" && `Delete ${entityLabel}`}
                {status === "deleting" && (
                  <div className="flex items-center gap-2">
                    Deleting {entityLabel}...
                  </div>
                )}
              </Button>
              <AlertDialogCancel
                className="w-full rounded-full"
                size="icon"
                disabled={status === "deleting"}
              >
                Cancel
              </AlertDialogCancel>
            </>
          )}

          {(status === "success" || status === "error") && (
            <Button variant={"outline"} onClick={onClose} className="w-full">
              Close
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
