"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { ArrowLeft, Download, Loader2, Inbox, Trash2 } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { IconLayer } from "@/components/icons";
import Loading from "@/components/ui/loading";
import { toast } from "sonner";

interface ArchiveListItem {
  _id: string;
  fileName: string;
  archiveName: string;
  uploadedBy?: { name?: string; email?: string } | null;
  totalRecords: number;
  successCount: number;
  failedCount: number;
  totalInstallerAmount: number;
  totalReferrerAmount: number;
  totalAmount: number;
  createdAt: string;
}

const formatPKR = (n: number) => `PKR ${(n || 0).toLocaleString()}`;

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function RewardArchivesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<ArchiveListItem | null>(null);

  const { data, isLoading, isError } = useQuery<{ archives: ArchiveListItem[] }>({
    queryKey: ["reward-archives"],
    queryFn: async () => {
      const res = await fetch("/api/reward-archives");
      if (!res.ok) throw new Error("Failed to load archives");
      const json = await res.json();
      return json.data;
    },
  });

  const archives = data?.archives ?? [];

  const handleDownload = async (archive: ArchiveListItem) => {
    setDownloadingId(archive._id);
    try {
      const res = await fetch(`/api/reward-archives/${archive._id}`);
      if (!res.ok) throw new Error("Failed to download archive");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${archive.archiveName}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Archive downloaded");
    } catch {
      toast.error("Failed to download archive");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    setDeletingId(toDelete._id);
    try {
      const res = await fetch(`/api/reward-archives/${toDelete._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete archive");
      await queryClient.invalidateQueries({ queryKey: ["reward-archives"] });
      toast.success("Archive deleted");
    } catch {
      toast.error("Failed to delete archive");
    } finally {
      setDeletingId(null);
      setToDelete(null);
    }
  };

  return (
    <div className="flex-1 overflow-auto space-y-4">
      <PageHeader
        iconFill
        Icon={IconLayer}
        title="Bulk Update Archives"
        description="Successfully-updated reward batches, saved per uploaded file"
        action={
          <Button
            variant="ghost"
            onClick={() => router.push("/rewards/bulk-update")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bulk Update
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
              <Loading />
              <span>Loading archives...</span>
            </div>
          ) : isError ? (
            <div className="py-16 text-center text-destructive text-sm">
              Failed to load archives. Please try again.
            </div>
          ) : archives.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Inbox className="h-10 w-10 opacity-50" />
              <p className="text-sm">No archives yet.</p>
              <p className="text-xs">
                Archives appear here after a successful bulk update.
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File Name</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead className="text-right">Installer</TableHead>
                    <TableHead className="text-right">Referrer</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archives.map((a) => (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium max-w-[16rem] truncate">
                        {a.archiveName}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.uploadedBy?.name || a.uploadedBy?.email || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="inline-flex items-center gap-1">
                          <Badge variant="default" className="bg-green-600">
                            {a.successCount}
                          </Badge>
                          {a.failedCount > 0 && (
                            <Badge variant="destructive">{a.failedCount}</Badge>
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatPKR(a.totalInstallerAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatPKR(a.totalReferrerAmount)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {formatPKR(a.totalAmount)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatDateTime(a.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(a)}
                            disabled={downloadingId === a._id}
                          >
                            {downloadingId === a._id ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-4 w-4 mr-2" />
                            )}
                            Download
                          </Button>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setToDelete(a)}
                              disabled={deletingId === a._id}
                              title="Delete archive"
                            >
                              {deletingId === a._id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-destructive" />
                              )}
                            </Button>
                          )}
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

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete archive?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{toDelete?.archiveName}&quot; will be permanently removed.
              This only deletes the archive record — it does not change any
              reward data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
