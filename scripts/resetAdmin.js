/* eslint-disable @typescript-eslint/no-require-imports */
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

async function resetAdmin() {
  try {
    // Connect to MongoDB
    const MONGODB_URI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/installer_program";
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to MongoDB");

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

    // Delete existing admin
    const deleted = await TeamMember.deleteOne({ email: "remi@fronus.com" });

    if (deleted.deletedCount > 0) {
      console.log("🗑️  Deleted existing admin user");
    } else {
      console.log("ℹ️  No existing admin user found");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("ItsRemi.Pro786", 10);

    // Create new admin user
    await TeamMember.create({
      name: "Admin User",
      email: "remi@fronus.com",
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("\n✅ New admin user created successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 Email: remi@fronus.com");
    console.log("🔑 Password: ItsRemi.Pro786");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("⚠️  Please change this password after first login!\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  }
}

resetAdmin();
