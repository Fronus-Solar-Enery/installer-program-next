/**
 * Script to generate Google Contacts API refresh token
 *
 * Steps to use this script:
 * 1. Go to Google Cloud Console: https://console.cloud.google.com
 * 2. Enable People API (Google Contacts API)
 * 3. Create OAuth 2.0 credentials (or use existing ones)
 * 4. Add http://localhost:3000/oauth2callback to authorized redirect URIs
 * 5. Run: node scripts/getGoogleContactsToken.js
 * 6. Follow the URL, authorize, and paste the code
 */

const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const env = {};

  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim();
      env[key] = value;
    }
  });

  return env;
}

const env = loadEnv();

const CLIENT_ID = env.GOOGLE_CONTACTS_CLIENT_ID || env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = env.GOOGLE_CONTACTS_CLIENT_SECRET || env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ Error: Missing Google OAuth credentials in .env.local');
  console.error('Need either GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
  console.error('or GOOGLE_CONTACTS_CLIENT_ID/GOOGLE_CONTACTS_CLIENT_SECRET');
  process.exit(1);
}

console.log('Using Client ID:', CLIENT_ID.substring(0, 20) + '...\n');

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'http://localhost:3000/oauth2callback'
);

// Scopes for Google Contacts API
const SCOPES = ['https://www.googleapis.com/auth/contacts'];

// Generate authorization URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent' // Force consent screen to get refresh token
});

console.log('\n=== Google Contacts API - Refresh Token Generator ===\n');
console.log('1. Authorize this app by visiting this URL:\n');
console.log(authUrl);
console.log('\n2. After authorization, you will be redirected to a URL like:');
console.log('   http://localhost:3000/oauth2callback?code=XXXXX\n');
console.log('3. Copy the CODE from the URL and paste it below:\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Enter the authorization code: ', async (code) => {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n✓ Success! Here is your refresh token:\n');
    console.log('GOOGLE_CONTACTS_REFRESH_TOKEN=' + tokens.refresh_token);
    console.log('\n📝 Add this to your .env.local file\n');

    // Test the token
    oauth2Client.setCredentials(tokens);
    const people = google.people({ version: 'v1', auth: oauth2Client });

    console.log('Testing the token...');
    const response = await people.people.connections.list({
      resourceName: 'people/me',
      pageSize: 1,
      personFields: 'names'
    });

    console.log('✓ Token works! You can access Google Contacts.\n');

  } catch (error) {
    console.error('\n✗ Error getting token:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }

  rl.close();
});
