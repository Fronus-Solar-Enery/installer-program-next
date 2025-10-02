# 🎯 Get Started in 3 Minutes

## What You Have Now

✅ **Already Configured:**
- Google OAuth Client ID & Secret
- Google Contacts Client ID & Secret

❌ **Need to Setup:**
- **MongoDB Database** (8 minutes - see below)
- **NextAuth Secret** (30 seconds)
- **Google Contacts Refresh Token** (optional, 90 seconds)

---

## ⚠️ Important: MongoDB Setup Required

You're getting the error because MongoDB is not set up. Choose one option:

### 🌐 Option A: MongoDB Atlas (Recommended - 8 minutes)
**No installation, works immediately**

📖 **[Follow Complete MongoDB Atlas Setup Guide →](./MONGODB_ATLAS_SETUP.md)**

Quick summary:
1. Sign up at https://www.mongodb.com/cloud/atlas/register
2. Create free M0 cluster (512MB free forever)
3. Get connection string
4. Update `.env.local`

### 💻 Option B: Local MongoDB (If you prefer local)
Install MongoDB locally:
- Windows: https://www.mongodb.com/try/download/community
- Mac: `brew install mongodb-community`
- Linux: `sudo apt-get install mongodb-org`

Then start service:
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

---

## ⚡ After MongoDB is Ready

### Step 1: Generate Secret (30 seconds)

```bash
npm run setup:secret
```

Copy the output and paste in `.env.local`:
```env
NEXTAUTH_SECRET=<paste-here>
```

### Step 2: Create Admin User (30 seconds)

```bash
npm run setup:admin
```

You'll get:
- Email: `admin@example.com`
- Password: `admin123`

### Step 3: Start Application (10 seconds)

```bash
npm run dev
```

Open http://localhost:3000

**Done! 🎉**

---

## Optional: Google Contacts Sync (90 seconds)

If you want installers to auto-sync to Google Contacts:

### Quick Steps:

1. **Enable API** (15 seconds)
   - https://console.cloud.google.com/apis/library
   - Search "Google People API" → Enable

2. **Add Redirect URI** (20 seconds)
   - https://console.cloud.google.com/apis/credentials
   - Edit your OAuth client
   - Add: `https://developers.google.com/oauthplayground`
   - Save

3. **Get Token** (55 seconds)
   - Go to: https://developers.google.com/oauthplayground
   - Click ⚙️ → Check "Use your own OAuth credentials"
   - Client ID: `851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com`
   - Client Secret: `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`
   - Close settings
   - Select: `Google People API v1` → `https://www.googleapis.com/auth/contacts`
   - Authorize → Allow
   - Exchange code for tokens
   - Copy "Refresh token"
   - Paste in `.env.local`:
     ```env
     GOOGLE_CONTACTS_REFRESH_TOKEN=1//0g...your-token
     ```

**OR** skip it:
```env
GOOGLE_CONTACTS_REFRESH_TOKEN=skip
```

---

## 📱 What You Can Do After Login

1. **Dashboard** - View statistics
2. **Team** - Add managers and users
3. **Installers** - Register installers with referral codes
4. **Rewards** - Register rewards (referrers get Rs. 500 automatically)
5. **Reports** - Export to Excel for payments

---

## 🆘 Troubleshooting

### Error: "connect ECONNREFUSED"

**You're seeing this error!**

This means MongoDB is not set up. Follow:
- **📖 [MongoDB Atlas Setup Guide](./MONGODB_ATLAS_SETUP.md)** (Recommended)
- Or install MongoDB locally (see Option B above)

### MongoDB not running (Local)?

```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Can't login?

Run again:
```bash
npm run setup:admin
```

### OAuth error?

Add this to Google Cloud Console → Credentials:
```
http://localhost:3000/api/auth/callback/google
```

---

## 📚 Need More Details?

- **Quick Checklist**: [CHECKLIST.md](./CHECKLIST.md)
- **Detailed Setup**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Full Documentation**: [README.md](./README.md)

---

## 🚀 You're Ready!

```bash
npm run dev
```

Login at http://localhost:3000 with:
- **Email**: admin@example.com
- **Password**: admin123

**Important**: Change password after first login!

---

**Questions?** Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for troubleshooting
