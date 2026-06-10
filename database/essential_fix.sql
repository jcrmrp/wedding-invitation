-- ESSENTIAL FIXES - Run this in Supabase SQL Editor
-- Run each block separately if you get errors

-- Step 1: Add the missing venue column
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS venue VARCHAR(255);

-- Step 2: Make subscription_id nullable
ALTER TABLE weddings ALTER COLUMN subscription_id DROP NOT NULL;