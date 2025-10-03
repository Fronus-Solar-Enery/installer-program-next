# Google Contacts API Setup Guide

## Error: `unauthorized_client`

This error means your Google Contacts refresh token is invalid or expired. Follow these steps to fix it:

---

## Step 1: Enable Google People API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (or create a new one)
3. Go to **APIs & Services** → **Library**
4. Search for **"People API"** (this is Google Contacts)
5. Click **Enable**

---

## Step 2: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. If not configured, set up the consent screen:
   - User Type: **External** (or Internal if using Google Workspace)
   - App name: `Installer Program`
   - User support email: Your email
   - Developer contact: Your email
3. Click **Save and Continue**
4. **Scopes**: Click **Add or Remove Scopes**
   - Search for `contacts`
   - Select: `.../auth/contacts` (Read and write contacts)
   - Click **Update** → **Save and Continue**
5. **Test users**: Add your Google account email
6. Click **Save and Continue** → **Back to Dashboard**

---

## Step 3: Create/Update OAuth 2.0 Credentials

### Option A: Use Existing Credentials

If you already have OAuth credentials (`GOOGLE_CONTACTS_CLIENT_ID` and `GOOGLE_CONTACTS_CLIENT_SECRET` in `.env.local`):

1. Go to **APIs & Services** → **Credentials**
2. Find your OAuth 2.0 Client ID
3. Click the edit icon (pencil)
4. Under **Authorized redirect URIs**, add:
   ```
   http://localhost:3000/oauth2callback
   ```
5. Click **Save**

### Option B: Create New Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Installer Program Contacts`
5. **Authorized redirect URIs**: Add
   ```
   http://localhost:3000/oauth2callback
   ```
6. Click **Create**
7. Copy the **Client ID** and **Client Secret**
8. Update `.env.local`:
   ```env
   GOOGLE_CONTACTS_CLIENT_ID=your-client-id-here
   GOOGLE_CONTACTS_CLIENT_SECRET=your-client-secret-here
   ```

---

## Step 4: Generate New Refresh Token

Run the token generator script:

```bash
node scripts/getGoogleContactsToken.js
```

The script will:
1. Display an authorization URL
2. You visit the URL in your browser
3. Sign in with your Google account
4. Grant permissions to access contacts
5. Google redirects you to `http://localhost:3000/oauth2callback?code=XXXXX`
6. Copy the `code=XXXXX` part (everything after `code=`)
7. Paste it into the script prompt
8. The script will display your new refresh token

**Example:**
```
Redirected URL: http://localhost:3000/oauth2callback?code=4/0AVG7fiQ8...xyz

Copy this part: 4/0AVG7fiQ8...xyz
```

---

## Step 5: Update .env.local

The script will output something like:
```
GOOGLE_CONTACTS_REFRESH_TOKEN=1//04abc...xyz
```

Copy this line and replace the existing `GOOGLE_CONTACTS_REFRESH_TOKEN` in your `.env.local` file.

---

## Step 6: Restart Your App

```bash
# Press Ctrl+C to stop the dev server
npm run dev
```

---

## Testing

Try registering a new installer. You should see in the terminal:

```
Creating Google contact for: [Name]
✓ Google contact created: people/c1234567890
```

Check your Google Contacts at https://contacts.google.com to verify the contact was created.

---

## Troubleshooting

### Error: "Access blocked: This app's request is invalid"

**Solution:** Make sure you added your email as a **Test User** in the OAuth consent screen (Step 2).

### Error: "redirect_uri_mismatch"

**Solution:** The redirect URI in the script must exactly match what's configured in Google Cloud Console:
- Script uses: `http://localhost:3000/oauth2callback`
- Make sure this exact URL is added to **Authorized redirect URIs**

### Error: "Invalid grant"

**Solution:** The authorization code expires quickly. Run the script again and paste the code immediately after authorizing.

### Contacts Not Creating

Check the terminal logs:
- If you see `✓ Google contact created: people/...` - Success!
- If you see `⚠ Google contact creation returned null` - Check the error logs above it

---

## Alternative: Disable Google Contacts (Optional)

If you don't need Google Contacts integration, you can remove the credentials from `.env.local`:

```env
# Comment out or remove these lines:
# GOOGLE_CONTACTS_CLIENT_ID=...
# GOOGLE_CONTACTS_CLIENT_SECRET=...
# GOOGLE_CONTACTS_REFRESH_TOKEN=...
```

The app will log a warning but continue to work without creating contacts.

---

## Security Notes

- Never commit `.env.local` to git
- Keep your refresh token private
- Refresh tokens don't expire unless revoked, but they can become invalid if:
  - You change the OAuth consent screen settings
  - You revoke access from your Google Account settings
  - The Google Cloud project is deleted
