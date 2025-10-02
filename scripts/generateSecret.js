const crypto = require('crypto');

console.log('🔐 Generating NEXTAUTH_SECRET...\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const secret = crypto.randomBytes(32).toString('base64');

console.log('Your NEXTAUTH_SECRET:');
console.log(secret);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('\nCopy this value to your .env.local file:');
console.log(`NEXTAUTH_SECRET=${secret}\n`);
