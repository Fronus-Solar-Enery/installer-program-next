import { NextRequest } from "next/server";

/**
 * Client information extracted from request headers
 */
export interface ClientInfo {
  /** Client IP address from x-forwarded-for or x-real-ip headers */
  ipAddress: string | undefined;
  /** User agent string from request headers */
  userAgent: string | undefined;
}

/**
 * Extract client information from request headers.
 *
 * Used for activity logging and auditing purposes.
 * Extracts IP address from proxy headers (x-forwarded-for, x-real-ip)
 * and user agent string.
 *
 * @param request - The Next.js request object
 * @returns Client information containing IP address and user agent
 *
 * @example
 * ```typescript
 * const clientInfo = getClientInfo(request);
 * await logActivity({
 *   type: ActivityType.INSTALLER_DELETED,
 *   ...clientInfo,
 * });
 * ```
 */
export function getClientInfo(request: NextRequest): ClientInfo {
  return {
    ipAddress:
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      undefined,
    userAgent: request.headers.get("user-agent") || undefined,
  };
}
