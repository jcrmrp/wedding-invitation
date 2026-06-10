-- Complete fix for wedding invitation platform
-- This adds missing columns AND fixes RLS policies

-- Step 1: Add missing columns to weddings table
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS music_url VARCHAR(512);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS story TEXT;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS plan VARCHAR(50);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS template VARCHAR(50);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS rsvp_deadline DATE;

-- Step 2: Make subscription_id optional for dev accounts
ALTER TABLE weddings ALTER COLUMN subscription_id DROP NOT NULL;

-- Step 3: RLS policies for photos table (so public can view photos of published weddings)
-- First enable RLS on photos if not already enabled
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS policies for weddings table (INSERT and UPDATE for authenticated users)
CREATE POLICY IF NOT EXISTS "Users can insert own weddings" ON weddings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own weddings" ON weddings
  FOR UPDATE USING (auth.uid() = user_id);

-- Allow anyone to view photos of published weddings
CREATE POLICY IF NOT EXISTS "Anyone can view photos of published weddings" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.is_published = TRUE
    )
  );

-- Allow users to manage their own photos
CREATE POLICY IF NOT EXISTS "Users can view own photos" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can insert own photos" ON photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can update own photos" ON photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Users can delete own photos" ON photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );
