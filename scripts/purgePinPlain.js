require("dotenv").config({ path: ".env.local" });
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");

// One-time purge of the legacy plaintext `pinPlain` field (F1 security fix).
// The bcrypt `pin` hash stays; recovery is via the resend-pin flow.
async function purge() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const res = await mongoose.connection.db
    .collection("installers")
    .updateMany({ pinPlain: { $exists: true } }, { $unset: { pinPlain: "" } });

  console.log(`✅ Cleared pinPlain from ${res.modifiedCount} installer(s)`);
  await mongoose.disconnect();
  process.exit(0);
}

purge().catch((err) => {
  console.error("❌ Purge failed:", err.message);
  process.exit(1);
});
