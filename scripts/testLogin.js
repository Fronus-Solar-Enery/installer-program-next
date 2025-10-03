const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

async function testLogin() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/installer_program';
    console.log('🔗 Connecting to:', MONGODB_URI.replace(/:[^:@]+@/, ':****@'));

    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB\n');

    // Define schema
    const TeamMember = mongoose.model('TeamMember', new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
    }));

    // Test credentials
    const testEmail = 'admin@example.com';
    const testPassword = 'admin123';

    console.log('🔍 Looking for user:', testEmail);
    const user = await TeamMember.findOne({ email: testEmail });

    if (!user) {
      console.log('❌ User not found in database!');
      console.log('\n📊 Database info:');
      const count = await TeamMember.countDocuments();
      console.log(`Total users in database: ${count}`);

      if (count > 0) {
        const allUsers = await TeamMember.find({}, 'email name role');
        console.log('\n👥 Existing users:');
        allUsers.forEach(u => {
          console.log(`  - ${u.email} (${u.role})`);
        });
      }

      console.log('\n💡 Run this to create admin user:');
      console.log('   node scripts/createAdmin.js');
      process.exit(1);
    }

    console.log('✅ User found!');
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Has password:', !!user.password);

    if (!user.password) {
      console.log('\n❌ User has no password! This user was created via Google OAuth.');
      console.log('   Either:');
      console.log('   1. Login with Google OAuth instead');
      console.log('   2. Delete this user and recreate with password');
      process.exit(1);
    }

    // Test password
    console.log('\n🔐 Testing password...');
    const isValid = await bcrypt.compare(testPassword, user.password);

    if (isValid) {
      console.log('✅ Password is CORRECT!');
      console.log('\n🎉 Login credentials are valid:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', testEmail);
      console.log('🔑 Password:', testPassword);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log('\n🔧 To reset the password, run:');
      console.log('   node scripts/resetAdminPassword.js');
    }

    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
