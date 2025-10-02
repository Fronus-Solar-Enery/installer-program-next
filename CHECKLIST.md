# ✅ Setup Checklist

Complete these steps to get your Installer Program running:

## Pre-Setup
- [ ] Node.js 18+ installed
- [ ] MongoDB installed (or MongoDB Atlas account)
- [ ] Code editor (VS Code recommended)

## Environment Variables

### 1. MongoDB
- [ ] MongoDB is running (local) OR
- [ ] MongoDB Atlas connection string ready
- [ ] `.env.local` has `MONGODB_URI` configured

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

Copy this to your `.env.local`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/installer_program

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: npm run setup:secret>

# Google OAuth (Already Configured ✅)
GOOGLE_CLIENT_ID=851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Google Contacts API (Optional)
GOOGLE_CONTACTS_CLIENT_ID=851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com
GOOGLE_CONTACTS_CLIENT_SECRET=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
GOOGLE_CONTACTS_REFRESH_TOKEN=<follow SETUP_GUIDE.md or set to 'skip'>
```

---

## Need Help?

1. 📖 Read [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed steps
2. 📚 Check [README.md](./README.md) for full documentation
3. 🐛 Common issues are in SETUP_GUIDE.md troubleshooting section

---

**You're almost there! 🚀**
