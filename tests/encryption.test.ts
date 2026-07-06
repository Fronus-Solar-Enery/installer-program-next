import { describe, it, expect, beforeAll, vi } from "vitest";

const KEY = "TcjWDSzmyP89WGwOoQ+gRvIv/+D9tb58K0Eid1bcd/Q=";

describe("encryption (AES-256-GCM)", () => {
  let enc: typeof import("@/lib/encryption");

  beforeAll(async () => {
    process.env.TOKEN_ENCRYPTION_KEY = KEY;
    enc = await import("@/lib/encryption");
  });

  it("round-trips a secret", () => {
    const secret = "1//0AVGzR1Bt-refresh-token";
    const ct = enc.encryptSecret(secret);
    expect(enc.isEncrypted(ct)).toBe(true);
    expect(ct).not.toContain(secret);
    expect(enc.decryptSecret(ct)).toBe(secret);
  });

  it("passes through legacy plaintext (no envelope prefix)", () => {
    expect(enc.decryptSecret("plain-legacy-token")).toBe("plain-legacy-token");
  });

  it("rejects a tampered ciphertext (GCM auth)", () => {
    const ct = enc.encryptSecret("sensitive");
    const parts = ct.split(":");
    const last = parts[4];
    parts[4] = last.slice(0, -2) + (last.slice(-2) === "AA" ? "BB" : "AA");
    expect(() => enc.decryptSecret(parts.join(":"))).toThrow();
  });

  it("cannot decrypt ciphertext produced under a different key", async () => {
    const secret = enc.encryptSecret("x");
    // Re-evaluate the module with a different key (resets its cached key).
    vi.resetModules();
    process.env.TOKEN_ENCRYPTION_KEY = Buffer.from(
      new Uint8Array(32).fill(7)
    ).toString("base64");
    const fresh = await import("@/lib/encryption");
    expect(() => fresh.decryptSecret(secret)).toThrow();
    vi.resetModules();
    process.env.TOKEN_ENCRYPTION_KEY = KEY;
  });
});
