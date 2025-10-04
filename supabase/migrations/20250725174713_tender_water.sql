/*
  # Fix RLS Infinite Recursion in Users Table

  1. Problem
    - RLS policies on users table were querying the users table itself
    - This creates infinite recursion when checking permissions
    - Error: "infinite recursion detected in policy for relation users"

  2. Solution
    - Use auth.uid() for direct user ID comparison
    - Use JWT claims for role-based access instead of querying users table
    - Simplify policies to avoid recursive queries

  3. Changes
    - Drop existing problematic policies
    - Create new non-recursive policies
    - Use auth metadata instead of table queries
*/

-- Drop all existing policies on users table to prevent conflicts
DROP POLICY IF EXISTS "Allow DELETE own user data" ON users;
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON users;
DROP POLICY IF EXISTS "Allow SELECT own user data" ON users;
DROP POLICY IF EXISTS "Allow UPDATE own user data" ON users;
DROP POLICY IF EXISTS "Allow full access for Admins" ON users;

-- Create simple, non-recursive policies
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

-- Create admin policy using JWT claims instead of querying users table
CREATE POLICY "users_admin_access" ON users
  FOR ALL TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text,
      'member'
    ) = 'pastor'
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text,
      'member'
    ) = 'pastor'
  );

-- Fix departments table policies to avoid recursion
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Everyone can view departments" ON departments;
DROP POLICY IF EXISTS "departments_select_authenticated" ON departments;

CREATE POLICY "departments_select_all" ON departments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "departments_admin_manage" ON departments
  FOR ALL TO authenticated
  USING (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text,
      'member'
    ) = 'pastor'
  )
  WITH CHECK (
    COALESCE(
      (auth.jwt() -> 'user_metadata' ->> 'role')::text,
      'member'
    ) = 'pastor'
  );

-- Fix other tables that might have recursive policies
DROP POLICY IF EXISTS "Users can view own department assignments" ON user_departments;
DROP POLICY IF EXISTS "Users can view their own department assignments" ON user_departments;

CREATE POLICY "user_departments_select_own" ON user_departments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Fix tasks policies
DROP POLICY IF EXISTS "Users insert tasks they assign" ON tasks;
DROP POLICY IF EXISTS "Users see their assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users update their own tasks" ON tasks;
DROP POLICY IF EXISTS "tasks_insert_assigned_by" ON tasks;
DROP POLICY IF EXISTS "tasks_select_assigned_users" ON tasks;
DROP POLICY IF EXISTS "tasks_update_owners" ON tasks;

CREATE POLICY "tasks_select_involved" ON tasks
  FOR SELECT TO authenticated
  USING (auth.uid() = assigned_by OR auth.uid() = assigned_to);

CREATE POLICY "tasks_insert_as_assigner" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = assigned_by);

CREATE POLICY "tasks_update_involved" ON tasks
  FOR UPDATE TO authenticated
  USING (auth.uid() = assigned_by OR auth.uid() = assigned_to)
  WITH CHECK (auth.uid() = assigned_by OR auth.uid() = assigned_to);

-- Fix attendance policies
DROP POLICY IF EXISTS "Users insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Users update own attendance" ON attendance;
DROP POLICY IF EXISTS "Users view own attendance" ON attendance;
DROP POLICY IF EXISTS "attendance_insert_own" ON attendance;
DROP POLICY IF EXISTS "attendance_select_own" ON attendance;
DROP POLICY IF EXISTS "attendance_update_own" ON attendance;

CREATE POLICY "attendance_manage_own" ON attendance
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix notifications policies
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON notifications;

CREATE POLICY "notifications_manage_own" ON notifications
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Fix notes policies
DROP POLICY IF EXISTS "Users delete own notes" ON notes;
DROP POLICY IF EXISTS "Users insert own notes" ON notes;
DROP POLICY IF EXISTS "Users update own notes" ON notes;
DROP POLICY IF EXISTS "Users view own notes" ON notes;
DROP POLICY IF EXISTS "notes_delete_own" ON notes;
DROP POLICY IF EXISTS "notes_insert_own" ON notes;
DROP POLICY IF EXISTS "notes_select_own" ON notes;
DROP POLICY IF EXISTS "notes_update_own" ON notes;

CREATE POLICY "notes_manage_own" ON notes
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);