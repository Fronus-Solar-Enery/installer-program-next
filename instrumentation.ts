export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only run on server-side in development
    if (process.env.NODE_ENV === 'development') {
      const mongoose = await import('mongoose');

      const MONGODB_URI = process.env.MONGODB_URI;

      if (!MONGODB_URI) {
        console.log('\n⚠️  MongoDB Connection Info:');
        console.log('   MONGODB_URI not configured in .env.local');
        console.log('   💡 Run: npm run test:db\n');
        return;
      }

      // Parse URI info
      const isAtlas = MONGODB_URI.includes('mongodb+srv://');
      const isLocal = MONGODB_URI.includes('localhost') || MONGODB_URI.includes('127.0.0.1');

      const dbMatch = MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
      const database = dbMatch ? dbMatch[1] : 'unknown';

      let host = 'unknown';
      if (isAtlas) {
        const hostMatch = MONGODB_URI.match(/@([^/]+)/);
        host = hostMatch ? hostMatch[1] : 'unknown';
      } else {
        const hostMatch = MONGODB_URI.match(/\/\/([^/]+)/);
        host = hostMatch ? hostMatch[1] : 'localhost:27017';
      }

      const type = isAtlas ? 'MongoDB Atlas (Cloud)' : isLocal ? 'MongoDB Local' : 'MongoDB Remote';

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🗄️  DATABASE CONFIGURATION');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`   Type:     ${type}`);
      console.log(`   Host:     ${host}`);
      console.log(`   Database: ${database}`);
      console.log(`   Status:   Will connect on first request`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('💡 Test connection: npm run test:db');
      console.log('📖 Setup guide: SETUP_GUIDE_COMPLETE.md\n');
    }
  }
}
