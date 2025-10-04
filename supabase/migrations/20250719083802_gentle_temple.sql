/*
  # Ensure users table exists with correct schema

  1. New Tables (if not exists)
    - `users`
      - `id` (uuid, primary key, matches auth.users.id)
      - `email` (text, unique, required)
      - `full_name` (text, required)
      - `role` (text, required - pastor, worker, member, newcomer)
      - `department_id` (uuid, optional)
      - `profile_image_url` (text, optional)
      - `language` (text, required, default 'en')
      - `church_joined_at` (date, optional)
      - `is_confirmed` (boolean, default false)
      - `phone` (text, optional)
      - `address` (text, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policies for users to read and update their own data
    - Add policy for authenticated users to read basic user info
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT 'User',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('pastor', 'worker', 'member', 'newcomer')),
  department_id UUID,
  profile_image_url TEXT,
  language TEXT NOT NULL DEFAULT 'en',
  church_joined_at DATE DEFAULT CURRENT_DATE,
  is_confirmed BOOLEAN DEFAULT FALSE,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view basic user info" ON users;

-- Create policies
CREATE POLICY "Users can view own profile"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can view basic user info"
  ON users
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, language)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();