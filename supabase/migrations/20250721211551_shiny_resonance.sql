/*
  # Reset Database for Production Use

  1. Clean Up Demo Data
    - Remove all demo/test users and data
    - Reset all tables to empty state
    - Keep table structure intact

  2. Security Setup
    - Enable RLS on all tables
    - Add proper security policies
    - Configure auth settings

  3. Storage Setup
    - Create avatars bucket
    - Set proper storage policies
*/

-- Clean up all demo/test data
DELETE FROM folder_comments;
DELETE FROM folders;
DELETE FROM pd_reports;
DELETE FROM tasks;
DELETE FROM attendance;
DELETE FROM follow_ups;
DELETE FROM department_reports;
DELETE FROM permissions;
DELETE FROM user_departments;
DELETE FROM finance_records;
DELETE FROM notifications;
DELETE FROM notices;
DELETE FROM excuses;
DELETE FROM programs;
DELETE FROM souls_won;
DELETE FROM pdf_files;
DELETE FROM subscriptions;
DELETE FROM registration_links;
DELETE FROM notes;
DELETE FROM birthday_reminders;
DELETE FROM church_settings;
DELETE FROM users;
DELETE FROM departments;

-- Reset sequences if needed
ALTER SEQUENCE IF EXISTS users_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS departments_id_seq RESTART WITH 1;

-- Create storage bucket for avatars if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure RLS is enabled on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls_won ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE excuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;

-- Update RLS policies for production

-- Users table policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

CREATE POLICY "Users can view own profile"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('pastor', 'admin')
  )
);

-- Departments policies
DROP POLICY IF EXISTS "All users can view departments" ON departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;

CREATE POLICY "All users can view departments"
ON departments FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage departments"
ON departments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('pastor', 'admin')
  )
);

-- Tasks policies
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Leaders can manage tasks" ON tasks;

CREATE POLICY "Users can view assigned tasks"
ON tasks FOR SELECT
TO authenticated
USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Users can update own tasks"
ON tasks FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Leaders can manage tasks"
ON tasks FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('pastor', 'admin', 'worker')
  )
);

-- Attendance policies
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Leaders can manage attendance" ON attendance;

CREATE POLICY "Users can view own attendance"
ON attendance FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own attendance"
ON attendance FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Leaders can manage attendance"
ON attendance FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND role IN ('pastor', 'admin', 'worker')
  )
);

-- Finance records policies (already exist and are correct)

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Notes policies (already exist and are correct)

-- Church settings policies (already exist and are correct)

-- Create default church settings
INSERT INTO church_settings (
  church_name,
  church_address,
  church_phone,
  church_email,
  primary_color,
  secondary_color,
  accent_color,
  timezone,
  default_language,
  welcome_message
) VALUES (
  'Your Church Name',
  'Church Address',
  'Church Phone',
  'church@email.com',
  '#2563eb',
  '#7c3aed',
  '#f59e0b',
  'UTC',
  'en',
  'Welcome to our church family!'
) ON CONFLICT DO NOTHING;

-- Create default departments
INSERT INTO departments (name, description) VALUES
  ('Worship Team', 'Music and worship ministry'),
  ('Youth Ministry', 'Ministry for young people'),
  ('Children Ministry', 'Sunday school and kids programs'),
  ('Evangelism', 'Outreach and soul winning'),
  ('Ushering', 'Service coordination and hospitality'),
  ('Media Team', 'Audio, video, and technical support'),
  ('Prayer Ministry', 'Prayer coordination and support'),
  ('Administration', 'Church administration and management')
ON CONFLICT (name) DO NOTHING;