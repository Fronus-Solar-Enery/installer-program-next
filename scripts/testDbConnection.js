require("dotenv").config({ path: ".env.local" });
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const mongoose = require("mongoose");

const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";

function ok(msg) {
  console.log(`${GREEN}✅ ${msg}${RESET}`);
}
function fail(msg) {
  console.log(`${RED}❌ ${msg}${RESET}`);
}
function warn(msg) {
  console.log(`${YELLOW}⚠️  ${msg}${RESET}`);
}
function info(msg) {
  console.log(`${CYAN}${msg}${RESET}`);
}

function maskUri(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
}

function diagnose(error) {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes("ECONNREFUSED")) {
    const isLocal =
      msg.includes("127.0.0.1") || msg.includes("::1") || msg.includes("localhost");
    console.log("\n🔴 ROOT CAUSE:");
    console.log(
      isLocal
        ? "   MongoDB is not running on your local machine"
        : "   Cannot connect to the MongoDB server"
    );
    console.log("\n📋 SOLUTIONS:");
    if (isLocal) {
      console.log("   1. Use MongoDB Atlas (cloud, no install):");
      console.log("      https://www.mongodb.com/cloud/atlas/register");
      console.log("   2. Or start MongoDB locally:");
      console.log("      Windows: net start MongoDB");
      console.log("      Mac:     brew services start mongodb-community");
      console.log("      Linux:   sudo systemctl start mongod");
    } else {
      console.log("   1. Check if the MongoDB server is running");
      console.log("   2. Verify host/port in MONGODB_URI");
      console.log("   3. Check firewall settings");
      console.log("   4. If using Atlas, verify IP whitelist");
    }
    return;
  }

  if (msg.includes("Authentication failed") || msg.includes("auth failed")) {
    console.log("\n🔴 ROOT CAUSE:");
    console.log("   MongoDB authentication failed - wrong username or password");
    console.log("\n📋 SOLUTIONS:");
    console.log("   1. Verify username/password in MONGODB_URI");
    console.log("   2. Confirm the user exists in MongoDB");
    console.log("   3. For Atlas: reset the password in the Atlas console");
    console.log("   4. URL-encode special characters: @ → %40, # → %23, : → %3A, / → %2F");
    return;
  }

  if (msg.includes("getaddrinfo") || msg.includes("ENOTFOUND")) {
    console.log("\n🔴 ROOT CAUSE:");
    console.log("   Cannot resolve MongoDB hostname - DNS or network issue");
    console.log("\n📋 SOLUTIONS:");
    console.log("   1. Check internet connection");
    console.log("   2. Verify hostname in MONGODB_URI");
    console.log("   3. Check VPN/proxy/DNS settings");
    return;
  }

  if (msg.includes("timeout") || msg.includes("ETIMEDOUT")) {
    console.log("\n🔴 ROOT CAUSE:");
    console.log("   Connection timeout - server took too long to respond");
    console.log("\n📋 SOLUTIONS:");
    console.log("   1. For Atlas: verify your IP is whitelisted");
    console.log("   2. Check connection speed / try a different network");
    console.log("   3. Disable VPN temporarily");
    return;
  }

  if (msg.includes("not in whitelist") || msg.includes("IP address")) {
    console.log("\n🔴 ROOT CAUSE:");
    console.log("   IP address not whitelisted in MongoDB Atlas");
    console.log("\n📋 SOLUTIONS:");
    console.log("   1. Atlas → Security → Network Access → Add IP Address");
    console.log("   2. Use 0.0.0.0/0 for development");
    console.log("   3. Wait 1-2 minutes for changes to apply");
    return;
  }

  console.log("\n🔴 ROOT CAUSE:");
  console.log(`   ${msg}`);
  console.log("\n📋 SOLUTIONS:");
  console.log("   1. Check MONGODB_URI in .env.local");
  console.log("   2. See https://docs.mongodb.com/manual/reference/connection-string/");
}

async function testConnection() {
  const uri = process.env.MONGODB_URI;

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🗄️  MongoDB Connection Test");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  if (!uri) {
    fail("MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  info(`URI: ${maskUri(uri)}`);

  const start = Date.now();
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const elapsed = Date.now() - start;
    ok(`Connected in ${elapsed}ms`);

    const db = mongoose.connection.db;
    ok(`Database: ${db.databaseName}`);

    const collections = await db.listCollections().toArray();
    if (collections.length === 0) {
      warn("No collections found (empty database)");
    } else {
      ok(`Collections (${collections.length}): ${collections.map((c) => c.name).join(", ")}`);
    }

    // Read/write smoke test against a throwaway collection
    const testCollection = db.collection("__connection_test__");
    await testCollection.insertOne({ ts: new Date() });
    ok("Write test passed");
    await testCollection.deleteMany({});
    ok("Read/delete test passed");

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    ok("All checks passed");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit(0);
  } catch (error) {
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    fail("CONNECTION FAILED - DIAGNOSIS");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    diagnose(error);
    process.exit(1);
  }
}

testConnection();
