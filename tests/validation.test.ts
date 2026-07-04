import { describe, it, expect } from "vitest";
import {
  registerTeamMemberSchema,
  registerInstallerSchema,
  updateInstallerSchema,
} from "@/lib/validation";

describe("registerTeamMemberSchema", () => {
  const base = { name: "Jane Doe", email: "jane@example.com", password: "secret123" };

  it("accepts a valid member and defaults role to USER", () => {
    const parsed = registerTeamMemberSchema.parse(base);
    expect(parsed.role).toBe("USER");
  });

  it("rejects an invalid email", () => {
    expect(registerTeamMemberSchema.safeParse({ ...base, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a short password", () => {
    expect(registerTeamMemberSchema.safeParse({ ...base, password: "123" }).success).toBe(false);
  });

  it("rejects an invalid role", () => {
    expect(registerTeamMemberSchema.safeParse({ ...base, role: "SUPERADMIN" }).success).toBe(false);
  });
});

describe("registerInstallerSchema", () => {
  const valid = {
    installerCode: "inst-001",
    fullName: "Ali Khan",
    cnic: "35202-1234567-8",
    phoneNumber: "03001234567",
    whatsappNumber: "03001234567",
    address: "123 Main Street",
    city: "Lahore",
    province: "Punjab",
    district: "Lahore",
    bankName: "HBL",
    accountNumber: "0123456789",
    accountTitle: "Ali Khan",
  };

  it("uppercases installerCode and formats phone to +92", () => {
    const parsed = registerInstallerSchema.parse(valid);
    expect(parsed.installerCode).toBe("INST-001");
    expect(parsed.phoneNumber).toBe("+923001234567");
    expect(parsed.certified).toBe(false);
  });

  it("rejects a malformed CNIC", () => {
    expect(registerInstallerSchema.safeParse({ ...valid, cnic: "12345" }).success).toBe(false);
  });

  it("requires the mandatory bank fields", () => {
    const { bankName: _omit, ...withoutBank } = valid;
    expect(registerInstallerSchema.safeParse(withoutBank).success).toBe(false);
  });
});

describe("updateInstallerSchema", () => {
  it("is fully partial — an empty object is valid", () => {
    expect(updateInstallerSchema.safeParse({}).success).toBe(true);
  });

  it("still validates provided fields", () => {
    expect(updateInstallerSchema.safeParse({ cnic: "bad" }).success).toBe(false);
  });
});
