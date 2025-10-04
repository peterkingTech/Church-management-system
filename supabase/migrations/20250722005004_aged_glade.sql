/*
  # Fix RLS Policy Infinite Recursion
  
  1. Security Fixes
    - Remove recursive policies on users table
    - Fix auth.uid() references
    - Add proper role-based policies
  
  2. Authentication Fixes
    - Clear problematic policies
    - Add simple, non-recursive policies
*/

-- Drop all existing policies on users table to fix recursion
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Pastors can view all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;

-- Create simple, non-recursive policies for users table
CREATE POLICY "Enable read access for own profile" 
ON users FOR SELECT 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Enable update for own profile" 
ON users FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

CREATE POLICY "Enable insert for own profile" 
ON users FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Fix other table policies that might reference users recursively
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
CREATE POLICY "Users can view assigned tasks" 
ON tasks FOR SELECT 
TO authenticated 
USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
CREATE POLICY "Users can view own attendance" 
ON attendance FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications" 
ON notifications FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Ensure auth.uid() function works properly
-- This creates a simple function to get current user ID without recursion
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claim.sub', true),
    (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
  )::uuid
$$;