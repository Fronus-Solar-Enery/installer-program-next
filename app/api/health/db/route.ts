import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import { auth } from "@/lib/auth";
import { TeamRole } from "@/models/TeamMember";

export async function GET(req: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const session = await auth();

    if (!session) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    if (session.user.role !== TeamRole.ADMIN) {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Admin access required",
        },
        { status: 403 }
      );
    }

    // Get connection details
    const MONGODB_URI = process.env.MONGODB_URI || "";
    const isAtlas = MONGODB_URI.includes("mongodb+srv://");
    const isLocal =
      MONGODB_URI.includes("localhost") || MONGODB_URI.includes("127.0.0.1");

    // Extract database name
    const dbMatch = MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
    const database = dbMatch ? dbMatch[1] : "unknown";

    // Extract host (masked)
    let host = "unknown";
    if (isAtlas) {
      const hostMatch = MONGODB_URI.match(/@([^/]+)/);
      host = hostMatch ? hostMatch[1] : "unknown";
    } else {
      const hostMatch = MONGODB_URI.match(/\/\/([^/]+)/);
      host = hostMatch ? hostMatch[1] : "localhost:27017";
    }

    const startTime = Date.now();

    // Test connection
    try {
      await dbConnect();

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Get connection state
      const readyState = mongoose.connection.readyState;
      const stateMap = {
        0: "disconnected",
        1: "connected",
        2: "connecting",
        3: "disconnecting",
      };

      const state = stateMap[readyState as keyof typeof stateMap] || "unknown";

      // Get database info
      const db = mongoose.connection.db;
      const collections = await db?.listCollections().toArray();

      return NextResponse.json({
        status: "healthy",
        database: {
          name: db?.databaseName || database,
          host: mongoose.connection.host || host,
          port: mongoose.connection.port,
          type: isAtlas
            ? "MongoDB Atlas (Cloud)"
            : isLocal
            ? "MongoDB Local"
            : "MongoDB Remote",
          state,
          collections: collections?.length || 0,
          collectionNames: collections?.map((c) => c.name) || [],
        },
        connection: {
          responseTime: `${responseTime}ms`,
          readyState,
          connected: readyState === 1,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error: unknown) {
      return NextResponse.json(
        {
          status: "unhealthy",
          error: error instanceof Error ? error.message : "Unknown error",
          database: {
            type: isAtlas
              ? "MongoDB Atlas (Cloud)"
              : isLocal
              ? "MongoDB Local"
              : "MongoDB Remote",
            expectedHost: host,
            expectedDatabase: database,
          },
          connection: {
            readyState: mongoose.connection.readyState,
            connected: false,
          },
          timestamp: new Date().toISOString(),
        },
        { status: 503 }
      );
    }
  } catch (error: unknown) {
    return NextResponse.json(
      {
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
