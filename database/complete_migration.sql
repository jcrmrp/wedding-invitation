-- COMPLETE DATABASE MIGRATION
-- Run this entire script in Supabase SQL Editor (https://supabase.com/dashboard)

-- =============================================================================
-- STEP 1: Add missing columns to weddings table
-- =============================================================================

-- Make subscription_id nullable (allows dev accounts without subscriptions)
ALTER TABLE weddings ALTER COLUMN subscription_id DROP NOT NULL;

-- Add venue column (required for dashboard save)
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS venue VARCHAR(255);

-- Add other required columns
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

-- =============================================================================
-- STEP 2: Add RLS policies for weddings table (INSERT and UPDATE)
-- =============================================================================

-- Users can insert their own weddings (this fixes the 403 error!)
CREATE POLICY IF NOT EXISTS "Users can insert own weddings" 
ON weddings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can update their own weddings
CREATE POLICY IF NOT EXISTS "Users can update own weddings" 
ON weddings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- =============================================================================
-- STEP 3: Add RLS policies for photos table
-- =============================================================================

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Anyone can view photos of published weddings
CREATE POLICY IF NOT EXISTS "Anyone can view photos of published weddings" 
ON photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM weddings 
    WHERE weddings.id = photos.wedding_id 
    AND weddings.is_published = TRUE
  )
);

-- Users can manage their own photos
CREATE POLICY IF NOT EXISTS "Users can view own photos" 
ON photos 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM weddings 
    WHERE weddings.id = photos.wedding_id 
    AND weddings.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can insert own photos" 
ON photos 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM weddings 
    WHERE weddings.id = photos.wedding_id 
    AND weddings.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can update own photos" 
ON photos 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM weddings 
    WHERE weddings.id = photos.wedding_id 
    AND weddings.user_id = auth.uid()
  )
);

CREATE POLICY IF NOT EXISTS "Users can delete own photos" 
ON photos 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM weddings 
    WHERE weddings.id = photos.wedding_id 
    AND weddings.user_id = auth.uid()
  )
);

-- =============================================================================
-- STEP 4: Verify policies were added
-- =============================================================================
-- After running, execute: SELECT * FROM pg_policies WHERE tablename = 'weddings';