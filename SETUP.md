# Setup Instructions for Wedding Invitation Platform

Complete step-by-step guide to get your project up and running.

## Prerequisites

Before you start, make sure you have:
- ✅ GitHub account and repository created
- ✅ Supabase account with project created
- ✅ PayMongo account created
- ✅ Node.js installed (v16 or higher)
- ✅ Git installed and configured
- ✅ VS Code or your preferred code editor

## Part 1: Database Setup (Supabase)

### Step 1: Create Database Tables

1. Go to https://supabase.com and log in
2. Select your **wedding-invitation** project
3. Go to **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. Copy the entire contents from `database/schema.sql`
6. Paste it into the SQL Editor
7. Click **"Run"** button

**Result:** ✅ All 7 database tables created with proper relationships and security policies

### Step 2: Verify Tables

1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - users
   - subscriptions
   - weddings
   - photos
   - guests
   - payments
   - notifications

**Result:** ✅ Database is ready to use

---

## Part 2: Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd wedding-invitation/backend
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- Express.js - Web framework
- TypeScript - Type safety
- Supabase client - Database
- dotenv - Environment variables
- CORS - Cross-origin support

### Step 3: Set Up Environment Variables

```bash
cp .env.example .env
```

Now edit `.env` file and fill in your keys:

```
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
PAYMONGO_SECRET_KEY=sk_test_xxxxx
PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
PORT=3000
NODE_ENV=development
```

**Where to find these:**
- **SUPABASE_URL:** Supabase → Settings → API → Project URL
- **SUPABASE_ANON_KEY:** Supabase → Settings → API → anon public
- **SUPABASE_SERVICE_ROLE_KEY:** Supabase → Settings → API → service_role
- **PAYMONGO_SECRET_KEY:** PayMongo → Developers → API Keys → Secret Key
- **PAYMONGO_PUBLIC_KEY:** PayMongo → Developers → API Keys → Public Key

### Step 4: Start Backend Server

```bash
npm run dev
```

**Expected output:**
```
🚀 Server running on http://localhost:3000
📝 API available at http://localhost:3000/api
```

### Step 5: Test Backend

In your browser, visit:
- http://localhost:3000/api/health

You should see:
```json
{
  "status": "ok",
  "timestamp": "2026-05-24T04:15:00.000Z"
}
```

**Result:** ✅ Backend is running!

---

## Part 3: Frontend Setup

### Step 1: Open New Terminal

Keep the backend running and open a **new terminal window**

### Step 2: Navigate to Frontend Directory

```bash
cd wedding-invitation/frontend
```

### Step 3: Install Dependencies

```bash
npm install
```

This installs:
- Next.js - React framework
- React 18 - UI library
- TypeScript - Type safety
- Tailwind CSS - Styling
- Supabase client - Database
- Axios - HTTP requests

### Step 4: Set Up Environment Variables

```bash
cp .env.example .env.local
```

Now edit `.env.local` file and fill in your keys:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY=pk_test_xxxxx
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

**Where to find these:**
- **NEXT_PUBLIC_SUPABASE_URL:** Supabase → Settings → API → Project URL
- **NEXT_PUBLIC_SUPABASE_ANON_KEY:** Supabase → Settings → API → anon public
- **NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY:** PayMongo → Developers → API Keys → Public Key
- **NEXT_PUBLIC_API_URL:** http://localhost:3000/api (local development)

### Step 5: Start Frontend Server

```bash
npm run dev
```

**Expected output:**
```
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
  ✓ Ready in 2.5s
```

### Step 6: View Application

In your browser, visit:
- http://localhost:3000

You should see:
```
💍 Wedding Invitation Hub
Your digital invitation platform
[Get Started]
```

**Result:** ✅ Frontend is running!

---

## Part 4: Verification Checklist

### Terminal 1 (Backend)
```bash
cd backend && npm run dev
# Should show: 🚀 Server running on http://localhost:3000
```

### Terminal 2 (Frontend)
```bash
cd frontend && npm run dev
# Should show: ✓ Ready in X.Xs
```

### In Browser

- [ ] Visit http://localhost:3000 - See home page
- [ ] Visit http://localhost:3000/api/health - See JSON response
- [ ] Check browser console (F12) - No red errors
- [ ] Check network tab - No failed requests

### In Supabase Dashboard

- [ ] Go to Table Editor
- [ ] See all 7 tables
- [ ] See no errors in logs

---

## Part 5: Git Setup

### Initialize Git Repository

```bash
cd wedding-invitation
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### Create Initial Commit

```bash
git add .
git commit -m "chore: initial project setup"
git push origin main
```

### View on GitHub

Visit: https://github.com/jcrmrp/wedding-invitation

You should see:
- ✅ All files pushed
- ✅ Main branch with commits
- ✅ README.md visible

---

## Troubleshooting

### Backend Issues

**Error: "Port 3000 already in use"**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change PORT in .env
PORT=3001
```

**Error: "Cannot find module"**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Error: "Supabase connection failed"**
- Check if SUPABASE_URL is correct
- Check if SUPABASE_SERVICE_ROLE_KEY is correct (not anon key)
- Make sure Supabase project is active

### Frontend Issues

**Error: "next dev won't start"**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

**Error: "Cannot reach backend API"**
- Check if backend is running on http://localhost:3000
- Check if NEXT_PUBLIC_API_URL in .env.local is correct
- Check browser console for CORS errors

**Error: "Tailwind CSS not loading"**
```bash
# Rebuild Tailwind
npm run build
npm start
```

### Database Issues

**Error: "Table does not exist"**
- Go to Supabase SQL Editor
- Copy schema.sql again
- Make sure no errors when running

**Error: "RLS policy blocked"**
- This is normal during development
- We'll configure auth in Phase 2

---

## Next Steps

Now that your environment is set up:

### 1. Test the Health Check
```bash
curl http://localhost:3000/api/health
```

### 2. Explore the Code
- Backend: `backend/src/index.ts`
- Frontend: `frontend/app/page.tsx`
- Database: `database/schema.sql`

### 3. Start Building Features
We'll start with:
1. **User Authentication** (Sign up, Login, Logout)
2. **Wedding CRUD** (Create, Read, Update, Delete)
3. **Photo Gallery** (Upload, Manage)
4. **RSVP System** (Guest tracking)
5. **Payments** (PayMongo integration)

### 4. Check Documentation
- Backend docs: `backend/README.md`
- Frontend docs: `frontend/README.md`
- Main guide: `QUICKSTART.md`

---

## Quick Reference

### Backend Commands
```bash
cd backend
npm install      # Install dependencies
npm run dev      # Start dev server
npm run build    # Build for production
npm start        # Run production build
```

### Frontend Commands
```bash
cd frontend
npm install      # Install dependencies
npm run dev      # Start dev server
npm run build    # Build for production
npm start        # Run production build
```

### Important URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:3000/api
- Supabase: https://supabase.com
- GitHub: https://github.com/jcrmrp/wedding-invitation

### Important Files
- Backend entry: `backend/src/index.ts`
- Frontend home: `frontend/app/page.tsx`
- Database schema: `database/schema.sql`
- Backend config: `backend/.env`
- Frontend config: `frontend/.env.local`

---

## Support

If you run into issues:
1. Check the **Troubleshooting** section above
2. Check individual README files in each folder
3. Review browser console (F12) for errors
4. Check Supabase logs for database errors

---

**✅ Setup Complete! You're ready to start building your Wedding Invitation Platform! 🚀**

Next: We'll implement user authentication and start building the core features.
