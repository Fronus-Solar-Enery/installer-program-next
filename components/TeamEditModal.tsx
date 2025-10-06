'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Modal from './Modal';
import { TeamRole } from '@/types/roles';
import { toast } from 'sonner';

interface TeamEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMemberId: string;
  onSuccess: () => void;
}

export default function TeamEditModal({ open, onOpenChange, teamMemberId, onSuccess }: TeamEditModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [teamMember, setTeamMember] = useState<any>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<TeamRole>(TeamRole.USER);
  const [password, setPassword] = useState('');

  const isAdmin = session?.user?.role === TeamRole.ADMIN;
  const isManager = session?.user?.role === TeamRole.MANAGER;

  useEffect(() => {
    if (open && teamMemberId) {
      fetchTeamMember();
    }
  }, [open, teamMemberId]);

  useEffect(() => {
    if (!open) {
      // Reset form when modal closes
      setName('');
      setEmail('');
      setRole(TeamRole.USER);
      setPassword('');
      setTeamMember(null);
    }
  }, [open]);

  const fetchTeamMember = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/team/${teamMemberId}`);
      const data = await response.json();

      if (data.success) {
        const member = data.data;
        setTeamMember(member);
        setName(member.name || '');
        setEmail(member.email || '');
        setRole(member.role || TeamRole.USER);
      } else {
        toast.error('Failed to load team member');
      }
    } catch (error) {
      console.error('Error fetching team member:', error);
      toast.error('Failed to load team member data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        name,
        email,
        role,
      };

      // Only include password if it's provided
      if (password.trim()) {
        updateData.password = password;
      }

      const response = await fetch(`/api/team/${teamMemberId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Team member updated successfully');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Failed to update team member');
      }
    } catch (error) {
      console.error('Error updating team member:', error);
      toast.error('An error occurred while updating team member');
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
      title="Edit Team Member"
      description="Update team member details"
      size="md"
      openInTabUrl={`/team/${teamMemberId}/edit`}
    >
      {loading && !teamMember ? (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">Loading team member data...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-foreground">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as TeamRole)}
              required
              disabled={!isAdmin && !isManager}
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border disabled:bg-muted disabled:cursor-not-allowed"
            >
              {availableRoles().map((roleOption) => (
                <option key={roleOption} value={roleOption}>
                  {roleOption}
                </option>
              ))}
            </select>
            {!isAdmin && !isManager && (
              <p className="mt-1 text-sm text-muted-foreground">
                Only admins and managers can change roles
              </p>
            )}
          </div>

          {/* Password (Optional) */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              New Password <span className="text-muted-foreground text-xs">(leave blank to keep current)</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password (optional)"
              className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            />
          </div>

          {/* Google Auth Info */}
          {teamMember?.googleId && (
            <div className="bg-blue-50 border border-border rounded-md p-3">
              <p className="text-sm text-blue-800 flex items-center">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
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
                This account uses Google authentication
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-border rounded-md hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-muted disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Team Member'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
