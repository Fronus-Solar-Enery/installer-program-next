# Installer Program Management System

A comprehensive Next.js application for managing installer programs, tracking rewards, and handling team operations with role-based access control.

## Features

### Authentication & Authorization

- **Google OAuth Integration** - Sign in with Google account
- **Credentials-based Login** - Email and password authentication
- **Role-Based Access Control** - Three user roles (Admin, Manager, User)
- **Session Management** - Secure JWT-based sessions
- **Password Management** - Change password functionality
- **Forgot Password** - Email-based password reset with 6-digit PIN

### Team Management

- **Team Member Registration** - ADMIN/MANAGER can register new members
  - ADMIN can register ADMIN, MANAGER, or USER
  - MANAGER can register MANAGER or USER only
- **Team Member CRUD** - Complete create, read, update, delete operations
- **Profile Management** - Update name, email, and password
- **Role Management** - Assign and update user roles

### Installer Management

- **Installer Registration** - Register new installers with complete details
  - Installer Code (unique identifier)
  - Personal Information (Name, CNIC, Phone, WhatsApp)
  - Location Details (Address, City, Province)
  - Banking Information (Bank Name, Account Number, Account Title)
  - Training Center and Company Name
  - Referrer Code (optional, max 5 referrals per installer)
  - Certification Status
- **Installer CRUD** - Complete CRUD operations
- **Installer Statistics** - View total rewards, amounts by status
- **Google Contacts Sync** - Auto-sync installer data to Google Contacts
- **Referral Tracking** - Track installer referrals (max 5 per installer)

### Reward Management

- **Reward Registration** - Register product installations and rewards
  - Installer Code lookup and validation
  - Product details (Model, Serial Number)
  - Installation details (City, Inverter Serial Number)
  - Payment information (Amount, Status, Transaction ID)
  - Automatic referrer reward calculation (Rs. 500 per referral)
- **Payment Status Tracking** - PENDING, PAID, FAILED statuses
- **Reward CRUD** - Complete CRUD operations
- **Referral Rewards** - Automatic Rs. 500 reward for referrers

### Advanced Filtering & Sorting

- **Payment Status Filter** - Filter by PENDING/PAID/FAILED
- **Date Range Filter** - Filter by sending date
- **Payment Method Filter** - Filter by payment method
- **Serial Number Status Filter** - Filter by serial status
- **Product Model Filter** - Filter by product model
- **Team Member Filter** - Filter by registered team member
- **City/Province Filter** - Filter by location
- **Sorting** - Sort by any field (ascending/descending)
- **Pagination** - Efficient data loading with page limits

### Reports & Export

- **Installer Report** - Complete installer table details with Excel export
- **Reward Report** - Complete reward table details with Excel export
- **Payment Format Export** - Excel format ready for bulk payment processing

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **MongoDB & Mongoose** - Database and ODM
- **NextAuth.js v5** - Authentication
- **Google OAuth & Contacts API** - Google integrations
- **Zod** - Schema validation
- **XLSX** - Excel file generation

## 🚀 Quick Start

### 📖 Setup Guide

**👉 [Complete Setup Guide](./SETUP_GUIDE_COMPLETE.md)** - Everything you need in one place!

This comprehensive guide includes:

- Quick Start (10 minutes)
- MongoDB Setup (Atlas & Local)
- Google Contacts Integration
- WhatsApp Integration
- Project Overview
- Troubleshooting

### ⚡ Super Quick Start (10 Minutes)

```bash
# 1. Setup MongoDB (see SETUP_GUIDE_COMPLETE.md) - 8 min
# Choose MongoDB Atlas (recommended) or local MongoDB

# 2. Generate NextAuth secret (30 sec)
npm run setup:secret
# → Copy output to .env.local

# 3. Create admin user (30 sec)
npm run setup:admin
# → Admin created with credentials

# 4. Start application (10 sec)
npm run dev
# → Open http://localhost:3000
```

**Login**: `admin@example.com` / `admin123`

### ⚠️ Getting "ECONNREFUSED" Error?

**You need to setup MongoDB first!**

👉 See the **MongoDB Setup** section in [SETUP_GUIDE_COMPLETE.md](./SETUP_GUIDE_COMPLETE.md)

**Quick Diagnosis:**

```bash
npm run test:db
```

This will diagnose the issue and provide specific solutions.

**Quick Fix (Recommended)**: Use cloud MongoDB (no installation, free forever)

### 🎯 What's Already Configured

Based on your `.env.local`:

✅ Google OAuth credentials
✅ Google Contacts credentials

❌ Need to setup:

- **MongoDB Database** - See [Setup Guide](./SETUP_GUIDE_COMPLETE.md#mongodb-setup) (8 min)
- `NEXTAUTH_SECRET` (run: `npm run setup:secret`)
- Optional integrations (Google Contacts, WhatsApp) - See [Setup Guide](./SETUP_GUIDE_COMPLETE.md)

---

## Installation & Environment Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Cloud account

---

## Step-by-Step Environment Variables Setup

### 1️⃣ MongoDB Setup

#### Option A: Local MongoDB (Development)

1. Install MongoDB locally: https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Your connection string will be:
   ```env
   MONGODB_URI=mongodb://localhost:27017/installer_program
   ```

#### Option B: MongoDB Atlas (Production/Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Click **"Create a New Cluster"** (Free tier available)
4. Wait for cluster creation (2-5 minutes)
5. Click **"Connect"** → **"Connect your application"**
6. Copy the connection string, it looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/installer_program
   ```
7. Replace `<username>` and `<password>` with your database credentials
8. Add to `.env.local`:
   ```env
   MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster0.xxxxx.mongodb.net/installer_program
   ```

---

### 2️⃣ NextAuth Secret Generation

1. Open terminal and run:

   ```bash
   openssl rand -base64 32
   ```

2. Copy the output (e.g., `xyz123abc456...`)

3. Add to `.env.local`:

   ```env
   NEXTAUTH_SECRET=xyz123abc456...
   NEXTAUTH_URL=http://localhost:3000
   ```

   **For production**, change `NEXTAUTH_URL` to your domain:

   ```env
   NEXTAUTH_URL=https://yourdomain.com
   ```

---

### 3️⃣ Google OAuth Setup (Required for Login)

#### Step 1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click **"Select a project"** → **"New Project"**
3. Enter project name: `Installer Program`
4. Click **"Create"**

#### Step 2: Configure OAuth Consent Screen

1. In the left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Select **"External"** user type
3. Click **"Create"**
4. Fill in the form:
   - **App name**: `Installer Program`
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. Skip "Scopes" → Click **"Save and Continue"**
7. Add test users (your email) → Click **"Save and Continue"**
8. Click **"Back to Dashboard"**

#### Step 3: Create OAuth Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ Create Credentials"** → **"OAuth client ID"**
3. Select **"Web application"**
4. Fill in the form:
   - **Name**: `Installer Program Web Client`
   - **Authorized JavaScript origins**:
     ```
     http://localhost:3000
     ```
   - **Authorized redirect URIs**:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
5. Click **"Create"**
6. Copy **Client ID** and **Client Secret**

#### Step 4: Add to Environment Variables

```env
GOOGLE_CLIENT_ID=851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

**✅ You already have these values configured!**

---

### 4️⃣ Google Contacts API Setup (Optional - For Auto-sync)

This enables automatic syncing of installer data to Google Contacts.

#### Step 1: Enable Google People API

1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google People API"**
3. Click on it and click **"Enable"**

#### Step 2: Use Same OAuth Credentials

You can use the same Client ID and Secret from Google OAuth setup:

```env
GOOGLE_CONTACTS_CLIENT_ID=851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com
GOOGLE_CONTACTS_CLIENT_SECRET=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
```

**✅ You already have these values configured!**

#### Step 3: Generate Refresh Token

This is the only missing piece!

##### Option A: Using OAuth 2.0 Playground (Recommended)

1. **Update OAuth Client for Playground**

   - Go to Google Cloud Console → **"Credentials"**
   - Edit your OAuth client
   - Add to **Authorized redirect URIs**:
     ```
     https://developers.google.com/oauthplayground
     ```
   - Click **"Save"**

2. **Get Refresh Token**

   - Go to https://developers.google.com/oauthplayground
   - Click the **⚙️ Settings icon** (top right)
   - Check **"Use your own OAuth credentials"**
   - Enter your Client ID and Client Secret
   - Close settings

3. **Authorize API**

   - In left panel, find **"Google People API v1"**
   - Select:
     - `https://www.googleapis.com/auth/contacts`
   - Click **"Authorize APIs"**
   - Sign in with your Google account
   - Click **"Allow"**

4. **Exchange Authorization Code**
   - Click **"Exchange authorization code for tokens"**
   - Copy the **"Refresh token"** value
   - Add to `.env.local`:
     ```env
     GOOGLE_CONTACTS_REFRESH_TOKEN=1//0gABC...your-refresh-token-here
     ```

##### Option B: Skip Google Contacts (Temporary)

If you don't need Google Contacts sync right now:

```env
GOOGLE_CONTACTS_REFRESH_TOKEN=skip-for-now
```

The app will work fine, but installer data won't sync to Google Contacts.

---

### 5️⃣ Email Configuration (For Forgot Password Feature)

The forgot password feature sends a 6-digit PIN to users via email.

#### Option A: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Google account

   - Go to https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**

   - Go to https://myaccount.google.com/apppasswords
   - App name: `Installer Program Email`
   - Click **"Create"**
   - Copy the 16-character password (remove spaces)

3. **Add to `.env.local`:**
   ```env
   GMAIL_USER=your-gmail@gmail.com
   GMAIL_APP_PASSWORD=your-16-character-app-password
   ```

#### Option B: Generic SMTP Server

For production or other email providers:

```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-email-password
EMAIL_FROM=noreply@example.com
```

**Recommended Production Email Services:**

- **SendGrid** - Reliable and scalable
- **Amazon SES** - Cost-effective for high volume
- **Mailgun** - Developer-friendly
- **Postmark** - Great deliverability

#### How It Works

1. User clicks "Forgot password?" on sign-in page
2. User enters their email address
3. System generates a 6-digit PIN (expires in 10 minutes)
4. PIN is sent to user's email with a beautiful HTML template
5. User enters PIN and creates new password
6. System verifies PIN and updates password

**Security Features:**

- ✅ PINs expire after 10 minutes
- ✅ PINs are single-use (deleted after successful reset)
- ✅ System doesn't reveal if email exists (security best practice)
- ✅ Automatic cleanup of expired PINs via MongoDB TTL index
- ✅ Beautiful, responsive email template with security tips

#### Email Template Preview

The system sends a professional, mobile-responsive email containing:

- Professional header with gradient background
- Large, easy-to-read 6-digit PIN in monospace font
- **PIN expiration notice** (10 minutes)
- **Security tips** and warnings
- Responsive design for all devices

#### Troubleshooting Email Issues

**Email not sending:**

- Verify EMAIL*\* or GMAIL*\* environment variables are set correctly
- For Gmail, ensure you're using an **App Password**, not regular password
- Check if your email provider allows SMTP access
- Review server logs in terminal for detailed error messages

**PIN not received:**

- Check spam/junk folder
- Verify email address is correct
- Ensure MongoDB is connected (PINs are stored in database)
- Check server console for sending errors

**PIN expired:**

- PINs expire after 10 minutes for security
- Request a new PIN if expired
- Old PINs are automatically cleaned up

---

### 6️⃣ Final `.env.local` Configuration

Your complete file should look like this:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/installer_program

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-using-openssl-rand-base64-32>

# Google OAuth (Already Configured ✅)
GOOGLE_CLIENT_ID=851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Google Contacts API (Optional)
GOOGLE_CONTACTS_CLIENT_ID=851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com
GOOGLE_CONTACTS_CLIENT_SECRET=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
GOOGLE_CONTACTS_REFRESH_TOKEN=<get-from-oauth-playground>

# Email Configuration (For Forgot Password)
# Option 1: Gmail (Recommended for Development)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-16-character-app-password

# Option 2: Generic SMTP (For Production)
# EMAIL_HOST=smtp.example.com
# EMAIL_PORT=587
# EMAIL_SECURE=false
# EMAIL_USER=your-email@example.com
# EMAIL_PASSWORD=your-email-password
# EMAIL_FROM=noreply@example.com
```

---

### 7️⃣ Install Dependencies & Run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open http://localhost:3000

---

### 8️⃣ Create First Admin User

Since there's no user initially, create first admin via MongoDB:

#### Option A: Using MongoDB Compass (GUI)

1. Install MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Connect to `mongodb://localhost:27017`
3. Create database: `installer_program`
4. Create collection: `teammembers`
5. Insert document:

```json
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "$2a$10$YourHashedPasswordHere",
  "role": "ADMIN",
  "createdAt": { "$date": "2024-01-01T00:00:00.000Z" },
  "updatedAt": { "$date": "2024-01-01T00:00:00.000Z" }
}
```

#### Option B: Using Node.js Script

Create `scripts/createAdmin.js`:

```javascript
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

async function createAdmin() {
  await mongoose.connect("mongodb://localhost:27017/installer_program");

  const TeamMember = mongoose.model(
    "TeamMember",
    new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      role: String,
    })
  );

  const hashedPassword = await bcrypt.hash("admin123", 10);

  await TeamMember.create({
    name: "Admin User",
    email: "admin@example.com",
    password: hashedPassword,
    role: "ADMIN",
  });

  console.log("✅ Admin user created!");
  console.log("Email: admin@example.com");
  console.log("Password: admin123");
  process.exit();
}

createAdmin().catch(console.error);
```

Run:

```bash
node scripts/createAdmin.js
```

---

## What You Need to Do Now

Based on your current `.env.local`:

✅ **Already Configured:**

- MongoDB URI (just make sure MongoDB is running)
- Google OAuth Client ID & Secret
- Google Contacts Client ID & Secret

❌ **Need to Configure:**

1. **NEXTAUTH_SECRET** - Generate it:

   ```bash
   openssl rand -base64 32
   ```

   Copy output and replace `your-secret-key-here-change-in-production`

2. **GOOGLE_CONTACTS_REFRESH_TOKEN** - Follow Step 4 above:

   - Go to https://developers.google.com/oauthplayground
   - Enable Google People API
   - Use your existing Client ID/Secret
   - Get refresh token
   - Replace `your-google-contacts-refresh-token`

3. **Start MongoDB** (if using local)

4. **Create first admin user** (see Step 7 above)

Then run:

```bash
npm run dev
```

---

## 🔍 Database Debugging & Testing

The application includes comprehensive database connection debugging tools.

### Test Database Connection

```bash
npm run test:db
```

**What it does:**

- ✅ Tests MongoDB connection
- ✅ Diagnoses connection errors with specific solutions
- ✅ Measures connection speed
- ✅ Lists databases and collections
- ✅ Tests read/write operations
- ✅ Color-coded output (green=success, red=error)

**Example output on error:**

```
❌ CONNECTION FAILED - DIAGNOSIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 ROOT CAUSE:
   MongoDB is not running on your local machine

📋 SOLUTION 1 (Recommended - No Installation):
   Use MongoDB Atlas (Cloud Database):
   1. Sign up: https://www.mongodb.com/cloud/atlas/register
   2. Create FREE M0 cluster (512MB forever free)
   ...
```

### Development Server Logging

When you run `npm run dev`, you'll see:

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

### Health Check API

**Endpoint:** `GET /api/health/db` (Admin only)

Returns detailed database connection status including:

- Connection state
- Database info
- Collections list
- Response time

**See [DB_DEBUG_FEATURES.md](./DB_DEBUG_FEATURES.md) for complete documentation.**

---

## API Endpoints

### Authentication

- `POST /api/auth/forgot-password` - Request password reset PIN
  - Body: `{ email: string }`
  - Sends 6-digit PIN to email
  - PIN expires in 10 minutes
- `POST /api/auth/reset-password` - Verify PIN and reset password
  - Body: `{ email: string, pin: string, newPassword: string }`
  - Validates PIN and updates password

### Team Management

- `GET /api/team` - List team members
- `POST /api/team/register` - Register new member
- `GET /api/team/:id` - Get team member
- `PUT /api/team/:id` - Update team member
- `DELETE /api/team/:id` - Delete team member

### Installer Management

- `GET /api/installers` - List installers (with filters)
- `POST /api/installers` - Register installer
- `GET /api/installers/:id` - Get installer with stats
- `PUT /api/installers/:id` - Update installer
- `DELETE /api/installers/:id` - Delete installer

### Reward Management

- `GET /api/rewards` - List rewards (with filters)
- `POST /api/rewards` - Register reward
- `GET /api/rewards/:id` - Get reward
- `PUT /api/rewards/:id` - Update reward
- `DELETE /api/rewards/:id` - Delete reward

### Reports

- `GET /api/reports/installers` - Installer report (JSON/Excel)
- `GET /api/reports/rewards` - Reward report (JSON/Excel)
- `GET /api/reports/payment-format` - Payment format (Excel)

## Role-Based Permissions

### ADMIN

- All permissions
- Manage team members (create, update, delete)
- Register ADMIN, MANAGER, or USER
- Delete installers and rewards

### MANAGER

- Manage team members (create, update)
- Register MANAGER or USER only
- Delete installers and rewards

### USER

- View installers and rewards
- Register installers and rewards
- Update own profile

## Development

```bash
npm run dev      # Development server
npm run build    # Production build
npm start        # Production server
npm run lint     # Lint code
```

## License

Proprietary - All rights reserved
