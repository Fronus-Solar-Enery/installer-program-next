/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Read from .env.local manually
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const envFile = fs.readFileSync(envPath, "utf8");
  const env = {};

  envFile.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");
      if (key && value) {
        env[key.trim()] = value.trim();
      }
    }
  });

  return env;
}

async function createAdmin() {
  try {
    const env = loadEnv();
    const MONGODB_URI = env.MONGODB_URI;

    if (!MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in .env.local");
      process.exit(1);
    }

    console.log("🔗 Connecting to MongoDB Atlas...");
    console.log("   URI:", MONGODB_URI.replace(/:[^:@]+@/, ":****@"));

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected successfully!\n");

    // Define schema
    const TeamMember = mongoose.model(
      "TeamMember",
      new mongoose.Schema({
        name: String,
        email: String,
        password: String,
        role: String,
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      })
    );

    // Check if admin already exists
    const existingAdmin = await TeamMember.findOne({
      email: "remi@fronus.com",
    });
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists in Atlas database!");
      console.log("   Email: remi@fronus.com\n");

      // Delete and recreate
      console.log("🗑️  Deleting existing admin...");
      await TeamMember.deleteOne({ email: "remi@fronus.com" });
      console.log("✅ Deleted\n");
    }

    // Hash password
    console.log("🔐 Creating new admin user...");
    const hashedPassword = await bcrypt.hash("ItsRemi.Pro786", 10);

    // Create admin user
    await TeamMember.create({
      name: "Admin User",
      email: "remi@fronus.com",
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("✅ Admin user created successfully in Atlas!\n");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email: remi@fronus.com");
    console.log("🔑 Password: ItsRemi.Pro786");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n🎉 You can now login at http://localhost:3000");
    console.log("⚠️  Please change this password after first login!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    if (error.code === "ENOENT") {
      console.error("\n💡 Make sure .env.local file exists");
    }
    process.exit(1);
  }
}

createAdmin();
