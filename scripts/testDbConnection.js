/* eslint-disable @typescript-eslint/no-require-imports */
const mongoose = require("mongoose");
const { performance } = require("perf_hooks");

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function parseMongoUri(uri) {
  try {
    const isAtlas = uri.includes("mongodb+srv://");
    const isLocal = uri.includes("localhost") || uri.includes("127.0.0.1");

    // Extract database name
    const dbMatch = uri.match(/\/([^/?]+)(\?|$)/);
    const database = dbMatch ? dbMatch[1] : "unknown";

    // Extract host
    let host = "unknown";
    if (isAtlas) {
      const hostMatch = uri.match(/@([^/]+)/);
      host = hostMatch ? hostMatch[1] : "unknown";
    } else {
      const hostMatch = uri.match(/\/\/([^/]+)/);
      host = hostMatch ? hostMatch[1] : "localhost:27017";
    }

    // Extract username
    const userMatch = uri.match(/\/\/([^:]+):/);
    const username = userMatch ? userMatch[1] : "none";

    // Mask password
    const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");

    return {
      type: isAtlas
        ? "MongoDB Atlas (Cloud)"
        : isLocal
          ? "MongoDB Local"
          : "MongoDB Remote",
      host,
      database,
      username,
      masked,
      isAtlas,
      isLocal,
    };
  } catch (error) {
    return null;
  }
}

function diagnoseError(error, uriInfo) {
  const errorMsg = error.message || String(error);

  console.log(
    colorize("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "red"),
  );
  console.log(colorize("❌ CONNECTION FAILED - DIAGNOSIS", "red"));
  console.log(
    colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "red"),
  );

  // ECONNREFUSED - MongoDB not running
  if (errorMsg.includes("ECONNREFUSED")) {
    if (uriInfo?.isLocal) {
      console.log(colorize("🔴 ROOT CAUSE:", "red"));
      console.log("   MongoDB is NOT running on your local machine\n");

      console.log(
        colorize("📋 SOLUTION 1 (Recommended - No Installation):", "green"),
      );
      console.log("   Use MongoDB Atlas (Cloud Database):");
      console.log(
        "   1. Sign up: https://www.mongodb.com/cloud/atlas/register",
      );
      console.log("   2. Create FREE M0 cluster (512MB forever free)");
      console.log("   3. Get connection string");
      console.log("   4. Update MONGODB_URI in .env.local");
      console.log(
        colorize(
          "   📖 Guide: SETUP_GUIDE_COMPLETE.md#mongodb-setup\n",
          "cyan",
        ),
      );

      console.log(colorize("📋 SOLUTION 2 (Install Local MongoDB):", "yellow"));
      console.log(
        "   Windows: Download from mongodb.com → Install → Run: net start MongoDB",
      );
      console.log(
        "   Mac:     brew install mongodb-community → brew services start mongodb-community",
      );
      console.log(
        "   Linux:   sudo apt-get install mongodb-org → sudo systemctl start mongod\n",
      );
    } else {
      console.log(colorize("🔴 ROOT CAUSE:", "red"));
      console.log("   Cannot connect to remote MongoDB server\n");

      console.log(colorize("📋 SOLUTIONS:", "yellow"));
      console.log("   1. Verify the server is running");
      console.log("   2. Check firewall settings");
      console.log("   3. Verify host/port in MONGODB_URI");
      console.log("   4. Check network connectivity\n");
    }
    return;
  }

  // Authentication errors
  if (
    errorMsg.includes("Authentication failed") ||
    errorMsg.includes("auth failed")
  ) {
    console.log(colorize("🔴 ROOT CAUSE:", "red"));
    console.log("   Wrong username or password\n");

    console.log(colorize("📋 SOLUTIONS:", "yellow"));
    console.log(`   Current username: ${uriInfo?.username || "unknown"}`);
    console.log("   1. Verify username and password in MONGODB_URI");
    console.log("   2. For Atlas: Reset password in MongoDB Atlas console");
    console.log("   3. Check if user exists in database");
    console.log("   4. Special characters must be URL encoded:");
    console.log("      @ → %40, # → %23, : → %3A, / → %2F\n");
    return;
  }

  // DNS/Network errors
  if (errorMsg.includes("getaddrinfo") || errorMsg.includes("ENOTFOUND")) {
    console.log(colorize("🔴 ROOT CAUSE:", "red"));
    console.log("   Cannot resolve hostname (DNS error)\n");

    console.log(colorize("📋 SOLUTIONS:", "yellow"));
    console.log("   1. Check internet connection");
    console.log("   2. Verify hostname in MONGODB_URI is correct");
    console.log("   3. Try using IP address instead of hostname");
    console.log("   4. Check VPN/proxy settings");
    console.log("   5. Flush DNS cache:\n");
    console.log("      Windows: ipconfig /flushdns");
    console.log("      Mac:     sudo dscacheutil -flushcache");
    console.log("      Linux:   sudo systemd-resolve --flush-caches\n");
    return;
  }

  // Timeout errors
  if (errorMsg.includes("timeout") || errorMsg.includes("ETIMEDOUT")) {
    console.log(colorize("🔴 ROOT CAUSE:", "red"));
    console.log("   Connection timeout - Server not responding\n");

    console.log(colorize("📋 SOLUTIONS:", "yellow"));
    console.log("   1. Check internet connection speed");
    console.log("   2. For Atlas: Verify IP is whitelisted");
    console.log("   3. Try different network (e.g., mobile hotspot)");
    console.log("   4. Disable VPN temporarily");
    console.log("   5. Check firewall settings\n");
    return;
  }

  // IP whitelist (Atlas specific)
  if (
    errorMsg.includes("IP address") ||
    errorMsg.includes("not in whitelist") ||
    errorMsg.includes("not authorized")
  ) {
    console.log(colorize("🔴 ROOT CAUSE:", "red"));
    console.log("   Your IP address is not whitelisted in MongoDB Atlas\n");

    console.log(colorize("📋 SOLUTIONS:", "green"));
    console.log("   1. Go to: MongoDB Atlas → Security → Network Access");
    console.log('   2. Click "Add IP Address"');
    console.log("   3. Options:");
    console.log('      • Click "Add Current IP Address" (recommended for dev)');
    console.log(
      "      • Or add 0.0.0.0/0 to allow from anywhere (less secure)",
    );
    console.log('   4. Click "Confirm"');
    console.log("   5. Wait 1-2 minutes for changes to apply\n");
    return;
  }

  // Invalid connection string
  if (
    errorMsg.includes("Invalid connection string") ||
    errorMsg.includes("Invalid scheme")
  ) {
    console.log(colorize("🔴 ROOT CAUSE:", "red"));
    console.log("   MongoDB URI format is invalid\n");

    console.log(colorize("📋 CORRECT FORMATS:", "green"));
    console.log(
      "   Atlas:  mongodb+srv://username:password@host.mongodb.net/database?options",
    );
    console.log("   Local:  mongodb://localhost:27017/database");
    console.log("   Remote: mongodb://username:password@host:27017/database\n");

    console.log(colorize("📋 YOUR URI:", "yellow"));
    console.log(`   ${uriInfo?.masked || "Could not parse"}\n`);
    return;
  }

  // Generic error
  console.log(colorize("🔴 ROOT CAUSE:", "red"));
  console.log(`   ${errorMsg}\n`);

  console.log(colorize("📋 GENERAL SOLUTIONS:", "yellow"));
  console.log("   1. Check MONGODB_URI in .env.local");
  console.log("   2. Verify MongoDB server is accessible");
  console.log("   3. Check network/firewall settings");
  console.log("   4. See: SETUP_GUIDE_COMPLETE.md\n");
}

async function testDbConnection() {
  console.log(
    colorize("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "cyan"),
  );
  console.log(colorize("🧪 MONGODB CONNECTION TEST", "cyan"));
  console.log(
    colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "cyan"),
  );

  // Check for .env.local
  require("dotenv").config({ path: ".env.local" });

  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.log(colorize("❌ MONGODB_URI not found in .env.local", "red"));
    console.log(colorize("\n📋 SOLUTION:", "yellow"));
    console.log("   1. Make sure .env.local file exists in project root");
    console.log("   2. Add this line to .env.local:");
    console.log(
      "      MONGODB_URI=mongodb://localhost:27017/installer_program",
    );
    console.log(
      "   3. Or see SETUP_GUIDE_COMPLETE.md for MongoDB Atlas setup\n",
    );
    process.exit(1);
  }

  // Parse URI
  const uriInfo = parseMongoUri(MONGODB_URI);

  console.log(colorize("📋 CONNECTION DETAILS:", "bright"));
  console.log(`   Type:     ${colorize(uriInfo.type, "cyan")}`);
  console.log(`   Host:     ${colorize(uriInfo.host, "cyan")}`);
  console.log(`   Database: ${colorize(uriInfo.database, "cyan")}`);
  console.log(`   Username: ${colorize(uriInfo.username, "cyan")}`);
  console.log(`   URI:      ${colorize(uriInfo.masked, "cyan")}\n`);

  // Test connection
  console.log(colorize("🔌 Testing connection...", "yellow"));
  const startTime = performance.now();

  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // 10 second timeout
      socketTimeoutMS: 45000,
    });

    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(
      colorize(`✅ Connection successful! (${duration}s)\n`, "green"),
    );

    // Test database access
    console.log(colorize("📊 DATABASE INFORMATION:", "bright"));
    const db = mongoose.connection.db;
    const dbName = db.databaseName;
    console.log(`   Database:    ${colorize(dbName, "green")}`);
    console.log(
      `   Host:        ${colorize(mongoose.connection.host, "green")}`,
    );
    console.log(
      `   Port:        ${colorize(String(mongoose.connection.port || "N/A"), "green")}`,
    );
    console.log(`   Ready State: ${colorize("Connected", "green")}\n`);

    // List collections
    console.log(colorize("📦 COLLECTIONS:", "bright"));
    const collections = await db.listCollections().toArray();
    if (collections.length > 0) {
      collections.forEach((col) => {
        console.log(`   • ${colorize(col.name, "cyan")}`);
      });
    } else {
      console.log(
        `   ${colorize("(No collections yet - database is empty)", "yellow")}`,
      );
    }
    console.log("");

    // Test read/write
    console.log(colorize("🧪 Testing read/write operations...", "yellow"));

    const TestModel = mongoose.model(
      "_test",
      new mongoose.Schema({ timestamp: Date }),
      "_connection_test",
    );

    // Write test
    const testDoc = await TestModel.create({ timestamp: new Date() });
    console.log(colorize("   ✓ Write operation successful", "green"));

    // Read test
    const found = await TestModel.findById(testDoc._id);
    console.log(colorize("   ✓ Read operation successful", "green"));

    // Delete test
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log(colorize("   ✓ Delete operation successful", "green"));

    // Cleanup test collection
    await db.dropCollection("_connection_test").catch(() => {});

    console.log(
      colorize(
        "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        "green",
      ),
    );
    console.log(colorize("✅ ALL TESTS PASSED!", "green"));
    console.log(
      colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "green"),
    );
    console.log(
      colorize("\n💡 Your MongoDB connection is working perfectly!", "bright"),
    );
    console.log(colorize("   You can now run: npm run dev\n", "bright"));

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    const endTime = performance.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(colorize(`❌ Connection failed after ${duration}s\n`, "red"));

    diagnoseError(error, uriInfo);

    console.log(
      colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "red"),
    );
    console.log(colorize("💡 NEXT STEPS:", "bright"));
    console.log(
      colorize("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "red"),
    );
    console.log("   1. Follow the solutions above");
    console.log("   2. Run this test again: npm run test:db");
    console.log("   3. See detailed guide: SETUP_GUIDE_COMPLETE.md");
    console.log(
      "   4. For Atlas setup: https://www.mongodb.com/cloud/atlas/register\n",
    );

    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

testDbConnection();
