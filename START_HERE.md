# 🚀 START HERE - Installer Program Setup

## 👋 Welcome!

You're about to set up the **Installer Program Management System**. This guide will help you get started in the right order.

---

## ⚠️ Are You Getting an Error?

### Error: `connect ECONNREFUSED ::1:27017`

**This is the error you're seeing right now!**

✅ **Solution**: MongoDB is not set up. Follow this guide:

👉 **[QUICK_FIX_MONGODB.md](./QUICK_FIX_MONGODB.md)** ← Start here!

---

## 📋 Setup Path (Choose Based on Your Situation)

### 🔴 Situation 1: "I just got the ECONNREFUSED error"

**Follow this order:**

1. **[QUICK_FIX_MONGODB.md](./QUICK_FIX_MONGODB.md)** (8 min)
   - Quick overview of the MongoDB error
   - Fast setup using MongoDB Atlas (cloud)

2. **[MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)** (8 min)
   - Detailed step-by-step MongoDB Atlas setup
   - Screenshots descriptions and troubleshooting

3. **Generate Secret** (30 sec)
   ```bash
   npm run setup:secret
   ```
   Copy output to `.env.local`

4. **Create Admin** (30 sec)
   ```bash
   npm run setup:admin
   ```

5. **Start App** (10 sec)
   ```bash
   npm run dev
   ```

**Total Time: ~10 minutes**

---

### 🟡 Situation 2: "I'm starting fresh"

**Follow this order:**

1. **[GET_STARTED.md](./GET_STARTED.md)** (10 min)
   - Complete quick start guide
   - Includes MongoDB setup

2. **[CHECKLIST.md](./CHECKLIST.md)** (5 min)
   - Use as a checklist while following GET_STARTED.md

**Total Time: ~10-15 minutes**

---

### 🟢 Situation 3: "I want detailed information"

**Follow this order:**

1. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** (15 min)
   - Comprehensive setup instructions
   - All environment variables explained

2. **[README.md](./README.md)** (Reference)
   - Complete technical documentation
   - API endpoints
   - Database schemas

**Total Time: ~20-30 minutes**

---

## 🎯 What You Need

### Already Configured ✅
- Google OAuth credentials
- Google Contacts credentials

### Need to Setup ❌
1. **MongoDB Database** (8 min) - [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)
2. **NEXTAUTH_SECRET** (30 sec) - Run `npm run setup:secret`
3. **Admin User** (30 sec) - Run `npm run setup:admin`

---

## 📚 All Available Guides

| Guide | Purpose | When to Use |
|-------|---------|-------------|
| **[START_HERE.md](./START_HERE.md)** | Navigation guide | You are here! |
| **[QUICK_FIX_MONGODB.md](./QUICK_FIX_MONGODB.md)** | Fix MongoDB error | You have ECONNREFUSED error |
| **[MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)** | Setup cloud database | Detailed MongoDB setup |
| **[GET_STARTED.md](./GET_STARTED.md)** | Quick start | First time setup |
| **[CHECKLIST.md](./CHECKLIST.md)** | Setup checklist | Track your progress |
| **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** | Detailed setup | Want all details |
| **[README.md](./README.md)** | Full documentation | Reference & API docs |
| **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** | Architecture | Understand the system |

---

## ⚡ Absolute Fastest Path (Recommended)

**If you have the ECONNREFUSED error:**

```bash
# 1. Setup MongoDB Atlas (8 min)
#    Follow: MONGODB_ATLAS_SETUP.md
#    Update .env.local with connection string

# 2. Generate secret (30 sec)
npm run setup:secret
# Copy output to .env.local

# 3. Create admin (30 sec)
npm run setup:admin

# 4. Start app (10 sec)
npm run dev
```

**Login**: http://localhost:3000
- Email: `admin@example.com`
- Password: `admin123`

---

## 🆘 Need Help?

### Common Issues

**"ECONNREFUSED" Error**
- → [QUICK_FIX_MONGODB.md](./QUICK_FIX_MONGODB.md)

**"Authentication failed" (MongoDB)**
- → Check password in connection string
- → URL encode special characters

**"Can't login to app"**
- → Run `npm run setup:admin` again

**"Google OAuth not working"**
- → Check redirect URI in Google Console
- → Should be: `http://localhost:3000/api/auth/callback/google`

---

## 🎯 Your Current Error

Based on the error you provided:

```
❌ Error: connect ECONNREFUSED ::1:27017
```

**Next Step**: Follow **[QUICK_FIX_MONGODB.md](./QUICK_FIX_MONGODB.md)**

This will set up MongoDB Atlas (cloud database) in ~8 minutes with zero installation.

---

## ✅ Quick Reference

### Environment Variables Needed

```env
# MongoDB (from MONGODB_ATLAS_SETUP.md)
MONGODB_URI=mongodb+srv://...

# NextAuth (from npm run setup:secret)
NEXTAUTH_SECRET=...

# Already configured ✅
GOOGLE_CLIENT_ID=851275578938-jd6gdl62do3i3mlt74k687qkrqlk7t7i.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

### Commands You'll Run

```bash
npm run setup:secret     # Generate NEXTAUTH_SECRET
npm run setup:admin      # Create admin user
npm run dev              # Start application
```

---

## 🎉 Ready to Start?

**👉 Go to: [QUICK_FIX_MONGODB.md](./QUICK_FIX_MONGODB.md)**

This will fix your current error and get you up and running!

---

**Good luck! You'll be done in ~10 minutes! 🚀**
