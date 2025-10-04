-- Fix Core Authentication and RLS Issues
-- This migration fixes infinite recursion and auth problems

-- ✅ STEP 1: Drop all existing policies to prevent conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Allow SELECT own user data" ON users;
DROP POLICY IF EXISTS "Allow UPDATE own user data" ON users;
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow DELETE own user data" ON users;
DROP POLICY IF EXISTS "Allow full access for Admins" ON users;

-- Drop all other problematic policies
DROP POLICY IF EXISTS "Users can view their tasks" ON tasks;
DROP POLICY IF EXISTS "Users can assign tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Users can update attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON notifications;

-- ✅ STEP 2: Create simple, non-recursive policies

-- USERS TABLE - Simple policies without recursion
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_authenticated" ON users
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- TASKS TABLE
CREATE POLICY "tasks_select_own" ON tasks
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "tasks_insert_own" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (assigned_by = auth.uid());

CREATE POLICY "tasks_update_own" ON tasks
  FOR UPDATE TO authenticated
  USING (assigned_by = auth.uid() OR assigned_to = auth.uid())
  WITH CHECK (assigned_by = auth.uid() OR assigned_to = auth.uid());

-- ATTENDANCE TABLE
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

-- NOTES TABLE
CREATE POLICY "notes_all_own" ON notes
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- NOTIFICATIONS TABLE
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- DEPARTMENTS TABLE - Public read access
CREATE POLICY "departments_select_all" ON departments
  FOR SELECT TO authenticated
  USING (true);

-- ✅ STEP 3: Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- ✅ STEP 4: Create a simple admin check function (non-recursive)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users 
    WHERE id = user_id 
    AND raw_user_meta_data->>'role' = 'admin'
  );
$$;