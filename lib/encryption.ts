import crypto from "crypto";

/**
 * Application-layer encryption for at-rest secrets (currently the Google OAuth
 * refresh/access tokens). AES-256-GCM gives confidentiality + integrity, so a
 * DB-only compromise (leaked connection string, stray backup, over-permissioned
 * Atlas user) does not hand over a durable external-service credential.
 *
 * The key comes from TOKEN_ENCRYPTION_KEY and MUST live in the deployment's
 * secret store (Vercel env / secrets manager) — deliberately NOT alongside
 * MONGODB_URI, so whoever can read the database cannot also read the key.
 * Generate one with:  openssl rand -base64 32
 */
const ALGO = "aes-256-gcm";
const PREFIX = "enc:v1:"; // versioned marker; lets us detect legacy plaintext

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not set — required to encrypt/decrypt stored OAuth tokens. Generate one with: openssl rand -base64 32"
    );
  }

  // Accept either 64-char hex or base64; must decode to exactly 32 bytes.
  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");

  if (key.length !== 32) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must decode to 32 bytes (256-bit). Generate one with: openssl rand -base64 32"
    );
  }

  cachedKey = key;
  return key;
}

/** Returns true if a stored value is in our encrypted envelope format. */
export function isEncrypted(value: string): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/** Encrypt a UTF-8 secret into `enc:v1:<iv>:<tag>:<ciphertext>` (all base64). */
export function encryptSecret(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(12); // 96-bit nonce, recommended for GCM
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return (
    PREFIX +
    [
      iv.toString("base64"),
      tag.toString("base64"),
      ciphertext.toString("base64"),
    ].join(":")
  );
}

/**
 * Decrypt a value produced by encryptSecret. Values without the envelope prefix
 * are treated as legacy plaintext and returned as-is, so a token stored before
 * encryption was introduced keeps working until the next OAuth re-auth rewrites
 * it in encrypted form.
 */
export function decryptSecret(value: string): string {
  if (!isEncrypted(value)) {
    return value; // legacy plaintext — pass through
  }

  const key = getKey();
  const [ivB64, tagB64, ctB64] = value.slice(PREFIX.length).split(":");
  if (!ivB64 || !tagB64 || !ctB64) {
    throw new Error("Malformed encrypted secret");
  }

  const decipher = crypto.createDecipheriv(
    ALGO,
    key,
    Buffer.from(ivB64, "base64")
  );
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
