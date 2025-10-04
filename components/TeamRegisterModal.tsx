'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Modal from './Modal';
import { TeamRole } from '@/types/roles';
import { toast } from 'sonner';

interface TeamRegisterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function TeamRegisterModal({ open, onOpenChange, onSuccess }: TeamRegisterModalProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<TeamRole>(TeamRole.USER);

  const isAdmin = session?.user?.role === TeamRole.ADMIN;
  const isManager = session?.user?.role === TeamRole.MANAGER;

  useEffect(() => {
    if (!open) {
      // Reset form when modal closes
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setRole(TeamRole.USER);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Team member created successfully');
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(data.error || 'Failed to create team member');
      }
    } catch (error) {
      console.error('Error creating team member:', error);
      toast.error('An error occurred while creating team member');
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
      openInTabUrl="/team/new"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            placeholder="Enter full name"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            placeholder="email@example.com"
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as TeamRole)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
          >
            {availableRoles().map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {roleOption}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? 'As an admin, you can assign any role'
              : isManager
              ? 'As a manager, you can assign MANAGER or USER roles'
              : 'You can only create USER accounts'}
          </p>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            placeholder="Minimum 6 characters"
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
            placeholder="Re-enter password"
          />
        </div>

        {/* Password Match Indicator */}
        {password && confirmPassword && (
          <div className={`text-sm ${password === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
            {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || password !== confirmPassword}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Team Member'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
