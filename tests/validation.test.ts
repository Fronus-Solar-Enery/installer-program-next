import { describe, it, expect } from "vitest";
import {
  registerTeamMemberSchema,
  registerInstallerSchema,
  updateInstallerSchema,
  bulkRewardAccountSchema,
  accountNumberHasSpaces,
  ACCOUNT_NUMBER_SPACES_ERROR,
} from "@/lib/validation";
import { stripAccountNumberSpaces } from "@/lib/validation-helpers";

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

  it("rejects an account number containing spaces", () => {
    const result = registerInstallerSchema.safeParse({
      ...valid,
      accountNumber: "PK36 SCBL 0000 0011 2345 6702",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(ACCOUNT_NUMBER_SPACES_ERROR);
  });

  it("trims and uppercases a space-free account number", () => {
    const parsed = registerInstallerSchema.parse({
      ...valid,
      accountNumber: "  pk36scbl0000001123456702  ",
    });
    expect(parsed.accountNumber).toBe("PK36SCBL0000001123456702");
  });
});

describe("accountNumberHasSpaces", () => {
  it("flags inner, leading-plus-inner, and tab whitespace", () => {
    expect(accountNumberHasSpaces("0123 456789")).toBe(true);
    expect(accountNumberHasSpaces("01\t23456789")).toBe(true);
  });

  it("ignores surrounding whitespace and non-strings", () => {
    expect(accountNumberHasSpaces("  0123456789  ")).toBe(false);
    expect(accountNumberHasSpaces(undefined)).toBe(false);
    expect(accountNumberHasSpaces(null)).toBe(false);
  });
});

describe("stripAccountNumberSpaces", () => {
  it("removes every space so a pasted grouped IBAN becomes valid", () => {
    expect(stripAccountNumberSpaces("PK36 SCBL 0000 0011")).toBe(
      "PK36SCBL00000011",
    );
  });
});

describe("bulkRewardAccountSchema", () => {
  const valid = {
    rewardIds: ["64b7f0c2e1a2b3c4d5e6f7a8"],
    bankName: "HBL",
    accountNumber: "0123456789",
    accountTitle: "ali khan",
  };

  it("normalizes account number and title", () => {
    const parsed = bulkRewardAccountSchema.parse(valid);
    expect(parsed.accountNumber).toBe("0123456789");
    expect(parsed.accountTitle).toBe("Ali Khan");
  });

  it("requires at least one reward id", () => {
    expect(
      bulkRewardAccountSchema.safeParse({ ...valid, rewardIds: [] }).success,
    ).toBe(false);
  });

  it("rejects an account number containing spaces", () => {
    expect(
      bulkRewardAccountSchema.safeParse({
        ...valid,
        accountNumber: "0123 456789",
      }).success,
    ).toBe(false);
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
