/*
  # Complete Authentication System Reset
  
  This migration completely resets and restores the authentication system with:
  1. Clean database schema with proper RLS policies
  2. Role-based access control for 5 user types
  3. Test accounts for each role
  4. Secure authentication flow
  
  ## User Roles:
  - Pastor: Highest religious authority (full access)
  - Admin: Administrative privileges (system management)
  - Worker: Staff/employee level (department management)
  - Member: Regular member (basic access)
  - User: Basic user level (limited access)
*/

-- ============================================================================
-- 1. CLEAN SLATE: Drop existing problematic policies and constraints
-- ============================================================================

-- Drop all existing RLS policies that might cause recursion
DROP POLICY IF EXISTS "Allow full access for Admins" ON users;
DROP POLICY IF EXISTS "Allow SELECT own user data" ON users;
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow UPDATE own user data" ON users;
DROP POLICY IF EXISTS "Allow DELETE own user data" ON users;
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Everyone can view departments" ON departments;
DROP POLICY IF EXISTS "departments_select_authenticated" ON departments;

-- Temporarily disable RLS to clean up
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. CORE TABLES: Create essential tables with proper structure
-- ============================================================================

-- Church Settings Table
CREATE TABLE IF NOT EXISTS church_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_name text NOT NULL DEFAULT 'AMEN TECH Church',
  church_address text,
  church_phone text,
  church_email text,
  primary_color text DEFAULT '#2563eb',
  secondary_color text DEFAULT '#7c3aed',
  accent_color text DEFAULT '#f59e0b',
  logo_url text,
  timezone text DEFAULT 'UTC',
  default_language text DEFAULT 'en',
  welcome_message text DEFAULT 'Welcome to our church!',
  updated_by uuid,
  updated_at timestamptz DEFAULT now()
);

-- Users Table (Core Authentication)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL DEFAULT 'User',
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('pastor', 'admin', 'worker', 'member', 'user')),
  phone text,
  address text,
  profile_image_url text,
  is_confirmed boolean DEFAULT true,
  language text DEFAULT 'en',
  church_joined_at date DEFAULT CURRENT_DATE,
  last_login timestamptz,
  is_online boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Departments Table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- User Departments Junction Table
CREATE TABLE IF NOT EXISTS user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_by uuid REFERENCES users(id),
  assigned_to uuid REFERENCES users(id),
  task_text text,
  description text,
  due_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  is_done boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  date date DEFAULT CURRENT_DATE,
  arrival_time time,
  was_present boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Finance Records Table
CREATE TABLE IF NOT EXISTS finance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('offering', 'tithe', 'donation', 'expense')),
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  category text,
  date date DEFAULT CURRENT_DATE,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('task', 'event', 'pd_report', 'general', 'announcement', 'prayer')),
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Notes Table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES users(id),
  is_pinned boolean DEFAULT false,
  color text DEFAULT '#fef3c7',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE NON-RECURSIVE RLS POLICIES
-- ============================================================================

-- Users Table Policies (Non-recursive)
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_own" ON users
  FOR DELETE TO authenticated
  USING (auth.uid() = id);

-- Pastor and Admin can manage all users (using JWT claims to avoid recursion)
CREATE POLICY "users_pastor_admin_all" ON users
  FOR ALL TO authenticated
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('pastor', 'admin')
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('pastor', 'admin')
  );

-- Departments Policies
CREATE POLICY "departments_select_all" ON departments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "departments_manage_pastor_admin" ON departments
  FOR ALL TO authenticated
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('pastor', 'admin')
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('pastor', 'admin')
  );

-- User Departments Policies
CREATE POLICY "user_departments_select_own" ON user_departments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_departments_manage_pastor_admin" ON user_departments
  FOR ALL TO authenticated
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('pastor', 'admin')
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('pastor', 'admin')
  );

-- Tasks Policies
CREATE POLICY "tasks_select_involved" ON tasks
  FOR SELECT TO authenticated
  USING (assigned_by = auth.uid() OR assigned_to = auth.uid());

CREATE POLICY "tasks_insert_by_role" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    assigned_by = auth.uid() AND
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('pastor', 'admin', 'worker')
  );

CREATE POLICY "tasks_update_involved" ON tasks
  FOR UPDATE TO authenticated
  USING (assigned_by = auth.uid() OR assigned_to = auth.uid())
  WITH CHECK (assigned_by = auth.uid() OR assigned_to = auth.uid());

-- Attendance Policies
CREATE POLICY "attendance_select_own" ON attendance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "attendance_insert_own" ON attendance
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "attendance_update_own" ON attendance
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Pastor, Admin, Worker can manage all attendance
CREATE POLICY "attendance_manage_leaders" ON attendance
  FOR ALL TO authenticated
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('pastor', 'admin', 'worker')
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('pastor', 'admin', 'worker')
  );

-- Finance Records Policies (Pastor and Admin only)
CREATE POLICY "finance_records_pastor_admin_only" ON finance_records
  FOR ALL TO authenticated
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('pastor', 'admin')
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') IN ('pastor', 'admin')
  );

-- Notifications Policies
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Notes Policies
CREATE POLICY "notes_select_own" ON notes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notes_insert_own" ON notes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notes_update_own" ON notes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notes_delete_own" ON notes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Church Settings Policies
CREATE POLICY "church_settings_select_all" ON church_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "church_settings_manage_pastor" ON church_settings
  FOR ALL TO authenticated
  USING (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') = 'pastor'
  )
  WITH CHECK (
    COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'user') = 'pastor'
  );

-- ============================================================================
-- 5. INSERT DEFAULT DATA
-- ============================================================================

-- Insert default church settings
INSERT INTO church_settings (
  church_name,
  church_address,
  church_phone,
  church_email,
  welcome_message
) VALUES (
  'AMEN TECH Church',
  '123 Church Street, City, State 12345',
  '+1 (555) 123-4567',
  'info@amentech.church',
  'Welcome to our church family! We are glad you are here.'
) ON CONFLICT DO NOTHING;

-- Insert default departments
INSERT INTO departments (name, description) VALUES
  ('Worship Team', 'Leading church worship and music ministry'),
  ('Youth Ministry', 'Ministry focused on young people and teenagers'),
  ('Children Ministry', 'Sunday school and children programs'),
  ('Evangelism', 'Outreach and soul winning ministry'),
  ('Ushering', 'Church service coordination and hospitality'),
  ('Media Team', 'Audio, video, and technical support'),
  ('Prayer Ministry', 'Intercessory prayer and spiritual warfare'),
  ('Administration', 'Church administration and management')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 6. CREATE TEST ACCOUNTS FOR ALL ROLES
-- ============================================================================

-- Insert test users for each role (these will be created in auth.users via the application)
-- The application will handle the auth.users creation and link to these profiles

-- Test Pastor Account
INSERT INTO users (
  id,
  full_name,
  email,
  role,
  phone,
  is_confirmed,
  language
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Pastor John Smith',
  'pastor@amentech.church',
  'pastor',
  '+1 (555) 123-4567',
  true,
  'en'
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_confirmed = EXCLUDED.is_confirmed;

-- Test Admin Account
INSERT INTO users (
  id,
  full_name,
  email,
  role,
  phone,
  is_confirmed,
  language
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Admin Sarah Johnson',
  'admin@amentech.church',
  'admin',
  '+1 (555) 123-4568',
  true,
  'en'
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_confirmed = EXCLUDED.is_confirmed;

-- Test Worker Account
INSERT INTO users (
  id,
  full_name,
  email,
  role,
  phone,
  is_confirmed,
  language
) VALUES (
  '00000000-0000-0000-0000-000000000003',
  'Worker David Wilson',
  'worker@amentech.church',
  'worker',
  '+1 (555) 123-4569',
  true,
  'en'
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_confirmed = EXCLUDED.is_confirmed;

-- Test Member Account
INSERT INTO users (
  id,
  full_name,
  email,
  role,
  phone,
  is_confirmed,
  language
) VALUES (
  '00000000-0000-0000-0000-000000000004',
  'Member Mary Brown',
  'member@amentech.church',
  'member',
  '+1 (555) 123-4570',
  true,
  'en'
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_confirmed = EXCLUDED.is_confirmed;

-- Test User Account
INSERT INTO users (
  id,
  full_name,
  email,
  role,
  phone,
  is_confirmed,
  language
) VALUES (
  '00000000-0000-0000-0000-000000000005',
  'User Mike Davis',
  'user@amentech.church',
  'user',
  '+1 (555) 123-4571',
  true,
  'en'
) ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  is_confirmed = EXCLUDED.is_confirmed;

-- ============================================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_confirmed ON users(is_confirmed);

-- Tasks table indexes
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_tasks_is_done ON tasks(is_done);

-- Attendance table indexes
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Notes table indexes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned);

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Verify tables exist
SELECT 'Tables created successfully' as status,
       COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'departments', 'tasks', 'attendance', 'finance_records', 'notifications', 'notes', 'church_settings');

-- Verify RLS is enabled
SELECT 'RLS Status' as check_type,
       tablename,
       rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'departments', 'tasks', 'attendance', 'finance_records', 'notifications', 'notes')
ORDER BY tablename;

-- Verify policies exist
SELECT 'Policies created' as status,
       COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public';

-- Verify test users
SELECT 'Test users created' as status,
       role,
       COUNT(*) as user_count
FROM users 
WHERE email LIKE '%@amentech.church'
GROUP BY role
ORDER BY role;

-- Verify departments
SELECT 'Departments created' as status,
       COUNT(*) as department_count
FROM departments;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Final status message
SELECT 
  'MIGRATION COMPLETE' as status,
  'Authentication system reset successfully' as message,
  'All 5 user roles configured with test accounts' as details,
  'System ready for testing' as next_step;