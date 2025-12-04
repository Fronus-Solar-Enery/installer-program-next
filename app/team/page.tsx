"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TeamRole } from "@/types/roles";
import { toast } from "sonner";
import TeamEditModal from "@/components/TeamEditModal";
import TeamRegisterModal from "@/components/TeamRegisterModal";
import { Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import HoverCard from "@/components/HoverCard";
import {
  DeleteConfirmationDialog,
  type DeleteDialogState,
} from "@/components/DeleteConfirmationDialog";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  googleId?: string;
}

export default function TeamPage() {
  const { isAuthorized, isAdmin, isManager } = useRoleGuard({
    autoRedirect: true,
  });

  const { data: session } = useSession();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [selectedTeamMemberId, setSelectedTeamMemberId] = useState("");

  // Delete dialog state
  const [deleteDialogState, setDeleteDialogState] = useState<
    DeleteDialogState & { memberId?: string; memberName?: string }
  >({
    open: false,
    status: "confirm",
  });

  // Check authorization

  const fetchTeamMembers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/team");
      const data = await response.json();

      if (data.success) {
        setTeamMembers(data.data.members || []);
      } else {
        setError("Failed to load team members");
        setTeamMembers([]);
      }
    } catch {
      setError("An error occurred while fetching team members");
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchTeamMembers();
    }
  }, [isAuthorized, fetchTeamMembers]);

  const openDeleteDialog = useCallback((id: string, name: string) => {
    setDeleteDialogState({
      open: true,
      status: "confirm",
      memberId: id,
      memberName: name,
    });
  }, []);

  const handleDelete = useCallback(async () => {
    const { memberId, memberName } = deleteDialogState;
    if (!memberId || !memberName) return;

    // Set deleting state
    setDeleteDialogState((prev) => ({
      ...prev,
      status: "deleting",
    }));

    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        // Show success in dialog
        setDeleteDialogState({
          open: true,
          status: "success",
          message: `Team member "${memberName}" has been deleted successfully!`,
          memberName,
        });
        fetchTeamMembers();
      } else {
        // Show error in dialog
        setDeleteDialogState({
          open: true,
          status: "error",
          message: data.error || "Failed to delete team member",
          memberName,
        });
      }
    } catch (err) {
      // Show error in dialog
      setDeleteDialogState({
        open: true,
        status: "error",
        message: "An error occurred while deleting team member",
        memberName,
      });
    }
  }, [deleteDialogState, fetchTeamMembers]);

  const closeDeleteDialog = useCallback(() => {
    setDeleteDialogState({
      open: false,
      status: "confirm",
    });
  }, []);

  if (!isAuthorized) {
    return null;
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <Button onClick={() => setRegisterModalOpen(true)}>
          + Add Team Member
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Loading team members...</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Auth Method</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!teamMembers || teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground"
                  >
                    No team members found
                  </TableCell>
                </TableRow>
              ) : (
                teamMembers.map((member) => (
                  <TableRow key={member._id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          member.role === TeamRole.ADMIN
                            ? "destructive"
                            : member.role === TeamRole.MANAGER
                            ? "default"
                            : "secondary"
                        }
                      >
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {member.googleId ? (
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24">
                            <path
                              fill="#4285F4"
                              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                              fill="#34A853"
                              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                              fill="#FBBC05"
                              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                              fill="#EA4335"
                              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                          </svg>
                          Google
                        </span>
                      ) : (
                        "Credentials"
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <HoverCard
                          asChild
                          trigger={
                            <Button
                              onClick={() => {
                                setSelectedTeamMemberId(member._id);
                                setEditModalOpen(true);
                              }}
                              variant="ghost"
                              size="icon"
                              disabled={
                                !isAdmin && member.role === TeamRole.ADMIN
                              }
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          }
                          content={
                            !isAdmin && member.role === TeamRole.ADMIN ? (
                              <p>You can&apos;t edit {member.name}</p>
                            ) : (
                              <p>Edit {member.name} </p>
                            )
                          }
                        />
                        <HoverCard
                          asChild
                          trigger={
                            <Button
                              onClick={() =>
                                openDeleteDialog(member._id, member.name)
                              }
                              variant="ghost"
                              size="icon"
                              disabled={
                                session?.user?.id === member._id ||
                                (!isAdmin && member.role === TeamRole.ADMIN)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          }
                          content={
                            !isAdmin && member.role === TeamRole.ADMIN
                              ? `You can't delete ${member.name}`
                              : `Delete ${member.name}?`
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <Alert className="mt-6">
        <AlertDescription>
          <h3 className="font-semibold mb-2">Role Permissions</h3>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-medium">ADMIN:</span> Can create ADMIN,
              MANAGER, and USER accounts
            </p>
            <p>
              <span className="font-medium">MANAGER:</span> Can create MANAGER
              and USER accounts
            </p>
            <p>
              <span className="font-medium">USER:</span> Can register installers
              and rewards
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Register Modal */}
      <TeamRegisterModal
        open={registerModalOpen}
        onOpenChange={setRegisterModalOpen}
        onSuccess={fetchTeamMembers}
      />

      {/* Edit Modal */}
      <TeamEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        teamMemberId={selectedTeamMemberId}
        onSuccess={fetchTeamMembers}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogState.open}
        status={deleteDialogState.status}
        itemName={deleteDialogState.memberName}
        message={deleteDialogState.message}
        entityType="team-member"
        warningMessage="This action cannot be undone."
        onConfirm={handleDelete}
        onClose={closeDeleteDialog}
      />
    </>
  );
}
