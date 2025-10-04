/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - RLS policies on 'users' table are causing infinite recursion
    - This prevents queries from executing correctly
    - Error code 42P17 indicates circular reference in policy logic

  2. Solution
    - Drop all existing policies that might cause recursion
    - Create simple, non-recursive policies using auth.uid() directly
    - Avoid referencing the same table within policy conditions

  3. Security
    - Users can only access their own data
    - No recursive queries within policies
    - Simple and efficient policy logic
*/

-- Disable RLS temporarily to avoid conflicts
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Users can delete own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can insert their own data" ON users;
DROP POLICY IF EXISTS "Users can delete their own data" ON users;
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON users;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies using auth.uid() directly
CREATE POLICY "users_select_own" ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_own" ON users
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Fix departments table policies (ensure they don't reference users table)
DROP POLICY IF EXISTS "All users can view departments" ON departments;
DROP POLICY IF EXISTS "departments_authenticated_read" ON departments;

CREATE POLICY "departments_select_all" ON departments
  FOR SELECT
  TO authenticated
  USING (true);

-- Verify policies are created correctly
SELECT tablename, policyname, cmd, permissive, roles, qual
FROM pg_policies 
WHERE tablename IN ('users', 'departments')
ORDER BY tablename, policyname;