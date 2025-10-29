-- Fix RLS policies for users table
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Allow insert for service role" ON users;

-- Disable RLS for now (we're using our own auth)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS enabled with simpler policies:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "Allow all for authenticated"
--   ON users
--   FOR ALL
--   USING (true)
--   WITH CHECK (true);
