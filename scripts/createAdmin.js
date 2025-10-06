const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

async function createAdmin() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/installer_program';

    if (!process.env.MONGODB_URI) {
      console.log('⚠️  Warning: MONGODB_URI not found in .env.local, using localhost');
    }

    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Define schema
    const TeamMember = mongoose.model('TeamMember', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }));

    // Check if admin already exists
    const existingAdmin = await TeamMember.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('Email: admin@example.com');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    await TeamMember.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
    });

    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Please change this password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
