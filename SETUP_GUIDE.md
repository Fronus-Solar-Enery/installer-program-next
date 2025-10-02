# 🚀 Quick Setup Guide - Installer Program

This guide will help you get the application running in **5 simple steps**.

---

## ✅ Current Status

Based on your `.env.local` file:

| Variable | Status |
|----------|--------|
| `MONGODB_URI` | ✅ Configured (Local) |
| `NEXTAUTH_URL` | ✅ Configured |
| `NEXTAUTH_SECRET` | ❌ **NEEDS UPDATE** |
| `GOOGLE_CLIENT_ID` | ✅ Configured |
| `GOOGLE_CLIENT_SECRET` | ✅ Configured |
| `GOOGLE_CONTACTS_CLIENT_ID` | ✅ Configured |
| `GOOGLE_CONTACTS_CLIENT_SECRET` | ✅ Configured |
| `GOOGLE_CONTACTS_REFRESH_TOKEN` | ❌ **NEEDS UPDATE** (Optional) |

---

## 📋 What You Need to Do

### Step 1: Generate NEXTAUTH_SECRET

Run this command:
```bash
node scripts/generateSecret.js
```

Copy the output and update in `.env.local`:
```env
NEXTAUTH_SECRET=<paste-the-generated-secret-here>
```

**OR** use OpenSSL (if available):
```bash
openssl rand -base64 32
```

---

### Step 2: Get Google Contacts Refresh Token (Optional)

**If you want Google Contacts sync**, follow these steps:

#### A. Add OAuth Playground to Authorized Redirect URIs

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth client: `Installer Program Web Client`
3. Under **"Authorized redirect URIs"**, add:
   ```
   https://developers.google.com/oauthplayground
   ```
4. Click **"Save"**

#### B. Generate Refresh Token

1. Go to: https://developers.google.com/oauthplayground

2. Click **⚙️ Settings** (top right)

3. Check ☑️ **"Use your own OAuth credentials"**

4. Enter:
   - **OAuth Client ID**: `851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com`
   - **OAuth Client Secret**: `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`

5. Close settings

6. In **Step 1** (left panel):
   - Find **"Google People API v1"** or search for it
   - Select: `https://www.googleapis.com/auth/contacts`
   - Click **"Authorize APIs"**

7. Sign in with your Google account

8. Click **"Allow"**

9. In **Step 2**:
   - Click **"Exchange authorization code for tokens"**

10. Copy the **"Refresh token"** value

11. Update in `.env.local`:
    ```env
    GOOGLE_CONTACTS_REFRESH_TOKEN=1//0gABC...your-refresh-token-here
    ```

#### C. Skip for Now (Alternative)

If you don't need Google Contacts sync right now:
```env
GOOGLE_CONTACTS_REFRESH_TOKEN=skip
```

The app will work fine without it!

---

### Step 3: Enable Google People API

1. Go to: https://console.cloud.google.com/apis/library

2. Search for **"Google People API"**

3. Click on it

4. Click **"Enable"**

---

### Step 4: Start MongoDB

#### If using Local MongoDB:
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### If using MongoDB Atlas:
Your connection string should already be in `.env.local`. No action needed!

---

### Step 5: Create Admin User

Run this script to create your first admin user:

```bash
node scripts/createAdmin.js
```

This will create:
- **Email**: `admin@example.com`
- **Password**: `admin123`

⚠️ **Important**: Change this password after first login!

---

## 🎉 You're Ready!

Start the development server:

```bash
npm run dev
```

Open: http://localhost:3000

Login with:
- **Email**: `admin@example.com`
- **Password**: `admin123`

---

## 🔧 Troubleshooting

### MongoDB Connection Error

**Error**: `MongoServerError: connect ECONNREFUSED`

**Solution**:
```bash
# Start MongoDB service
# Windows:
net start MongoDB

# Mac:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

---

### Google OAuth Error: redirect_uri_mismatch

**Error**: `The redirect URI in the request: http://localhost:3000/api/auth/callback/google does not match`

**Solution**:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Edit your OAuth client
3. Add to **"Authorized redirect URIs"**:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Save

---

### NextAuth Secret Not Set

**Error**: `NEXTAUTH_SECRET` not found

**Solution**:
Run:
```bash
node scripts/generateSecret.js
```
Copy the output to `.env.local`

---

### Admin User Already Exists

**Error**: Admin user already exists

**Solution**:
If you forgot the password, delete the user from MongoDB and run the script again:

```javascript
// In MongoDB Compass or Shell
db.teammembers.deleteOne({ email: 'admin@example.com' })
```

Then run:
```bash
node scripts/createAdmin.js
```

---

## 📚 Next Steps After Setup

Once logged in:

1. **Change Admin Password**
   - Go to Profile → Change Password
   - Update from `admin123` to a secure password

2. **Create Team Members**
   - Go to Team → Register New Member
   - Add MANAGER or USER accounts

3. **Register Installers**
   - Go to Installers → Register New Installer
   - Fill in all required details

4. **Register Rewards**
   - Go to Rewards → Register New Reward
   - Select installer by code
   - Referrers automatically get Rs. 500

5. **Generate Reports**
   - Go to Reports
   - Export to Excel for payment processing

---

## 🆘 Need Help?

Check the main [README.md](./README.md) for:
- Complete API documentation
- Database schema details
- Advanced configuration
- Deployment guides

---

**Built with ❤️ using Next.js, TypeScript, and MongoDB**
