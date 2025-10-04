'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TeamRole } from '@/types/roles';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'bg-indigo-700' : '';
  };

  const canAccessTeamManagement =
    session?.user?.role === TeamRole.ADMIN || session?.user?.role === TeamRole.MANAGER;

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              Installer Program
            </Link>
            <div className="hidden md:flex space-x-4">
              <Link
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 ${isActive('/dashboard')}`}
              >
                Dashboard
              </Link>
              <Link
                href="/installers"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 ${isActive('/installers')}`}
              >
                Installers
              </Link>
              <Link
                href="/rewards"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 ${isActive('/rewards')}`}
              >
                Rewards
              </Link>
              <Link
                href="/reports"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 ${isActive('/reports')}`}
              >
                Reports
              </Link>
              <Link
                href="/activity"
                className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 ${isActive('/activity')}`}
              >
                Activity
              </Link>
              {canAccessTeamManagement && (
                <Link
                  href="/team"
                  className={`px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 ${isActive('/team')}`}
                >
                  Team
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm">
              <div className="font-medium">{session?.user?.name}</div>
              <div className="text-indigo-200 text-xs">{session?.user?.role}</div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/auth/signin' })}
              className="px-4 py-2 rounded-md text-sm font-medium bg-indigo-700 hover:bg-indigo-800"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
