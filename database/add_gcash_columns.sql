-- Add GCash columns to weddings table
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS gcash_number VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS gcash_qr_url VARCHAR(512);

-- Add dress code color + message columns
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_primary_color VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_secondary_color VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_message TEXT;

-- Add other missing columns that may not exist yet
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS state VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS venue VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS entourage JSONB;

-- RLS policies for weddings table (INSERT and UPDATE)
-- Users can insert their own weddings
CREATE POLICY IF NOT EXISTS "Users can insert own weddings" ON weddings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own weddings
CREATE POLICY IF NOT EXISTS "Users can update own weddings" ON weddings
  FOR UPDATE USING (auth.uid() = user_id);

-- Storage bucket setup (run in Supabase Dashboard > Storage if not already done):
-- 1. Create bucket named: wedding-assets  (toggle Public ON)
-- 2. Add RLS policy for INSERT: authenticated users can upload to their own folder
--    WITH CHECK: bucket_id = 'wedding-assets' AND (storage.foldername(name))[1] = auth.uid()::text
-- 3. Add RLS policy for SELECT: public can read
--    USING: bucket_id = 'wedding-assets'
