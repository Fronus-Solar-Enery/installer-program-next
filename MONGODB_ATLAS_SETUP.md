# 🌐 MongoDB Atlas Setup Guide (2025)

**Complete setup in ~8 minutes | Zero installation required**

---

## 🎯 Why MongoDB Atlas?

MongoDB Atlas is a cloud-hosted MongoDB service that's perfect for this project because:

✅ **No Installation** - Works immediately, no local setup
✅ **Free Forever** - M0 tier never expires (512MB storage)
✅ **Always On** - Access from anywhere
✅ **Automatic Backups** - Built-in data protection
✅ **Easy Setup** - Get running in 8 minutes

---

## 📋 What You'll Get

- **Free M0 Cluster**: 512MB storage, perfect for development
- **Connection String**: To use in your `.env.local`
- **Database User**: Credentials for secure access
- **Cloud Access**: Work from any computer

---

## 🚀 Step-by-Step Setup

### Step 1: Create MongoDB Atlas Account (2 minutes)

1. **Go to MongoDB Atlas**
   - Visit: https://www.mongodb.com/cloud/atlas/register

2. **Sign Up**
   - **Option A**: Click **"Sign up with Google"** (fastest)
   - **Option B**: Enter email and password manually

3. **Complete Registration**
   - If using email: Verify your email address
   - If using Google: You're logged in immediately

4. **Welcome Survey** (Optional)
   - Select your preferences or click "Skip"

**✅ You're now logged into MongoDB Atlas!**

---

### Step 2: Create Free M0 Cluster (3 minutes)

1. **Start Cluster Creation**
   - You'll see: **"Welcome to Atlas"** or **"Deploy a database"**
   - Click: **"+ Create"** or **"Build a Database"**

2. **Choose Deployment Type**
   - Select: **"M0 FREE"** (left option)
   - You'll see: "512 MB Storage" and "Shared RAM"
   - Click: **"Create Deployment"** or **"Create"**

3. **Choose Cloud Provider & Region**

   **Provider**: Any of these work (choose one)
   - AWS (Amazon Web Services)
   - Google Cloud
   - Azure

   **Region**: Choose closest to your location
   - If in Asia: `ap-south-1` (Mumbai) or `ap-southeast-1` (Singapore)
   - If in US: `us-east-1` (Virginia) or `us-west-1` (California)
   - If in Europe: `eu-west-1` (Ireland) or `eu-central-1` (Frankfurt)

4. **Cluster Name** (Optional)
   - Default name: `Cluster0` (you can keep this)
   - Or rename to: `installer-program`
   - **Note**: Can't change after creation

5. **Click "Create Deployment"**
   - Wait 1-3 minutes for cluster to deploy
   - You'll see a progress indicator

**✅ Your cluster is being created!**

---

### Step 3: Create Database User (1 minute)

While the cluster is deploying, a popup will appear:

#### Security Quickstart Window

1. **Choose Authentication Method**
   - Select: **"Username and Password"** (already selected)

2. **Create Database User**
   - **Username**: `adminuser` (or any name you want)
   - **Password**: Click **"Autogenerate Secure Password"**

   **⚠️ IMPORTANT**:
   - Click the **"Copy"** button next to the password
   - Save this password somewhere safe!
   - You'll need it for your `.env.local` file

   Example generated password: `xK9mP2qR8vL5nT4w`

3. **Click "Create User"**

**✅ Database user created!**

---

### Step 4: Configure Network Access (1 minute)

Still in the Security Quickstart popup:

1. **Where would you like to connect from?**
   - You'll see: "Add entries to your IP Access List"

2. **Add Your IP Address**

   **For Development** (Recommended):
   - Click: **"Add My Current IP Address"**
   - Your IP will be auto-detected
   - Click: **"Add Entry"**

   **For Production/Testing from Multiple Locations**:
   - Click: **"Allow Access from Anywhere"**
   - This adds `0.0.0.0/0` (all IPs)
   - Less secure but convenient for development

3. **Click "Finish and Close"**

4. **Click "Go to Database"** on the success message

**✅ Network access configured!**

---

### Step 5: Get Connection String (1 minute)

1. **On Database Deployments Page**
   - You'll see your cluster: `Cluster0` (or your custom name)
   - Status should be: **"Active"** (green dot)

2. **Click "Connect" Button**
   - Big button on your cluster

3. **Choose Connection Method**
   - Click: **"Drivers"**
   - (Not "Compass" or "MongoDB Shell")

4. **Select Your Driver**
   - **Driver**: Select **"Node.js"**
   - **Version**: Select your version (or leave default)

5. **Copy Connection String**
   - You'll see a connection string like:
   ```
   mongodb+srv://adminuser:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

   - Click **"Copy"** button

**✅ Connection string copied!**

---

### Step 6: Update `.env.local` (30 seconds)

1. **Open your `.env.local` file**

2. **Find the MongoDB URI line**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/installer_program
   ```

3. **Replace with your Atlas connection string**:

   **Before**:
   ```env
   MONGODB_URI=mongodb://localhost:27017/installer_program
   ```

   **After** (replace with YOUR values):
   ```env
   MONGODB_URI=mongodb+srv://adminuser:xK9mP2qR8vL5nT4w@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority
   ```

4. **Important Changes to Make**:

   ✏️ **Replace `<password>`** with your actual password from Step 3
   ```
   mongodb+srv://adminuser:YOUR_ACTUAL_PASSWORD@cluster0...
   ```

   ✏️ **Add database name** before the `?`
   ```
   ...mongodb.net/installer_program?retryWrites...
   ```

   **Final Example**:
   ```env
   MONGODB_URI=mongodb+srv://adminuser:xK9mP2qR8vL5nT4w@cluster0.ab1c2d.mongodb.net/installer_program?retryWrites=true&w=majority
   ```

5. **Save the file**

**✅ Environment configured!**

---

### Step 7: Test Connection (30 seconds)

1. **Create Admin User**
   ```bash
   node scripts/createAdmin.js
   ```

2. **Expected Output**:
   ```
   📦 Connected to MongoDB
   ✅ Admin user created successfully!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📧 Email: admin@example.com
   🔑 Password: admin123
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ⚠️  Please change this password after first login!
   ```

**✅ MongoDB Atlas is working!**

---

## 🎉 You're Ready!

Start your application:

```bash
npm run dev
```

Visit: http://localhost:3000

Login with:
- Email: `admin@example.com`
- Password: `admin123`

---

## 🔧 Troubleshooting

### Error: "Authentication failed"

**Problem**: Wrong username or password in connection string

**Solution**:
1. Double-check username and password in `.env.local`
2. Password must NOT contain `<` or `>`
3. Special characters in password need URL encoding:
   - `@` → `%40`
   - `:` → `%3A`
   - `/` → `%2F`
   - `#` → `%23`
   - `?` → `%3F`

**Example**:
- Password: `pass@word#123`
- Encoded: `pass%40word%23123`

---

### Error: "IP address not whitelisted"

**Problem**: Your IP is not in the access list

**Solution**:
1. Go to MongoDB Atlas → Security → Network Access
2. Click "+ Add IP Address"
3. Click "Add Current IP Address"
4. Click "Confirm"
5. Wait 1-2 minutes for changes to apply

---

### Error: "Could not connect to any servers"

**Problem**: Network or firewall blocking connection

**Solutions**:
1. Check your internet connection
2. Try from a different network (not corporate firewall)
3. Use connection string with `+srv` format
4. Disable VPN temporarily

---

### Error: "Database not found"

**Problem**: Database name missing from connection string

**Solution**:
Add `/installer_program` before the `?`:
```
mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true
```

---

### Password Contains Special Characters

If your auto-generated password has special characters, you need to URL-encode them:

**Common Special Characters**:
```
! → %21
@ → %40
# → %23
$ → %24
% → %25
^ → %5E
& → %26
* → %2A
( → %28
) → %29
```

**Tool**: Use online URL encoder or change password to simpler one

**Change Password**:
1. MongoDB Atlas → Security → Database Access
2. Click "Edit" on your user
3. Click "Edit Password"
4. Enter simple password (letters + numbers only)
5. Click "Update User"

---

## 📊 View Your Data in Atlas

1. **Go to Database Deployments**
2. **Click "Browse Collections"**
3. **You'll see**:
   - Database: `installer_program`
   - Collections: `teammembers`, `installers`, `installerrewards`
4. **Click any collection** to view data

---

## 💡 Tips & Best Practices

### 1. Backup Your Connection String
Save your connection string somewhere safe (password manager, notes app)

### 2. Create Multiple Users
- Create separate users for dev/production
- Database Access → Add New Database User

### 3. Monitor Usage
- Atlas → Metrics tab
- Check storage usage (512MB limit on free tier)

### 4. Set Alerts
- Atlas → Alerts
- Get notified when storage is near limit

### 5. Upgrade When Needed
If you exceed 512MB, upgrade to:
- M2 Flex: $9/month
- M5 Flex: $25/month

---

## 🌟 Next Steps

Now that MongoDB is set up:

1. ✅ Generate NEXTAUTH_SECRET
   ```bash
   npm run setup:secret
   ```

2. ✅ Admin user already created (you did this in Step 7)

3. ✅ Start the app
   ```bash
   npm run dev
   ```

4. ✅ Login and change password

5. ✅ Start using the application!

---

## 📚 Additional Resources

- **MongoDB Atlas Docs**: https://www.mongodb.com/docs/atlas/
- **Connection String Format**: https://www.mongodb.com/docs/manual/reference/connection-string/
- **Node.js Driver Docs**: https://www.mongodb.com/docs/drivers/node/current/
- **Troubleshooting**: https://www.mongodb.com/docs/atlas/troubleshoot-connection/

---

## 🆘 Still Having Issues?

1. Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for general setup
2. Check [GET_STARTED.md](./GET_STARTED.md) for quick start
3. Check MongoDB Atlas status: https://status.mongodb.com/

---

## ✅ Checklist

- [ ] Created MongoDB Atlas account
- [ ] Created free M0 cluster
- [ ] Created database user (saved password!)
- [ ] Added IP to whitelist
- [ ] Copied connection string
- [ ] Updated `.env.local` with correct values
- [ ] Tested connection with `node scripts/createAdmin.js`
- [ ] Successfully created admin user
- [ ] Ready to run `npm run dev`

---

**🎉 Congratulations! Your MongoDB Atlas database is ready!**

Your cloud database is now accessible from anywhere, requires zero maintenance, and will never expire with the free tier.
