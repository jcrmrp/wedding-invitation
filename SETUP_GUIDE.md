# Wedding Invitation App - Setup Guide

## ⚠️ IMPORTANT: Supabase Connection Issue

The current Supabase URL (`fbvrvfpcieygopprokju.supabase.co`) is returning a DNS error. This means the project is either:
- Deleted
- Paused (Supabase pauses free tier projects after 7 days of inactivity)
- The URL is incorrect

## 🔧 How to Fix

### Option 1: Check if Project is Paused (Most Likely)

1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Look for the project `fbvrvfpcieygopprokju`
4. If it shows as "Paused", click "Restore" or "Resume"
5. Wait 2-3 minutes for it to become active
6. Try accessing the app again

### Option 2: Create a New Supabase Project

If the project was deleted or you can't access it:

#### Step 1: Create New Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Choose your organization
4. Enter project name: `wedding-invitation`
5. Set a strong database password (save this!)
6. Choose a region close to you
7. Click "Create new project"
8. Wait 2-3 minutes for setup to complete

#### Step 2: Get Your New Credentials
1. In your new project, go to **Settings** (gear icon)
2. Click **API** in the left sidebar
3. Copy these values:
   - **Project URL** (e.g., `https://xyzabc123.supabase.co`)
   - **anon/public key** (starts with `sb_publishable_...`)
   - **service_role key** (starts with `eyJ...` - keep this secret!)

#### Step 3: Update Environment Variables

**Update `backend/.env`:**
```env
SUPABASE_URL=https://your-new-project.supabase.co
SUPABASE_ANON_KEY=sb_publishable_your_new_key_here
SUPABASE_SERVICE_ROLE_KEY=your_new_service_role_key
```

**Update `frontend/.env.local`:**
```env
VITE_SUPABASE_URL=https://your-new-project.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_your_new_key_here
```

#### Step 4: Set Up Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the contents of `database/schema.sql`
4. Click **Run** to execute the SQL
5. You should see "Success. No rows returned"

If you get errors, run the migration files in order:
```bash
# In Supabase SQL Editor, run these in order:
database/complete_migration.sql
database/guest_management_enhancements.sql
```

#### Step 5: Enable Realtime (Critical for Live Updates)

1. In Supabase dashboard, go to **Database** → **Replication**
2. Find the `weddings` table
3. Toggle **Realtime** to ON
4. This enables the live sync between dashboard and invitation page

#### Step 6: Configure Storage (For QR Codes)

1. In Supabase dashboard, go to **Storage**
2. Click **Create a new bucket**
3. Name: `wedding-assets`
4. Set as **Public bucket**
5. Click **Create bucket**
6. Go to **Storage Policies** for this bucket
7. Add policy to allow public uploads:
   ```sql
   CREATE POLICY "Public Uploads"
   ON storage.objects FOR INSERT
   TO public
   WITH CHECK (bucket_id = 'wedding-assets');
   ```

#### Step 7: Configure Google OAuth (For Google Sign-In)

1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   - `https://your-new-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/dashboard` (for development)
7. Copy the **Client ID** and **Client Secret**

8. Go back to Supabase dashboard → **Authentication** → **Providers**
9. Find **Google** and enable it
10. Paste your Google Client ID and Client Secret
11. Save

#### Step 8: Update Frontend URLs

If you're deploying to a custom domain, update these files:

**`frontend/.env.local`:**
```env
VITE_API_URL=https://your-backend-url.com/api
```

**`backend/.env`:**
```env
FRONTEND_URL=https://your-frontend-domain.com
BACKEND_URL=https://your-backend-domain.com
```

## 🚀 Quick Start After Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

2. **Start development server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open browser:**
   - Go to http://localhost:3000
   - Sign in with developer email: `mr.johnlester.domingo@gmail.com`
   - You should bypass payment and see the dashboard

## ✅ Verification Checklist

After setup, verify these work:

- [ ] Can access Supabase dashboard
- [ ] Can sign in with Google
- [ ] Can sign in with email/password
- [ ] Dashboard loads without errors
- [ ] Can edit invitation details
- [ ] Can save changes
- [ ] Live invitation page loads at `/invite/your-names`
- [ ] Changes in dashboard appear on live page (real-time)
- [ ] Can upload QR code for GCash
- [ ] Open Graph preview works (use Facebook Debugger)

## 🐛 Common Issues

### "DNS_PROBE_FINISHED_NXDOMAIN"
**Solution:** Project is paused or deleted. Follow Option 1 or 2 above.

### "Invalid API key"
**Solution:** Copy the correct keys from Supabase dashboard → Settings → API

### "Table doesn't exist"
**Solution:** Run the SQL schema files in Supabase SQL Editor

### "Realtime not working"
**Solution:** Enable Realtime in Supabase → Database → Replication → Enable for `weddings` table

### "Google Sign-In not working"
**Solution:** 
1. Check Google OAuth credentials are correct
2. Verify redirect URIs in Google Console
3. Enable Google provider in Supabase Auth

### "Can't upload QR code"
**Solution:** Create `wedding-assets` storage bucket and enable public access

## 📞 Support

If you still have issues:
1. Check browser console for specific error messages
2. Verify all environment variables are correct
3. Ensure Supabase project is active (not paused)
4. Check Supabase logs in dashboard → Logs

## 🔗 Useful Links

- Supabase Dashboard: https://supabase.com/dashboard
- Supabase Docs: https://supabase.com/docs
- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Google Cloud Console: https://console.cloud.google.com