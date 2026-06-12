-- Fix: Allow users to insert their own profile, and ensure subscriptions/notifications policies exist

-- Users: allow insert during signup
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions: allow users to read and insert their own
CREATE POLICY IF NOT EXISTS "Users can insert own subscriptions" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: allow read and insert
CREATE POLICY IF NOT EXISTS "Users can insert own notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can read own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
