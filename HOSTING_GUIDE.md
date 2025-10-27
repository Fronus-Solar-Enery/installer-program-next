# 🚀 Hosting Guide - Installer Program

Complete guide to deploy your Next.js Installer Program to production.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start (Vercel - Recommended)](#quick-start-vercel)
4. [Alternative Platforms](#alternative-platforms)
5. [Environment Variables Setup](#environment-variables-setup)
6. [Database Setup](#database-setup)
7. [Post-Deployment Steps](#post-deployment-steps)
8. [Domain Configuration](#domain-configuration)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This application is a **Next.js 15** app with:
- **Framework**: Next.js 15 with App Router
- **Database**: MongoDB (via Mongoose)
- **Authentication**: NextAuth v5 (Credentials + Google OAuth)
- **Features**: Team management, installer tracking, rewards system, bulk operations
- **Runtime**: Node.js 20+

**Recommended Hosting**: Vercel (Free tier available, built for Next.js)

---

## ✅ Prerequisites

Before deploying, ensure you have:

- [ ] **GitHub Account** (to connect with hosting platform)
- [ ] **MongoDB Database** (Atlas free tier recommended)
- [ ] **Google Cloud Project** (for OAuth - optional but recommended)
- [ ] **Domain Name** (optional, but recommended for production)

---

## 🚀 Quick Start (Vercel - Recommended)

Vercel is the easiest and best option for Next.js apps. **Free tier includes**:
- Unlimited deployments
- Automatic HTTPS
- Built-in CI/CD
- Edge network (fast globally)

### Step 1: Push Code to GitHub

```bash
# Navigate to your project
cd "d:/Coding Projects/ip25-api-oct/installer-program"

# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit - Installer Program"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/installer-program.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub

2. **Click "Add New Project"**

3. **Import your GitHub repository**
   - Select `installer-program` repository
   - Click "Import"

4. **Configure Project**
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default)
   - **Node.js Version**: 20.x (recommended)

5. **Add Environment Variables** (see [Environment Variables Setup](#environment-variables-setup))
   - Click "Environment Variables"
   - Add all required variables (listed below)

6. **Click "Deploy"**
   - First deployment takes ~2-3 minutes
   - You'll get a URL: `your-app.vercel.app`

### Step 3: Configure Production Environment

After deployment, you need to:

1. **Create Admin User** (using Vercel CLI or manual database entry)
2. **Test Authentication**
3. **Configure Google OAuth** with production URL

---

## 🌐 Alternative Platforms

### Option 2: Railway.app

**Pros**: Easy database integration, generous free tier
**Cons**: Slower than Vercel for static content

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Link to Railway project
railway link

# Add environment variables via Railway dashboard

# Deploy
railway up
```

**Cost**: Free tier includes $5/month credit

### Option 3: Render.com

**Pros**: Free tier, PostgreSQL support (if you migrate)
**Cons**: Slower cold starts

1. Go to [render.com](https://render.com)
2. Connect GitHub repository
3. Select "Web Service"
4. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variables
6. Deploy

**Cost**: Free tier available (slower performance)

### Option 4: Self-Hosted (VPS)

For advanced users who want full control.

**Requirements**:
- VPS with Node.js 20+
- PM2 or systemd for process management
- Nginx for reverse proxy
- SSL certificate (Let's Encrypt)

**Not recommended for beginners** - use Vercel instead.

---

## 🔑 Environment Variables Setup

### Required Variables

Add these to your hosting platform's environment variables:

```bash
# ============================================
# DATABASE
# ============================================
MONGODB_URI=mongodb+srv://username:password@cluster.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority

# ============================================
# AUTHENTICATION
# ============================================
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here

# ============================================
# GOOGLE OAUTH (Required for Google Sign-In)
# ============================================
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# ============================================
# GOOGLE CONTACTS (Optional)
# ============================================
GOOGLE_CONTACTS_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CONTACTS_CLIENT_SECRET=your-client-secret
GOOGLE_CONTACTS_REFRESH_TOKEN=your-refresh-token-or-skip
```

### How to Generate Each Variable

#### 1. MONGODB_URI

See [Database Setup](#database-setup) section below.

#### 2. NEXTAUTH_SECRET

Generate a secure random secret:

```bash
# Option 1: Using OpenSSL (Mac/Linux)
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Using the project script (locally)
npm run setup:secret
```

Copy the output and use it as `NEXTAUTH_SECRET`.

#### 3. NEXTAUTH_URL

Your production URL:
- Vercel: `https://your-app.vercel.app`
- Custom domain: `https://yourdomain.com`

⚠️ **Important**: Must be HTTPS in production

#### 4. Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable Google+ API
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure OAuth consent screen:
   - User Type: External
   - App name: "Installer Program"
   - Authorized domains: Add your domain
6. Create OAuth Client ID:
   - Application type: Web application
   - Authorized JavaScript origins: `https://your-app.vercel.app`
   - Authorized redirect URIs: `https://your-app.vercel.app/api/auth/callback/google`
7. Copy Client ID and Client Secret

#### 5. Google Contacts (Optional)

If you want Google Contacts sync:

1. Use same credentials as above, OR create new ones
2. Enable People API in Google Cloud Console
3. Get refresh token:
   - Go to [OAuth Playground](https://developers.google.com/oauthplayground)
   - Click settings (top right) → Use your own OAuth credentials
   - Paste your Client ID and Secret
   - In Step 1: Select "People API v1" → `https://www.googleapis.com/auth/contacts`
   - Authorize APIs
   - In Step 2: Exchange authorization code for tokens
   - Copy the "Refresh token"

Or set to `skip` to disable this feature.

---

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)

MongoDB Atlas is free, cloud-hosted, and requires no installation.

#### Step 1: Create Atlas Account

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up (free forever)
3. Create a new cluster:
   - Provider: AWS / GCP / Azure (any)
   - Region: Choose closest to you
   - Cluster Tier: **M0 Sandbox (FREE)**
   - Cluster Name: `installer-program`

#### Step 2: Create Database User

1. Go to **Database Access** (left sidebar)
2. Click "Add New Database User"
3. Authentication Method: Password
4. Username: `installer_admin` (or any name)
5. Password: Generate secure password (save it!)
6. Database User Privileges: **Read and write to any database**
7. Click "Add User"

#### Step 3: Whitelist IP Addresses

1. Go to **Network Access** (left sidebar)
2. Click "Add IP Address"
3. For development/testing:
   - Click "Allow Access from Anywhere" → `0.0.0.0/0`
   - ⚠️ **Note**: This is fine for development, but for production you should restrict to specific IPs
4. For production (recommended):
   - Add your server's IP address
   - For Vercel: Add all Vercel IP ranges (see [Vercel docs](https://vercel.com/docs/concepts/deployments/build-step#ip-addresses))
5. Click "Confirm"

#### Step 4: Get Connection String

1. Click "Database" (left sidebar)
2. Click "Connect" button on your cluster
3. Select "Connect your application"
4. Driver: Node.js, Version: 5.5 or later
5. Copy connection string:
   ```
   mongodb+srv://installer_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. **Replace** `<password>` with your actual password
7. **Add database name** after `.net/`:
   ```
   mongodb+srv://installer_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority
   ```

⚠️ **Important**:
- URL encode special characters in password:
  - `@` → `%40`
  - `#` → `%23`
  - `:` → `%3A`
  - `/` → `%2F`

#### Step 5: Test Connection

Add to your `.env.local` locally and test:

```bash
npm run test:db
```

You should see: ✅ MongoDB Connected Successfully!

---

## 🔧 Post-Deployment Steps

### 1. Create Admin User

After deploying, you need to create the first admin user.

#### Option A: Using Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link to your project
vercel link

# Create admin via script (locally, connected to production DB)
# First, update your local .env.local with production MONGODB_URI
npm run setup:admin

# Or manually create via MongoDB Atlas UI (see Option B)
```

#### Option B: Manual Database Entry (MongoDB Atlas UI)

1. Go to MongoDB Atlas → Browse Collections
2. Select database: `installer_program`
3. Create collection: `teammembers`
4. Insert document:

```json
{
  "email": "admin@example.com",
  "name": "Admin User",
  "password": "$2a$10$... (bcrypt hash - see below)",
  "role": "ADMIN",
  "createdAt": { "$date": "2025-01-27T00:00:00.000Z" },
  "updatedAt": { "$date": "2025-01-27T00:00:00.000Z" }
}
```

To generate password hash:
```bash
# Using Node.js
node -e "console.log(require('bcryptjs').hashSync('your-password', 10))"
```

### 2. Test Authentication

1. Visit your deployed URL
2. Try logging in with admin credentials
3. Verify Google OAuth works (if configured)

### 3. Configure Google OAuth Redirect

⚠️ **Critical**: Update Google Cloud Console with production URL

1. Go to Google Cloud Console → Credentials
2. Edit your OAuth Client ID
3. Update **Authorized redirect URIs**:
   - Add: `https://your-app.vercel.app/api/auth/callback/google`
4. Save changes
5. Wait 5 minutes for changes to propagate
6. Test Google Sign-In

### 4. Update NEXTAUTH_URL

If you change domains or get a custom domain, update:

1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit `NEXTAUTH_URL` to new URL
3. Redeploy (Vercel auto-redeploys on env change)

---

## 🌍 Domain Configuration

### Using Custom Domain (Optional)

#### On Vercel:

1. Go to Project Settings → Domains
2. Add your domain: `yourdomain.com`
3. Vercel will provide DNS records:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21

   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```
4. Add these to your domain registrar (GoDaddy, Namecheap, etc.)
5. Wait for DNS propagation (5 minutes - 24 hours)
6. Vercel auto-provisions SSL certificate
7. Update environment variables:
   ```bash
   NEXTAUTH_URL=https://yourdomain.com
   ```
8. Update Google OAuth redirect URIs with new domain

---

## 🐛 Troubleshooting

### Deployment Fails

#### Error: "Module not found"

**Cause**: Missing dependencies

**Solution**:
```bash
# Locally, ensure all deps are in package.json
npm install

# Check package.json has all imports
# Redeploy
```

#### Error: "Build failed"

**Cause**: TypeScript errors

**Solution**:
```bash
# Run build locally first
npm run build

# Fix all TypeScript errors
# Push and redeploy
```

### Database Connection Issues

#### Error: "MONGODB_URI is not defined"

**Cause**: Environment variable not set

**Solution**:
- Vercel: Add to Environment Variables in dashboard
- Railway: Add in Variables tab
- Check spelling exactly: `MONGODB_URI`

#### Error: "Authentication failed"

**Cause**: Wrong MongoDB credentials

**Solution**:
1. Verify username/password in Atlas
2. URL encode special characters in password
3. Test connection string locally: `npm run test:db`

#### Error: "IP not whitelisted"

**Cause**: Vercel IPs not whitelisted in MongoDB Atlas

**Solution**:
1. MongoDB Atlas → Network Access
2. Allow `0.0.0.0/0` (for development)
3. Or add Vercel IP ranges (production)

### Authentication Issues

#### Error: "NEXTAUTH_SECRET is not defined"

**Cause**: Missing secret

**Solution**:
```bash
# Generate secret
openssl rand -base64 32

# Add to environment variables
```

#### Google OAuth Not Working

**Cause**: Redirect URI mismatch

**Solution**:
1. Google Cloud Console → Credentials
2. Check **Authorized redirect URIs** includes:
   ```
   https://your-actual-deployed-url.vercel.app/api/auth/callback/google
   ```
3. Wait 5 minutes
4. Clear browser cache
5. Try again

#### Error: "Callback URL mismatch"

**Cause**: NEXTAUTH_URL doesn't match actual URL

**Solution**:
```bash
# Update NEXTAUTH_URL to match deployment URL
NEXTAUTH_URL=https://your-app.vercel.app
```

### Performance Issues

#### Slow API responses

**Cause**: Cold starts or database far from server

**Solution**:
1. Choose MongoDB region close to hosting region
2. Use connection pooling (already configured)
3. Consider upgrading hosting plan

#### Images not loading

**Cause**: Need to configure domains in next.config.js

**Solution**:
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-domain.com', 'lh3.googleusercontent.com'],
  },
}
```

---

## 📊 Monitoring & Maintenance

### Recommended Monitoring

1. **Vercel Analytics** (built-in)
   - Page views
   - Performance metrics
   - Error tracking

2. **MongoDB Atlas Monitoring**
   - Connection stats
   - Query performance
   - Storage usage

3. **Error Tracking** (optional)
   - Sentry integration
   - LogRocket for session replay

### Regular Maintenance

- [ ] **Weekly**: Check error logs
- [ ] **Monthly**: Review database indexes
- [ ] **Quarterly**: Update dependencies
- [ ] **As needed**: Scale database if approaching limits

---

## 📚 Additional Resources

### Official Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

### Useful Links
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [Next.js Discord](https://discord.gg/nextjs)
- [MongoDB Community](https://community.mongodb.com/)

---

## 🎉 Success Checklist

After deployment, verify:

- [ ] App loads at production URL
- [ ] Database connection works
- [ ] Login with credentials works
- [ ] Google OAuth login works (if configured)
- [ ] Can create new team members
- [ ] Can register installers
- [ ] Can create rewards
- [ ] Bulk upload works
- [ ] All pages load correctly
- [ ] SSL certificate active (HTTPS)
- [ ] Environment variables secured
- [ ] Admin user created
- [ ] Domain configured (if using custom domain)

---

## 🆘 Need Help?

If you encounter issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Review Vercel deployment logs
3. Check MongoDB Atlas logs
4. Test locally with production environment variables
5. Review error messages carefully

---

## 📝 Notes

- **First deployment** may take 2-3 minutes
- **Subsequent deployments** are faster (~1 minute)
- **Environment variable changes** trigger automatic redeployment
- **Database changes** require manual migration/update
- **Always test locally** before deploying major changes

---

**That's it! Your Installer Program should now be live and accessible to the world! 🚀**
