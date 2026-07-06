"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Modal from "./Modal";
import { TeamRole } from "@/types/roles";
import { toast } from "sonner";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";

interface TeamRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function TeamRegisterModal({
  open,
  onOpenChange,
  onSuccess,
}: TeamRegisterModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<TeamRole>(TeamRole.USER);

  const isAdmin = session?.user?.role === TeamRole.ADMIN;
  const isManager = session?.user?.role === TeamRole.MANAGER;

  useEffect(() => {
    if (!open) {
      // Reset form when modal closes
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole(TeamRole.USER);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message || "Team member created successfully");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.message || "Failed to create team member");
      }
    } catch (error) {
      console.error("Error creating team member:", error);
      toast.error("An error occurred while creating team member");
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = () => {
    if (isAdmin) {
      return [TeamRole.ADMIN, TeamRole.MANAGER, TeamRole.USER];
    } else if (isManager) {
      return [TeamRole.MANAGER, TeamRole.USER];
    } else {
      return [TeamRole.USER];
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Add Team Member"
      description="Create a new team member account"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Enter full name"
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="email@example.com"
          />
        </div>

        {/* Role */}
        <div>
          <Label htmlFor="role">
            Role <span className="text-red-500">*</span>
          </Label>

          <Select
            value={role}
            onValueChange={(value) => setRole(value as TeamRole)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="All cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {availableRoles().map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin
              ? "As an admin, you can assign any role"
              : isManager
              ? "As a manager, you can assign MANAGER or USER roles"
              : "You can only create USER accounts"}
          </p>
        </div>

        {/* Password */}
        <div>
          <Label htmlFor="password">
            Password <span className="text-red-500">*</span>
          </Label>
          <Input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Minimum 6 characters"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <Label htmlFor="confirmPassword">
            Confirm Password <span className="text-red-500">*</span>
          </Label>
          <Input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Re-enter password"
          />
        </div>

        {/* Password Match Indicator */}
        {password && confirmPassword && (
          <div
            className={`text-sm ${
              password === confirmPassword ? "text-green-600" : "text-red-600"
            }`}
          >
            {password === confirmPassword
              ? "✓ Passwords match"
              : "✗ Passwords do not match"}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant={"secondary"}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={"default"}
            disabled={loading || password !== confirmPassword}
          >
            {loading ? "Creating..." : "Create Team Member"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
