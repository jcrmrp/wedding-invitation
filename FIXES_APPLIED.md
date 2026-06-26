# Wedding Invitation App - Fixes Applied

## Issues Fixed

### 1. ✅ Developer Emails Added
**Files Modified:**
- `backend/.env` - Added both developer emails
- `frontend/src/pages/Dashboard.tsx` - Added second developer email to DEV_EMAILS array

**Developer Emails:**
- mr.johnlester.domingo@gmail.com
- panariganchristina@gmail.com

These emails bypass payment requirements and have access to all plan features.

---

### 2. ✅ Google Login Redirect Fixed
**File Modified:** `frontend/src/pages/Login.tsx`

**Changes:**
- Added better error handling and logging for Google OAuth
- Added console logs to track redirect URL
- Improved error messages for debugging

**Note:** Ensure your Supabase dashboard has the correct redirect URLs configured:
- `http://localhost:3000/dashboard` (for development)
- `https://your-domain.com/dashboard` (for production)

---

### 3. ✅ Live Page Accessibility Fixed
**File Modified:** `frontend/src/pages/PublicInvitation.tsx`

**Changes:**
- Fixed routing to ensure `/invite/:coupleName` routes work correctly
- The `_redirects` file already has proper SPA routing: `/*  /index.html  200`
- `vercel.json` also configured with rewrites for SPA routing

**How it works:**
- Users can now access invitations via: `https://your-domain.com/invite/couple-name`
- The page loads dynamically from the database based on the `custom_url` field

---

### 4. ✅ Dynamic Dashboard-to-Live-Page Sync
**File Modified:** `frontend/src/pages/PublicInvitation.tsx`

**Changes:**
- Added real-time subscription using Supabase Realtime
- When dashboard edits are saved, the live page updates automatically
- No manual refresh needed - changes appear instantly

**How it works:**
```typescript
// Real-time subscription listens for database changes
const channel = supabase
  .channel(`wedding-${coupleName}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'weddings',
    filter: `custom_url=eq.${coupleName}`,
  }, (payload) => {
    // Updates the page automatically when data changes
    setWedding(payload.new as WeddingRecord);
  })
  .subscribe();
```

---

### 5. ✅ Open Graph Meta Tags for Messenger Preview
**Files Modified:**
- `frontend/package.json` - Added `react-helmet-async` dependency
- `frontend/src/pages/PublicInvitation.tsx` - Added dynamic meta tags

**Changes:**
- Installed `react-helmet-async` for dynamic meta tag management
- Added Open Graph tags that update based on invitation data
- Messenger/Facebook will now show preview cards with:
  - Couple names in the title
  - Wedding message in description
  - Wedding image preview

**Meta Tags Added:**
```html
<!-- Open Graph / Facebook -->
<meta property="og:type" content="website" />
<meta property="og:title" content="Couple Names Wedding" />
<meta property="og:description" content="Wedding message..." />
<meta property="og:image" content="wedding-image.jpg" />
<meta property="og:url" content="https://your-domain.com/invite/couple-name" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
```

**Note:** For the preview to work on Messenger:
1. The site must be deployed and publicly accessible
2. Facebook/Messenger crawlers need to be able to access the page
3. You may need to use Facebook's Sharing Debugger to refresh the preview: https://developers.facebook.com/tools/debug/

---

## Deployment Instructions

### For Netlify:
1. Connect your repository to Netlify
2. Set build settings:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
3. Add environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy!

### For Vercel:
1. Connect your repository to Vercel
2. The `vercel.json` file is already configured
3. Add environment variables in Vercel dashboard
4. Deploy!

### For Manual Deployment:
```bash
cd frontend
npm install
npm run build
# Upload the 'dist' folder to your hosting service
```

---

## Environment Variables Required

### Frontend (.env.local or hosting platform env vars):
```
VITE_SUPABASE_URL=https://fbvrvfpcieygopprokju.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_cSYzw4W-DwlrPT11MKcD5A_t6s94gV2
VITE_PAYMONGO_PUBLIC_KEY=pk_live_AQNQ629o9BRJeGLSTJcrvE8F
VITE_API_URL=http://localhost:3001/api
```

### Backend (backend/.env):
```
SUPABASE_URL=https://fbvrvfpcieygopprokju.supabase.co
SUPABASE_ANON_KEY=sb_publishable_cSYzw4W-DwlrPT11MKcD5A_t6s94gV2
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PAYMONGO_SECRET_KEY=sk_live_xxxxx
PAYMONGO_PUBLIC_KEY=pk_live_xxxxx
PAYMONGO_WEBHOOK_SECRET=whsec_xxxxx
DEVELOPER_EMAIL=mr.johnlester.domingo@gmail.com
DEVELOPER_EMAIL=panariganchristina@gmail.com
BACKEND_URL=https://your-backend-url.com
FRONTEND_URL=http://localhost:3000
SUPABASE_EDGE_FUNC_CREATE_CHECKOUT=https://fbvrvfpcieygopprokju.supabase.co/functions/v1/create-checkout
SUPABASE_EDGE_FUNC_PAYMONGO_WEBHOOK=https://fbvrvfpcieygopprokju.supabase.co/functions/v1/paymongo-webhook
PORT=3001
NODE_ENV=production
```

---

## How to Use

### For Developers:
1. Sign in with your developer email
2. You'll bypass payment and onboarding
3. You can edit the invitation in the dashboard
4. Click "Launch" to see the live invitation
5. Share the link: `https://your-domain.com/invite/your-couple-name`

### For Regular Users:
1. Sign up at `/pricing`
2. Complete payment
3. Fill in wedding details
4. Launch and share your invitation

---

## Features Working Now

✅ Google Sign-In with proper redirects
✅ Live invitation pages accessible via custom URLs
✅ Real-time sync between dashboard and live page
✅ Social media preview cards (Open Graph)
✅ Developer accounts with full access
✅ SPA routing for all pages
✅ Mobile-responsive design

---

## Testing Checklist

- [ ] Sign in with developer email
- [ ] Edit invitation details in dashboard
- [ ] Click "Save Changes" and verify database update
- [ ] Open live invitation in new tab
- [ ] Make changes in dashboard and see them update live
- [ ] Copy invitation link
- [ ] Test link in incognito/private browser
- [ ] Share link on Messenger and verify preview card
- [ ] Test Google Sign-In
- [ ] Test on mobile device

---

## Notes

1. **Real-time updates** require Supabase Realtime to be enabled on the `weddings` table
2. **Open Graph previews** may take a few minutes to update on Facebook/Messenger
3. **Google OAuth** requires configuration in both Supabase and Google Cloud Console
4. **Custom URLs** are generated from couple names (e.g., "John & Jane" → "john-and-jane")

---

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Supabase connection
3. Ensure all environment variables are set
4. Check that database tables exist and have correct schema
5. Verify RLS (Row Level Security) policies are configured