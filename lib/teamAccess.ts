import { TeamRole } from "@/types/roles";

interface AccessChangeInput {
  actor: { id: string; role: TeamRole };
  target: { id: string; role: TeamRole; accessRevoked?: boolean };
  /** true = revoke access, false = restore it */
  revoke: boolean;
  /** Number of ADMINs whose access is currently not revoked */
  activeAdminCount: number;
}

export type AccessChangeDenial = { status: 400 | 403; message: string };

/**
 * Decide whether `actor` may revoke/restore `target`'s sign-in access.
 * Returns null when allowed, otherwise the HTTP status + message to respond with.
 */
export function checkAccessChange({
  actor,
  target,
  revoke,
  activeAdminCount,
}: AccessChangeInput): AccessChangeDenial | null {
  if (actor.id === target.id) {
    return { status: 400, message: "You cannot change your own access" };
  }

  if (actor.role === TeamRole.MANAGER && target.role === TeamRole.ADMIN) {
    return {
      status: 403,
      message: "Managers cannot change admin access",
    };
  }

  // Never leave the system without an admin who can sign in.
  if (
    revoke &&
    target.role === TeamRole.ADMIN &&
    !target.accessRevoked &&
    activeAdminCount <= 1
  ) {
    return {
      status: 400,
      message: "Cannot revoke access of the last active admin",
    };
  }

  return null;
}
