# 📚 Complete Guide - Installer Program Management System

**Everything you need to know about setup, features, and development**

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Project Overview](#project-overview)
3. [Setup Instructions](#setup-instructions)
4. [Features](#features)
5. [Development](#development)
6. [Troubleshooting](#troubleshooting)
7. [Tailwind CSS v4 Migration](#tailwind-css-v4-migration)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier works)
- Google OAuth credentials (already configured)

### Setup Steps (10 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Setup MongoDB Atlas (see MongoDB Setup section)
# Add MONGODB_URI to .env.local

# 3. Generate NextAuth secret
npm run setup:secret
# Copy output to .env.local

# 4. Create admin user
npm run setup:admin

# 5. Start development server
npm run dev
```

**Login:** http://localhost:3000
- Email: `admin@example.com`
- Password: `admin123`

---

## 📊 Project Overview

### Technology Stack
- **Framework**: Next.js 15.5.4 (App Router, Turbopack)
- **Language**: TypeScript 5
- **Database**: MongoDB Atlas + Mongoose 8
- **Authentication**: NextAuth v5 (Google OAuth + Credentials)
- **Styling**: Tailwind CSS v4.1.14 with OKLCH colors
- **UI Components**: shadcn/ui (New York style, Zinc theme)
- **Forms**: React Hook Form + Zod validation
- **State**: React Hooks
- **Icons**: Lucide React
- **Charts**: Recharts

### Features
- 👥 **Team Management** - Multi-role system (Admin, Manager, User)
- 🔧 **Installer Management** - Track installers with codes, locations, certifications
- 🎁 **Reward System** - Manage rewards with payment tracking
- 📊 **Dashboard** - Analytics with charts and statistics
- 📋 **Reports** - Generate and export reports
- 🌓 **Dark Mode** - Full light/dark theme support
- 📱 **Responsive** - Mobile-friendly design
- 🔐 **Secure** - Role-based access control

---

## ⚙️ Setup Instructions

### 1. MongoDB Atlas Setup

#### Why MongoDB Atlas?
- ✅ **No installation** required
- ✅ **Free tier** (512 MB storage)
- ✅ **Cloud-hosted** (works anywhere)
- ✅ **Automatic backups**

#### Steps:

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up with email or Google

2. **Create Cluster**
   - Click "Create" (M0 Free tier)
   - Choose provider and region
   - Click "Create Cluster"

3. **Setup Database Access**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Username: `adminUser`
   - Password: (generate strong password)
   - Database User Privileges: "Read and write to any database"
   - Click "Add User"

4. **Setup Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Go to "Database" → "Connect"
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your password
   - Replace `<database>` with `installer_program`

6. **Add to .env.local**
   ```env
   MONGODB_URI=mongodb+srv://adminUser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority
   ```

### 2. Environment Variables

Create `.env.local` in the project root:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_generated_secret

# Google OAuth (already configured)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Google Contacts API (already configured)
GOOGLE_CONTACTS_CLIENT_ID=your_contacts_client_id
GOOGLE_CONTACTS_CLIENT_SECRET=your_contacts_client_secret
GOOGLE_CONTACTS_REDIRECT_URI=http://localhost:3000/api/google/callback
```

### 3. Database Testing

Test your MongoDB connection:

```bash
npm run test:db
```

This will:
- ✅ Test connection to MongoDB
- ✅ Diagnose any connection errors
- ✅ Show database information
- ✅ List collections
- ✅ Test read/write operations

### 4. Admin User Management

**Create admin user:**
```bash
npm run setup:admin
```

**Reset admin user:**
```bash
npm run reset:admin
```

Default credentials:
- Email: `admin@example.com`
- Password: `admin123`

---

## 🎨 Features

### Team Management
- **Roles**: Admin, Manager, User
- **Permissions**: Role-based access control
- **Google OAuth**: Sign in with Google
- **Credentials Auth**: Email/password login

### Installer Management
- Unique installer codes (auto-generated)
- Location tracking (city, province)
- Certification status
- Contact details (phone, WhatsApp, email)
- Bank/payment information
- Referral tracking

### Reward System
- Product-based rewards
- Serial number tracking
- Payment status (Pending, Paid, Failed)
- Payment methods (multiple options)
- Transaction tracking
- Bulk upload via Excel

### Dashboard Analytics
- **Statistics Cards**: Total installers, rewards, amounts
- **Time Period Filters**: All time, Last 30 days, Previous month, etc.
- **Top Performers**: Separate date range selector with 5 options
  - Last Week
  - Last 30 Days
  - Previous Month
  - This Year
  - Previous Year
- **Product Charts**: Installation counts by product
- **City Distribution**: Pie chart of installers by city
- **Active Installers**: Trend over time
- **Recent Activity**: Latest installations and installers

### Reports
- Generate custom reports
- Export to Excel
- Filter by date range
- Multiple report types

### Dark Mode
- Full theme support
- Automatic system detection
- Manual toggle
- OKLCH color system for better accuracy

---

## 💻 Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server (Turbopack)
npm run build            # Build for production
npm run start            # Start production server

# Database
npm run test:db          # Test database connection
npm run reset:admin      # Reset admin user

# Setup
npm run setup:secret     # Generate NEXTAUTH_SECRET
npm run setup:admin      # Create admin user
npm run setup            # Run both setup commands
```

### Project Structure

```
installer-program-next/
├── app/                      # Next.js App Router
│   ├── api/                 # API routes
│   │   ├── auth/           # NextAuth
│   │   ├── installers/     # Installer CRUD
│   │   ├── rewards/        # Reward CRUD
│   │   ├── team/           # Team management
│   │   └── reports/        # Report generation
│   ├── auth/               # Auth pages
│   ├── dashboard/          # Dashboard
│   ├── installers/         # Installer pages
│   ├── rewards/            # Reward pages
│   ├── reports/            # Reports page
│   ├── team/               # Team management
│   ├── settings/           # Settings page
│   └── activity/           # Activity log
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── Navbar.tsx         # Navigation bar
│   └── ...                # Modal components
├── lib/                   # Utilities
│   ├── auth.ts           # Auth config
│   ├── mongodb.ts        # MongoDB connection
│   └── apiResponse.ts    # API helpers
├── models/               # Mongoose models
├── types/                # TypeScript types
├── scripts/              # Utility scripts
└── public/               # Static assets
```

### Key Technologies

#### Tailwind CSS v4
- New `@theme` syntax with OKLCH colors
- No config file needed
- Semantic color tokens
- Better performance

#### shadcn/ui
- New York style
- Zinc theme
- 24 components installed
- Full dark mode support

#### Error Handling
- Field-level validation
- Specific error messages
- Backend error mapping
- User-friendly alerts

---

## 🔧 Troubleshooting

### Common Issues

#### 1. ECONNREFUSED Error
**Problem**: MongoDB connection refused

**Solution**:
```bash
# Test connection
npm run test:db

# Common causes:
# 1. MongoDB not configured
# 2. Wrong connection string
# 3. IP not whitelisted
# 4. Network issues
```

#### 2. Authentication Errors
**Problem**: Cannot sign in

**Solutions**:
- Check admin user exists: `npm run reset:admin`
- Verify NEXTAUTH_SECRET in .env.local
- Check NEXTAUTH_URL matches your domain

#### 3. Build Errors
**Problem**: npm install fails

**Solution**:
```bash
# Use legacy peer deps (React 19 compatibility)
npm install --legacy-peer-deps
```

#### 4. Port Already in Use
**Problem**: Port 3000 in use

**Solution**:
```bash
# Next.js will automatically use next available port
# Look for message: "Using available port 3001 instead"
```

#### 5. Dark Mode Not Working
**Problem**: Theme not switching

**Solutions**:
- Check ThemeProvider in app/layout.tsx
- Verify `suppressHydrationWarning` on html tag
- Clear browser cache and reload

---

## 🎨 Tailwind CSS v4 Migration

### What Changed

The project uses Tailwind CSS v4.1.14 with OKLCH color system.

### Key Features

#### 1. OKLCH Colors
- More vibrant colors
- Better dark mode
- Perceptually uniform
- Alpha transparency support

#### 2. Semantic Tokens
All components use semantic color tokens:

```tsx
// ✅ Good
<div className="bg-background text-foreground border border-border">

// ❌ Avoid
<div className="bg-white text-gray-900 border-gray-300">
```

#### 3. No Config File
- All configuration in `app/globals.css`
- Uses `@theme` block
- No `tailwind.config.ts` needed

#### 4. Available Semantic Colors

| Token | Usage |
|-------|-------|
| `bg-background` | Page backgrounds |
| `bg-card` | Card backgrounds |
| `bg-muted` | Secondary backgrounds |
| `bg-primary` | Primary buttons |
| `bg-secondary` | Secondary buttons |
| `bg-accent` | Accent elements |
| `bg-destructive` | Delete/error buttons |
| `text-foreground` | Primary text |
| `text-muted-foreground` | Secondary text |
| `border-border` | All borders |
| `ring-ring` | Focus rings |

### Theme Configuration

Located in `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  /* OKLCH colors for Tailwind v4 */
  --color-background: oklch(1 0 0);
  --color-foreground: oklch(0.145 0 0);
  /* ... more colors */
}

:root {
  /* HSL for backwards compatibility */
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... more colors */
}

.dark {
  /* Dark mode colors */
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... more colors */
}
```

---

## 📝 Commands Reference

### Database Commands
```bash
npm run test:db           # Test MongoDB connection
npm run reset:admin       # Reset admin user
```

### Development Commands
```bash
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
```

### Setup Commands
```bash
npm run setup:secret     # Generate NEXTAUTH_SECRET
npm run setup:admin      # Create admin user
npm run setup            # Run both setup commands
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in with credentials
- `GET /api/auth/signout` - Sign out
- `GET /api/auth/session` - Get current session

### Installers
- `GET /api/installers` - List installers
- `POST /api/installers` - Create installer
- `GET /api/installers/[id]` - Get installer
- `PUT /api/installers/[id]` - Update installer
- `DELETE /api/installers/[id]` - Delete installer

### Rewards
- `GET /api/rewards` - List rewards
- `POST /api/rewards` - Create reward
- `GET /api/rewards/[id]` - Get reward
- `PUT /api/rewards/[id]` - Update reward
- `DELETE /api/rewards/[id]` - Delete reward
- `POST /api/rewards/bulk` - Bulk upload

### Team
- `GET /api/team` - List team members
- `POST /api/team` - Create team member
- `GET /api/team/[id]` - Get team member
- `PUT /api/team/[id]` - Update team member
- `DELETE /api/team/[id]` - Delete team member

### Reports
- `GET /api/reports` - Generate report

---

## 🎯 Best Practices

### Code Style
- Use TypeScript for type safety
- Use semantic color tokens
- Follow component structure
- Add proper error handling

### Database
- Use MongoDB Atlas (cloud)
- Test connection regularly
- Backup data periodically

### Security
- Never commit .env.local
- Use strong passwords
- Keep dependencies updated
- Use role-based access control

### Performance
- Use Turbopack (faster)
- Optimize images
- Minimize API calls
- Use proper caching

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [NextAuth.js Docs](https://next-auth.js.org/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide's [Troubleshooting](#troubleshooting) section
2. Run `npm run test:db` to diagnose database issues
3. Check browser console for errors
4. Check terminal output for server errors
5. Verify all environment variables in .env.local

---

**Version**: 1.0.0
**Last Updated**: October 2025
**Next.js**: 15.5.4
**Tailwind CSS**: 4.1.14
**Node.js**: 18+

---

## ✅ Quick Checklist

Before starting development:
- [ ] MongoDB Atlas cluster created
- [ ] .env.local file configured
- [ ] NEXTAUTH_SECRET generated
- [ ] Admin user created
- [ ] Database connection tested
- [ ] npm install completed
- [ ] Dev server running
- [ ] Can login as admin

Your installer program is ready! 🎉
