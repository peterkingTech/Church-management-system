/*
  # Fix Policy Conflicts - Drop and Recreate Policies

  This migration safely handles existing policies by dropping them first,
  then recreating them with proper names and permissions.

  1. Security
    - Drop existing policies if they exist
    - Create new policies with unique names
    - Enable RLS on all tables
  
  2. Tables Covered
    - departments
    - users
    - tasks
    - attendance
    - finance_records
    - notifications
    - notes
    - registration_links
    - church_settings
    - birthday_reminders
    - user_departments
*/

-- Enable RLS on all tables first
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Departments: View All" ON departments;
DROP POLICY IF EXISTS "Users can view departments" ON departments;
DROP POLICY IF EXISTS "Allow SELECT own user data" ON users;
DROP POLICY IF EXISTS "Allow UPDATE own user data" ON users;
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow full access for Admins" ON users;
DROP POLICY IF EXISTS "Logged-in users can insert their data" ON users;
DROP POLICY IF EXISTS "Tasks: View Assigned" ON tasks;
DROP POLICY IF EXISTS "Tasks: Insert Own" ON tasks;
DROP POLICY IF EXISTS "Tasks: Update Own" ON tasks;
DROP POLICY IF EXISTS "Attendance: View Own" ON attendance;
DROP POLICY IF EXISTS "Attendance: Insert Own" ON attendance;
DROP POLICY IF EXISTS "Attendance: Update Own" ON attendance;
DROP POLICY IF EXISTS "Notes: View Own" ON notes;
DROP POLICY IF EXISTS "Notes: Insert Own" ON notes;
DROP POLICY IF EXISTS "Notes: Update Own" ON notes;
DROP POLICY IF EXISTS "Notes: Delete Own" ON notes;
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert own notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
DROP POLICY IF EXISTS "Notifications: View Own" ON notifications;
DROP POLICY IF EXISTS "Notifications: Update Own" ON notifications;
DROP POLICY IF EXISTS "All users can view church settings" ON church_settings;
DROP POLICY IF EXISTS "Users can manage own birthday reminders" ON birthday_reminders;
DROP POLICY IF EXISTS "Users can view their own department assignments" ON user_departments;

-- Create new policies with unique names

-- DEPARTMENTS POLICIES
CREATE POLICY "departments_select_all" ON departments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "departments_admin_manage" ON departments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('pastor', 'admin')
    )
  );

-- USERS POLICIES
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_insert_authenticated" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_admin_full_access" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role IN ('pastor', 'admin')
    )
  );

-- TASKS POLICIES
CREATE POLICY "tasks_view_assigned" ON tasks
  FOR SELECT TO authenticated
  USING (
    assigned_by = auth.uid() OR 
    assigned_to = auth.uid()
  );

CREATE POLICY "tasks_insert_own" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (assigned_by = auth.uid());

CREATE POLICY "tasks_update_assigned" ON tasks
  FOR UPDATE TO authenticated
  USING (
    assigned_by = auth.uid() OR 
    assigned_to = auth.uid()
  )
  WITH CHECK (
    assigned_by = auth.uid() OR 
    assigned_to = auth.uid()
  );

-- ATTENDANCE POLICIES
CREATE POLICY "attendance_view_own" ON attendance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "attendance_insert_own" ON attendance
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "attendance_update_own" ON attendance
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- NOTES POLICIES
CREATE POLICY "notes_view_own" ON notes
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

-- NOTIFICATIONS POLICIES
CREATE POLICY "notifications_view_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- CHURCH SETTINGS POLICIES
CREATE POLICY "church_settings_view_all" ON church_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "church_settings_admin_manage" ON church_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('pastor', 'admin')
    )
  );

-- BIRTHDAY REMINDERS POLICIES
CREATE POLICY "birthday_reminders_manage_own" ON birthday_reminders
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- USER DEPARTMENTS POLICIES
CREATE POLICY "user_departments_view_own" ON user_departments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_departments_admin_manage" ON user_departments
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('pastor', 'admin')
    )
  );

-- FINANCE RECORDS POLICIES (Pastor/Admin only)
CREATE POLICY "finance_records_admin_only" ON finance_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('pastor', 'finance_admin')
    )
  );

-- REGISTRATION LINKS POLICIES (Admin only)
CREATE POLICY "registration_links_admin_only" ON registration_links
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('pastor', 'admin')
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_user_id ON user_departments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_departments_department_id ON user_departments(department_id);