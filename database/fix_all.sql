-- ============================================================
-- RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- It is safe to run multiple times (all statements are idempotent)
-- ============================================================

-- ── 1. Add ALL missing columns to weddings ──────────────────
ALTER TABLE weddings ALTER COLUMN subscription_id DROP NOT NULL;
ALTER TABLE weddings ALTER COLUMN title SET DEFAULT 'My Wedding';

ALTER TABLE weddings ADD COLUMN IF NOT EXISTS venue                    VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS state                    VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code               VARCHAR(255);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS music_url                VARCHAR(512);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS live_stream_url          VARCHAR(512);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS story                    TEXT;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS plan                     VARCHAR(50);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS template                 VARCHAR(50);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS gcash_number             VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS gcash_qr_url             VARCHAR(512);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_primary_color   VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_secondary_color VARCHAR(20);
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS dress_code_message       TEXT;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS entourage                JSONB;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS rsvp_deadline            DATE;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS guest_photo_wall_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE weddings ADD COLUMN IF NOT EXISTS photobooth_enabled       BOOLEAN DEFAULT FALSE;

-- ── 2. RLS policies for users table ────────────────────────
DROP POLICY IF EXISTS "Users can insert own profile"  ON users;
DROP POLICY IF EXISTS "Users can read own profile"    ON users;
DROP POLICY IF EXISTS "Users can update own profile"  ON users;

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- ── 3. RLS policies for weddings table ─────────────────────
DROP POLICY IF EXISTS "Users can insert own weddings"       ON weddings;
DROP POLICY IF EXISTS "Users can update own weddings"       ON weddings;
DROP POLICY IF EXISTS "Users can see own weddings"          ON weddings;
DROP POLICY IF EXISTS "Anyone can view published weddings"  ON weddings;

CREATE POLICY "Users can insert own weddings" ON weddings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own weddings" ON weddings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can see own weddings" ON weddings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published weddings" ON weddings
  FOR SELECT USING (is_published = TRUE);

-- ── 4. photos RLS (safe to re-run) ─────────────────────────
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view photos of published weddings" ON photos;
DROP POLICY IF EXISTS "Users can view own photos"                    ON photos;
DROP POLICY IF EXISTS "Users can insert own photos"                  ON photos;
DROP POLICY IF EXISTS "Users can update own photos"                  ON photos;
DROP POLICY IF EXISTS "Users can delete own photos"                  ON photos;

CREATE POLICY "Anyone can view photos of published weddings" ON photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM weddings WHERE weddings.id = photos.wedding_id AND weddings.is_published = TRUE)
  );

CREATE POLICY "Users can view own photos" ON photos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM weddings WHERE weddings.id = photos.wedding_id AND weddings.user_id = auth.uid())
  );

CREATE POLICY "Users can insert own photos" ON photos
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM weddings WHERE weddings.id = photos.wedding_id AND weddings.user_id = auth.uid())
  );

CREATE POLICY "Users can update own photos" ON photos
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM weddings WHERE weddings.id = photos.wedding_id AND weddings.user_id = auth.uid())
  );

CREATE POLICY "Users can delete own photos" ON photos
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM weddings WHERE weddings.id = photos.wedding_id AND weddings.user_id = auth.uid())
  );
