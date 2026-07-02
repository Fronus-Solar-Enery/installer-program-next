require("dotenv").config({ path: ".env.local" });
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const email = process.argv[2] || "admin@example.com";
const password = process.argv[3] || "admin123";
const name = process.argv[4] || "Admin User";

async function createAdmin() {
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

  const existing = await TeamMember.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await TeamMember.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role: "ADMIN",
  });

  console.log("Admin user created");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
