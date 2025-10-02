# 📊 Project Overview - Installer Program Management System

## 🎯 What This Application Does

A comprehensive system to manage:
- **Team Members** (Admin, Manager, User roles)
- **Installers** (with referral tracking)
- **Rewards** (with automatic referrer compensation)
- **Reports** (Excel exports for payments)

---

## 🏗️ Architecture

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
                          ↕
┌─────────────────────────────────────────────────────────┐
│              INTEGRATIONS (Google APIs)                 │
│  ┌──────────┐  ┌──────────┐                             │
│  │  OAuth   │  │ Contacts │                             │
│  │  Login   │  │   Sync   │                             │
│  └──────────┘  └──────────┘                             │
└─────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
installer-program/
│
├── 📄 Documentation
│   ├── README.md              # Complete documentation
│   ├── GET_STARTED.md         # 3-minute quick start
│   ├── SETUP_GUIDE.md         # Detailed setup guide
│   ├── CHECKLIST.md           # Setup checklist
│   └── PROJECT_OVERVIEW.md    # This file
│
├── 🔧 Configuration
│   ├── .env.local             # Environment variables
│   ├── package.json           # Dependencies & scripts
│   ├── tsconfig.json          # TypeScript config
│   ├── tailwind.config.ts     # Tailwind CSS config
│   └── middleware.ts          # Auth middleware
│
├── 🎨 Frontend (app/)
│   ├── layout.tsx             # Root layout
│   ├── providers.tsx          # Session provider
│   ├── auth/signin/           # Login page
│   ├── dashboard/             # Dashboard page
│   ├── installers/            # Installer pages
│   ├── rewards/               # Reward pages
│   ├── reports/               # Report pages
│   └── team/                  # Team management pages
│
├── 🔌 Backend (app/api/)
│   ├── auth/[...nextauth]/    # NextAuth routes
│   ├── team/                  # Team member APIs
│   │   ├── route.ts           # List team members
│   │   ├── register/          # Register member
│   │   ├── [id]/              # CRUD operations
│   │   ├── profile/           # User profile
│   │   └── change-password/   # Change password
│   ├── installers/            # Installer APIs
│   │   ├── route.ts           # List/Create installers
│   │   └── [id]/              # CRUD operations
│   ├── rewards/               # Reward APIs
│   │   ├── route.ts           # List/Create rewards
│   │   └── [id]/              # CRUD operations
│   └── reports/               # Report APIs
│       ├── installers/        # Installer report
│       ├── rewards/           # Reward report
│       └── payment-format/    # Payment Excel
│
├── 🗄️ Database (models/)
│   ├── TeamMember.ts          # Team member schema
│   ├── Installer.ts           # Installer schema
│   └── InstallerReward.ts     # Reward schema
│
├── 🛠️ Utilities (lib/)
│   ├── mongodb.ts             # Database connection
│   ├── auth.ts                # NextAuth config
│   ├── validation.ts          # Zod schemas
│   ├── apiResponse.ts         # API helpers
│   └── googleContacts.ts      # Google integration
│
├── 🧩 Components (components/)
│   └── Navbar.tsx             # Navigation bar
│
├── 📝 Scripts (scripts/)
│   ├── createAdmin.js         # Create first admin
│   └── generateSecret.js      # Generate auth secret
│
└── 🎯 Types (types/)
    └── next-auth.d.ts         # NextAuth types
```

---

## 🔄 Data Flow Examples

### 1️⃣ Register Installer

```
User Input (Form)
    ↓
Frontend Validation (Zod)
    ↓
POST /api/installers
    ↓
Backend Validation (Zod)
    ↓
Check Referrer (max 5 referrals)
    ↓
Save to MongoDB
    ↓
Create Google Contact (optional)
    ↓
Return Success
```

### 2️⃣ Register Reward with Referral

```
User Input (Installer Code)
    ↓
POST /api/rewards
    ↓
Fetch Installer by Code
    ↓
Get Bank Details from Installer
    ↓
Check if Installer has Referrer
    ↓
If YES → Add Rs. 500 referrer reward
    ↓
Save Reward to MongoDB
    ↓
Return Success
```

### 3️⃣ Generate Payment Report

```
User Selects Filters
    ↓
GET /api/reports/payment-format?status=PENDING
    ↓
Query Rewards by Status
    ↓
Populate Installer & Referrer Data
    ↓
Create Excel Workbook
    ↓
Sheet 1: Installer Payments
Sheet 2: Referrer Payments
    ↓
Download Excel File
```

---

## 🔐 Security Features

| Feature | Implementation |
|---------|---------------|
| **Authentication** | NextAuth.js with JWT |
| **Password** | bcrypt hashing (10 rounds) |
| **Authorization** | Role-based middleware |
| **Session** | HTTP-only cookies |
| **API Protection** | Middleware checks |
| **Input Validation** | Zod schemas |
| **CSRF Protection** | NextAuth built-in |

---

## 📊 Database Schema Summary

### TeamMember
- Primary Key: `_id`
- Unique: `email`, `googleId`
- Roles: ADMIN, MANAGER, USER

### Installer
- Primary Key: `cnic`
- Unique: `installerCode`, `cnic`
- References: `registeredBy` → TeamMember, `referrer` → Installer
- Max referrals per installer: 5

### InstallerReward
- Primary Key: `serialNumber`
- Unique: `serialNumber`
- References: `installer`, `referrer`, `registeredBy`
- Statuses: PENDING, PAID, FAILED
- Auto-calculation: Referrer gets Rs. 500

---

## 🎨 User Roles & Permissions

### 👑 ADMIN
- ✅ All features
- ✅ Register ADMIN/MANAGER/USER
- ✅ Delete team members
- ✅ Delete installers/rewards
- ✅ Full access to all data

### 👔 MANAGER
- ✅ Register MANAGER/USER (not ADMIN)
- ✅ Delete installers/rewards
- ✅ Full CRUD on installers
- ✅ Full CRUD on rewards
- ❌ Cannot delete ADMIN users

### 👤 USER
- ✅ View installers
- ✅ Register installers
- ✅ View rewards
- ✅ Register rewards
- ✅ Update own profile
- ❌ No delete permissions
- ❌ Cannot manage team

---

## 📈 API Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/signin` | Login | Public |
| GET | `/api/team` | List team members | Admin/Manager |
| POST | `/api/team/register` | Register member | Admin/Manager |
| GET | `/api/installers` | List installers | All |
| POST | `/api/installers` | Create installer | All |
| PUT | `/api/installers/:id` | Update installer | All |
| DELETE | `/api/installers/:id` | Delete installer | Admin/Manager |
| GET | `/api/rewards` | List rewards | All |
| POST | `/api/rewards` | Create reward | All |
| PUT | `/api/rewards/:id` | Update reward | All |
| DELETE | `/api/rewards/:id` | Delete reward | Admin/Manager |
| GET | `/api/reports/installers` | Export installers | All |
| GET | `/api/reports/rewards` | Export rewards | All |
| GET | `/api/reports/payment-format` | Payment Excel | All |

---

## 🔍 Key Features in Detail

### Referral System
- Installer A refers Installer B
- When B gets a reward → A gets Rs. 500 automatically
- Max 5 referrals per installer
- Tracked via `referrerCode` and `referrer` relationship

### Google Contacts Sync
- Auto-creates contact when installer registered
- Updates contact when installer modified
- Deletes contact when installer deleted
- Syncs: Name, Phone, Address, Company, etc.

### Excel Reports
- **Installers**: Complete data export
- **Rewards**: Filtered by status, date, etc.
- **Payment Format**: Bank-ready with phone numbers
- Separate sheets for installers and referrers

### Advanced Filtering
- Multiple filter combinations
- Date range filtering
- Status-based filtering
- City/Province filtering
- Pagination support
- Sorting (ascending/descending)

---

## 🚀 Performance Optimizations

1. **Database Indexing**
   - All frequently queried fields indexed
   - Compound indexes for common queries

2. **Connection Pooling**
   - Mongoose connection caching
   - Reuses connections across requests

3. **Pagination**
   - Default limit: 10 items
   - Prevents loading large datasets

4. **Parallel Queries**
   - Uses `Promise.all()` for independent queries
   - Reduces API response time

---

## 🧪 Testing Checklist

- [ ] Login with Google OAuth
- [ ] Login with credentials
- [ ] Register team member (all roles)
- [ ] Update team member
- [ ] Change password
- [ ] Register installer without referrer
- [ ] Register installer with referrer
- [ ] View installer statistics
- [ ] Register reward (installer gets amount)
- [ ] Verify referrer reward (Rs. 500 auto-added)
- [ ] Update reward status
- [ ] Filter rewards by status
- [ ] Filter rewards by date range
- [ ] Export installers to Excel
- [ ] Export rewards to Excel
- [ ] Export payment format
- [ ] Test role permissions (ADMIN, MANAGER, USER)

---

## 📦 Technologies Used

### Frontend
- Next.js 15 (App Router)
- React 19
- TypeScript 5
- Tailwind CSS 4
- React Hook Form
- Zod

### Backend
- Next.js API Routes
- MongoDB 6
- Mongoose 8
- NextAuth.js v5
- bcryptjs

### Integrations
- Google OAuth 2.0
- Google People API (Contacts)
- XLSX (Excel generation)

---

## 🔮 Future Enhancements

Potential features to add:

1. **Email Notifications**
   - Send email when reward is paid
   - Notify referrers of earnings

2. **SMS Integration**
   - Send SMS for payment confirmations
   - WhatsApp notifications

3. **Dashboard Analytics**
   - Charts and graphs
   - Trend analysis
   - Performance metrics

4. **Bulk Operations**
   - Bulk installer import via CSV
   - Bulk reward updates

5. **Audit Logs**
   - Track all changes
   - Who did what and when

6. **Mobile App**
   - React Native app
   - QR code scanning for installers

---

## 📞 Support & Documentation

- **Quick Start**: [GET_STARTED.md](./GET_STARTED.md)
- **Setup Guide**: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- **Checklist**: [CHECKLIST.md](./CHECKLIST.md)
- **Full Docs**: [README.md](./README.md)

---

**Built with ❤️ for efficient installer program management**
