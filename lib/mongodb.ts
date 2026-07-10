import mongoose from "mongoose";
import dns from "dns";
import { logger } from "@/lib/logger";

// System DNS resolver can't resolve mongodb+srv SRV records on this
// network (router/ISP limitation). Force a public resolver that can.
if (process.env.NODE_ENV === "development") {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
}

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

    logger.debug("MongoDB connecting");

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      logger.info("MongoDB connected", {
        database: mongoose.connection.db?.databaseName,
        host: mongoose.connection.host,
      });
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    // Human troubleshooting tutorials live in scripts/testDbConnection.js (npm run test:db).
    logger.error("MongoDB connection failed", { error });
    throw error;
  }

  return cached.conn;
}

export default dbConnect;
