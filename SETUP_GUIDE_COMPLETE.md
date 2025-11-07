# 🚀 Complete Setup Guide - Installer Program Management System

**Everything you need to get your Installer Program up and running**

---

## 📋 Table of Contents

1. [Quick Start (10 minutes)](#quick-start)
2. [Detailed Setup](#detailed-setup)
3. [MongoDB Setup](#mongodb-setup)
4. [Database Testing & Debugging](#database-testing--debugging)
5. [Google Contacts Integration](#google-contacts-integration)
6. [WhatsApp Integration](#whatsapp-integration)
7. [Project Overview](#project-overview)
8. [Troubleshooting](#troubleshooting)

---

## Quick Start

### What You Have ✅

- Google OAuth credentials configured
- Google Contacts credentials configured

### What You Need to Setup ❌

1. **MongoDB Database** (8 min)
2. **NEXTAUTH_SECRET** (30 sec)
3. **Admin User** (30 sec)

### 🚀 Fastest Path

**If you see the ECONNREFUSED error:**

```bash
# 1. Setup MongoDB Atlas (8 min) - see MongoDB Setup section below
# 2. Generate secret (30 sec)
npm run setup:secret
# Copy output to .env.local

# 3. Create admin (30 sec)
npm run setup:admin

# 4. Start app (10 sec)
npm run dev
```

**Login:** http://localhost:3000

- Email: `admin@example.com`
- Password: `admin123`

---

## Detailed Setup

### ✅ Setup Checklist

#### Pre-Setup

- [ ] Node.js 18+ installed
- [ ] Code editor (VS Code recommended)

#### Environment Variables

**1. MongoDB Database** (Choose ONE option)

**Option A: MongoDB Atlas (Recommended - 8 min)**

- [ ] Created MongoDB Atlas account
- [ ] Created free M0 cluster (512MB forever free)
- [ ] Created database user (saved password!)
- [ ] Added IP to whitelist
- [ ] Copied connection string
- [ ] Updated `.env.local` with Atlas URI

**Example:**

```env
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority
```

**Option B: Local MongoDB**

- [ ] MongoDB installed locally
- [ ] MongoDB service started
- [ ] `.env.local` has local URI

**Example:**

```env
MONGODB_URI=mongodb://localhost:27017/installer_program
```

**2. NextAuth Secret**

- [ ] Run: `npm run setup:secret`
- [ ] Copy generated secret to `.env.local` as `NEXTAUTH_SECRET`

**3. Google OAuth** (Already Done! ✅)

- [x] `GOOGLE_CLIENT_ID` configured
- [x] `GOOGLE_CLIENT_SECRET` configured

**4. Google Contacts API** (Optional)

- [ ] Google People API enabled
- [ ] OAuth redirect URI configured
- [ ] User authenticated via UI

#### Database Setup

- [ ] MongoDB service is running
- [ ] Run: `npm run setup:admin`
- [ ] Admin user created successfully

#### Final Steps

- [ ] Run: `npm install` (if not done)
- [ ] Run: `npm run dev`
- [ ] Open: http://localhost:3000
- [ ] Login with admin credentials
- [ ] Change admin password immediately

#### Post-Setup

- [ ] Create team members (MANAGER/USER)
- [ ] Test installer registration
- [ ] Test reward registration
- [ ] Test reports generation

---

## MongoDB Setup

### 🔧 Quick Fix: ECONNREFUSED Error

```
❌ Error: connect ECONNREFUSED ::1:27017
```

**Translation**: Your app can't find a MongoDB database.

### ⚡ MongoDB Atlas Setup (Recommended - 8 minutes)

**Why MongoDB Atlas?**

- ✅ No Installation - Works immediately
- ✅ Free Forever - M0 tier never expires (512MB)
- ✅ Always On - Access from anywhere
- ✅ Automatic Backups - Built-in data protection

#### Step 1: Create Account (2 minutes)

1. **Go to MongoDB Atlas**

   - Visit: https://www.mongodb.com/cloud/atlas/register

2. **Sign Up**

   - Option A: Click "Sign up with Google" (fastest)
   - Option B: Enter email and password manually

3. **Complete Registration**
   - Verify email if using manual signup
   - Skip welcome survey if prompted

#### Step 2: Create Free Cluster (3 minutes)

1. **Start Cluster Creation**

   - Click "Create" or "Build a Database"

2. **Choose Deployment Type**

   - Select: **"M0 FREE"**
   - Shows: "512 MB Storage" and "Shared RAM"
   - Click: "Create Deployment"

3. **Choose Provider & Region**

   - Provider: AWS, Google Cloud, or Azure
   - Region: Choose closest to your location
     - Asia: `ap-south-1` (Mumbai) or `ap-southeast-1` (Singapore)
     - US: `us-east-1` (Virginia) or `us-west-1` (California)
     - Europe: `eu-west-1` (Ireland) or `eu-central-1` (Frankfurt)

4. **Cluster Name** (Optional)

   - Default: `Cluster0` (you can keep this)
   - Or rename to: `installer-program`

5. **Click "Create Deployment"**
   - Wait 1-3 minutes for deployment

#### Step 3: Create Database User (1 minute)

1. **In Security Quickstart Window:**

   - Select: "Username and Password"

2. **Create User**
   - Username: `adminuser` (or any name)
   - Click: "Autogenerate Secure Password"
   - **⚠️ IMPORTANT**: Click "Copy" and save password!
   - Click: "Create User"

#### Step 4: Configure Network Access (1 minute)

1. **Add IP Address**

   - For Development: Click "Add My Current IP Address"
   - For Testing: Click "Allow Access from Anywhere" (0.0.0.0/0)

2. **Click "Finish and Close"**
3. **Click "Go to Database"**

#### Step 5: Get Connection String (1 minute)

1. **On Database Deployments Page**

   - Find your cluster (should show "Active")

2. **Click "Connect" Button**

   - Choose: "Drivers"
   - Driver: "Node.js"

3. **Copy Connection String**
   ```
   mongodb+srv://adminuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

#### Step 6: Update `.env.local` (30 seconds)

**Replace:**

```env
MONGODB_URI=mongodb://localhost:27017/installer_program
```

**With** (use YOUR values):

```env
MONGODB_URI=mongodb+srv://adminuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority
```

**Important:**

- Replace `<password>` with your actual password
- Add `/installer_program` before the `?`
- URL encode special characters in password:
  - `@` → `%40`
  - `#` → `%23`
  - `:` → `%3A`

#### Step 7: Test Connection (30 seconds)

```bash
npm run setup:admin
```

**Expected Output:**

```
📦 Connected to MongoDB
✅ Admin user created successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: admin@example.com
🔑 Password: admin123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 🔄 Alternative: Local MongoDB

#### Windows

```bash
# Download from: https://www.mongodb.com/try/download/community
# After installation:
net start MongoDB
```

#### Mac

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

#### Linux (Ubuntu/Debian)

```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

---

## Database Testing & Debugging

The application includes comprehensive database connection debugging and testing tools to help diagnose issues quickly.

### 🧪 Test Database Connection

Run the database connection test at any time:

```bash
npm run test:db
```

**What it does:**

- ✅ Tests MongoDB connection
- ✅ Diagnoses connection errors with specific solutions
- ✅ Measures connection speed
- ✅ Lists databases and collections
- ✅ Tests read/write operations
- ✅ Color-coded output (green=success, red=error, yellow=warning)

**Example output:**

```
🧪 MONGODB CONNECTION TEST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CONNECTION DETAILS:
   Type:     MongoDB Atlas (Cloud)
   Host:     cluster0.xxxxx.mongodb.net
   Database: installer_program

🔌 Testing connection...
✅ Connection successful! (1.23s)

📊 DATABASE INFORMATION:
   Database:    installer_program
   Collections: 3
   • teammembers
   • installers
   • installerrewards

🧪 Testing read/write operations...
   ✓ Write operation successful
   ✓ Read operation successful
   ✓ Delete operation successful

✅ ALL TESTS PASSED!
```

### 🔍 Automatic Error Diagnosis

When connection fails, the test tool automatically identifies the root cause:

**ECONNREFUSED Error:**

- 🔴 Identifies if MongoDB is not running locally
- 📋 Provides specific solutions (Atlas setup or local installation)
- 💡 Shows exact commands to fix the issue

**Authentication Errors:**

- 🔴 Detects wrong credentials
- 📋 Shows how to reset password
- 💡 Explains URL encoding for special characters

**Network Errors:**

- 🔴 Identifies DNS/timeout issues
- 📋 Suggests IP whitelisting (Atlas)
- 💡 Provides network troubleshooting steps

### 📊 Development Server Logging

When you run `npm run dev`, the server automatically logs database configuration:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🗄️  DATABASE CONFIGURATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Type:     MongoDB Atlas (Cloud)
   Host:     cluster0.xxxxx.mongodb.net
   Database: installer_program
   Status:   Will connect on first request
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 Test connection: npm run test:db
```

### 🔌 Connection Logging

The MongoDB connection module now provides detailed logging:

**On Connection Attempt:**

```
🔌 MongoDB Connection Attempt:
   Type: MongoDB Atlas (Cloud)
   Host: cluster0.xxxxx.mongodb.net
   Database: installer_program
   URI: mongodb+srv://user:****@cluster0.xxxxx.mongodb.net/...
   State: Connecting...
```

**On Success:**

```
✅ MongoDB Connected Successfully!
   Database: installer_program
   Host: cluster0.xxxxx.mongodb.net
   Status: Connected
```

**On Failure:**

```
❌ MongoDB Connection Failed!

   🔴 MongoDB is not running on your local machine

📋 Solutions:
   1. Use MongoDB Atlas (Recommended - No installation):
      → See SETUP_GUIDE_COMPLETE.md#mongodb-setup
      → Sign up at: https://www.mongodb.com/cloud/atlas/register
      → Free forever (512MB)

💡 Quick Test: Run "npm run test:db" for detailed diagnostics
```

### 🏥 Health Check API

Check database status programmatically (Admin only):

**Endpoint:** `GET /api/health/db`

**Response (Success):**

```json
{
  "status": "healthy",
  "database": {
    "name": "installer_program",
    "host": "cluster0.xxxxx.mongodb.net",
    "type": "MongoDB Atlas (Cloud)",
    "state": "connected",
    "collections": 3,
    "collectionNames": ["teammembers", "installers", "installerrewards"]
  },
  "connection": {
    "responseTime": "142ms",
    "readyState": 1,
    "connected": true
  },
  "timestamp": "2025-10-04T18:30:00.000Z"
}
```

**Response (Failure):**

```json
{
  "status": "unhealthy",
  "error": "connect ECONNREFUSED ::1:27017",
  "database": {
    "type": "MongoDB Local",
    "expectedHost": "localhost:27017",
    "expectedDatabase": "installer_program"
  },
  "connection": {
    "readyState": 0,
    "connected": false
  }
}
```

### 💡 Quick Debugging Tips

**If you see ECONNREFUSED:**

```bash
# Run the test tool for detailed diagnosis
npm run test:db

# It will show exactly what's wrong and how to fix it
```

**Check current database status:**

```bash
# The dev server shows DB config on startup
npm run dev

# Or use the health check API (requires admin login)
curl http://localhost:3000/api/health/db
```

**Common fixes:**

- Local MongoDB not running → `net start MongoDB` (Windows)
- Wrong credentials → Check .env.local
- IP not whitelisted → Atlas → Network Access → Add IP
- No MONGODB_URI → Add to .env.local

---

## Google Contacts Integration

### UI-Based Authentication (Recommended)

The app uses a user-friendly OAuth flow where users authenticate Google Contacts directly from the UI.

#### Setup Steps

**1. Add OAuth Redirect URI**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. APIs & Services → Credentials
3. Edit your OAuth 2.0 Client ID
4. Under "Authorized redirect URIs", add:
   ```
   http://localhost:3000/api/google-auth/callback
   ```
5. Click "Save"

**2. Enable People API**

1. APIs & Services → Library
2. Search "People API"
3. Click and ensure it's "Enabled"

**3. Configure OAuth Consent Screen**

1. APIs & Services → OAuth consent screen
2. Add scope: `https://www.googleapis.com/auth/contacts`
3. Add your email as test user (if app is in testing mode)

#### How to Use

1. Navigate to `/installers/register`
2. If not connected, see yellow warning banner
3. Click "🔗 Authenticate Google Contacts"
4. Sign in and grant permissions
5. Redirected back with success message
6. Installers now auto-sync to Google Contacts

### Alternative: Manual Token Setup (Legacy)

<details>
<summary>Click to expand manual setup instructions</summary>

#### A. Add OAuth Playground Redirect URI

1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit OAuth client
3. Add: `https://developers.google.com/oauthplayground`
4. Click "Save"

#### B. Generate Refresh Token

1. Go to: https://developers.google.com/oauthplayground
2. Click ⚙️ → Check "Use your own OAuth credentials"
3. Enter:
   - Client ID: `851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com`
   - Client Secret: `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`
4. Close settings
5. Select: `Google People API v1` → `https://www.googleapis.com/auth/contacts`
6. Authorize → Allow
7. Exchange code for tokens
8. Copy "Refresh token"
9. Add to `.env.local`:
   ```env
   GOOGLE_CONTACTS_REFRESH_TOKEN=1//0g...your-token
   ```

</details>

---

## WhatsApp Integration

Send WhatsApp notifications when installers are registered or rewards are paid.

### Option 1: CallMeBot (FREE)

#### Setup Steps

**1. Add CallMeBot to WhatsApp**

- Save number: **+34 644 31 95 72**
- Name it: **CallMeBot**

**2. Activate API Key**

- Send message to CallMeBot:
  ```
  I allow callmebot to send me messages
  ```
- You'll receive your API key: `Your API key is: 123456`

**3. Configure Environment**

Add to `.env.local`:

```env
CALLMEBOT_API_KEY=your-api-key-here
```

**4. Test**

- Register a test installer
- Mark reward as PAID
- Check Activity logs for delivery status

#### Important Notes

- FREE but has rate limits
- Recipients must have CallMeBot activated
- Failed messages logged in Activity section

### Option 2: Twilio WhatsApp API (Paid)

<details>
<summary>Click to expand Twilio setup</summary>

#### Setup Steps

1. **Create Twilio Account**

   - Go to: https://www.twilio.com/console
   - Sign up and verify

2. **Enable WhatsApp Sandbox** (testing)

   - Messaging → Try it out → Send WhatsApp message
   - Follow instructions

3. **Get Credentials**

   - Account SID
   - Auth Token
   - WhatsApp Phone Number

4. **Install Package**

   ```bash
   npm install twilio
   ```

5. **Configure Environment**
   ```env
   TWILIO_ACCOUNT_SID=your-account-sid
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   ```

**Pricing:** ~$0.005 per message

</details>

### Other Alternatives

- **Waboxapp**: Free tier (1000 messages/month)
- **WATI**: $49/month (popular in Pakistan)
- **MessageBird**: Pay-as-you-go
- **Meta WhatsApp Business**: Official platform

---

## Project Overview

### What This Application Does

A comprehensive system to manage:

- **Team Members** (Admin, Manager, User roles)
- **Installers** (with referral tracking)
- **Rewards** (with automatic referrer compensation)
- **Reports** (Excel exports for payments)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │Dashboard │  │Installers│  │ Rewards  │  │ Reports  ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                    API ROUTES (Next.js)                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │   Team   │  │Installers│  │ Rewards  │  │ Reports  ││
│  │   CRUD   │  │   CRUD   │  │   CRUD   │  │  Export  ││
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘│
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│                   DATABASE (MongoDB)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │TeamMember│  │Installer │  │  Reward  │              │
│  │Collection│  │Collection│  │Collection│              │
│  └──────────┘  └──────────┘  └──────────┘              │
└─────────────────────────────────────────────────────────┘
```

### User Roles & Permissions

#### 👑 ADMIN

- ✅ All features
- ✅ Register ADMIN/MANAGER/USER
- ✅ Delete team members
- ✅ Full access to all data

#### 👔 MANAGER

- ✅ Register MANAGER/USER (not ADMIN)
- ✅ Delete installers/rewards
- ✅ Full CRUD on installers/rewards
- ❌ Cannot delete ADMIN users

#### 👤 USER

- ✅ View/Register installers
- ✅ View/Register rewards
- ✅ Update own profile
- ❌ No delete permissions

### Key Features

**Referral System**

- Installer A refers Installer B
- When B gets a reward → A gets Rs. 500 automatically
- Max 5 referrals per installer

**Google Contacts Sync**

- Auto-creates contact when installer registered
- Updates contact when modified
- Deletes contact when removed

**Excel Reports**

- Installers: Complete data export
- Rewards: Filtered by status/date
- Payment Format: Bank-ready with phone numbers

### Technologies Used

**Frontend**

- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4

**Backend**

- Next.js API Routes
- MongoDB 6
- Mongoose 8
- NextAuth.js v5

**Integrations**

- Google OAuth 2.0
- Google People API
- XLSX (Excel generation)

---

## Troubleshooting

### MongoDB Errors

**Error: "Authentication failed"**

- Check username/password in connection string
- URL encode special characters in password

**Error: "IP address not whitelisted"**

- Atlas → Security → Network Access
- Add your current IP
- Wait 1-2 minutes for changes

**Error: "Database not found"**

- Add `/installer_program` before `?` in connection string

### Google OAuth Errors

**Error: "redirect_uri_mismatch"**

- Add exact redirect URI to Google Console:
  - `http://localhost:3000/api/auth/callback/google`
  - `http://localhost:3000/api/google-auth/callback`

**Error: "Access blocked: This app's request is invalid"**

- Add email as test user in OAuth consent screen
- Enable People API

### WhatsApp Errors

**"WhatsApp service not configured"**

- Add `CALLMEBOT_API_KEY` to `.env.local`

**Messages not received**

- Check recipient has CallMeBot activated
- Verify phone number format: +92XXXXXXXXXX
- Check rate limits

### General Issues

**Can't login to app**

- Run `npm run setup:admin` again

**Admin user already exists**

```javascript
// In MongoDB Compass or Shell
db.teammembers.deleteOne({ email: "admin@example.com" });
```

Then run: `npm run setup:admin`

---

## Environment Variables Summary

Your `.env.local` should look like this:

```env
# MongoDB (Atlas recommended)
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generated-secret>

# Google OAuth (Already Configured ✅)
GOOGLE_CLIENT_ID=851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Google Contacts (Optional - UI auth recommended)
GOOGLE_CONTACTS_CLIENT_ID=851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com
GOOGLE_CONTACTS_CLIENT_SECRET=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

# WhatsApp (Optional)
CALLMEBOT_API_KEY=your-api-key
```

---

## Quick Commands Reference

```bash
# Generate NextAuth secret
npm run setup:secret

# Create admin user
npm run setup:admin

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Next Steps After Setup

1. **Change Admin Password**

   - Profile → Change Password

2. **Create Team Members**

   - Team → Register New Member

3. **Register Installers**

   - Installers → Register New Installer

4. **Register Rewards**

   - Rewards → Register New Reward
   - Referrers automatically get Rs. 500

5. **Generate Reports**
   - Reports → Export to Excel

---

## Additional Resources

- **Full Documentation**: [README.md](./README.md)
- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas/
- **Google Cloud Console**: https://console.cloud.google.com
- **CallMeBot**: https://www.callmebot.com/

---

**Built with ❤️ for efficient installer program management**

🎉 **You're ready to go! Happy managing!**
