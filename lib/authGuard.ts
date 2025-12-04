import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { ApiResponse } from "@/lib/apiResponse";
import { TeamRole } from "@/models/TeamMember";
import { Session } from "next-auth";

/**
 * Route handler context with dynamic params
 */
export interface RouteContext {
  params: Promise<{ [key: string]: string }>;
}

/**
 * Extended session with user role information
 */
export interface AuthSession extends Session {
  user: Session["user"] & {
    id: string;
    role: TeamRole;
  };
}

/**
 * Authorized handler function type
 */
type AuthorizedHandler = (
  request: NextRequest,
  context: RouteContext,
  session: AuthSession
) => Promise<NextResponse>;

/**
 * Options for withAuth wrapper
 */
interface WithAuthOptions {
  /** Required roles - user must have one of these roles */
  roles?: TeamRole[];
  /** Custom unauthorized message */
  unauthorizedMessage?: string;
  /** Custom forbidden message */
  forbiddenMessage?: string;
}

/**
 * Higher-order function that wraps route handlers with authentication and authorization.
 *
 * @example
 * // Basic auth check (any authenticated user)
 * export const GET = withAuth(async (request, context, session) => {
 *   return ApiResponse.success({ userId: session.user.id });
 * });
 *
 * @example
 * // Role-based auth (only ADMIN and MANAGER)
 * export const DELETE = withAuth(
 *   async (request, context, session) => {
 *     // Handler logic
 *   },
 *   { roles: [TeamRole.ADMIN, TeamRole.MANAGER] }
 * );
 */
export function withAuth(
  handler: AuthorizedHandler,
  options?: WithAuthOptions
) {
  return async (
    request: NextRequest,
    context: RouteContext
  ): Promise<NextResponse> => {
    try {
      const session = await auth();

      // Check authentication
      if (!session?.user) {
        return ApiResponse.unauthorized(
          options?.unauthorizedMessage
        ) as NextResponse;
      }

      // Check authorization (roles)
      if (options?.roles && options.roles.length > 0) {
        const userRole = session.user.role as TeamRole;
        if (!options.roles.includes(userRole)) {
          return ApiResponse.forbidden(
            options?.forbiddenMessage ||
              `This action requires one of these roles: ${options.roles.join(
                ", "
              )}`
          ) as NextResponse;
        }
      }

      // Call the actual handler with the authenticated session
      return (await handler(
        request,
        context,
        session as AuthSession
      )) as NextResponse;
    } catch (error) {
      console.error("Auth guard error:", error);
      return ApiResponse.serverError() as NextResponse;
    }
  };
}

/**
 * Check if a user can perform an action on a resource based on ownership.
 * Admins can always perform the action, others can only act on their own resources.
 *
 * @example
 * if (!canAccessResource(session.user, resource.createdBy.toString())) {
 *   return ApiResponse.forbidden("You can only access your own resources");
 * }
 */
export function canAccessResource(
  user: AuthSession["user"],
  resourceOwnerId: string
): boolean {
  // Admins can access any resource
  if (user.role === TeamRole.ADMIN) {
    return true;
  }
  // Others can only access their own resources
  return user.id === resourceOwnerId;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthSession["user"], role: TeamRole): boolean {
  return user.role === role;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(
  user: AuthSession["user"],
  roles: TeamRole[]
): boolean {
  return roles.includes(user.role);
}

/**
 * Role hierarchy check - higher roles can do what lower roles can do
 * ADMIN > MANAGER > USER
 */
export function hasRoleOrHigher(
  user: AuthSession["user"],
  minimumRole: TeamRole
): boolean {
  const roleHierarchy: Record<TeamRole, number> = {
    [TeamRole.ADMIN]: 3,
    [TeamRole.MANAGER]: 2,
    [TeamRole.USER]: 1,
  };

  return roleHierarchy[user.role] >= roleHierarchy[minimumRole];
}
