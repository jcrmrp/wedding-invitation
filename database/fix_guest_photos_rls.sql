-- Fix guest_photos RLS - Run this in Supabase SQL Editor
-- Step 1: Disable RLS on guest_photos
ALTER TABLE guest_photos DISABLE ROW LEVEL SECURITY;

-- Step 2: Storage bucket RLS must be configured in Supabase Dashboard:
-- Go to Storage > wedding-assets > Policies and remove/recreate policies there
-- OR use SQL Editor > select query: SELECT * FROM storage.buckets WHERE id = 'wedding-assets';