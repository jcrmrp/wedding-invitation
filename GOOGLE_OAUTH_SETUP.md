# Google OAuth Setup Guide

## Why Google Login Isn't Working

Google Sign-In requires configuration in **TWO places**:
1. Google Cloud Console (to create OAuth credentials)
2. Supabase Dashboard (to enable Google provider)

## 🔧 Step-by-Step Setup

### Part 1: Google Cloud Console Setup

#### Step 1.1: Create Google Cloud Project

1. Go to https://console.cloud.google.com
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Name: `Wedding Invitation App`
5. Click **"Create"**

#### Step 1.2: Enable Google+ API

1. In your new project, go to **APIs & Services** → **Library**
2. Search for "Google+ API"
3. Click on it and click **"Enable"**

#### Step 1.3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
3. If prompted, click **"CONFIGURE CONSENT SCREEN"** first:
   - User Type: **External**
   - App name: `Wedding Invitation`
   - User support email: your email
   - Developer contact: your email
   - Click **"SAVE AND CONTINUE"** through all steps
4. Back to **Credentials** → **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. Application type: **"Web application"**
6. Name: `Wedding Invitation Web Client`
7. **Authorized redirect URIs** - Add these EXACTLY:
   ```
   https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
   http://localhost:3000/dashboard
   http://localhost:3000/login
   ```
   
   **Replace `YOUR-PROJECT-ID` with your actual Supabase project ID**
   
   Example: `https://fbvrvfpcieygopprokju.supabase.co/auth/v1/callback`

8. Click **"Create"**
9. **IMPORTANT:** Copy the **Client ID** and **Client Secret**
   - Client ID looks like: `123456789-abc.apps.googleusercontent.com`
   - Client Secret looks like: `GOCSPX-abc123xyz`

### Part 2: Supabase Dashboard Setup

#### Step 2.1: Get Your Supabase Project ID

1. Go to https://supabase.com/dashboard
2. Open your project (or create one if needed)
3. Go to **Settings** (gear icon) → **API**
4. Copy your **Project URL**:
   - Example: `https://fbvrvfpcieygopprokju.supabase.co`
   - The project ID is: `fbvrvfpcieygopprokju`

#### Step 2.2: Enable Google Provider

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** in the list
3. Click to expand it
4. Toggle **"Enable Sign in with Google"** to ON
5. Paste your Google credentials:
   - **Client ID (for OAuth):** Paste from Google Cloud Console
   - **Client Secret (for OAuth):** Paste from Google Cloud Console
6. Click **"Save"**

#### Step 2.3: Configure Site URL

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. **Site URL:** Set to your main URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. **Redirect URLs:** Add these:
   ```
   http://localhost:3000/dashboard
   http://localhost:3000/login
   https://your-domain.com/dashboard
   https://your-domain.com/login
   ```
4. Click **"Save"**

### Part 3: Update Your Code

I've already added better error logging. Now let's verify the redirect URL is correct:

**Check `frontend/src/pages/Login.tsx`:**
```typescript
const redirectUrl = `${window.location.origin}/dashboard`;
```

This should work, but let's add more detailed error messages:

## 🐛 Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause:** The redirect URL in Google Cloud Console doesn't match exactly.

**Solution:**
1. Check the exact URL in the error message
2. Add that exact URL to Google Cloud Console → Credentials → OAuth Client → Authorized redirect URIs
3. Make sure there are no trailing slashes
4. Make sure http vs https matches

### Error: "Access blocked: This app's request is invalid"

**Cause:** OAuth consent screen not configured properly.

**Solution:**
1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Make sure app is configured (even if unverified)
3. Add test users if app is in testing mode

### Error: "DNS_PROBE_FINISHED_NXDOMAIN"

**Cause:** Supabase project is paused or deleted.

**Solution:**
1. Go to https://supabase.com/dashboard
2. Check if your project exists
3. If paused, click "Restore"
4. If deleted, create a new project and update credentials

### Error: "Invalid API key"

**Cause:** Wrong Supabase credentials in `.env` files.

**Solution:**
1. Go to Supabase dashboard → Settings → API
2. Copy the **anon/public key** (starts with `sb_publishable_`)
3. Update `frontend/.env.local` with the correct key
4. Update `backend/.env` with the correct key

### Error: "Provider is not enabled"

**Cause:** Google provider not enabled in Supabase.

**Solution:**
1. Go to Supabase dashboard → Authentication → Providers
2. Find Google
3. Toggle it ON
4. Enter your Google Client ID and Secret
5. Save

## ✅ Testing Google Login

### Test 1: Check Supabase Connection

Open browser console (F12) and run:
```javascript
import { supabase } from './src/supabaseClient'
console.log('Supabase URL:', supabase.supabaseUrl)
```

Should show your Supabase URL, not an error.

### Test 2: Check Google Provider Status

In Supabase dashboard:
1. Go to **Authentication** → **Providers**
2. Google should show as **"Enabled"**
3. Client ID and Secret should be filled in

### Test 3: Test Login Flow

1. Go to http://localhost:3000/login
2. Open browser console (F12)
3. Click "Continue with Google"
4. Watch console for logs:
   - Should see: `🔐 Google login redirect URL: http://localhost:3000/dashboard`
   - Should redirect to Google login page
   - After login, should redirect back to `/dashboard`

### Test 4: Check for Errors

If it fails, check console for:
- `❌ Google login error:` - Shows the specific error
- Network tab - Check if requests to Supabase are going through
- Application tab → Cookies - Check if Supabase session is set

## 📋 Complete Checklist

Before testing, verify:

- [ ] Supabase project is active (not paused)
- [ ] Google OAuth credentials created in Google Cloud Console
- [ ] Redirect URIs added in Google Cloud Console (exact match!)
- [ ] Google provider enabled in Supabase
- [ ] Google Client ID and Secret entered in Supabase
- [ ] Site URL configured in Supabase
- [ ] Redirect URLs added in Supabase
- [ ] Correct Supabase credentials in `.env` files
- [ ] App is running: `npm run dev`
- [ ] Browser console open to see logs

## 🔍 Debug Mode

To see detailed logs, open browser console and you'll see:

```
🔐 Google login redirect URL: http://localhost:3000/dashboard
```

If you see an error:
```
❌ Google login error: [error details]
```

Common errors and solutions:

1. **"redirect_uri_mismatch"**
   - Add the exact redirect URL to Google Cloud Console

2. **"access_blocked"**
   - Configure OAuth consent screen in Google Cloud Console

3. **"provider_not_enabled"**
   - Enable Google provider in Supabase dashboard

4. **"invalid_api_key"**
   - Check your Supabase credentials in `.env` files

5. **"network_error"**
   - Supabase project might be paused - check Supabase dashboard

## 🚀 Quick Test

After setup, test with this flow:

1. Start app: `cd frontend && npm run dev`
2. Go to: http://localhost:3000/login
3. Click "Continue with Google"
4. Sign in with your Google account
5. Should redirect to `/dashboard`
6. Should see the dashboard (not an error)

## 📞 Still Not Working?

If Google login still doesn't work:

1. **Check Supabase logs:**
   - Go to Supabase dashboard → Logs → Auth logs
   - Look for failed login attempts
   - Check error messages

2. **Check Google Cloud Console logs:**
   - Go to Google Cloud Console → APIs & Services → Dashboard
   - Look for errors or quota issues

3. **Verify URLs match EXACTLY:**
   - No trailing slashes
   - Correct protocol (http vs https)
   - Correct port numbers
   - Case-sensitive

4. **Try incognito mode:**
   - Sometimes browser extensions interfere
   - Try in incognito/private window

5. **Check browser console:**
   - F12 → Console tab
   - Look for red errors
   - Share the exact error message

## 📝 Example Configuration

### Google Cloud Console Redirect URIs:
```
https://abc123.supabase.co/auth/v1/callback
http://localhost:3000/dashboard
http://localhost:3000/login
```

### Supabase URL Configuration:
- **Site URL:** `http://localhost:3000`
- **Redirect URLs:**
  - `http://localhost:3000/dashboard`
  - `http://localhost:3000/login`

### frontend/.env.local:
```env
VITE_SUPABASE_URL=https://abc123.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

### backend/.env:
```env
SUPABASE_URL=https://abc123.supabase.co
SUPABASE_ANON_KEY=sb_publishable_xxxxx
```

## ⚠️ Important Notes

1. **Supabase must be active** - If paused, nothing will work
2. **URLs must match EXACTLY** - Including http/https, ports, trailing slashes
3. **Google OAuth takes 5-10 minutes** to activate after creation
4. **First time** you may see "unverified app" - This is normal, click "Advanced" → "Go to app"
5. **Test users** - If app is in testing mode, only added test users can sign in