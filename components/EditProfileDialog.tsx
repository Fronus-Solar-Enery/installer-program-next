"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { User } from "lucide-react";

import { TeamRole } from "@/types/roles";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: TeamRole;
}

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: UserProfile;
  onSuccess: (updatedProfile: UserProfile) => void;
}

export default function EditProfileDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: EditProfileDialogProps) {
  const { data: session, update: updateSession } = useSession();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialData.name);
  const [email, setEmail] = useState(initialData.email);

  useEffect(() => {
    if (open) {
      setName(initialData.name);
      setEmail(initialData.email);
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/team/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      toast.success("Profile updated successfully");

      // Update session if name or email changed
      if (session?.user) {
        await updateSession({
          ...session,
          user: {
            ...session.user,
            name: data.data.name,
            email: data.data.email,
          },
        });
      }

      onSuccess(data.data);
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Error updating profile:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Failed to update profile");
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            Edit Profile
          </DialogTitle>
          <DialogDescription>Update your account information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
