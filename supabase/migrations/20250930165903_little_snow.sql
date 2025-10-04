/*
  # Complete Backend Rebuild for Church Management System

  1. New Tables
    - `churches` - Church organizations with settings
    - `users` - User profiles with roles and permissions
    - `departments` - Church departments and ministries
    - `user_departments` - User-department assignments
    - `tasks` - Task management system
    - `events` - Church events and calendar
    - `attendance` - Attendance tracking
    - `prayer_requests` - Prayer wall system
    - `announcements` - Church announcements
    - `notifications` - User notifications
    - `financial_records` - Financial tracking
    - `notes` - Personal notes system
    - `invite_links` - Registration invitation system
    - `file_uploads` - File management system
    - `audit_logs` - System audit trail

  2. Security
    - Enable RLS on all tables
    - Church-scoped data isolation
    - Role-based access control
    - Secure file upload policies

  3. Storage
    - Create avatars bucket for profile images
    - Create church-files bucket for documents
    - Set up proper access policies

  4. Functions
    - Birthday calculation function
    - Permission checking function
    - Audit logging triggers
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS file_uploads CASCADE;
DROP TABLE IF EXISTS invite_links CASCADE;
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS financial_records CASCADE;
DROP TABLE IF EXISTS prayer_requests CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS user_departments CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS churches CASCADE;

-- Create churches table
CREATE TABLE churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  website text,
  logo_url text,
  theme_colors jsonb DEFAULT '{"primary": "#7C3AED", "secondary": "#F59E0B", "accent": "#EF4444"}'::jsonb,
  default_language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  pastor_id uuid,
  subscription_plan text DEFAULT 'premium',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT 'User',
  first_name text,
  last_name text,
  role text NOT NULL DEFAULT 'newcomer' CHECK (role IN ('pastor', 'admin', 'worker', 'member', 'newcomer')),
  phone text,
  address text,
  birthday date,
  birthday_month integer CHECK (birthday_month >= 1 AND birthday_month <= 12),
  birthday_day integer CHECK (birthday_day >= 1 AND birthday_day <= 31),
  profile_photo_url text,
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  is_confirmed boolean DEFAULT true,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  last_seen_at timestamptz,
  church_joined_at date DEFAULT CURRENT_DATE,
  assigned_worker_id uuid REFERENCES users(id),
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create departments table
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  leader_id uuid REFERENCES users(id),
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(church_id, name)
);

-- Create user_departments table
CREATE TABLE user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
  role_in_department text DEFAULT 'member',
  assigned_at timestamptz DEFAULT now(),
  assigned_by uuid REFERENCES users(id),
  UNIQUE(user_id, department_id)
);

-- Create tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES users(id),
  assigned_by uuid REFERENCES users(id),
  department_id uuid REFERENCES departments(id),
  due_date date,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  is_done boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create events table
CREATE TABLE events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  event_type text DEFAULT 'service' CHECK (event_type IN ('service', 'meeting', 'crusade', 'outreach', 'training', 'social')),
  max_attendees integer,
  requires_registration boolean DEFAULT false,
  image_url text,
  created_by uuid REFERENCES users(id),
  status text DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id),
  attendance_date date DEFAULT CURRENT_DATE,
  arrival_time time,
  departure_time time,
  was_present boolean DEFAULT true,
  attendance_type text DEFAULT 'service',
  notes text,
  marked_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, attendance_date, attendance_type)
);

-- Create prayer_requests table
CREATE TABLE prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  title text,
  message text NOT NULL,
  submitted_by uuid REFERENCES users(id),
  is_anonymous boolean DEFAULT false,
  is_urgent boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'answered', 'archived')),
  prayer_count integer DEFAULT 0,
  category text,
  visibility text DEFAULT 'church' CHECK (visibility IN ('public', 'church', 'leaders', 'private')),
  answered_at timestamptz,
  answer_testimony text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  announcement_type text DEFAULT 'general',
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  visible_to text DEFAULT 'all' CHECK (visible_to IN ('all', 'members', 'workers', 'pastors')),
  requires_acknowledgment boolean DEFAULT false,
  is_blinking boolean DEFAULT false,
  expires_at timestamptz,
  image_url text,
  created_by uuid REFERENCES users(id),
  status text DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  notification_type text DEFAULT 'general' CHECK (notification_type IN ('task', 'event', 'announcement', 'prayer', 'system', 'general')),
  related_entity_type text,
  related_entity_id uuid,
  action_url text,
  is_read boolean DEFAULT false,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create financial_records table
CREATE TABLE financial_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('offering', 'tithe', 'donation', 'expense')),
  amount decimal(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  description text NOT NULL,
  category text,
  transaction_date date DEFAULT CURRENT_DATE,
  payment_method text,
  reference_number text,
  receipt_url text,
  recorded_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notes table
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  color text DEFAULT '#fef3c7',
  is_pinned boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invite_links table
CREATE TABLE invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  code text UNIQUE NOT NULL,
  role text NOT NULL CHECK (role IN ('pastor', 'admin', 'worker', 'member', 'newcomer')),
  department_id uuid REFERENCES departments(id),
  expires_at timestamptz NOT NULL,
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,
  created_by uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  qr_code_url text,
  created_at timestamptz DEFAULT now()
);

-- Create file_uploads table
CREATE TABLE file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  uploaded_by uuid REFERENCES users(id) NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  mime_type text NOT NULL,
  entity_type text,
  entity_id uuid,
  access_level text DEFAULT 'church' CHECK (access_level IN ('public', 'church', 'role', 'private')),
  allowed_roles text[],
  download_count integer DEFAULT 0,
  version integer DEFAULT 1,
  is_current_version boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_users_church_id ON users(church_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_birthday ON users(birthday_month, birthday_day);
CREATE INDEX idx_departments_church_id ON departments(church_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_events_church_id ON events(church_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, attendance_date);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_financial_church_date ON financial_records(church_id, transaction_date);

-- Enable Row Level Security on all tables
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for churches
CREATE POLICY "Users can view their church" ON churches
  FOR SELECT TO authenticated
  USING (
    id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Pastors can update their church" ON churches
  FOR UPDATE TO authenticated
  USING (
    id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role = 'pastor'
    )
  );

-- Create RLS policies for users
CREATE POLICY "Users can view church members" ON users
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Pastors and admins can manage users" ON users
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- Create RLS policies for departments
CREATE POLICY "Users can view church departments" ON departments
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Leaders can manage departments" ON departments
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker')
    )
  );

-- Create RLS policies for user_departments
CREATE POLICY "Users can view department assignments" ON user_departments
  FOR SELECT TO authenticated
  USING (
    user_id IN (
      SELECT id FROM users 
      WHERE church_id IN (
        SELECT church_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Leaders can manage department assignments" ON user_departments
  FOR ALL TO authenticated
  USING (
    department_id IN (
      SELECT id FROM departments 
      WHERE church_id IN (
        SELECT church_id FROM users 
        WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker')
      )
    )
  );

-- Create RLS policies for tasks
CREATE POLICY "Users can view relevant tasks" ON tasks
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid() OR 
    assigned_by = auth.uid() OR
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    assigned_by = auth.uid() AND
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Task assignees can update completion" ON tasks
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid());

CREATE POLICY "Task creators can update tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (assigned_by = auth.uid());

-- Create RLS policies for events
CREATE POLICY "Users can view church events" ON events
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Leaders can manage events" ON events
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker')
    )
  );

-- Create RLS policies for attendance
CREATE POLICY "Users can view church attendance" ON attendance
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can mark own attendance" ON attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Leaders can mark attendance for others" ON attendance
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker')
    )
  );

-- Create RLS policies for prayer_requests
CREATE POLICY "Users can view church prayers" ON prayer_requests
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can submit prayers" ON prayer_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Prayer submitters can update own prayers" ON prayer_requests
  FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid());

-- Create RLS policies for announcements
CREATE POLICY "Users can view church announcements" ON announcements
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Leaders can manage announcements" ON announcements
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker')
    )
  );

-- Create RLS policies for notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

-- Create RLS policies for financial_records
CREATE POLICY "Financial access for authorized users" ON financial_records
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

CREATE POLICY "Authorized users can manage finances" ON financial_records
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

-- Create RLS policies for notes
CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Create RLS policies for invite_links
CREATE POLICY "Public can view active invites" ON invite_links
  FOR SELECT TO anon, authenticated
  USING (
    is_active = true AND 
    expires_at > now() AND 
    current_uses < max_uses
  );

CREATE POLICY "Leaders can manage invites" ON invite_links
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

-- Create RLS policies for file_uploads
CREATE POLICY "Users can view accessible files" ON file_uploads
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    ) AND
    (
      access_level = 'public' OR
      access_level = 'church' OR
      uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Users can upload files" ON file_uploads
  FOR INSERT TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own files" ON file_uploads
  FOR ALL TO authenticated
  USING (uploaded_by = auth.uid());

-- Create RLS policies for audit_logs
CREATE POLICY "Pastors can view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role = 'pastor'
    )
  );

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('church-files', 'church-files', false, 52428800, ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create storage policies for church files
CREATE POLICY "Church files access control" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'church-files');

CREATE POLICY "Users can upload church files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'church-files');

-- Create utility functions
CREATE OR REPLACE FUNCTION get_upcoming_birthdays(church_uuid uuid, days_ahead integer DEFAULT 7)
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
          (DATE '2024-01-01' + INTERVAL '1 year' * 
            CASE WHEN 
              MAKE_DATE(2024, u.birthday_month, u.birthday_day) >= CURRENT_DATE 
            THEN 0 ELSE 1 END + 
            MAKE_DATE(2024, u.birthday_month, u.birthday_day) - CURRENT_DATE
          )
        )
      )::integer
    END as days_until_birthday
  FROM users u
  WHERE u.church_id = church_uuid
    AND u.is_active = true
    AND u.birthday_month IS NOT NULL
    AND u.birthday_day IS NOT NULL
    AND (
      CASE 
        WHEN u.birthday_month IS NULL OR u.birthday_day IS NULL THEN 999
        ELSE (
          DATE_PART('day', 
            (DATE '2024-01-01' + INTERVAL '1 year' * 
              CASE WHEN 
                MAKE_DATE(2024, u.birthday_month, u.birthday_day) >= CURRENT_DATE 
              THEN 0 ELSE 1 END + 
              MAKE_DATE(2024, u.birthday_month, u.birthday_day) - CURRENT_DATE
            )
          )
        )::integer
      END
    ) <= days_ahead
  ORDER BY days_until_birthday ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create user permission checking function
CREATE OR REPLACE FUNCTION user_has_permission(permission_name text)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid();
  
  -- Pastor has all permissions
  IF user_role = 'pastor' THEN
    RETURN true;
  END IF;
  
  -- Admin has most permissions except church settings
  IF user_role = 'admin' AND permission_name != 'church_settings' THEN
    RETURN true;
  END IF;
  
  -- Worker has limited permissions
  IF user_role = 'worker' AND permission_name IN ('task_management', 'attendance_marking', 'event_management') THEN
    RETURN true;
  END IF;
  
  -- Member has basic permissions
  IF user_role = 'member' AND permission_name IN ('personal_access', 'event_participation') THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default church (for the pastor account)
INSERT INTO churches (id, name, theme_colors, default_language, is_active)
VALUES (
  'default-church-id',
  'AMEN TECH Church',
  '{"primary": "#7C3AED", "secondary": "#F59E0B", "accent": "#EF4444"}'::jsonb,
  'en',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert default departments
INSERT INTO departments (church_id, name, description, color, sort_order) VALUES
  ('default-church-id', 'Worship Team', 'Music and worship ministry', '#3B82F6', 1),
  ('default-church-id', 'Youth Ministry', 'Ministry for young people', '#10B981', 2),
  ('default-church-id', 'Children Ministry', 'Sunday school and children programs', '#F59E0B', 3),
  ('default-church-id', 'Evangelism', 'Outreach and soul winning', '#EF4444', 4),
  ('default-church-id', 'Ushering', 'Church service coordination', '#8B5CF6', 5),
  ('default-church-id', 'Media Team', 'Audio, video, and technical support', '#06B6D4', 6),
  ('default-church-id', 'Prayer Ministry', 'Intercessory prayer and spiritual warfare', '#EC4899', 7),
  ('default-church-id', 'Administration', 'Church administration and management', '#6B7280', 8)
ON CONFLICT (church_id, name) DO NOTHING;

-- Insert pastor user (this will be linked to auth.users via trigger)
INSERT INTO users (
  id,
  church_id,
  email,
  full_name,
  role,
  language,
  is_confirmed,
  is_active,
  church_joined_at,
  created_at
) VALUES (
  'pastor-user-id',
  'default-church-id',
  'officialezepetervictor@gmail.com',
  'Pastor Victor',
  'pastor',
  'en',
  true,
  true,
  CURRENT_DATE,
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'pastor',
  church_id = 'default-church-id',
  is_confirmed = true,
  is_active = true;

-- Create trigger function for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger AS $$
DECLARE
  church_uuid uuid;
BEGIN
  -- Get church_id from the record
  IF TG_OP = 'DELETE' THEN
    church_uuid := OLD.church_id;
  ELSE
    church_uuid := NEW.church_id;
  END IF;

  -- Insert audit log
  INSERT INTO audit_logs (
    church_id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    church_uuid,
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.id
      ELSE NEW.id
    END,
    CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN row_to_json(NEW) ELSE NULL END
  );

  RETURN CASE 
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers for important tables
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_tasks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_financial_trigger
  AFTER INSERT OR UPDATE OR DELETE ON financial_records
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user profile when auth.users record is created
  INSERT INTO public.users (
    id,
    church_id,
    email,
    full_name,
    role,
    language,
    phone,
    is_confirmed,
    church_joined_at
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'church_id', 'default-church-id'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'newcomer'),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    NEW.raw_user_meta_data->>'phone',
    NEW.email_confirmed_at IS NOT NULL,
    CURRENT_DATE
  ) ON CONFLICT (email) DO UPDATE SET
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', users.full_name),
    role = COALESCE(NEW.raw_user_meta_data->>'role', users.role),
    language = COALESCE(NEW.raw_user_meta_data->>'language', users.language),
    phone = COALESCE(NEW.raw_user_meta_data->>'phone', users.phone),
    is_confirmed = NEW.email_confirmed_at IS NOT NULL,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Final verification
DO $$
BEGIN
  RAISE NOTICE 'Backend rebuild completed successfully!';
  RAISE NOTICE 'Tables created: %', (
    SELECT count(*) FROM information_schema.tables 
    WHERE table_schema = 'public'
  );
  RAISE NOTICE 'RLS policies created: %', (
    SELECT count(*) FROM pg_policies 
    WHERE schemaname = 'public'
  );
  RAISE NOTICE 'Storage buckets: %', (
    SELECT count(*) FROM storage.buckets
  );
END $$;