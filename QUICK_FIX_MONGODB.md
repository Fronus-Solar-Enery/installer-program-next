# 🔧 Quick Fix: MongoDB "ECONNREFUSED" Error

## What This Error Means

```
❌ Error: connect ECONNREFUSED ::1:27017
```

**Translation**: Your app can't find a MongoDB database to connect to.

---

## ⚡ Fastest Solution: MongoDB Atlas (8 minutes)

**No installation, works immediately!**

### Quick Steps:

1. **Sign up** → https://www.mongodb.com/cloud/atlas/register

2. **Create free cluster**
   - Click "Create Deployment"
   - Select "M0 FREE"
   - Choose region
   - Click "Create"

3. **Create user**
   - Username: `adminuser`
   - Click "Autogenerate Secure Password"
   - **Copy password!**
   - Click "Create User"

4. **Allow IP**
   - Click "Add My Current IP Address"
   - Click "Add Entry"

5. **Get connection string**
   - Click "Connect" → "Drivers"
   - Copy the connection string
   - It looks like: `mongodb+srv://adminuser:<password>@cluster0.xxxxx.mongodb.net/`

6. **Update `.env.local`**

   Replace this:
   ```env
   MONGODB_URI=mongodb://localhost:27017/installer_program
   ```

   With this (use YOUR values):
   ```env
   MONGODB_URI=mongodb+srv://adminuser:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/installer_program?retryWrites=true&w=majority
   ```

   **Important**:
   - Replace `<password>` with your actual password
   - Add `/installer_program` before the `?`

7. **Test it**
   ```bash
   node scripts/createAdmin.js
   ```

   You should see: ✅ Admin user created successfully!

---

## 📖 Need More Details?

**Complete Step-by-Step Guide with Screenshots**:
- 📖 [MONGODB_ATLAS_SETUP.md](./MONGODB_ATLAS_SETUP.md)

---

## 🔄 Alternative: Install MongoDB Locally

### Windows
1. Download: https://www.mongodb.com/try/download/community
2. Run installer
3. Start service:
   ```bash
   net start MongoDB
   ```

### Mac
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

Then your `.env.local` keeps the current value:
```env
MONGODB_URI=mongodb://localhost:27017/installer_program
```

---

## ✅ After MongoDB is Ready

```bash
# Generate secret
npm run setup:secret
# Copy output to .env.local

# Create admin user
npm run setup:admin

# Start app
npm run dev
```

---

## 🆘 Still Having Issues?

1. **Connection String Format Wrong?**
   - Must be: `mongodb+srv://user:password@cluster.mongodb.net/dbname?options`
   - No spaces
   - Password must not contain `<` or `>`
   - Must have `/installer_program` before `?`

2. **IP Not Whitelisted?**
   - Atlas → Security → Network Access
   - Add your current IP

3. **Password Has Special Characters?**
   - URL encode them:
     - `@` → `%40`
     - `#` → `%23`
     - `:` → `%3A`

---

## 📚 More Resources

- [GET_STARTED.md](./GET_STARTED.md) - Complete quick start
- [CHECKLIST.md](./CHECKLIST.md) - Setup checklist
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Detailed guide

---

**Recommended**: Use MongoDB Atlas - it's free forever, no installation, and works everywhere!
