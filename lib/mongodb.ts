import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Use globalThis instead of global for compatibility with Edge Runtime
declare global {
  var mongoose: GlobalMongoose | undefined;
}

const cached: GlobalMongoose = globalThis.mongoose || {
  conn: null,
  promise: null,
};

if (!globalThis.mongoose) {
  globalThis.mongoose = cached;
}

// Helper function to parse and mask MongoDB URI for logging
function parseMongoUri(uri: string): {
  type: string;
  host: string;
  database: string;
  masked: string;
} {
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

    // Mask password in URI
    const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");

    return {
      type: isAtlas
        ? "MongoDB Atlas (Cloud)"
        : isLocal
        ? "MongoDB Local"
        : "MongoDB Remote",
      host,
      database,
      masked,
    };
  } catch {
    return {
      type: "Unknown",
      host: "unknown",
      database: "unknown",
      masked: uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@"),
    };
  }
}

// Helper function to classify and explain errors
function classifyMongoError(error: unknown): {
  cause: string;
  solution: string;
} {
  const errorMsg = error instanceof Error ? error.message : String(error);

  // Connection refused errors
  if (
    errorMsg.includes("ECONNREFUSED") ||
    errorMsg.includes("connect ECONNREFUSED")
  ) {
    const isLocal =
      errorMsg.includes("127.0.0.1") ||
      errorMsg.includes("::1") ||
      errorMsg.includes("localhost");
    return {
      cause: isLocal
        ? "🔴 MongoDB is not running on your local machine"
        : "🔴 Cannot connect to the MongoDB server",
      solution: isLocal
        ? `
📋 Solutions:
   1. Use MongoDB Atlas (Recommended - No installation):
      → See SETUP_GUIDE_COMPLETE.md#mongodb-setup
      → Sign up at: https://www.mongodb.com/cloud/atlas/register
      → Free forever (512MB)

   2. Install & Start MongoDB locally:
      • Windows: net start MongoDB
      • Mac: brew services start mongodb-community
      • Linux: sudo systemctl start mongod`
        : `
📋 Solutions:
   1. Check if MongoDB server is running
   2. Verify the host/port in your MONGODB_URI
   3. Check firewall settings
   4. If using Atlas, verify IP whitelist`,
    };
  }

  // Authentication errors
  if (
    errorMsg.includes("Authentication failed") ||
    errorMsg.includes("auth failed")
  ) {
    return {
      cause: "🔴 MongoDB authentication failed - Wrong username or password",
      solution: `
📋 Solutions:
   1. Verify username and password in MONGODB_URI
   2. Check if user exists in MongoDB
   3. For Atlas: Reset password in MongoDB Atlas console
   4. Special characters in password must be URL encoded:
      @ → %40, # → %23, : → %3A, / → %2F`,
    };
  }

  // DNS/Network errors
  if (errorMsg.includes("getaddrinfo") || errorMsg.includes("ENOTFOUND")) {
    return {
      cause: "🔴 Cannot resolve MongoDB hostname - DNS or network issue",
      solution: `
📋 Solutions:
   1. Check internet connection
   2. Verify hostname in MONGODB_URI is correct
   3. Try using IP address instead of hostname
   4. Check VPN/proxy settings
   5. Verify DNS settings`,
    };
  }

  // Timeout errors
  if (errorMsg.includes("timeout") || errorMsg.includes("ETIMEDOUT")) {
    return {
      cause: "🔴 Connection timeout - Server took too long to respond",
      solution: `
📋 Solutions:
   1. Check internet connection speed
   2. For Atlas: Verify IP is whitelisted
   3. Try different network (mobile hotspot)
   4. Disable VPN temporarily
   5. Check firewall settings`,
    };
  }

  // IP whitelist errors (Atlas)
  if (
    errorMsg.includes("IP address") ||
    errorMsg.includes("not in whitelist")
  ) {
    return {
      cause: "🔴 IP address not whitelisted in MongoDB Atlas",
      solution: `
📋 Solutions:
   1. Go to MongoDB Atlas → Security → Network Access
   2. Click "Add IP Address"
   3. Add your current IP or use 0.0.0.0/0 for development
   4. Wait 1-2 minutes for changes to apply`,
    };
  }

  // URI format errors
  if (
    errorMsg.includes("Invalid connection string") ||
    errorMsg.includes("URI")
  ) {
    return {
      cause: "🔴 MongoDB URI format is invalid",
      solution: `
📋 Solutions:
   1. Atlas format: mongodb+srv://username:password@host/database?options
   2. Local format: mongodb://localhost:27017/database
   3. Ensure password is URL encoded
   4. Check for missing database name after the host`,
    };
  }

  // Generic error
  return {
    cause: `🔴 MongoDB connection error: ${errorMsg}`,
    solution: `
📋 Solutions:
   1. Check MONGODB_URI in .env.local
   2. Run: npm run test:db
   3. See SETUP_GUIDE_COMPLETE.md for detailed setup
   4. Common issues: https://docs.mongodb.com/manual/reference/connection-string/`,
  };
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      // Connection pool optimization for production
      maxPoolSize: 10, // Reduced from default 100 for serverless environments
      minPoolSize: 2, // Keep minimum warm connections
      maxIdleTimeMS: 30000, // Close idle connections after 30 seconds
      serverSelectionTimeoutMS: 10000, // Fail fast if no server available
      socketTimeoutMS: 45000, // Socket timeout for operations
    };

    const uriInfo = parseMongoUri(MONGODB_URI);

    // Log connection attempt (only in development)
    if (process.env.NODE_ENV !== "production") {
      console.log("\n🔌 MongoDB Connection Attempt:");
      console.log(`   Type: ${uriInfo.type}`);
      console.log(`   Host: ${uriInfo.host}`);
      console.log(`   Database: ${uriInfo.database}`);
      console.log(`   URI: ${uriInfo.masked}`);
      console.log(
        `   State: ${
          mongoose.connection.readyState === 0
            ? "Disconnected"
            : "Connecting..."
        }`
      );
    }

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      // Log success
      if (process.env.NODE_ENV !== "production") {
        console.log(`\n✅ MongoDB Connected Successfully!`);
        console.log(
          `   Database: ${mongoose.connection.db?.databaseName || "Unknown"}`
        );
        console.log(`   Host: ${mongoose.connection.host}`);
        console.log(`   Status: Connected\n`);
      }
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;

    // Log detailed error information
    const { cause, solution } = classifyMongoError(e);
    console.error("\n❌ MongoDB Connection Failed!\n");
    console.error(`   ${cause}\n`);
    console.error(solution);
    console.error(
      '\n💡 Quick Test: Run "npm run test:db" for detailed diagnostics\n'
    );

    throw e;
  }

  return cached.conn;
}

export default dbConnect;
