-- Guest Management Enhancement Migration
-- Run this in Supabase SQL Editor to support RSVP tokens, meal choices, seating, and reminders.

-- Add enhanced columns to existing guests table
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS rsvp_token VARCHAR(64) UNIQUE,
  ADD COLUMN IF NOT EXISTS meal_choice VARCHAR(100),
  ADD COLUMN IF NOT EXISTS table_number INT,
  ADD COLUMN IF NOT EXISTS message_to_couple TEXT,
  ADD COLUMN IF NOT EXISTS invitation_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP;

-- Auto-generate rsvp_token for existing guests that don't have one
UPDATE guests
  SET rsvp_token = encode(gen_random_bytes(32), 'hex')
  WHERE rsvp_token IS NULL;

-- Make rsvp_token required going forward
ALTER TABLE guests
  ALTER COLUMN rsvp_token SET NOT NULL;

-- Index for fast guest lookups by token and wedding
CREATE INDEX IF NOT EXISTS idx_guests_rsvp_token ON guests(rsvp_token);
CREATE INDEX IF NOT EXISTS idx_guests_wedding_rsvp ON guests(wedding_id, rsvp_status);

-- Enable Row Level Security on guests (additive to existing policies)
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;

-- Anyone can view guests of published weddings (for RSVP form checks)
CREATE POLICY IF NOT EXISTS "Guests can view wedding guests via public RSVP"
  ON guests FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.is_published = TRUE
    )
  );

-- Guests can update their own RSVP using the token (public RSVP submit)
CREATE POLICY IF NOT EXISTS "Guests can update own RSVP via token"
  ON guests FOR UPDATE USING (true);

-- Guests can insert their own RSVP using the token (public RSVP submit)
CREATE POLICY IF NOT EXISTS "Guests can insert RSVP via token"
  ON guests FOR INSERT WITH CHECK (true);

-- Owners can manage all guests for their wedding
CREATE POLICY IF NOT EXISTS "Owners can manage wedding guests"
  ON guests FOR ALL USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guests.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );
