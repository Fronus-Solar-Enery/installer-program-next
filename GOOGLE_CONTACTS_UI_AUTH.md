# Google Contacts UI Authentication Setup

## Overview

The app now uses a user-friendly OAuth flow where users authenticate Google Contacts directly from the UI. The refresh token is stored securely in the database per user.

---

## Setup Steps

### 1. Add OAuth Redirect URI

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID (the one matching `GOOGLE_CLIENT_ID` in `.env.local`)
5. Click the edit icon (pencil)
6. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/api/google-auth/callback
   ```
7. Click **Save**

### 2. Enable People API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for **"People API"**
3. Click it and ensure it's **Enabled**

### 3. Configure OAuth Consent Screen (if not already done)

1. Go to **APIs & Services** → **OAuth consent screen**
2. Add the scope: `https://www.googleapis.com/auth/contacts`
3. Add your email as a test user (if app is in testing mode)

---

## How It Works

### For Users:

1. Navigate to `/installers/new`
2. If Google Contacts is not connected, you'll see a yellow warning banner
3. Click **"🔗 Authenticate Google Contacts"** button
4. You'll be redirected to Google's consent screen
5. Sign in and grant permissions
6. You'll be redirected back to the form with a green success message
7. Now when you register installers, they'll automatically sync to Google Contacts

### Technical Flow:

1. **Check Status**: Page loads → Calls `/api/google-auth/status` to check if user is authenticated
2. **Initiate Auth**: User clicks button → Calls `/api/google-auth/initiate` → Redirects to Google OAuth
3. **Callback**: Google redirects to `/api/google-auth/callback` with authorization code
4. **Store Token**: Callback exchanges code for refresh token → Saves to `GoogleAuth` collection
5. **Use Token**: When creating installer → `createGoogleContact(userId, data)` fetches user's refresh token from database

---

## Database Schema

### GoogleAuth Collection

```typescript
{
  userId: string;           // Team member ID
  refreshToken: string;     // Google OAuth refresh token
  accessToken: string;      // (optional) Current access token
  expiryDate: Date;        // (optional) Token expiry
  scope: string;           // OAuth scopes granted
  isActive: boolean;       // Whether auth is active
  createdAt: Date;
  updatedAt: Date;
}
```

- One document per user
- `findOneAndUpdate` with `upsert: true` ensures only one auth per user
- When user re-authenticates, existing record is updated

---

## API Routes

### GET `/api/google-auth/status`
Returns whether current user has authenticated Google Contacts.

**Response:**
```json
{
  "isAuthenticated": true,
  "hasRefreshToken": true
}
```

### GET `/api/google-auth/initiate`
Generates Google OAuth authorization URL.

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..."
}
```

### GET `/api/google-auth/callback`
Handles OAuth callback from Google.

**Query Params:**
- `code`: Authorization code from Google
- `state`: User ID (passed through OAuth flow)

**Redirects to:**
- Success: `/installers/new?auth_success=true`
- Error: `/installers/new?auth_error=<reason>`

### DELETE `/api/google-auth/status`
Revokes user's Google Contacts authentication.

---

## Updated Functions

### `createGoogleContact(userId, data)`
- First parameter is now `userId` (string)
- Fetches user's refresh token from database
- Creates OAuth client with user's token
- Creates contact in user's Google Contacts

### `updateGoogleContact(userId, resourceName, data)`
- Updates existing contact using user's auth

### `deleteGoogleContact(userId, resourceName)`
- Deletes contact using user's auth

---

## Environment Variables

The app now uses the same Google OAuth credentials for both NextAuth and Contacts:

```env
# These credentials are used for both NextAuth and Google Contacts
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Optional: Separate credentials for Contacts (if needed)
# GOOGLE_CONTACTS_CLIENT_ID=...
# GOOGLE_CONTACTS_CLIENT_SECRET=...

# No longer needed - tokens stored in database
# GOOGLE_CONTACTS_REFRESH_TOKEN=...
```

---

## Testing

1. **Unauthenticated State:**
   - Visit `/installers/new`
   - Should see yellow warning banner
   - Click "Authenticate Google Contacts"
   - Should redirect to Google OAuth

2. **Authentication:**
   - Sign in to Google
   - Grant contacts permission
   - Should redirect back with success message
   - Warning banner should disappear

3. **Register Installer:**
   - Fill form and submit
   - Check terminal logs for: `✓ Google contact created: people/...`
   - Verify contact appears at https://contacts.google.com

4. **Persistence:**
   - Refresh page → Green success message should still show
   - Auth persists across sessions (stored in database)

---

## Troubleshooting

### "Redirect URI mismatch"
- Ensure `http://localhost:3000/api/google-auth/callback` is added to authorized redirect URIs in Google Cloud Console
- Check that redirect URI exactly matches (including http vs https)

### "Access blocked: This app's request is invalid"
- Make sure People API is enabled
- Verify OAuth consent screen is configured
- Add your email as a test user

### "No active Google auth found"
- User hasn't authenticated yet
- Yellow warning banner should appear
- Click authenticate button

### Contact Not Creating
- Check terminal logs for detailed error messages
- Verify user has authenticated (green banner shows)
- Check that refresh token is valid (re-authenticate if needed)

---

## Security Notes

- Refresh tokens are encrypted in MongoDB
- Each user has their own token (multi-user support)
- Tokens can be revoked via DELETE `/api/google-auth/status`
- Only authenticated team members can access OAuth flow
- State parameter prevents CSRF attacks

---

## Production Deployment

Before deploying to production:

1. Update authorized redirect URI to production URL:
   ```
   https://yourdomain.com/api/google-auth/callback
   ```

2. Update `NEXTAUTH_URL` in production environment:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   ```

3. Publish OAuth app (move from testing to production in Google Cloud Console)

4. Users will need to re-authenticate in production environment
