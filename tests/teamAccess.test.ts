import { describe, it, expect } from "vitest";
import { checkAccessChange } from "@/lib/teamAccess";
import { TeamRole } from "@/types/roles";

const admin = { id: "a1", role: TeamRole.ADMIN };
const manager = { id: "m1", role: TeamRole.MANAGER };

describe("checkAccessChange", () => {
  it("blocks changing your own access", () => {
    expect(
      checkAccessChange({
        actor: admin,
        target: { ...admin },
        revoke: true,
        activeAdminCount: 3,
      })
    ).toMatchObject({ status: 400 });
  });

  it("forbids managers from revoking or restoring admins", () => {
    for (const revoke of [true, false]) {
      expect(
        checkAccessChange({
          actor: manager,
          target: { id: "a2", role: TeamRole.ADMIN, accessRevoked: !revoke },
          revoke,
          activeAdminCount: 3,
        })
      ).toMatchObject({ status: 403 });
    }
  });

  it("refuses to revoke the last active admin", () => {
    expect(
      checkAccessChange({
        actor: admin,
        target: { id: "a2", role: TeamRole.ADMIN },
        revoke: true,
        activeAdminCount: 1,
      })
    ).toMatchObject({ status: 400 });
  });

  it("allows revoking an admin when another active admin remains", () => {
    expect(
      checkAccessChange({
        actor: admin,
        target: { id: "a2", role: TeamRole.ADMIN },
        revoke: true,
        activeAdminCount: 2,
      })
    ).toBeNull();
  });

  it("allows restoring an admin regardless of active admin count", () => {
    expect(
      checkAccessChange({
        actor: admin,
        target: { id: "a2", role: TeamRole.ADMIN, accessRevoked: true },
        revoke: false,
        activeAdminCount: 1,
      })
    ).toBeNull();
  });

  it("allows managers to revoke users and managers", () => {
    for (const role of [TeamRole.USER, TeamRole.MANAGER]) {
      expect(
        checkAccessChange({
          actor: manager,
          target: { id: "x1", role },
          revoke: true,
          activeAdminCount: 1,
        })
      ).toBeNull();
    }
  });
});
