import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the NextAuth entrypoint so the guard's auth() is controllable and we
// don't pull in the real NextAuth/DB stack.
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { auth } from "@/lib/auth";
import {
  withAuth,
  hasRoleOrHigher,
  hasAnyRole,
  canAccessResource,
  type AuthSession,
} from "@/lib/authGuard";
import { TeamRole } from "@/models/TeamMember";

const mockAuth = vi.mocked(auth);
const req = {} as never;
const ctx = { params: Promise.resolve({}) } as never;

function sessionFor(role: TeamRole, id = "u1"): AuthSession {
  return { user: { id, role, email: "u@x.com", name: "U" }, expires: "" } as AuthSession;
}

describe("withAuth", () => {
  beforeEach(() => mockAuth.mockReset());

  it("401s when there is no session", async () => {
    mockAuth.mockResolvedValue(null as never);
    const handler = vi.fn();
    const res = await withAuth(handler)(req, ctx);
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
  });

  it("403s when the role is not allowed", async () => {
    mockAuth.mockResolvedValue(sessionFor(TeamRole.USER) as never);
    const handler = vi.fn();
    const res = await withAuth(handler, { roles: [TeamRole.ADMIN] })(req, ctx);
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls the handler for an allowed role", async () => {
    mockAuth.mockResolvedValue(sessionFor(TeamRole.ADMIN) as never);
    const handler = vi.fn().mockResolvedValue(
      new Response(null, { status: 200 })
    );
    const res = await withAuth(handler, { roles: [TeamRole.ADMIN] })(req, ctx);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });

  it("allows any authenticated user when no roles are required", async () => {
    mockAuth.mockResolvedValue(sessionFor(TeamRole.USER) as never);
    const handler = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const res = await withAuth(handler)(req, ctx);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledOnce();
  });
});

describe("role helpers", () => {
  const admin = sessionFor(TeamRole.ADMIN).user;
  const manager = sessionFor(TeamRole.MANAGER).user;
  const user = sessionFor(TeamRole.USER, "owner").user;

  it("hasRoleOrHigher respects ADMIN > MANAGER > USER", () => {
    expect(hasRoleOrHigher(admin, TeamRole.MANAGER)).toBe(true);
    expect(hasRoleOrHigher(manager, TeamRole.ADMIN)).toBe(false);
    expect(hasRoleOrHigher(user, TeamRole.USER)).toBe(true);
  });

  it("hasAnyRole checks membership", () => {
    expect(hasAnyRole(manager, [TeamRole.ADMIN, TeamRole.MANAGER])).toBe(true);
    expect(hasAnyRole(user, [TeamRole.ADMIN])).toBe(false);
  });

  it("canAccessResource: admin anything, others only their own", () => {
    expect(canAccessResource(admin, "someone-else")).toBe(true);
    expect(canAccessResource(user, "owner")).toBe(true);
    expect(canAccessResource(user, "someone-else")).toBe(false);
  });
});
