"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { TeamRole } from "@/types/roles";

export type RoleGuardOptions = {
  requiredRoles?: TeamRole[];
  autoRedirect?: boolean;
  redirectTo?: string;
  redirectUnauthenticatedTo?: string;
  replace?: boolean;
};

const DEFAULT_OPTIONS: Required<RoleGuardOptions> = {
  requiredRoles: [TeamRole.ADMIN, TeamRole.MANAGER],
  autoRedirect: true,
  redirectTo: "/dashboard",
  redirectUnauthenticatedTo: "/login",
  replace: true,
};

export function useRoleGuard(options?: RoleGuardOptions) {
  const router = useRouter();
  const { data: session, status } = useSession();

  const opts = useMemo(
    () => ({
      ...DEFAULT_OPTIONS,
      ...(options ?? {}),
    }),
    [options]
  );

  const userRole = (session?.user?.role as TeamRole | undefined) ?? undefined;

  const isAuthLoading = status === "loading";
  const isAuthenticated = status === "authenticated" && !!session;

  const isAuthorized = useMemo(() => {
    if (!isAuthenticated) return false;
    if (!opts.requiredRoles || opts.requiredRoles.length === 0) return true;
    return opts.requiredRoles.includes(userRole as TeamRole);
  }, [isAuthenticated, opts.requiredRoles, userRole]);

  useEffect(() => {
    if (!opts.autoRedirect) return;
    if (isAuthLoading) return;

    if (status === "unauthenticated") {
      if (opts.redirectUnauthenticatedTo) {
        const fn = opts.replace ? router.replace : router.push;
        fn(opts.redirectUnauthenticatedTo);
      }
      return;
    }

    if (isAuthenticated && !isAuthorized) {
      const fn = opts.replace ? router.replace : router.push;
      fn(opts.redirectTo);
    }
  }, [status, isAuthLoading, isAuthenticated, isAuthorized, opts, router]);

  return {
    isAuthLoading,
    isAuthenticated,
    isAuthorized,
    userRole,
  } as const;
}

export function useAdminGuard(
  options?: Omit<RoleGuardOptions, "requiredRoles">
) {
  return useRoleGuard({ ...(options ?? {}), requiredRoles: [TeamRole.ADMIN] });
}

export function useManagerGuard(
  options?: Omit<RoleGuardOptions, "requiredRoles">
) {
  return useRoleGuard({
    ...(options ?? {}),
    requiredRoles: [TeamRole.MANAGER],
  });
}
