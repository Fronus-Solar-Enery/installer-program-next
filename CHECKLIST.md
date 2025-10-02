# ✅ Setup Checklist

Complete these steps to get your Installer Program running:

## Pre-Setup
- [ ] Node.js 18+ installed
- [ ] Code editor (VS Code recommended)

## Environment Variables

### 1. MongoDB Database (Choose ONE option)

**⚠️ If you see "ECONNREFUSED" error, MongoDB is not set up!**

#### ✅ Option A: MongoDB Atlas (Recommended - 8 min)
**No installation required!**

- [ ] Follow: **[MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)**
- [ ] Created MongoDB Atlas account
- [ ] Created free M0 cluster (512MB forever free)
- [ ] Created database user (saved password!)
- [ ] Added IP to whitelist
- [ ] Copied connection string
- [ ] Updated `.env.local` with Atlas URI

**Example Atlas URI:**
```env
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority
```

#### OR Option B: Local MongoDB
- [ ] MongoDB installed locally
- [ ] MongoDB service started
- [ ] `.env.local` has local URI

**Example Local URI:**
```env
MONGODB_URI=mongodb://localhost:27017/installer_program
```

### 2. NextAuth Secret
- [ ] Run: `npm run setup:secret`
- [ ] Copy generated secret to `.env.local` as `NEXTAUTH_SECRET`

### 3. Google OAuth (Already Done! ✅)
- [x] `GOOGLE_CLIENT_ID` configured
- [x] `GOOGLE_CLIENT_SECRET` configured

### 4. Google Contacts API (Optional)
- [ ] Google People API enabled in Google Cloud Console
- [ ] OAuth Playground added to redirect URIs
- [ ] Refresh token generated
- [ ] `.env.local` has `GOOGLE_CONTACTS_REFRESH_TOKEN`

**OR Skip for now:**
- [ ] Set `GOOGLE_CONTACTS_REFRESH_TOKEN=skip`

## Database Setup
- [ ] MongoDB service is running
- [ ] Run: `npm run setup:admin`
- [ ] Admin user created successfully
- [ ] Note down credentials:
  - Email: `admin@example.com`
  - Password: `admin123`

## Final Steps
- [ ] Run: `npm install` (if not done)
- [ ] Run: `npm run dev`
- [ ] Open: http://localhost:3000
- [ ] Login with admin credentials
- [ ] Change admin password immediately

## Post-Setup
- [ ] Create team members (MANAGER/USER)
- [ ] Test installer registration
- [ ] Test reward registration
- [ ] Test reports generation
- [ ] Test Excel exports

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

## Environment Variables Summary

Your `.env.local` should look like this:

### If Using MongoDB Atlas (Recommended):
```env
# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: npm run setup:secret>

# Google OAuth (Already Configured ✅)
GOOGLE_CLIENT_ID=851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Google Contacts API (Optional)
GOOGLE_CONTACTS_CLIENT_ID=851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com
GOOGLE_CONTACTS_CLIENT_SECRET=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
GOOGLE_CONTACTS_REFRESH_TOKEN=skip
```

### If Using Local MongoDB:
```env
# MongoDB Local
MONGODB_URI=mongodb://localhost:27017/installer_program

# (rest is same as above)
```

---

## Need Help?

1. 🌐 **MongoDB Atlas Setup**: [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
2. 📖 **Detailed Setup**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
3. ⚡ **Quick Start**: [GET_STARTED.md](./GET_STARTED.md)
4. 📚 **Full Documentation**: [README.md](./README.md)

---

**You're almost there! 🚀**
