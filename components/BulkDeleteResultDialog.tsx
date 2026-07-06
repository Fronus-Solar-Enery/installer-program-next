import { Button } from "@/components/ui/button";
import {
  AlertDialog,
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
} from "@/components/icons";

export interface BulkDeleteResultState {
  open: boolean;
  successCount: number;
  failCount: number;
  failures: Array<{ name: string; reason: string }>;
}

interface BulkDeleteResultDialogProps {
  open: boolean;
  successCount: number;
  failCount: number;
  failures: Array<{ name: string; reason: string }>;
  entityType: "installer" | "reward";
  onClose: () => void;
}

export function BulkDeleteResultDialog({
  open,
  successCount,
  failCount,
  failures,
  entityType,
  onClose,
}: BulkDeleteResultDialogProps) {
  const entityLabel = entityType === "installer" ? "installer" : "reward";

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent className="rounded-4xl max-w-xs">
        <AlertDialogHeader className="flex flex-col items-center">
          {failCount === 0 ? (
            <>
              <IconCheckCircle
                duotone
                fill
                opacity={0.1}
                className="size-32 text-green-500"
              />
              <AlertDialogTitle>Bulk Delete Complete</AlertDialogTitle>
              <AlertDialogDescription className="w-19/20 text-center text-balance">
                Successfully deleted {successCount} {entityLabel}
                {successCount !== 1 ? "s" : ""}!
              </AlertDialogDescription>
            </>
          ) : successCount === 0 ? (
            <>
              <IconCloseCircle
                className="size-32 text-destructive-text"
                fill
                duotone
                opacity={0.1}
              />
              <AlertDialogTitle>All Deletions Failed</AlertDialogTitle>
              <AlertDialogDescription className="w-19/20 text-center text-balance">
                Failed to delete {failCount} {entityLabel}
                {failCount !== 1 ? "s" : ""}. See details below.
              </AlertDialogDescription>
            </>
          ) : (
            <>
              <div className="size-32 flex items-center justify-center relative">
                <IconCheckCircle
                  duotone
                  fill
                  opacity={0.1}
                  className="size-32 text-green-500 absolute"
                />
                <div className="size-12 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center font-bold text-xl absolute -bottom-2 -right-2 border-4 border-background">
                  {failCount}
                </div>
              </div>
              <AlertDialogTitle>Partial Success</AlertDialogTitle>
              <AlertDialogDescription className="w-19/20 text-center text-balance">
                Successfully deleted {successCount} {entityLabel}
                {successCount !== 1 ? "s" : ""}, but {failCount} failed.
              </AlertDialogDescription>
            </>
          )}
        </AlertDialogHeader>

        {failCount > 0 && (
          <div className="mt-4 max-h-96 overflow-y-auto">
            <div className="px-6 pb-2">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <IconInfoCircle className="size-5 text-destructive-text" />
                Failed Deletions ({failCount})
              </h4>
              <div className="space-y-2">
                {failures.map((failure, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{failure.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>Reason:</strong> {failure.reason}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <AlertDialogFooter className="mt-4">
          <Button variant={"outline"} onClick={onClose} className="w-full">
            Close
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
