-- Run this SQL in Supabase SQL Editor to fix the save error
-- ============================================================

-- Step 1: Drop existing policies that might conflict (safe to run)
DROP POLICY IF EXISTS "Users can insert own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can update own weddings" ON weddings;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can see own subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can see own weddings" ON weddings;
DROP POLICY IF EXISTS "Anyone can view published weddings" ON weddings;
DROP POLICY IF EXISTS "Anyone can view photos of published weddings" ON photos;

-- Step 2: Add missing columns
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS venue VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS state VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS music_url VARCHAR(512);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS story TEXT;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS plan VARCHAR(50);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS gcash_number VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS gcash_qr_url VARCHAR(512);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_primary_color VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_secondary_color VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_message TEXT;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS entourage JSONB;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS template VARCHAR(50);

-- Make subscription_id nullable (for dev accounts)
ALTER TABLE weddings ALTER COLUMN subscription_id DROP NOT NULL;

-- Step 3: Recreate RLS policies (INSERT fixes the 403 error!)
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can see own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can see own weddings" ON weddings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published weddings" ON weddings
  FOR SELECT USING (is_published = TRUE);

-- THIS IS THE KEY POLICY - fixes your 403 error!
CREATE POLICY "Users can insert own weddings" ON weddings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weddings" ON weddings
  FOR UPDATE USING (auth.uid() = user_id);

-- Photos policies
CREATE POLICY "Anyone can view photos of published weddings" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.is_published = TRUE
    )
  );

CREATE POLICY "Users can view own photos" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own photos" ON photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own photos" ON photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own photos" ON photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );