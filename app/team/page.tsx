"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { TeamRole } from "@/types/roles";
import TeamEditModal from "@/components/TeamEditModal";
import TeamRegisterModal from "@/components/TeamRegisterModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import {
  DeleteConfirmationDialog,
  type DeleteDialogState,
} from "@/components/DeleteConfirmationDialog";
import PageHeader from "@/components/PageHeader";
import { IconAdd, IconEdit2, IconUser } from "@/components/icons";
import IconTrashBin2 from "@/components/icons/TrashBin2";
import IconSortVertical from "@/components/icons/SortVertical";
import { UserAvatar } from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import Loading from "@/components/ui/loading";
import { EmptyState } from "@/components/EmptyState";

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: TeamRole;
  createdAt: string;
  googleId?: string;
}

type SortField = "name" | "email" | "role" | "createdAt";
type SortDirection = "asc" | "desc";

// Role priority for sorting
const ROLE_PRIORITY: Record<TeamRole, number> = {
  [TeamRole.ADMIN]: 1,
  [TeamRole.MANAGER]: 2,
  [TeamRole.USER]: 3,
};

export default function TeamPage() {
  const { isAuthorized, isAdmin, isManager } = useRoleGuard({
    autoRedirect: true,
  });

  const { data: session } = useSession();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sorting state
  const [sortField, setSortField] = useState<SortField>("role");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

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

  // Sorted team members
  const sortedTeamMembers = useMemo(() => {
    return [...teamMembers].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "email":
          comparison = a.email.localeCompare(b.email);
          break;
        case "role":
          comparison = ROLE_PRIORITY[a.role] - ROLE_PRIORITY[b.role];
          break;
        case "createdAt":
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [teamMembers, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return (
        <IconSortVertical className="size-4 ml-1 inline text-muted-foreground/50" />
      );
    }
    return sortDirection === "asc" ? (
      <IconSortVertical duotone className="size-4 ml-1 inline text-primary" />
    ) : (
      <IconSortVertical
        duotone
        className="size-4 ml-1 inline rotate-180 text-primary"
      />
    );
  };

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
        setDeleteDialogState({
          open: true,
          status: "success",
          message: `Team member "${memberName}" has been deleted successfully!`,
          memberName,
        });
        fetchTeamMembers();
      } else {
        setDeleteDialogState({
          open: true,
          status: "error",
          message: data.message || "Failed to delete team member",
          memberName,
        });
      }
    } catch (err) {
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

  const getRoleBadgeVariant = (role: TeamRole) => {
    switch (role) {
      case TeamRole.ADMIN:
        return "destructive";
      case TeamRole.MANAGER:
        return "warning";
      default:
        return "info";
    }
  };

  if (!isAuthorized) {
    return null;
  }

  // Column styles for consistent widths
  const columnStyles = {
    name: { flex: 1, minWidth: "200px" },
    email: { flex: 1.5, minWidth: "250px" },
    role: { flex: 1, minWidth: "120px" },
    auth: { flex: 1, minWidth: "120px" },
    joined: { flex: 1, minWidth: "150px" },
    actions: { flex: 1, minWidth: "100px" },
  };

  return (
    <div className="flex-1 overflow-auto space-y-4">
      <PageHeader
        title="Team Management"
        iconFill
        Icon={IconUser}
        description={
          <p className="mt-1 text-sm text-muted-foreground">
            Manage team members, roles, and permissions
          </p>
        }
        action={
          <Button
            onClick={() => setRegisterModalOpen(true)}
            className="gap-2 pl-2"
          >
            <IconAdd width={2} className="h-3.5 w-3.5" />
            Add Team Member
          </Button>
        }
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Members
                </p>
                <p className="text-2xl font-bold">{teamMembers.length}</p>
              </div>
              <IconUser className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Admins
                </p>
                <p className="text-2xl font-bold">
                  {teamMembers.filter((m) => m.role === TeamRole.ADMIN).length}
                </p>
              </div>
              <Badge variant="destructive" className="text-xs">
                ADMIN
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Managers
                </p>
                <p className="text-2xl font-bold">
                  {
                    teamMembers.filter((m) => m.role === TeamRole.MANAGER)
                      .length
                  }
                </p>
              </div>
              <Badge variant="default" className="text-xs">
                MANAGER
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Table */}
      <Card className="bg-transparent">
        <CardHeader className="flex-row items-center justify-between w-full bg-muted/50 border-b border-border/30">
          <CardTitle className="text-lg font-semibold">
            Team Members
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal">
              <span>
                {loading ? <Loading /> : `${teamMembers.length} members`}
              </span>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0!">
          {/* Table Header */}
          <div className="flex w-full min-w-max bg-muted/30 border-b border-border">
            <button
              onClick={() => handleSort("name")}
              className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
              style={columnStyles.name}
            >
              Name {getSortIcon("name")}
            </button>
            <button
              onClick={() => handleSort("email")}
              className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
              style={columnStyles.email}
            >
              Email {getSortIcon("email")}
            </button>
            <button
              onClick={() => handleSort("role")}
              className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
              style={columnStyles.role}
            >
              Role {getSortIcon("role")}
            </button>
            <div
              className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              style={columnStyles.auth}
            >
              Auth Method
            </div>
            <button
              onClick={() => handleSort("createdAt")}
              className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors"
              style={columnStyles.joined}
            >
              Registered {getSortIcon("createdAt")}
            </button>
            <div
              className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              style={columnStyles.actions}
            >
              Actions
            </div>
          </div>

          {/* Table Body */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loading />
              <span className="ml-2 text-muted-foreground">
                Loading team members...
              </span>
            </div>
          ) : sortedTeamMembers.length === 0 ? (
            <div className="w-full h-[300px] flex items-center justify-center">
              <EmptyState
                title="No Team Members"
                description="Add a new team member to get started."
                action={{
                  label: "Add Team Member",
                  onClick: () => setRegisterModalOpen(true),
                }}
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedTeamMembers.map((member) => (
                <div
                  key={member._id}
                  className="flex w-full min-w-max hover:bg-muted/30 transition-colors group/row"
                >
                  {/* Name */}
                  <div
                    className="px-4 py-3 flex items-center gap-3"
                    style={columnStyles.name}
                  >
                    <UserAvatar user={member} className="size-10 text-sm" />
                    <span className="font-medium">{member.name}</span>
                  </div>

                  {/* Email */}
                  <div
                    className="px-4 py-3 flex items-center text-muted-foreground"
                    style={columnStyles.email}
                  >
                    {member.email}
                  </div>

                  {/* Role */}
                  <div
                    className="px-4 py-3 flex items-center"
                    style={columnStyles.role}
                  >
                    <Badge variant={getRoleBadgeVariant(member.role)}>
                      {member.role}
                    </Badge>
                  </div>

                  {/* Auth Method */}
                  <div
                    className="px-4 py-3 flex items-center text-muted-foreground text-sm"
                    style={columnStyles.auth}
                  >
                    {member.googleId ? (
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                  </div>

                  {/* Joined */}
                  <div
                    className="px-4 py-3 flex items-center text-muted-foreground text-sm"
                    style={columnStyles.joined}
                  >
                    {new Date(member.createdAt).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div
                    className="px-4 py-3 flex items-center gap-2"
                    style={columnStyles.actions}
                  >
                    <button
                      onClick={() => {
                        setSelectedTeamMemberId(member._id);
                        setEditModalOpen(true);
                      }}
                      disabled={
                        session?.user?.id === member._id ||
                        (!isAdmin && member.role === TeamRole.ADMIN)
                      }
                      className={cn(
                        "text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
                        (session?.user?.id === member._id ||
                          (!isAdmin && member.role === TeamRole.ADMIN)) &&
                          "opacity-50 cursor-not-allowed"
                      )}
                      title={
                        !isAdmin && member.role === TeamRole.ADMIN
                          ? "Cannot edit admin"
                          : `Edit ${member.name}`
                      }
                    >
                      <IconEdit2 className="size-5" />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(member._id, member.name)}
                      disabled={
                        session?.user?.id === member._id ||
                        (!isAdmin && member.role === TeamRole.ADMIN)
                      }
                      className={cn(
                        "text-destructive-text hover:text-destructive-text-hover transition-colors cursor-pointer",
                        (session?.user?.id === member._id ||
                          (!isAdmin && member.role === TeamRole.ADMIN)) &&
                          "opacity-50 cursor-not-allowed"
                      )}
                      title={
                        session?.user?.id === member._id
                          ? "Cannot delete yourself"
                          : !isAdmin && member.role === TeamRole.ADMIN
                          ? "Cannot delete admin"
                          : `Delete ${member.name}`
                      }
                    >
                      <IconTrashBin2 className="size-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <Card>
        <CardContent className="py-4">
          <h3 className="font-semibold mb-2">Role Permissions</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <Badge
                variant={getRoleBadgeVariant(TeamRole.ADMIN)}
                className="mr-2"
              >
                ADMIN
              </Badge>
              Can create ADMIN, MANAGER, and USER accounts. Full system access.
            </p>
            <p>
              <Badge
                variant={getRoleBadgeVariant(TeamRole.MANAGER)}
                className="mr-2"
              >
                MANAGER
              </Badge>
              Can create MANAGER and USER accounts. Can manage installers and
              rewards.
            </p>
            <p>
              <Badge
                variant={getRoleBadgeVariant(TeamRole.USER)}
                className="mr-2"
              >
                USER
              </Badge>
              Can register installers and rewards only.
            </p>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
