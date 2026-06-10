-- FINAL COMPLETE FIX - Run ALL at once
-- ====================================

BEGIN;

-- Drop the unique constraint on user_id (recreate after cleanup)
ALTER TABLE weddings DROP CONSTRAINT IF EXISTS weddings_user_id_unique;
ALTER TABLE weddings DROP CONSTRAINT IF EXISTS weddings_user_id_key;

-- Also drop custom_url constraint temporarily
ALTER TABLE weddings DROP CONSTRAINT IF EXISTS weddings_custom_url_unique;
ALTER TABLE weddings DROP CONSTRAINT IF EXISTS weddings_custom_url_key;

-- Delete ALL weddings (complete clean)
DELETE FROM weddings;

-- Re-add constraints
ALTER TABLE weddings ADD CONSTRAINT weddings_user_id_key UNIQUE (user_id);
ALTER TABLE weddings ADD CONSTRAINT weddings_custom_url_key UNIQUE (custom_url);

-- Make subscription_id nullable
ALTER TABLE weddings ALTER COLUMN subscription_id DROP NOT NULL;

-- Add the user record
INSERT INTO users (id, email) 
VALUES ('2e9c56ef-a7f1-4023-a6e9-6cf6b9c740c6', 'mr.johnlester.domingo@gmail.com')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- RLS policies
DROP POLICY IF EXISTS "Users can insert own weddings" ON weddings;
CREATE POLICY "Users can insert own weddings" ON weddings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

SELECT 'Database reset complete! Refresh dashboard.';