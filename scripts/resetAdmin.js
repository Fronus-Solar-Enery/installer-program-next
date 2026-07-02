require("dotenv").config({ path: ".env.local" });
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const email = process.argv[2] || "admin@example.com";
const password = process.argv[3] || "admin123";

async function resetAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not set in .env.local");
    process.exit(1);
  }

  await mongoose.connect(uri);

  const TeamMember = mongoose.model(
    "TeamMember",
    new mongoose.Schema(
      {
        name: String,
        email: { type: String, unique: true, lowercase: true, trim: true },
        password: String,
        role: String,
      },
      { timestamps: true }
    )
  );

  const hashedPassword = await bcrypt.hash(password, 10);
  const normalizedEmail = email.toLowerCase();

  const existing = await TeamMember.findOne({ email: normalizedEmail });

  if (existing) {
    existing.password = hashedPassword;
    existing.role = "ADMIN";
    await existing.save();
    console.log(`Admin password reset: ${normalizedEmail}`);
  } else {
    await TeamMember.create({
      name: "Admin User",
      email: normalizedEmail,
      password: hashedPassword,
      role: "ADMIN",
    });
    console.log(`Admin user created: ${normalizedEmail}`);
  }

  console.log(`Email: ${normalizedEmail}`);
  console.log(`Password: ${password}`);
  process.exit(0);
}

resetAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
