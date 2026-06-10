-- Add ALL missing columns to weddings table for complete functionality
-- Run this in Supabase SQL Editor

-- Basic columns
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS couple_names VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS wedding_date DATE;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS venue VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS state VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS story TEXT;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS music_url VARCHAR(512);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS live_stream_url VARCHAR(512);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS plan VARCHAR(50);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS custom_url VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;

-- GCash columns
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS gcash_number VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS gcash_qr_url VARCHAR(512);

-- Dress code color columns
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_primary_color VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_secondary_color VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_message TEXT;

-- Entourage
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS entourage JSONB;

-- Feature flags
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS guest_photo_wall_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS photobooth_enabled BOOLEAN DEFAULT FALSE;

-- RSVP deadline
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS rsvp_deadline DATE;

-- Storage bucket setup (run in Supabase Dashboard > Storage if not already done):
-- 1. Create bucket named: wedding-assets  (toggle Public ON)
-- 2. Add RLS policy for INSERT: authenticated users can upload to their own folder
--    WITH CHECK: bucket_id = 'wedding-assets' AND (storage.foldername(name))[1] = auth.uid()::text
-- 3. Add RLS policy for SELECT: public can read
--    USING: bucket_id = 'wedding-assets'