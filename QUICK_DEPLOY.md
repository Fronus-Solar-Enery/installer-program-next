# ⚡ Quick Deploy Guide (5 Minutes)

Deploy your Installer Program to production in 5 minutes with Vercel.

---

## 🎯 What You'll Need

1. **GitHub account** (free)
2. **Vercel account** (free)
3. **MongoDB Atlas account** (free)
4. **Google Cloud account** (free) - for OAuth

---

## 🚀 Step-by-Step Deployment

### 1️⃣ Setup MongoDB (2 minutes)

1. **Go to** [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. **Sign up** (free)
3. **Create cluster**:
   - Tier: M0 Sandbox (FREE)
   - Region: Closest to you
   - Name: `installer-program`
4. **Create database user**:
   - Security → Database Access → Add New User
   - Username: `admin`
   - Password: Auto-generate (copy it!)
   - Role: Atlas admin
5. **Whitelist IPs**:
   - Security → Network Access → Add IP
   - Allow Access from Anywhere: `0.0.0.0/0`
6. **Get connection string**:
   - Database → Connect → Connect your application
   - Copy connection string
   - Replace `<password>` with your password
   - Add `/installer_program` after `.net/`:
   ```
   mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority
   ```
   - **Save this!** ✅

---

### 2️⃣ Setup Google OAuth (2 minutes)

1. **Go to** [console.cloud.google.com](https://console.cloud.google.com)
2. **Create project**: "Installer Program"
3. **Enable APIs**:
   - APIs & Services → Enable APIs
   - Search "Google+ API" → Enable
4. **Create credentials**:
   - APIs & Services → Credentials → Create Credentials → OAuth Client ID
   - Configure consent screen:
     - User Type: External
     - App name: "Installer Program"
     - Your email
     - Save
   - Create OAuth Client ID:
     - Application type: Web application
     - Name: "Installer Program Web"
     - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google` (for now)
     - Create
5. **Copy credentials**:
   - Client ID: `xxxxx.apps.googleusercontent.com` ✅
   - Client Secret: `xxxxx` ✅

---

### 3️⃣ Push to GitHub (1 minute)

```bash
# Navigate to project
cd "d:/Coding Projects/ip25-api-oct/installer-program"

# Initialize git (if not done)
git init
git add .
git commit -m "Initial deployment"

# Create repo on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/installer-program.git
git branch -M main
git push -u origin main
```

---

### 4️⃣ Deploy to Vercel (1 minute)

1. **Go to** [vercel.com](https://vercel.com)
2. **Sign in** with GitHub
3. **New Project** → Import `installer-program` repository
4. **Add Environment Variables**:

   Click "Environment Variables" and add:

   ```bash
   # Copy these exactly (update YOUR_* values)
   MONGODB_URI=mongodb+srv://admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=run-this-command-openssl-rand-base64-32
   GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxxxx
   GOOGLE_CONTACTS_REFRESH_TOKEN=skip
   ```

   **Generate NEXTAUTH_SECRET**:
   ```bash
   # Run this locally
   openssl rand -base64 32
   # Or
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```

5. **Deploy!**
   - Click "Deploy"
   - Wait ~2 minutes
   - You'll get: `https://your-app-xxxxx.vercel.app` ✅

---

### 5️⃣ Update Google OAuth Redirect (30 seconds)

1. **Copy your Vercel URL**: `https://your-app-xxxxx.vercel.app`
2. **Go back to Google Cloud Console** → Credentials
3. **Edit OAuth Client ID**
4. **Update Authorized redirect URIs**:
   - Remove localhost one
   - Add: `https://your-app-xxxxx.vercel.app/api/auth/callback/google`
5. **Save**
6. **Go back to Vercel** and redeploy:
   - Vercel Dashboard → Deployments → Click "..." on latest → "Redeploy"

---

### 6️⃣ Create Admin User (1 minute)

You need to create the first admin user manually.

**Option A: Via MongoDB Atlas UI (Easiest)**

1. Go to MongoDB Atlas → Browse Collections
2. Database: `installer_program`
3. Create Collection: `teammembers`
4. Insert Document:

```json
{
  "email": "admin@example.com",
  "name": "Admin User",
  "password": "$2a$10$8ZqFN0x0kR9KqZ3z9WxQe.lYN9xqHD/vZJG9K6d7YKF8eHj0YN3bS",
  "role": "ADMIN",
  "createdAt": { "$date": "2025-01-27T00:00:00.000Z" },
  "updatedAt": { "$date": "2025-01-27T00:00:00.000Z" }
}
```

**Default password**: `admin123` (change after first login!)

**Option B: Generate your own password**

```bash
# Generate password hash locally
node -e "console.log(require('bcryptjs').hashSync('YOUR_PASSWORD', 10))"
```

Use the output as the `password` field in the JSON above.

---

## ✅ Test Your Deployment

1. **Visit**: `https://your-app-xxxxx.vercel.app`
2. **Login**:
   - Email: `admin@example.com`
   - Password: `admin123` (or your custom password)
3. **Test**:
   - ✅ Dashboard loads
   - ✅ Can create team member
   - ✅ Can register installer
   - ✅ Google Sign-In works

---

## 🎉 Done! Your App is Live!

**Your app URL**: `https://your-app-xxxxx.vercel.app`

Share this with your team!

---

## 📌 Important Next Steps

1. **Change admin password** (Settings → Profile)
2. **Create team members** for your team
3. **Test all features**
4. **Optional**: Set up custom domain (see [HOSTING_GUIDE.md](./HOSTING_GUIDE.md))

---

## 🐛 Quick Troubleshooting

### Can't connect to database?
- Check MONGODB_URI has correct password
- Check IP whitelist in MongoDB Atlas (should be `0.0.0.0/0`)
- URL encode special characters in password

### Google Sign-In not working?
- Check redirect URI in Google Console matches exactly
- Wait 5 minutes after updating Google credentials
- Check NEXTAUTH_URL matches your Vercel URL

### Build failed?
- Check TypeScript errors locally: `npm run build`
- Fix errors and push again

### App loads but login doesn't work?
- Check NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL is correct
- Check admin user was created in database

---

## 📚 Full Documentation

For detailed setup, troubleshooting, and advanced configuration:

- **[HOSTING_GUIDE.md](./HOSTING_GUIDE.md)** - Complete hosting guide
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Full checklist
- **[README.md](./README.md)** - Application overview

---

## 🆘 Need Help?

1. Check [Troubleshooting section](#-quick-troubleshooting) above
2. Review [HOSTING_GUIDE.md](./HOSTING_GUIDE.md)
3. Check Vercel deployment logs
4. Check MongoDB Atlas logs

---

**Happy Deploying! 🚀**

*Total time: ~5 minutes*
*Cost: $0 (all free tiers)*
