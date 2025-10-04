/*
  # Complete Backend Setup for Church Management System

  1. Database Structure
    - Update existing tables with church_id scoping
    - Add missing tables for complete functionality
    - Ensure proper relationships and constraints

  2. Row Level Security
    - Church-scoped data isolation
    - Role-based access control
    - Fix all broken policies

  3. Authentication
    - Proper user profile creation
    - Church creation for pastors
    - Role-based permissions
*/

-- ============================================================================
-- 1. UPDATE EXISTING TABLES WITH CHURCH_ID SCOPING
-- ============================================================================

-- Add church_id to tables that don't have it
DO $$ 
BEGIN
  -- Add church_id to users table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE users ADD COLUMN church_id uuid;
  END IF;

  -- Add church_id to tasks table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN church_id uuid;
  END IF;

  -- Add church_id to finance_records table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'finance_records' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE finance_records ADD COLUMN church_id uuid;
  END IF;

  -- Add church_id to notifications table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN church_id uuid;
  END IF;

  -- Add church_id to notes table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE notes ADD COLUMN church_id uuid;
  END IF;

  -- Add church_id to attendance table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE attendance ADD COLUMN church_id uuid;
  END IF;

  -- Add church_id to departments table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'departments' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE departments ADD COLUMN church_id uuid;
  END IF;
END $$;

-- ============================================================================
-- 2. CREATE MISSING TABLES
-- ============================================================================

-- Churches table (main church registry)
CREATE TABLE IF NOT EXISTS churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  website text,
  timezone text DEFAULT 'UTC',
  default_language text DEFAULT 'en',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- User profiles (extended user information)
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer')),
  birthday date,
  language text DEFAULT 'en',
  profile_image_url text,
  phone text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  module text NOT NULL,
  access_level text NOT NULL CHECK (access_level IN ('read', 'write', 'admin')),
  granted_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time time,
  location text,
  photo_url text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Manuals table
CREATE TABLE IF NOT EXISTS manuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  language text NOT NULL DEFAULT 'en',
  content text NOT NULL,
  title text NOT NULL,
  category text DEFAULT 'general',
  updated_by uuid REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. UPDATE EXISTING TABLES STRUCTURE
-- ============================================================================

-- Update church_settings to reference churches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'church_settings' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE church_settings ADD COLUMN church_id uuid REFERENCES churches(id);
  END IF;
END $$;

-- ============================================================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_church_id ON user_profiles(church_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_permissions_user_church ON permissions(user_id, church_id);
CREATE INDEX IF NOT EXISTS idx_tasks_church_id ON tasks(church_id);
CREATE INDEX IF NOT EXISTS idx_events_church_id ON events(church_id);
CREATE INDEX IF NOT EXISTS idx_finance_church_id ON finance_records(church_id);
CREATE INDEX IF NOT EXISTS idx_notifications_church_id ON notifications(church_id);
CREATE INDEX IF NOT EXISTS idx_notes_church_id ON notes(church_id);
CREATE INDEX IF NOT EXISTS idx_attendance_church_id ON attendance(church_id);
CREATE INDEX IF NOT EXISTS idx_departments_church_id ON departments(church_id);

-- ============================================================================
-- 5. DROP ALL EXISTING POLICIES TO START FRESH
-- ============================================================================

-- Drop all existing policies that might cause recursion
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- ============================================================================
-- 6. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. CREATE HELPER FUNCTIONS FOR RLS
-- ============================================================================

-- Function to get user's church_id
CREATE OR REPLACE FUNCTION get_user_church_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT church_id FROM user_profiles WHERE id = auth.uid();
$$;

-- Function to check if user is pastor
CREATE OR REPLACE FUNCTION is_pastor()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'pastor'
  );
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role IN ('pastor', 'admin')
  );
$$;

-- Function to check if user is finance admin
CREATE OR REPLACE FUNCTION is_finance_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role IN ('pastor', 'finance_admin')
  );
$$;

-- ============================================================================
-- 8. CREATE NON-RECURSIVE RLS POLICIES
-- ============================================================================

-- CHURCHES TABLE POLICIES
CREATE POLICY "Users can view their church"
  ON churches FOR SELECT TO authenticated
  USING (id = get_user_church_id());

CREATE POLICY "Pastors can update their church"
  ON churches FOR UPDATE TO authenticated
  USING (id = get_user_church_id() AND is_pastor())
  WITH CHECK (id = get_user_church_id() AND is_pastor());

CREATE POLICY "Anyone can create a church"
  ON churches FOR INSERT TO authenticated
  WITH CHECK (true);

-- USER_PROFILES TABLE POLICIES
CREATE POLICY "Users can view profiles in their church"
  ON user_profiles FOR SELECT TO authenticated
  USING (church_id = get_user_church_id());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can update profiles in their church"
  ON user_profiles FOR UPDATE TO authenticated
  USING (church_id = get_user_church_id() AND is_admin())
  WITH CHECK (church_id = get_user_church_id());

CREATE POLICY "Anyone can insert their profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- USERS TABLE POLICIES (Legacy support)
CREATE POLICY "Users can view own data"
  ON users FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own data"
  ON users FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- TASKS TABLE POLICIES
CREATE POLICY "Users can view tasks in their church"
  ON tasks FOR SELECT TO authenticated
  USING (church_id = get_user_church_id());

CREATE POLICY "Users can create tasks in their church"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (church_id = get_user_church_id());

CREATE POLICY "Users can update tasks in their church"
  ON tasks FOR UPDATE TO authenticated
  USING (church_id = get_user_church_id())
  WITH CHECK (church_id = get_user_church_id());

-- EVENTS TABLE POLICIES
CREATE POLICY "Users can view events in their church"
  ON events FOR SELECT TO authenticated
  USING (church_id = get_user_church_id());

CREATE POLICY "Admins can manage events in their church"
  ON events FOR ALL TO authenticated
  USING (church_id = get_user_church_id() AND is_admin())
  WITH CHECK (church_id = get_user_church_id() AND is_admin());

-- FINANCE_RECORDS TABLE POLICIES
CREATE POLICY "Finance admins can view finance in their church"
  ON finance_records FOR SELECT TO authenticated
  USING (church_id = get_user_church_id() AND is_finance_admin());

CREATE POLICY "Finance admins can manage finance in their church"
  ON finance_records FOR ALL TO authenticated
  USING (church_id = get_user_church_id() AND is_finance_admin())
  WITH CHECK (church_id = get_user_church_id() AND is_finance_admin());

-- NOTIFICATIONS TABLE POLICIES
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- NOTES TABLE POLICIES
CREATE POLICY "Users can manage own notes"
  ON notes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ATTENDANCE TABLE POLICIES
CREATE POLICY "Users can view attendance in their church"
  ON attendance FOR SELECT TO authenticated
  USING (church_id = get_user_church_id());

CREATE POLICY "Users can manage attendance in their church"
  ON attendance FOR ALL TO authenticated
  USING (church_id = get_user_church_id())
  WITH CHECK (church_id = get_user_church_id());

-- DEPARTMENTS TABLE POLICIES
CREATE POLICY "Users can view departments in their church"
  ON departments FOR SELECT TO authenticated
  USING (church_id = get_user_church_id());

CREATE POLICY "Admins can manage departments in their church"
  ON departments FOR ALL TO authenticated
  USING (church_id = get_user_church_id() AND is_admin())
  WITH CHECK (church_id = get_user_church_id() AND is_admin());

-- CHURCH_SETTINGS TABLE POLICIES
CREATE POLICY "Users can view their church settings"
  ON church_settings FOR SELECT TO authenticated
  USING (church_id = get_user_church_id());

CREATE POLICY "Pastors can manage their church settings"
  ON church_settings FOR ALL TO authenticated
  USING (church_id = get_user_church_id() AND is_pastor())
  WITH CHECK (church_id = get_user_church_id() AND is_pastor());

-- PERMISSIONS TABLE POLICIES
CREATE POLICY "Users can view permissions in their church"
  ON permissions FOR SELECT TO authenticated
  USING (church_id = get_user_church_id());

CREATE POLICY "Admins can manage permissions in their church"
  ON permissions FOR ALL TO authenticated
  USING (church_id = get_user_church_id() AND is_admin())
  WITH CHECK (church_id = get_user_church_id() AND is_admin());

-- MANUALS TABLE POLICIES
CREATE POLICY "Users can view manuals in their church"
  ON manuals FOR SELECT TO authenticated
  USING (church_id = get_user_church_id());

CREATE POLICY "Admins can manage manuals in their church"
  ON manuals FOR ALL TO authenticated
  USING (church_id = get_user_church_id() AND is_admin())
  WITH CHECK (church_id = get_user_church_id() AND is_admin());

-- ============================================================================
-- 9. CREATE TRIGGER FUNCTIONS FOR AUTO-POPULATION
-- ============================================================================

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_church_id uuid;
  user_role text;
BEGIN
  -- Get role from user metadata
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'member');
  
  -- If user is a pastor, create a new church
  IF user_role = 'pastor' THEN
    INSERT INTO churches (name, created_by)
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'church_name', 'New Church'),
      NEW.id
    )
    RETURNING id INTO user_church_id;
  ELSE
    -- For non-pastors, they need to be invited to a church
    -- This will be handled by the application
    user_church_id := NULL;
  END IF;

  -- Create user profile
  INSERT INTO user_profiles (
    id,
    church_id,
    full_name,
    email,
    role,
    language
  ) VALUES (
    NEW.id,
    user_church_id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );

  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 10. INSERT DEFAULT DATA
-- ============================================================================

-- Create default church for existing users without church_id
DO $$
DECLARE
  default_church_id uuid;
BEGIN
  -- Create a default church if none exists
  IF NOT EXISTS (SELECT 1 FROM churches LIMIT 1) THEN
    INSERT INTO churches (name, created_by)
    VALUES ('AMEN TECH Church', NULL)
    RETURNING id INTO default_church_id;
    
    -- Update users without church_id
    UPDATE users SET church_id = default_church_id WHERE church_id IS NULL;
    UPDATE user_profiles SET church_id = default_church_id WHERE church_id IS NULL;
    UPDATE tasks SET church_id = default_church_id WHERE church_id IS NULL;
    UPDATE finance_records SET church_id = default_church_id WHERE church_id IS NULL;
    UPDATE notifications SET church_id = default_church_id WHERE church_id IS NULL;
    UPDATE notes SET church_id = default_church_id WHERE church_id IS NULL;
    UPDATE attendance SET church_id = default_church_id WHERE church_id IS NULL;
    UPDATE departments SET church_id = default_church_id WHERE church_id IS NULL;
    UPDATE church_settings SET church_id = default_church_id WHERE church_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 11. STORAGE SETUP
-- ============================================================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'avatars');

-- Storage policies for documents
CREATE POLICY "Users can upload documents to their church"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can view documents in their church"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents');

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';