-- Fix RLS for public viewing
-- First, allow anyone to view published weddings and their photos

-- Policy for photos: Allow viewing photos of published weddings
CREATE POLICY "Anyone can view photos of published weddings" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.is_published = TRUE
    )
  );

-- Also make sure we have policies for users to manage their own photos
CREATE POLICY "Users can view own photos" ON photos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own photos" ON photos
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own photos" ON photos
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own photos" ON photos
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM weddings 
      WHERE weddings.id = photos.wedding_id 
      AND weddings.user_id = auth.uid()
    )
  );

-- Optional: If you want to temporarily disable RLS for testing (not recommended for production)
-- ALTER TABLE weddings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE photos DISABLE ROW LEVEL SECURITY;
