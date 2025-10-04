/*
  # User Management System for AMEN TECH Church Management

  1. New Tables
    - Enhanced users table with additional fields
    - departments table for organizing users
    - user_departments junction table for many-to-many relationships
    
  2. Security
    - Enable RLS on all tables
    - Add policies for admin access
    - Add policies for user self-management
    
  3. Functions
    - Auto-create user profile on auth signup
    - Handle user role changes
    - Manage department assignments
*/

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  leader_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Update users table with additional fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES departments(id),
ADD COLUMN IF NOT EXISTS church_joined_at date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS last_login timestamptz,
ADD COLUMN IF NOT EXISTS notes text;

-- Create user_departments junction table for multiple department assignments
CREATE TABLE IF NOT EXISTS user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  role text DEFAULT 'member', -- member, leader, assistant
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Enable RLS
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- Departments policies
CREATE POLICY "Admins can manage departments"
  ON departments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "All users can view departments"
  ON departments
  FOR SELECT
  TO authenticated
  USING (true);

-- User departments policies
CREATE POLICY "Admins can manage user departments"
  ON user_departments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can view their own department assignments"
  ON user_departments
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Update users table policies for admin management
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO users (
    id,
    full_name,
    email,
    role,
    language,
    created_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', users.full_name),
    email = NEW.email,
    role = COALESCE(NEW.raw_user_meta_data->>'role', users.role),
    language = COALESCE(NEW.raw_user_meta_data->>'language', users.language);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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

-- Function to assign user to department
CREATE OR REPLACE FUNCTION assign_user_to_department(
  user_id uuid,
  department_id uuid,
  user_role text DEFAULT 'member'
)
RETURNS void AS $$
BEGIN
  INSERT INTO user_departments (user_id, department_id, role)
  VALUES (user_id, department_id, user_role)
  ON CONFLICT (user_id, department_id) 
  DO UPDATE SET role = user_role, assigned_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's departments
CREATE OR REPLACE FUNCTION get_user_departments(user_id uuid)
RETURNS TABLE (
  department_id uuid,
  department_name text,
  department_description text,
  user_role text,
  assigned_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.description,
    ud.role,
    ud.assigned_at
  FROM user_departments ud
  JOIN departments d ON ud.department_id = d.id
  WHERE ud.user_id = get_user_departments.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;