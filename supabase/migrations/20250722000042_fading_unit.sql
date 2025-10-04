/*
  # Core Tables Setup
  
  1. New Tables
    - `users` - User profiles and authentication
    - `departments` - Church departments/ministries
    - `user_departments` - User-department relationships
    - `church_settings` - Church configuration
  
  2. Security
    - Enable RLS on all tables
    - Add basic policies for user access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name text NOT NULL DEFAULT 'Required',
  email text UNIQUE NOT NULL DEFAULT 'Unique, Required',
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer')),
  department_id uuid,
  phone text,
  address text,
  profile_image_url text,
  language text NOT NULL DEFAULT 'en',
  is_confirmed boolean DEFAULT true,
  church_joined_at date DEFAULT CURRENT_DATE,
  birthday_month integer CHECK (birthday_month >= 1 AND birthday_month <= 12),
  birthday_day integer CHECK (birthday_day >= 1 AND birthday_day <= 31),
  last_login timestamptz,
  is_online boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- User departments relationship
CREATE TABLE IF NOT EXISTS user_departments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  assigned_at timestamptz DEFAULT now()
);

-- Church settings
CREATE TABLE IF NOT EXISTS church_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_name text NOT NULL DEFAULT 'Church Name',
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

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;

-- Basic policies
CREATE POLICY "Users can view own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "All users can view departments" ON departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own department assignments" ON user_departments FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "All users can view church settings" ON church_settings FOR SELECT TO authenticated USING (true);

-- Insert default departments
INSERT INTO departments (name, description) VALUES
  ('Worship Team', 'Leading church worship and music ministry'),
  ('Youth Ministry', 'Ministry focused on young people and teenagers'),
  ('Children Ministry', 'Sunday school and children programs'),
  ('Evangelism', 'Outreach and soul winning ministry'),
  ('Ushering', 'Church service coordination and hospitality'),
  ('Media Team', 'Audio, video, and technical support'),
  ('Prayer Ministry', 'Intercessory prayer and prayer meetings'),
  ('Administration', 'Church administration and management')
ON CONFLICT (name) DO NOTHING;

-- Insert default church settings
INSERT INTO church_settings (church_name, welcome_message) VALUES
  ('AMEN TECH Church', 'Welcome to our church family! Building systems that serves God''s kingdom.')
ON CONFLICT DO NOTHING;