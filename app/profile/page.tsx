"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Mail, Shield, Calendar, Key } from "lucide-react";
import { toast } from "sonner";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import EditProfileDialog from "@/components/EditProfileDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { TeamRole } from "@/models/TeamMember";
import { IconEdit2, IconUser } from "@/components/icons";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: TeamRole;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Fetch profile data
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/team/profile");

      if (!response.ok) {
        throw new Error("Failed to fetch profile");
      }

      const data = await response.json();
      setProfile(data.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role?.toUpperCase()) {
      case "ADMIN":
        return "destructive";
      case "MANAGER":
        return "warning";
      case "USER":
        return "info";
      default:
        return "default";
    }
  };
  // console.log(profile);
  if (isLoading) {
    return (
      <div className="p-6">
        <PageHeader
          iconFill
          Icon={IconUser}
          title="My Profile"
          description="Manage your account information"
        />
        <div className="mt-6 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-6">
        <PageHeader
          iconFill
          Icon={IconUser}
          title="My Profile"
          description="Manage your account information"
        />
        <Card className="mt-6 p-6 text-center">
          <p className="text-muted-foreground">Profile not found</p>
          <Button onClick={fetchProfile} className="mt-4">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        iconFill
        Icon={<UserAvatar user={profile} className="size-18" />}
        title={
          <div className="flex items-center gap-2">
            <p>{profile.name}</p>
            <Badge variant={getRoleBadgeVariant(profile.role)}>
              {profile.role}
            </Badge>
          </div>
        }
        description={profile.email}
        action={
          <>
            <Button onClick={() => setEditDialogOpen(true)}>
              <IconEdit2 className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </>
        }
      />

      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Password Change Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Security</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Change your password to keep your account secure
              </p>
              <Button
                variant="outline"
                onClick={() => setIsPasswordModalOpen(true)}
              >
                <Key className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </div>
          </div>
        </Card>

        {/* Account Info Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Account ID</span>
              <span className="font-mono">{profile._id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created At</span>
              <span>{formatDate(profile.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span>{formatDate(profile.updatedAt)}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        initialData={profile}
        onSuccess={(updatedProfile) =>
          setProfile({ ...profile, ...updatedProfile })
        }
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}
