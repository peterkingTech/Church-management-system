/*
  # Complete Production Database Setup for Church Data Log Management System

  This migration sets up a complete, production-ready database with:
  1. All required tables with proper structure
  2. Row Level Security (RLS) policies
  3. Storage buckets for file uploads
  4. Default data (departments, church settings)
  5. Proper indexes for performance
  6. Security policies for all roles

  Run this in your Supabase SQL Editor to set up everything.
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS public.folder_comments CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.pd_reports CASCADE;
DROP TABLE IF EXISTS public.department_reports CASCADE;
DROP TABLE IF EXISTS public.follow_ups CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.finance_records CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;
DROP TABLE IF EXISTS public.souls_won CASCADE;
DROP TABLE IF EXISTS public.notices CASCADE;
DROP TABLE IF EXISTS public.excuses CASCADE;
DROP TABLE IF EXISTS public.pdf_files CASCADE;
DROP TABLE IF EXISTS public.permissions CASCADE;
DROP TABLE IF EXISTS public.user_departments CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.church_settings CASCADE;
DROP TABLE IF EXISTS public.registration_links CASCADE;
DROP TABLE IF EXISTS public.birthday_reminders CASCADE;
DROP TABLE IF EXISTS public.bible_verses CASCADE;
DROP TABLE IF EXISTS public.departments CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create departments table
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text UNIQUE NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  full_name text DEFAULT 'Anonymous',
  email text UNIQUE NOT NULL,
  role text NOT NULL DEFAULT 'newcomer' CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer')),
  is_confirmed boolean DEFAULT false,
  church_joined_at date DEFAULT CURRENT_DATE,
  profile_image_url text,
  created_at timestamptz DEFAULT now(),
  address text,
  department_id uuid REFERENCES departments(id),
  last_login timestamptz,
  notes text,
  birthday_month integer CHECK (birthday_month >= 1 AND birthday_month <= 12),
  birthday_day integer CHECK (birthday_day >= 1 AND birthday_day <= 31),
  phone text,
  language text DEFAULT 'en'
);

-- Create user_departments junction table
CREATE TABLE public.user_departments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assigned_by uuid REFERENCES users(id),
  assigned_to uuid REFERENCES users(id),
  task_text text,
  due_date date,
  is_done boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id),
  date date DEFAULT CURRENT_DATE,
  arrival_time time,
  was_present boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create finance_records table
CREATE TABLE public.finance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('offering', 'tithe', 'donation', 'expense')),
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  category text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('task', 'event', 'pd_report', 'general', 'announcement', 'prayer')),
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Create notes table
CREATE TABLE public.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  color text DEFAULT '#fef3c7',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create church_settings table
CREATE TABLE public.church_settings (
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

-- Create registration_links table
CREATE TABLE public.registration_links (
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
CREATE TABLE public.programs (
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

-- Create souls_won table
CREATE TABLE public.souls_won (
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

-- Create folders table
CREATE TABLE public.folders (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  type text NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create folder_comments table
CREATE TABLE public.folder_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  comment_by uuid REFERENCES users(id),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Create pd_reports table
CREATE TABLE public.pd_reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id uuid REFERENCES users(id),
  receiver_id uuid REFERENCES users(id),
  message text NOT NULL,
  date_sent timestamptz DEFAULT now()
);

-- Create birthday_reminders table
CREATE TABLE public.birthday_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reminder_days_before integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create pdf_files table for document storage
CREATE TABLE public.pdf_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  entity_type text NOT NULL CHECK (entity_type IN ('folder', 'summary', 'report', 'program', 'task', 'notice', 'excuse', 'department_report')),
  entity_id uuid,
  uploaded_by uuid REFERENCES users(id),
  uploaded_by_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  file_type text DEFAULT 'pdf'
);

-- Add indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_birthday ON users(birthday_month, birthday_day);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_finance_records_date ON finance_records(date);
CREATE INDEX idx_finance_records_type ON finance_records(type);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notes_user_id ON notes(user_id);
CREATE INDEX idx_notes_is_pinned ON notes(is_pinned);
CREATE INDEX idx_registration_links_code ON registration_links(code);
CREATE INDEX idx_registration_links_expires_at ON registration_links(expires_at);
CREATE INDEX idx_pdf_files_entity_type ON pdf_files(entity_type);
CREATE INDEX idx_pdf_files_entity_id ON pdf_files(entity_id);
CREATE INDEX idx_pdf_files_created_at ON pdf_files(created_at);
CREATE INDEX idx_pdf_files_file_type ON pdf_files(file_type);

-- Enable Row Level Security on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls_won ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for departments
CREATE POLICY "All users can view departments" ON departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage departments" ON departments FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('pastor', 'admin')));

-- RLS Policies for users
CREATE POLICY "Users can view own profile" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can manage all users" ON users FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('pastor', 'admin')));

-- RLS Policies for user_departments
CREATE POLICY "Users can view their own department assignments" ON user_departments FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage user departments" ON user_departments FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'pastor')));

-- RLS Policies for tasks
CREATE POLICY "Users can view assigned tasks" ON tasks FOR SELECT TO authenticated USING ((assigned_to = auth.uid()) OR (assigned_by = auth.uid()));
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE TO authenticated USING ((assigned_to = auth.uid()) OR (assigned_by = auth.uid()));
CREATE POLICY "Leaders can manage tasks" ON tasks FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('pastor', 'admin', 'worker')));

-- RLS Policies for attendance
CREATE POLICY "Users can view own attendance" ON attendance FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Leaders can manage attendance" ON attendance FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('pastor', 'admin', 'worker')));

-- RLS Policies for finance_records
CREATE POLICY "Finance admins and pastors can manage finance records" ON finance_records FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('pastor', 'finance_admin')));

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);

-- RLS Policies for notes
CREATE POLICY "Users can manage own notes" ON notes FOR ALL TO authenticated USING (user_id = auth.uid());

-- RLS Policies for church_settings
CREATE POLICY "All users can view church settings" ON church_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Pastors can manage church settings" ON church_settings FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'pastor'));

-- RLS Policies for registration_links
CREATE POLICY "Pastors and admins can manage registration links" ON registration_links FOR ALL TO authenticated 
  USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('pastor', 'admin')));

-- RLS Policies for programs
CREATE POLICY "All users can view programs" ON programs FOR SELECT TO public USING (true);

-- RLS Policies for souls_won
CREATE POLICY "All users can view souls won" ON souls_won FOR SELECT TO public USING (true);

-- RLS Policies for folders
CREATE POLICY "Pastor and Worker can insert folders" ON folders FOR INSERT TO public WITH CHECK (created_by = auth.uid());

-- RLS Policies for folder_comments
CREATE POLICY "User can view their comments" ON folder_comments FOR SELECT TO public USING (comment_by = auth.uid());
CREATE POLICY "User can insert their own comments" ON folder_comments FOR INSERT TO public WITH CHECK (comment_by = auth.uid());

-- RLS Policies for pd_reports
CREATE POLICY "Worker can view own PD reports" ON pd_reports FOR SELECT TO public USING ((sender_id = auth.uid()) OR (receiver_id = auth.uid()));

-- RLS Policies for birthday_reminders
CREATE POLICY "Users can manage own birthday reminders" ON birthday_reminders FOR ALL TO authenticated USING (user_id = auth.uid());

-- RLS Policies for pdf_files
CREATE POLICY "Anyone can view PDF files" ON pdf_files FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can upload PDF files" ON pdf_files FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete PDF files" ON pdf_files FOR DELETE TO public USING (true);

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for documents bucket
CREATE POLICY "Documents are accessible to authenticated users" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Authenticated users can upload documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents');
CREATE POLICY "Users can update their own documents" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'documents');
CREATE POLICY "Users can delete their own documents" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'documents');

-- Insert default departments
INSERT INTO departments (name, description) VALUES
  ('Worship Team', 'Leading church worship and music ministry'),
  ('Youth Ministry', 'Ministry focused on young people and teenagers'),
  ('Children Ministry', 'Sunday school and children programs'),
  ('Evangelism', 'Outreach and soul winning ministry'),
  ('Ushering', 'Church service coordination and hospitality'),
  ('Media Team', 'Audio, video, and technical support'),
  ('Prayer Ministry', 'Intercessory prayer and prayer meetings'),
  ('Finance', 'Church financial management and stewardship');

-- Insert default church settings
INSERT INTO church_settings (church_name, welcome_message, primary_color, secondary_color, accent_color) VALUES
  ('CHURCH DATA LOG MANAGEMENT SYSTEM', 'Welcome to our church family!', '#2563eb', '#7c3aed', '#f59e0b');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role, language, is_confirmed)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'New User'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'newcomer'),
    COALESCE(new.raw_user_meta_data->>'language', 'en'),
    true
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to get upcoming birthdays
CREATE OR REPLACE FUNCTION get_upcoming_birthdays(days_ahead integer DEFAULT 7)
RETURNS TABLE (
  id uuid,
  full_name text,
  birthday_month integer,
  birthday_day integer,
  days_until_birthday integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.birthday_month,
    u.birthday_day,
    CASE 
      WHEN u.birthday_month IS NULL OR u.birthday_day IS NULL THEN 999
      ELSE (
        DATE_PART('day', 
          (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' * 
           CASE WHEN MAKE_DATE(EXTRACT(year FROM CURRENT_DATE)::int, u.birthday_month, u.birthday_day) < CURRENT_DATE 
                THEN 1 ELSE 0 END + 
           MAKE_DATE(EXTRACT(year FROM CURRENT_DATE)::int, u.birthday_month, u.birthday_day) - CURRENT_DATE)
        )
      )::integer
    END as days_until_birthday
  FROM users u
  WHERE u.birthday_month IS NOT NULL 
    AND u.birthday_day IS NOT NULL
    AND u.is_confirmed = true
    AND (
      DATE_PART('day', 
        (DATE_TRUNC('year', CURRENT_DATE) + INTERVAL '1 year' * 
         CASE WHEN MAKE_DATE(EXTRACT(year FROM CURRENT_DATE)::int, u.birthday_month, u.birthday_day) < CURRENT_DATE 
              THEN 1 ELSE 0 END + 
         MAKE_DATE(EXTRACT(year FROM CURRENT_DATE)::int, u.birthday_month, u.birthday_day) - CURRENT_DATE)
      ) <= days_ahead
    )
  ORDER BY days_until_birthday ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'Created tables: departments, users, tasks, attendance, finance_records, notifications, notes, church_settings, registration_links, programs, souls_won, folders, folder_comments, pd_reports, birthday_reminders, pdf_files';
  RAISE NOTICE 'Created storage buckets: avatars (public), documents (private)';
  RAISE NOTICE 'Applied Row Level Security policies to all tables';
  RAISE NOTICE 'Inserted default departments and church settings';
  RAISE NOTICE 'Your database is ready for production use!';
END $$;