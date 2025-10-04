/*
  # Add Pastor Account

  1. New User
    - Creates pastor account for officialezepetervictor@gmail.com
    - Sets up proper role and permissions
    - Configures church association

  2. Security
    - Enables RLS on users table
    - Adds policies for pastor access
*/

-- Insert pastor user account
INSERT INTO users (
  id,
  email,
  full_name,
  role,
  language,
  is_confirmed,
  church_joined_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'officialezepetervictor@gmail.com',
  'Pastor Victor',
  'pastor',
  'en',
  true,
  CURRENT_DATE,
  now(),
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'pastor',
  is_confirmed = true,
  updated_at = now();

-- Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Add pastor access policy if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Pastor full access'
  ) THEN
    CREATE POLICY "Pastor full access"
      ON users
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() AND role = 'pastor'
        )
      );
  END IF;
END $$;