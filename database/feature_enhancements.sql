-- Feature Enhancements Migration
-- Run in Supabase SQL Editor to support all new features
-- Seating Chart, Live Stream, Guest Photo Wall, Collaboration, Image Editing, Guest Categorization

-- 1. WEDDINGS table additions
ALTER TABLE weddings
  ADD COLUMN IF NOT EXISTS live_stream_url VARCHAR(512),
  ADD COLUMN IF NOT EXISTS guest_photo_wall_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS photobooth_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rsvp_deadline DATE,
  ADD COLUMN IF NOT EXISTS collaborators JSONB DEFAULT '[]';

-- 2. Create SEATING_CHARTS table
CREATE TABLE IF NOT EXISTS seating_charts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  table_number INT NOT NULL,
  table_name VARCHAR(255),
  shape VARCHAR(50) DEFAULT 'round',
  capacity INT DEFAULT 8,
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0,
  color VARCHAR(20) DEFAULT '#b07f56',
  guests JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create GUEST_CATEGORIES table (for grouping guests)
CREATE TABLE IF NOT EXISTS guest_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(20) DEFAULT '#b07f56',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Add guest category reference
ALTER TABLE guests
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES guest_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS exchange_photo_url VARCHAR(512),
  ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP;

-- 5. Create GUEST_PHOTOS table (for guest photo wall)
CREATE TABLE IF NOT EXISTS guest_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wedding_id UUID NOT NULL REFERENCES weddings(id) ON DELETE CASCADE,
  guest_id UUID REFERENCES guests(id) ON DELETE CASCADE,
  guest_name VARCHAR(255) NOT NULL,
  image_url VARCHAR(512) NOT NULL,
  caption TEXT,
  display_order INT DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create TEMPLATE_RATINGS / RECOMMENDATIONS table
CREATE TABLE IF NOT EXISTS template_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  wedding_id UUID REFERENCES weddings(id) ON DELETE CASCADE,
  recommended_template VARCHAR(255),
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create indexes
CREATE INDEX IF NOT EXISTS idx_seating_wedding ON seating_charts(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guest_photos_wedding ON guest_photos(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guest_photos_guest ON guest_photos(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_categories_wedding ON guest_categories(wedding_id);
CREATE INDEX IF NOT EXISTS idx_guests_category ON guests(category_id);
CREATE INDEX IF NOT EXISTS idx_template_recs_wedding ON template_recommendations(wedding_id);

-- 8. RLS Policies
ALTER TABLE seating_charts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_recommendations ENABLE ROW LEVEL SECURITY;

-- Seating charts: public read for published weddings, owner CRUD
DROP POLICY IF EXISTS "Anyone can view seating charts for published weddings" ON seating_charts;
CREATE POLICY "Anyone can view seating charts for published weddings"
  ON seating_charts FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = seating_charts.wedding_id
      AND weddings.is_published = TRUE
    )
  );
DROP POLICY IF EXISTS "Owners can manage seating charts" ON seating_charts;
CREATE POLICY "Owners can manage seating charts"
  ON seating_charts FOR ALL USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = seating_charts.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Guest categories: owner only
DROP POLICY IF EXISTS "Owners can manage guest categories" ON guest_categories;
CREATE POLICY "Owners can manage guest categories"
  ON guest_categories FOR ALL USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_categories.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Guest photos: public read for approved photos, public insert, owner approve/delete
DROP POLICY IF EXISTS "Anyone can view approved guest photos" ON guest_photos;
CREATE POLICY "Anyone can view approved guest photos"
  ON guest_photos FOR SELECT USING (is_approved = TRUE);
DROP POLICY IF EXISTS "Anyone can upload guest photos" ON guest_photos;
CREATE POLICY "Anyone can upload guest photos"
  ON guest_photos FOR INSERT WITH CHECK (true);
-- NOTE: If uploads still fail, temporarily disable RLS on guest_photos:
-- ALTER TABLE guest_photos DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owners can manage all guest photos" ON guest_photos;
CREATE POLICY "Owners can manage all guest photos"
  ON guest_photos FOR ALL USING (
    EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = guest_photos.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );

-- Template recommendations: owner only
DROP POLICY IF EXISTS "Owners can view template recommendations" ON template_recommendations;
CREATE POLICY "Owners can view template recommendations"
  ON template_recommendations FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM weddings
      WHERE weddings.id = template_recommendations.wedding_id
      AND weddings.user_id = auth.uid()
    )
  );
DROP POLICY IF EXISTS "System can insert template recommendations" ON template_recommendations;
CREATE POLICY "System can insert template recommendations"
  ON template_recommendations FOR INSERT WITH CHECK (true);

-- 9. Enable realtime for important tables
ALTER PUBLICATION supabase_realtime ADD TABLE seating_charts;
ALTER PUBLICATION supabase_realtime ADD TABLE guest_photos;

-- Note: Storage bucket policies must be configured in Supabase Dashboard at:
-- Storage → Buckets → wedding-assets → Policies
-- Create two policies:
-- 1. INSERT: WITH CHECK (true) - Allow anyone to upload
-- 2. SELECT: USING (true) - Allow anyone to read
