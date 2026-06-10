-- Add missing columns to weddings table
-- Add music_url column
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS music_url VARCHAR(512);

-- Add story column
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS story TEXT;

-- Add plan column
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS plan VARCHAR(50);

-- Add template column
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS template VARCHAR(50);

-- Add RSVP deadline column
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS rsvp_deadline DATE;

-- Make subscription_id optional (so dev accounts don't need it)
ALTER TABLE weddings ALTER COLUMN subscription_id DROP NOT NULL;
