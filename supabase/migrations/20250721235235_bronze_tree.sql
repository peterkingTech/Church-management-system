/*
  # Complete Church Management System Database Setup

  1. New Tables
    - `users` - User profiles and authentication data
    - `departments` - Church departments and ministries
    - `user_departments` - User-department relationships
    - `tasks` - Task management system
    - `attendance` - Attendance tracking
    - `finance_records` - Financial transactions
    - `notifications` - User notifications
    - `notes` - Personal notes system
    - `registration_links` - Self-registration links
    - `programs` - Church programs and events
    - `souls_won` - Evangelism tracking
    - `folders` - Document organization
    - `folder_comments` - Folder communication
    - `pd_reports` - Pastor's desk reports
    - `church_settings` - Church configuration
    - `birthday_reminders` - Birthday notification system
    - `announcements` - Church announcements
    - `prayers` - Prayer request system
    - `events` - Event management
    - `excuses` - Absence excuse system
    - `permissions` - User permission system
    - `subscriptions` - Church subscription management
    - `pdf_files` - File upload system

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for role-based access
    - Secure file upload policies

  3. Storage
    - Create avatars bucket for profile images
    - Create documents bucket for file uploads
    - Set up proper storage policies

  4. Default Data
    - Insert default departments
    - Insert default church settings
    - Create sample data for development
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL DEFAULT 'Anonymous',
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'newcomer' CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer')),
  department_id uuid,
  profile_image_url text,
  phone text,
  address text,
  language text NOT NULL DEFAULT 'en',
  is_confirmed boolean DEFAULT true,
  church_joined_at date DEFAULT CURRENT_DATE,
  birthday_month integer CHECK (birthday_month >= 1 AND birthday_month <= 12),
  birthday_day integer CHECK (birthday_day >= 1 AND birthday_day <= 31),
  last_login timestamptz,
  is_online boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create user_departments table
CREATE TABLE IF NOT EXISTS user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  assigned_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_by uuid REFERENCES users(id),
  assigned_to uuid REFERENCES users(id),
  task_text text NOT NULL,
  description text,
  due_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  is_done boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  program_id uuid,
  date date DEFAULT CURRENT_DATE,
  arrival_time time,
  was_present boolean DEFAULT true,
  notes text,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create finance_records table
CREATE TABLE IF NOT EXISTS finance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('offering', 'tithe', 'donation', 'expense')),
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  category text,
  date date DEFAULT CURRENT_DATE,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('task', 'event', 'pd_report', 'general', 'announcement', 'prayer')),
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES users(id),
  is_pinned boolean DEFAULT false,
  color text DEFAULT '#fef3c7',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create registration_links table
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

-- Create programs table
CREATE TABLE IF NOT EXISTS programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  type text DEFAULT 'service' CHECK (type IN ('service', 'study', 'youth', 'prayer', 'crusade', 'special')),
  schedule text,
  location text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create souls_won table
CREATE TABLE IF NOT EXISTS souls_won (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('foundation', 'integration', 'general', 'ministry')),
  description text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create folder_comments table
CREATE TABLE IF NOT EXISTS folder_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  comment_by uuid REFERENCES users(id),
  comment text,
  type text DEFAULT 'comment' CHECK (type IN ('comment', 'service_note', 'pd_report', 'directive')),
  created_at timestamptz DEFAULT now()
);

-- Create pd_reports table
CREATE TABLE IF NOT EXISTS pd_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES users(id),
  receiver_id uuid REFERENCES users(id),
  message text NOT NULL,
  type text DEFAULT 'report' CHECK (type IN ('report', 'directive')),
  read boolean DEFAULT false,
  date_sent timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Create church_settings table
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
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

-- Create birthday_reminders table
CREATE TABLE IF NOT EXISTS birthday_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  reminder_days_before integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  created_by uuid REFERENCES users(id),
  visible_to text DEFAULT 'all' CHECK (visible_to IN ('all', 'members', 'workers', 'pastors')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  expires_at date,
  created_at timestamptz DEFAULT now()
);

-- Create prayers table
CREATE TABLE IF NOT EXISTS prayers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  submitted_by uuid REFERENCES users(id),
  is_anonymous boolean DEFAULT false,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
  prayer_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time time,
  location text,
  type text DEFAULT 'service' CHECK (type IN ('service', 'meeting', 'crusade', 'outreach', 'training')),
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create excuses table
CREATE TABLE IF NOT EXISTS excuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  reason text NOT NULL,
  date_from date NOT NULL,
  date_to date,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  permission text NOT NULL,
  granted_by uuid REFERENCES users(id),
  granted_at timestamptz DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid,
  status text DEFAULT 'active',
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  created_at timestamptz DEFAULT now()
);

-- Create pdf_files table
CREATE TABLE IF NOT EXISTS pdf_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('folder', 'summary', 'report', 'program', 'task', 'notice', 'excuse', 'department_report')),
  entity_id uuid,
  uploaded_by uuid REFERENCES users(id),
  uploaded_by_name text NOT NULL,
  file_type text DEFAULT 'pdf',
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls_won ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE excuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_files ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Users policies
CREATE POLICY "Users can view own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Pastors can manage all users" ON users FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'pastor')
);

-- Departments policies
CREATE POLICY "All users can view departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pastors can manage departments" ON departments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin'))
);

-- User departments policies
CREATE POLICY "Users can view own department assignments" ON user_departments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Pastors can manage department assignments" ON user_departments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin'))
);

-- Tasks policies
CREATE POLICY "Users can view assigned tasks" ON tasks FOR SELECT TO authenticated USING (
  assigned_to = auth.uid() OR assigned_by = auth.uid()
);
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE TO authenticated USING (
  assigned_to = auth.uid() OR assigned_by = auth.uid()
);
CREATE POLICY "Workers can create tasks" ON tasks FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker'))
);

-- Attendance policies
CREATE POLICY "Users can view own attendance" ON attendance FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Workers can manage attendance" ON attendance FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker'))
);

-- Finance records policies
CREATE POLICY "Finance admins can manage finance" ON finance_records FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'finance_admin'))
);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Notes policies
CREATE POLICY "Users can manage own notes" ON notes FOR ALL TO authenticated USING (user_id = auth.uid());

-- Registration links policies
CREATE POLICY "Pastors can manage registration links" ON registration_links FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin'))
);
CREATE POLICY "Anyone can view active registration links" ON registration_links FOR SELECT TO anon USING (is_active = true AND expires_at >= CURRENT_DATE);

-- Programs policies
CREATE POLICY "All users can view programs" ON programs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Workers can manage programs" ON programs FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker'))
);

-- Souls won policies
CREATE POLICY "Workers can manage souls won" ON souls_won FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker'))
);

-- Folders policies
CREATE POLICY "Workers can manage folders" ON folders FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker'))
);

-- Folder comments policies
CREATE POLICY "Users can view folder comments" ON folder_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert own comments" ON folder_comments FOR INSERT TO authenticated WITH CHECK (comment_by = auth.uid());

-- PD reports policies
CREATE POLICY "Users can view own PD reports" ON pd_reports FOR SELECT TO authenticated USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);
CREATE POLICY "Users can send PD reports" ON pd_reports FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Users can update received reports" ON pd_reports FOR UPDATE TO authenticated USING (receiver_id = auth.uid());

-- Church settings policies
CREATE POLICY "All users can view church settings" ON church_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pastors can update church settings" ON church_settings FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'pastor')
);

-- Birthday reminders policies
CREATE POLICY "Users can manage own birthday reminders" ON birthday_reminders FOR ALL TO authenticated USING (user_id = auth.uid());

-- Announcements policies
CREATE POLICY "All users can view announcements" ON announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Workers can create announcements" ON announcements FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker'))
);

-- Prayers policies
CREATE POLICY "All users can view prayers" ON prayers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can submit prayers" ON prayers FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "Users can update own prayers" ON prayers FOR UPDATE TO authenticated USING (submitted_by = auth.uid());

-- Events policies
CREATE POLICY "All users can view events" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Workers can manage events" ON events FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker'))
);

-- Excuses policies
CREATE POLICY "Users can manage own excuses" ON excuses FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Pastors can review excuses" ON excuses FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin'))
);

-- Permissions policies
CREATE POLICY "Users can view own permissions" ON permissions FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Pastors can manage permissions" ON permissions FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'pastor')
);

-- PDF files policies
CREATE POLICY "Users can view PDF files" ON pdf_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upload PDF files" ON pdf_files FOR INSERT TO authenticated WITH CHECK (uploaded_by = auth.uid());
CREATE POLICY "Users can delete own PDF files" ON pdf_files FOR DELETE TO authenticated USING (uploaded_by = auth.uid());

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Documents bucket policies
CREATE POLICY "Users can view documents" ON storage.objects FOR SELECT USING (bucket_id = 'documents');
CREATE POLICY "Users can upload documents" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]
);

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
INSERT INTO church_settings (church_name, church_address, church_phone, church_email, primary_color, secondary_color, accent_color, welcome_message) VALUES
  ('AMEN TECH Church', '123 Church Street, City, State 12345', '+1 (555) 123-4567', 'info@amentech.church', '#2563eb', '#7c3aed', '#f59e0b', 'Welcome to our church family! We are glad you are here.')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_finance_records_date ON finance_records(date);
CREATE INDEX IF NOT EXISTS idx_finance_records_type ON finance_records(type);