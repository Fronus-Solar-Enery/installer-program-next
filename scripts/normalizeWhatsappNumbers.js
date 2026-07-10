require("dotenv").config({ path: ".env.local" });
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");

// One-off: normalize every installer's whatsappNumber to the canonical format
// the schema setter now enforces (normalized digits with leading '+', e.g.
// "+923001234567"). Existing docs were stored inconsistently ('92...', '0300...',
// '+92...'), which forced a $or lookup dance at every call site. After this runs,
// lookups are a plain equality. Idempotent + safe: only writes docs that change.
//
// Keep in sync with lib/phoneUtils.ts whatsappStorageFormat (scripts are plain
// node, no @/ aliases).

function whatsappStorageFormat(phoneNumber) {
  let digits = String(phoneNumber).replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  return `+${digits}`;
}

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  const confirmed = process.argv.includes("--confirm");

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const col = mongoose.connection.db.collection("installers");

  const cursor = col.find(
    { whatsappNumber: { $type: "string" } },
    { projection: { _id: 1, whatsappNumber: 1 } }
  );

  let changed = 0;
  let scanned = 0;
  let failed = 0;
  const preview = [];

  for await (const doc of cursor) {
    scanned++;
    const canonical = whatsappStorageFormat(doc.whatsappNumber);
    if (canonical === doc.whatsappNumber) continue;

    if (!confirmed) {
      changed++;
      if (preview.length < 10) preview.push(`  ${doc.whatsappNumber} → ${canonical}`);
      continue;
    }

    try {
      await col.updateOne({ _id: doc._id }, { $set: { whatsappNumber: canonical } });
      changed++;
    } catch (err) {
      failed++;
      console.error(`  ✗ ${doc._id}: ${err.message}`);
    }
  }

  if (!confirmed) {
    console.log(`ℹ️  ${changed}/${scanned} installer(s) would have whatsappNumber normalized.`);
    if (preview.length) console.log(preview.join("\n"));
    console.log("    Re-run with --confirm to apply:  node scripts/normalizeWhatsappNumbers.js --confirm");
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log(`✅ Normalized ${changed}/${scanned} whatsappNumber(s)${failed ? `, ${failed} failed` : ""}.`);
  await mongoose.disconnect();
  process.exit(failed ? 1 : 0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err.message);
  process.exit(1);
});
