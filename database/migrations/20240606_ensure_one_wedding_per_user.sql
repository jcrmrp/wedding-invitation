-- Migration: Ensure one wedding per user
-- Run this AFTER cleaning any duplicate weddings rows for the same user_id
-- If you get "duplicate key value violates unique constraint", run the cleanup first:
--   DELETE FROM weddings WHERE id NOT IN (SELECT MIN(id) FROM weddings GROUP BY user_id);

-- Ensure unique weddings per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_weddings_user_id_unique ON weddings(user_id);

-- Keep custom_url unique as well (allow multiple NULLs, only one non-NULL per value)
CREATE UNIQUE INDEX IF NOT EXISTS idx_weddings_custom_url_unique ON weddings(custom_url);

-- Make subscription_id nullable if it's still NOT NULL in your DB
ALTER TABLE weddings ALTER COLUMN subscription_id DROP NOT NULL;
