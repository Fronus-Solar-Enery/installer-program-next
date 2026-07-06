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

export type BulkDeleteStatus = "confirm" | "deleting" | "success" | "error";

interface BulkDeleteConfirmationDialogProps {
  open: boolean;
  status: BulkDeleteStatus;
  count: number;
  successCount?: number;
  failCount?: number;
  entityType: "installer" | "reward";
  warningMessage?: string;
  message?: string;
  failures?: Array<{ name: string; reason: string }>;
  onConfirm: () => void;
  onClose: () => void;
}

export function BulkDeleteConfirmationDialog({
  open,
  status,
  count,
  successCount = 0,
  failCount = 0,
  entityType,
  warningMessage,
  message,
  failures,
  onConfirm,
  onClose,
}: BulkDeleteConfirmationDialogProps) {
  const entityLabel = entityType === "installer" ? "Installer" : "Reward";
  const entityLabelPlural =
    entityType === "installer" ? "Installers" : "Rewards";
  const pluralSuffix = count > 1 ? "s" : "";

  return (
    <AlertDialog
      open={open}
      onOpenChange={(open) => {
        if (!open && status !== "deleting") {
          onClose();
        }
      }}
    >
      <AlertDialogContent className="rounded-4xl">
        <AlertDialogHeader className="flex flex-col items-center">
          <div
            key={status}
            className="flex flex-col items-center gap-2 animate-status-in"
          >
          {status === "confirm" && (
            <>
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
            </>
          )}

          {status === "deleting" && (
            <>
              <div className="size-32 flex items-center justify-center">
                <Loading className="size-24" />
              </div>
              <AlertDialogTitle>Deleting...</AlertDialogTitle>
              <AlertDialogDescription className="w-19/20 text-center text-balance">
                Please wait while we delete {count} {entityType}
                {pluralSuffix}...
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
              <AlertDialogTitle>Deletion Complete!</AlertDialogTitle>
              <AlertDialogDescription className="w-19/20 text-center text-balance">
                {successCount > 0 && (
                  <span className="block text-green-600 dark:text-green-400 mb-2">
                    Successfully deleted {successCount} {entityType}
                    {successCount > 1 ? "s" : ""} from database
                  </span>
                )}
                {message && (
                  <span className="block mt-4 text-blue-600 dark:text-blue-400 font-medium">
                    {message}
                  </span>
                )}
                {failCount > 0 && (
                  <span className="block mt-4">
                    <span className="block text-destructive-text font-semibold mb-2">
                      Failed to delete {failCount} {entityType}
                      {failCount > 1 ? "s" : ""}:
                    </span>
                    {failures && failures.length > 0 && (
                      <div className="max-h-48 overflow-y-auto text-left bg-muted/50 rounded-lg p-3 space-y-2">
                        {failures.map((failure, index) => (
                          <div
                            key={index}
                            className="text-xs border-l-2 border-destructive-text pl-2"
                          >
                            <div className="font-medium">{failure.name}</div>
                            <div className="text-muted-foreground">
                              {failure.reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </span>
                )}
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
                  Failed to delete the selected {entityType}
                  {pluralSuffix}
                </span>
                {message && (
                  <span className="mt-4 flex gap-2 text-destructive-text items-start justify-center">
                    <IconInfoCircle className="mt-0.5 shrink-0" />
                    <span className="text-left">
                      <strong>Reason:</strong> {message}
                    </span>
                  </span>
                )}
              </AlertDialogDescription>
            </>
          )}
          </div>
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
                {status === "confirm" &&
                  `Delete ${count} ${entityLabel}${pluralSuffix}`}
                {status === "deleting" && (
                  <div className="flex items-center gap-2">
                    Deleting {count} {entityLabel}
                    {pluralSuffix}...
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
