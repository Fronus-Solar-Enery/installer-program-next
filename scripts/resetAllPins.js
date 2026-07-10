require("dotenv").config({ path: ".env.local" });
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// One-off: regenerate EVERY installer's PIN silently — new bcrypt hash + a fresh
// AES-256-GCM copy so ADMIN/MANAGER reveal works for pre-existing installers.
// No WhatsApp is sent, so every installer's current PIN stops working; the new
// PIN is only visible via the reveal endpoint. Destructive → requires --confirm.
//
// The encrypted envelope below MUST stay byte-compatible with lib/encryption.ts
// (encryptSecret / decryptSecret). If that format ever bumps to enc:v2, update
// both. Kept as raw crypto here because scripts are plain node (no @/ aliases).

const ENC_PREFIX = "enc:v1:";

function getKey() {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not set — required to write revealable PINs. Generate one with: openssl rand -base64 32"
    );
  }
  const key = /^[0-9a-fA-F]{64}$/.test(raw)
    ? Buffer.from(raw, "hex")
    : Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (256-bit).");
  }
  return key;
}

function encryptSecret(plaintext, key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return (
    ENC_PREFIX +
    [iv.toString("base64"), tag.toString("base64"), ct.toString("base64")].join(":")
  );
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  const key = getKey(); // throws early if the encryption key is missing/invalid
  const confirmed = process.argv.includes("--confirm");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection("installers");
  const total = await col.countDocuments({});

  if (!confirmed) {
    console.log(`ℹ️  ${total} installer(s) would have their PIN reset.`);
    console.log("⚠️  This invalidates every installer's current login PIN.");
    console.log("    Re-run with --confirm to proceed:  npm run reset:pins -- --confirm");
    await mongoose.disconnect();
    process.exit(0);
  }

  const cursor = col.find({}, { projection: { _id: 1 } });
  let done = 0;
  let failed = 0;

  for await (const { _id } of cursor) {
    try {
      const plainPin = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
      const hash = await bcrypt.hash(plainPin, 10);
      const pinEncrypted = encryptSecret(plainPin, key);
      await col.updateOne(
        { _id },
        {
          $set: { pin: hash, pinEncrypted, lastPinChangeAt: new Date(), pinAttempts: 0 },
          $unset: { pinLockedUntil: "" },
        }
      );
      done++;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${_id}: ${err.message}`);
    }
  }

  console.log(`✅ Reset ${done}/${total} installer PIN(s)${failed ? `, ${failed} failed` : ""}.`);
  await mongoose.disconnect();
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error("❌ Reset failed:", err.message);
  process.exit(1);
});
