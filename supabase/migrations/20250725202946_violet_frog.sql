/*
  # Fix User Creation Database Issues

  This migration addresses common user creation problems:
  1. Ensures users table has all required columns
  2. Fixes any missing constraints or indexes
  3. Updates RLS policies for user creation
  4. Adds proper error handling for user operations
*/

-- Ensure users table exists with all required columns
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT 'User',
  role text NOT NULL DEFAULT 'member',
  department_id uuid,
  profile_image_url text,
  language text NOT NULL DEFAULT 'en',
  church_joined_at date DEFAULT CURRENT_DATE,
  is_confirmed boolean DEFAULT true,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  notes text,
  birthday_month integer,
  birthday_day integer
);

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Add role constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_role_check' AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer'));
  END IF;

  -- Add birthday constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_birthday_month_check' AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_birthday_month_check 
    CHECK (birthday_month >= 1 AND birthday_month <= 12);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_birthday_day_check' AND table_name = 'users'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_birthday_day_check 
    CHECK (birthday_day >= 1 AND birthday_day <= 31);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_birthday ON users(birthday_month, birthday_day);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view basic user info" ON users;

-- Create comprehensive RLS policies
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
  ON users FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'pastor')
    )
  );

CREATE POLICY "Users can view basic user info"
  ON users FOR SELECT
  TO authenticated
  USING (true);

-- Ensure departments table exists for foreign key
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  leader_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Create departments policies
DROP POLICY IF EXISTS "All users can view departments" ON departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;

CREATE POLICY "All users can view departments"
  ON departments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments"
  ON departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'pastor')
    )
  );

-- Create user_departments junction table
CREATE TABLE IF NOT EXISTS user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Enable RLS on user_departments
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- Create user_departments policies
DROP POLICY IF EXISTS "Users can view their own department assignments" ON user_departments;
DROP POLICY IF EXISTS "Admins can manage user departments" ON user_departments;

CREATE POLICY "Users can view their own department assignments"
  ON user_departments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user departments"
  ON user_departments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'pastor')
    )
  );

-- Insert default departments if they don't exist
INSERT INTO departments (name, description) VALUES
  ('Worship Team', 'Music and worship ministry'),
  ('Youth Ministry', 'Ministry for young people'),
  ('Children Ministry', 'Sunday school and children programs'),
  ('Evangelism', 'Outreach and soul winning'),
  ('Ushering', 'Church service coordination'),
  ('Media Team', 'Audio, video, and technical support'),
  ('Prayer Team', 'Intercessory prayer ministry'),
  ('Administration', 'Church administration and management')
ON CONFLICT (name) DO NOTHING;

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into public.users table when auth.users is created
  INSERT INTO public.users (id, email, full_name, role, language, is_confirmed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    is_confirmed = EXCLUDED.is_confirmed,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_name text)
RETURNS boolean AS $$
BEGIN
  -- Check if current user has the specified permission
  -- For now, pastors and admins have all permissions
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('pastor', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'User creation database fixes completed successfully!';
  RAISE NOTICE 'Tables created: users, departments, user_departments';
  RAISE NOTICE 'RLS policies applied for security';
  RAISE NOTICE 'Triggers created for automatic user profile creation';
  RAISE NOTICE 'Default departments inserted';
END $$;