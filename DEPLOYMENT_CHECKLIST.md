# 🚀 Deployment Checklist

Quick checklist for deploying the Installer Program to production.

---

## 📋 Pre-Deployment Checklist

### Code Preparation
- [ ] All features tested locally
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Build succeeds: `npm run build`
- [ ] All environment variables documented
- [ ] Sensitive data removed from code
- [ ] `.env.local` is in `.gitignore`
- [ ] Code committed to Git
- [ ] Repository pushed to GitHub

### Database Setup
- [ ] MongoDB Atlas account created
- [ ] Cluster created (M0 Free tier)
- [ ] Database user created with strong password
- [ ] IP addresses whitelisted (0.0.0.0/0 for dev, specific IPs for prod)
- [ ] Connection string obtained and tested
- [ ] Database name added to connection string: `/installer_program`
- [ ] Connection tested locally: `npm run test:db`

### Authentication Setup
- [ ] NEXTAUTH_SECRET generated: `openssl rand -base64 32`
- [ ] Google Cloud Project created
- [ ] Google OAuth credentials created
- [ ] OAuth consent screen configured
- [ ] Authorized redirect URIs configured
- [ ] Google+ API enabled (for OAuth)
- [ ] People API enabled (if using Contacts sync)

---

## 🌐 Deployment Steps (Vercel)

### Step 1: Deploy
- [ ] Signed in to [vercel.com](https://vercel.com)
- [ ] Repository imported
- [ ] Framework detected: Next.js
- [ ] Build settings verified:
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Install Command: `npm install`

### Step 2: Environment Variables
Add all required variables in Vercel dashboard:

- [ ] `MONGODB_URI` - MongoDB connection string
- [ ] `NEXTAUTH_URL` - Your production URL (https://your-app.vercel.app)
- [ ] `NEXTAUTH_SECRET` - Generated secret
- [ ] `GOOGLE_CLIENT_ID` - Google OAuth client ID
- [ ] `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- [ ] `GOOGLE_CONTACTS_CLIENT_ID` - (Optional) Same as above or separate
- [ ] `GOOGLE_CONTACTS_CLIENT_SECRET` - (Optional) Same as above or separate
- [ ] `GOOGLE_CONTACTS_REFRESH_TOKEN` - (Optional) Or set to "skip"

### Step 3: Deploy
- [ ] Clicked "Deploy"
- [ ] Deployment succeeded
- [ ] URL generated: `https://your-app.vercel.app`

---

## 🔧 Post-Deployment Steps

### Step 1: Update Google OAuth
- [ ] Go to Google Cloud Console → Credentials
- [ ] Edit OAuth Client ID
- [ ] Add production redirect URI:
  ```
  https://your-app.vercel.app/api/auth/callback/google
  ```
- [ ] Save changes
- [ ] Wait 5 minutes for propagation

### Step 2: Create Admin User

**Option A: Using Script (Locally)**
```bash
# Update .env.local with production MONGODB_URI
# Run setup script
npm run setup:admin
```

**Option B: Manual (MongoDB Atlas)**
- [ ] MongoDB Atlas → Browse Collections
- [ ] Database: `installer_program`
- [ ] Collection: `teammembers`
- [ ] Insert admin document (see HOSTING_GUIDE.md)

### Step 3: Test Application
- [ ] Visit production URL
- [ ] Login page loads
- [ ] Login with admin credentials works
- [ ] Google Sign-In works
- [ ] Dashboard accessible
- [ ] Can navigate all pages
- [ ] Can create team member
- [ ] Can register installer
- [ ] Can create reward
- [ ] Bulk upload works

---

## 🌍 Custom Domain (Optional)

If using custom domain:

- [ ] Domain purchased/available
- [ ] Vercel: Settings → Domains → Add domain
- [ ] DNS records added to domain registrar:
  ```
  Type: A, Name: @, Value: 76.76.21.21
  Type: CNAME, Name: www, Value: cname.vercel-dns.com
  ```
- [ ] DNS propagated (check: `nslookup yourdomain.com`)
- [ ] SSL certificate issued automatically
- [ ] Update `NEXTAUTH_URL` to custom domain
- [ ] Update Google OAuth redirect URIs with new domain
- [ ] Test with new domain

---

## ✅ Verification Checklist

### Functionality
- [ ] User authentication works
- [ ] Team members page loads
- [ ] Installers page loads
- [ ] Rewards page loads
- [ ] Activities page loads
- [ ] Profile page works
- [ ] Bulk register installers works
- [ ] Bulk register rewards works
- [ ] Bulk update rewards works
- [ ] Search functionality works
- [ ] Filters work
- [ ] Export to Excel works
- [ ] Google Contacts sync works (if enabled)

### Security
- [ ] HTTPS enabled (SSL certificate)
- [ ] Environment variables not exposed
- [ ] No secrets in client-side code
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Strong admin password set
- [ ] Google OAuth restricted to authorized domains

### Performance
- [ ] Pages load quickly (< 3 seconds)
- [ ] Images optimize
- [ ] Database queries fast
- [ ] Bulk operations complete without timeout
- [ ] No console errors in production

---

## 📊 Monitoring Setup (Optional)

- [ ] Vercel Analytics enabled
- [ ] MongoDB Atlas monitoring enabled
- [ ] Error tracking configured (Sentry, etc.)
- [ ] Uptime monitoring (UptimeRobot, etc.)
- [ ] Backup strategy defined

---

## 🔄 Regular Maintenance

### Daily
- [ ] Check error logs (if issues reported)

### Weekly
- [ ] Review Vercel deployment logs
- [ ] Check MongoDB Atlas metrics
- [ ] Monitor storage usage

### Monthly
- [ ] Review database indexes
- [ ] Check for package updates: `npm outdated`
- [ ] Review user feedback
- [ ] Backup database (if not auto-backed up)

### Quarterly
- [ ] Update dependencies: `npm update`
- [ ] Security audit: `npm audit`
- [ ] Review and optimize database queries
- [ ] Check MongoDB Atlas tier (still within free limits?)

---

## 🆘 Rollback Plan

If deployment fails or has critical issues:

### Vercel Rollback
1. Go to Vercel Dashboard → Deployments
2. Find last working deployment
3. Click "..." → "Promote to Production"
4. Or: `vercel rollback` via CLI

### Database Rollback
1. MongoDB Atlas → Backup (if configured)
2. Restore from backup
3. Or manually revert changes via Atlas UI

### Code Rollback
1. Git: `git revert <commit-hash>`
2. Push to GitHub
3. Vercel auto-redeploys

---

## 📝 Environment Variables Reference

Quick copy-paste for Vercel:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/installer_program?retryWrites=true&w=majority

# Auth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-generated-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Google Contacts (Optional)
GOOGLE_CONTACTS_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CONTACTS_CLIENT_SECRET=your-client-secret
GOOGLE_CONTACTS_REFRESH_TOKEN=your-refresh-token-or-skip
```

---

## 🎯 Success Criteria

Deployment is successful when:

✅ App accessible at production URL
✅ All pages load without errors
✅ Authentication works (both methods)
✅ Database operations work
✅ No console errors
✅ SSL certificate active
✅ Admin user can access everything
✅ Team members can be created
✅ Installers can be registered
✅ Rewards can be created
✅ Bulk operations work

---

## 📞 Support Resources

- **Vercel Status**: [vercel-status.com](https://www.vercel-status.com/)
- **MongoDB Status**: [status.mongodb.com](https://status.mongodb.com/)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **MongoDB Support**: [support.mongodb.com](https://support.mongodb.com/)

---

**Last Updated**: January 2025
**Version**: 1.0
**App Version**: Next.js 15

---

## 🎉 Congratulations!

If you've completed this checklist, your app is now deployed and running in production! 🚀

For detailed guidance, refer to [HOSTING_GUIDE.md](./HOSTING_GUIDE.md).
