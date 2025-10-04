-- ✅ COMPLETE CHURCH DATABASE SETUP
-- This migration creates all required tables and policies

-- ✅ ENABLE EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ✅ DROP EXISTING POLICIES TO AVOID CONFLICTS
DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Users can view own data" ON users;
    DROP POLICY IF EXISTS "Users can update own data" ON users;
    DROP POLICY IF EXISTS "All users can view departments" ON departments;
    DROP POLICY IF EXISTS "Users can view own department assignments" ON user_departments;
    DROP POLICY IF EXISTS "All users can view church settings" ON church_settings;
    DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
    DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
    DROP POLICY IF EXISTS "User can insert task assigned by or to them" ON tasks;
    DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
    DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance;
    DROP POLICY IF EXISTS "All users can view events" ON events;
    DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
    DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
    DROP POLICY IF EXISTS "Users can manage own notes" ON notes;
    DROP POLICY IF EXISTS "All users can view prayers" ON prayers;
    DROP POLICY IF EXISTS "Users can insert prayers" ON prayers;
    DROP POLICY IF EXISTS "All users can view announcements" ON announcements;
    DROP POLICY IF EXISTS "All users can view programs" ON programs;
    DROP POLICY IF EXISTS "Users can view own folders" ON folders;
    DROP POLICY IF EXISTS "Users can insert own folders" ON folders;
    DROP POLICY IF EXISTS "Users can view folder comments" ON folder_comments;
    DROP POLICY IF EXISTS "Users can insert folder comments" ON folder_comments;
    DROP POLICY IF EXISTS "Users can view own PD reports" ON pd_reports;
EXCEPTION
    WHEN undefined_table THEN
        NULL; -- Ignore if tables don't exist yet
END $$;

-- ✅ CREATE ALL TABLES

-- Users table (main authentication table)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL DEFAULT 'Anonymous',
  email text UNIQUE NOT NULL,
  role text CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer')) DEFAULT 'newcomer' NOT NULL,
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

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  assigned_by uuid REFERENCES users(id),
  assigned_to uuid REFERENCES users(id),
  due_date date,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz DEFAULT now()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  program_id uuid,
  date date DEFAULT CURRENT_DATE,
  arrival_time time,
  was_present boolean DEFAULT true,
  notes text,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time time,
  location text,
  type text DEFAULT 'service' CHECK (type IN ('service', 'study', 'youth', 'prayer', 'crusade', 'special')),
  created_by uuid REFERENCES users(id),
  reminders text[],
  created_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('task', 'event', 'pd_report', 'general', 'announcement', 'prayer')),
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  color text DEFAULT '#fef3c7',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Prayers table
CREATE TABLE IF NOT EXISTS prayers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  message text NOT NULL,
  submitted_by uuid REFERENCES users(id),
  submitted_by_name text DEFAULT 'Anonymous',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  prayer_count integer DEFAULT 0,
  is_anonymous boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  message text NOT NULL,
  created_by uuid REFERENCES users(id),
  visible_to text DEFAULT 'all' CHECK (visible_to IN ('all', 'members', 'workers', 'pastors')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  expires_at date,
  created_at timestamptz DEFAULT now()
);

-- Programs table
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  type text DEFAULT 'service' CHECK (type IN ('service', 'study', 'youth', 'prayer', 'crusade', 'special')),
  schedule text,
  location text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('foundation', 'integration', 'general', 'ministry')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Folder comments table
CREATE TABLE IF NOT EXISTS folder_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  comment_by uuid REFERENCES users(id),
  comment text,
  type text DEFAULT 'comment' CHECK (type IN ('comment', 'service_note', 'pd_report', 'directive')),
  created_at timestamptz DEFAULT now()
);

-- PD Reports table
CREATE TABLE IF NOT EXISTS pd_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid REFERENCES users(id),
  receiver_id uuid REFERENCES users(id),
  message text NOT NULL,
  type text DEFAULT 'report' CHECK (type IN ('report', 'directive')),
  date_sent timestamptz DEFAULT now(),
  read boolean DEFAULT false,
  read_at timestamptz
);

-- Finance records table
CREATE TABLE IF NOT EXISTS finance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('offering', 'tithe', 'donation', 'expense')),
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  category text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Registration links table
CREATE TABLE IF NOT EXISTS registration_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer')),
  code text UNIQUE NOT NULL,
  qr_code text,
  expires_at date NOT NULL,
  created_by uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Souls won table
CREATE TABLE IF NOT EXISTS souls_won (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  age integer,
  phone text,
  email text,
  program_id uuid REFERENCES programs(id),
  counselor_id uuid REFERENCES users(id),
  date_won date DEFAULT CURRENT_DATE,
  notes text,
  follow_up_status text DEFAULT 'pending' CHECK (follow_up_status IN ('pending', 'contacted', 'integrated')),
  created_at timestamptz DEFAULT now()
);

-- Birthday reminders table
CREATE TABLE IF NOT EXISTS birthday_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reminder_days_before integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Excuses table
CREATE TABLE IF NOT EXISTS excuses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  date_from date NOT NULL,
  date_to date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Notices table
CREATE TABLE IF NOT EXISTS notices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  content text NOT NULL,
  created_by uuid REFERENCES users(id),
  target_audience text DEFAULT 'all' CHECK (target_audience IN ('all', 'members', 'workers', 'pastors')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  expires_at date,
  created_at timestamptz DEFAULT now()
);

-- ✅ ENABLE RLS ON ALL TABLES
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls_won ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE excuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;

-- ✅ CREATE POLICIES
CREATE POLICY "Users can view own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "All users can view departments" ON departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own department assignments" ON user_departments FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "All users can view church settings" ON church_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view assigned tasks" ON tasks FOR SELECT TO authenticated USING (assigned_to = auth.uid() OR assigned_by = auth.uid());
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE TO authenticated USING (assigned_to = auth.uid() OR assigned_by = auth.uid());
CREATE POLICY "User can insert task assigned by or to them" ON tasks FOR INSERT TO authenticated WITH CHECK (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Users can view own attendance" ON attendance FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "All users can view events" ON events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can manage own notes" ON notes FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "All users can view prayers" ON prayers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert prayers" ON prayers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All users can view announcements" ON announcements FOR SELECT TO authenticated USING (true);

CREATE POLICY "All users can view programs" ON programs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can view own folders" ON folders FOR SELECT TO authenticated USING (created_by = auth.uid());
CREATE POLICY "Users can insert own folders" ON folders FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view folder comments" ON folder_comments FOR SELECT TO authenticated USING (comment_by = auth.uid());
CREATE POLICY "Users can insert folder comments" ON folder_comments FOR INSERT TO authenticated WITH CHECK (comment_by = auth.uid());

CREATE POLICY "Users can view own PD reports" ON pd_reports FOR SELECT TO authenticated USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can manage own birthday reminders" ON birthday_reminders FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view own excuses" ON excuses FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can create own excuses" ON excuses FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "All users can view notices" ON notices FOR SELECT TO authenticated USING (true);

-- ✅ INSERT DEFAULT DEPARTMENTS
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

-- ✅ INSERT DEFAULT CHURCH SETTINGS
INSERT INTO church_settings (church_name, welcome_message) VALUES
  ('AMEN TECH Church', 'Welcome to our church family! Building systems that serves God''s kingdom.')
ON CONFLICT DO NOTHING;

-- ✅ CREATE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- ✅ STORAGE POLICIES (drop existing first)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can upload own documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update own documents" ON storage.objects FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ✅ CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);