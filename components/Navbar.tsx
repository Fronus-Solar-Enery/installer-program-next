'use client';

import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TeamRole } from '@/types/roles';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOut, Settings, User } from 'lucide-react';

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  const canAccessTeamManagement =
    session?.user?.role === TeamRole.ADMIN || session?.user?.role === TeamRole.MANAGER;

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/dashboard" className="text-xl font-bold">
              Installer Program
            </Link>
            <div className="hidden md:flex space-x-1">
              <Link href="/dashboard">
                <Button
                  variant={isActive('/dashboard') ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  Dashboard
                </Button>
              </Link>
              <Link href="/installers">
                <Button
                  variant={isActive('/installers') ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  Installers
                </Button>
              </Link>
              <Link href="/rewards">
                <Button
                  variant={isActive('/rewards') ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  Rewards
                </Button>
              </Link>
              <Link href="/reports">
                <Button
                  variant={isActive('/reports') ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  Reports
                </Button>
              </Link>
              <Link href="/activity">
                <Button
                  variant={isActive('/activity') ? 'secondary' : 'ghost'}
                  size="sm"
                >
                  Activity
                </Button>
              </Link>
              {canAccessTeamManagement && (
                <Link href="/team">
                  <Button
                    variant={isActive('/team') ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    Team
                  </Button>
                </Link>
              )}
              {session?.user?.role === TeamRole.ADMIN && (
                <Link href="/settings">
                  <Button
                    variant={isActive('/settings') ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    Settings
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Separator orientation="vertical" className="h-8" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{getInitials(session?.user?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session?.user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {session?.user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">
                      Role: {session?.user?.role}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {session?.user?.role === TeamRole.ADMIN && (
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
