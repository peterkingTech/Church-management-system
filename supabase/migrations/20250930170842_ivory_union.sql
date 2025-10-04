/*
  # Complete Backend Rebuild for Church Management System

  1. New Tables
    - `churches` - Church organizations with settings
    - `users` - User profiles with roles and permissions
    - `departments` - Church departments and ministries
    - `user_departments` - User-department assignments
    - `tasks` - Task management system
    - `events` - Event calendar and management
    - `attendance` - Attendance tracking
    - `prayer_requests` - Prayer wall system
    - `announcements` - Church announcements
    - `notifications` - User notifications
    - `financial_records` - Financial tracking
    - `notes` - Personal notes system
    - `invite_links` - Registration system
    - `file_uploads` - File management
    - `audit_logs` - System audit trail

  2. Security
    - Enable RLS on all tables
    - Church-scoped data isolation
    - Role-based access control
    - Secure file upload policies

  3. Storage
    - Create avatars bucket (public)
    - Create church-files bucket (private)
    - Set up proper storage policies

  4. Functions
    - Birthday calculation function
    - Permission checking system
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
DROP TABLE IF EXISTS financial_records CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS prayer_requests CASCADE;
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
  full_name text NOT NULL DEFAULT 'Anonymous',
  first_name text,
  last_name text,
  role text NOT NULL DEFAULT 'newcomer' CHECK (role IN ('pastor', 'admin', 'worker', 'member', 'newcomer')),
  department_id uuid,
  profile_image_url text,
  phone text,
  address text,
  birthday date,
  birthday_month integer,
  birthday_day integer,
  language text DEFAULT 'en',
  timezone text,
  is_confirmed boolean DEFAULT true,
  is_active boolean DEFAULT true,
  last_login_at timestamptz,
  last_seen_at timestamptz,
  church_joined_at date DEFAULT CURRENT_DATE,
  assigned_worker_id uuid,
  discipleship_level text,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create departments table
CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  type text DEFAULT 'general' CHECK (type IN ('worship', 'youth', 'children', 'evangelism', 'ushering', 'media', 'prayer', 'administration', 'general')),
  leader_id uuid REFERENCES users(id),
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_departments junction table
CREATE TABLE user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Create tasks table
CREATE TABLE tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
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
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  type text DEFAULT 'service' CHECK (type IN ('service', 'meeting', 'crusade', 'outreach', 'training')),
  max_attendees integer,
  requires_registration boolean DEFAULT false,
  is_public boolean DEFAULT true,
  image_url text,
  created_by uuid REFERENCES users(id),
  status text DEFAULT 'scheduled' CHECK (status IN ('draft', 'scheduled', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id),
  date date DEFAULT CURRENT_DATE,
  arrival_time time,
  was_present boolean DEFAULT true,
  attendance_type text DEFAULT 'service',
  notes text,
  marked_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create prayer_requests table
CREATE TABLE prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
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
  testimony text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create announcements table
CREATE TABLE announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  type text DEFAULT 'general',
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  visible_to text DEFAULT 'all' CHECK (visible_to IN ('all', 'members', 'workers', 'pastors')),
  requires_acknowledgment boolean DEFAULT false,
  is_blinking boolean DEFAULT false,
  publish_at timestamptz DEFAULT now(),
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
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'general' CHECK (type IN ('task', 'event', 'announcement', 'prayer', 'report', 'general')),
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
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('offering', 'tithe', 'donation', 'expense')),
  amount numeric(10,2) NOT NULL,
  description text NOT NULL,
  category text,
  date date DEFAULT CURRENT_DATE,
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
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  is_pinned boolean DEFAULT false,
  color text DEFAULT '#fef3c7',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invite_links table
CREATE TABLE invite_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
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
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES users(id),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  mime_type text NOT NULL,
  entity_type text DEFAULT 'general',
  entity_id uuid,
  access_level text DEFAULT 'church' CHECK (access_level IN ('public', 'church', 'role', 'private')),
  allowed_roles text[] DEFAULT ARRAY['pastor', 'admin', 'worker', 'member'],
  download_count integer DEFAULT 0,
  version integer DEFAULT 1,
  is_current_version boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create audit_logs table
CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
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

-- Add foreign key constraints
ALTER TABLE churches ADD CONSTRAINT churches_pastor_id_fkey FOREIGN KEY (pastor_id) REFERENCES users(id);
ALTER TABLE users ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES departments(id);
ALTER TABLE users ADD CONSTRAINT users_assigned_worker_id_fkey FOREIGN KEY (assigned_worker_id) REFERENCES users(id);

-- Create indexes for performance
CREATE INDEX idx_users_church_id ON users(church_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_departments_church_id ON departments(church_id);
CREATE INDEX idx_tasks_church_id ON tasks(church_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_events_church_id ON events(church_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_attendance_church_id ON attendance(church_id);
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_prayer_requests_church_id ON prayer_requests(church_id);
CREATE INDEX idx_announcements_church_id ON announcements(church_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_financial_records_church_id ON financial_records(church_id);
CREATE INDEX idx_financial_records_date ON financial_records(date);

-- Enable Row Level Security
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

-- Create RLS Policies

-- Churches policies
CREATE POLICY "Users can view their church" ON churches
  FOR SELECT TO authenticated
  USING (id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Pastors can update their church" ON churches
  FOR UPDATE TO authenticated
  USING (pastor_id = auth.uid());

-- Users policies
CREATE POLICY "Users can view church members" ON users
  FOR SELECT TO authenticated
  USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Pastors and admins can manage users" ON users
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('pastor', 'admin')
    )
  );

-- Departments policies
CREATE POLICY "Users can view departments" ON departments
  FOR SELECT TO authenticated
  USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Leaders can manage departments" ON departments
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('pastor', 'admin', 'worker')
    )
  );

-- User_departments policies
CREATE POLICY "Users can view department assignments" ON user_departments
  FOR SELECT TO authenticated
  USING (
    department_id IN (
      SELECT d.id FROM departments d
      JOIN users u ON d.church_id = u.church_id
      WHERE u.id = auth.uid()
    )
  );

-- Tasks policies
CREATE POLICY "Users can view relevant tasks" ON tasks
  FOR SELECT TO authenticated
  USING (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
    AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
  );

CREATE POLICY "Users can update assigned tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Leaders can create tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('pastor', 'admin', 'worker')
    )
  );

-- Events policies
CREATE POLICY "Users can view church events" ON events
  FOR SELECT TO authenticated
  USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Leaders can manage events" ON events
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('pastor', 'admin', 'worker')
    )
  );

-- Attendance policies
CREATE POLICY "Users can view own attendance" ON attendance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark own attendance" ON attendance
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Leaders can manage attendance" ON attendance
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('pastor', 'admin', 'worker')
    )
  );

-- Prayer requests policies
CREATE POLICY "Users can view prayer requests" ON prayer_requests
  FOR SELECT TO authenticated
  USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create prayer requests" ON prayer_requests
  FOR INSERT TO authenticated
  WITH CHECK (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own prayer requests" ON prayer_requests
  FOR UPDATE TO authenticated
  USING (submitted_by = auth.uid());

-- Announcements policies
CREATE POLICY "Users can view announcements" ON announcements
  FOR SELECT TO authenticated
  USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Leaders can manage announcements" ON announcements
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('pastor', 'admin', 'worker')
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Financial records policies
CREATE POLICY "Financial access for authorized roles" ON financial_records
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('pastor', 'admin')
    )
  );

CREATE POLICY "Financial management for pastors" ON financial_records
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'pastor'
    )
  );

-- Notes policies
CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Invite links policies
CREATE POLICY "Public can view active invites" ON invite_links
  FOR SELECT TO anon, authenticated
  USING (is_active = true AND expires_at > now());

CREATE POLICY "Leaders can manage invites" ON invite_links
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() 
      AND role IN ('pastor', 'admin')
    )
  );

-- File uploads policies
CREATE POLICY "Users can view accessible files" ON file_uploads
  FOR SELECT TO authenticated
  USING (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid())
    AND (
      access_level = 'public' 
      OR access_level = 'church'
      OR uploaded_by = auth.uid()
    )
  );

CREATE POLICY "Users can upload files" ON file_uploads
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Audit logs policies
CREATE POLICY "Pastors can view audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() 
      AND role = 'pastor'
    )
  );

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('church-files', 'church-files', false, 52428800, ARRAY['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for church files
CREATE POLICY "Church files access" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'church-files');

CREATE POLICY "Users can upload church files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'church-files');

-- Create birthday calculation function
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
              MAKE_DATE(2024, u.birthday_month, u.birthday_day) < CURRENT_DATE 
            THEN 1 ELSE 0 END + 
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
                MAKE_DATE(2024, u.birthday_month, u.birthday_day) < CURRENT_DATE 
              THEN 1 ELSE 0 END + 
              MAKE_DATE(2024, u.birthday_month, u.birthday_day) - CURRENT_DATE
            )
          )
        )::integer
      END
    ) <= days_ahead
  ORDER BY days_until_birthday ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default church
INSERT INTO churches (id, name, theme_colors, default_language, is_active)
VALUES (
  'default-church-id',
  'AMEN TECH Church',
  '{"primary": "#7C3AED", "secondary": "#F59E0B", "accent": "#EF4444"}'::jsonb,
  'en',
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert default departments
INSERT INTO departments (church_id, name, description, type, color, sort_order) VALUES
  ('default-church-id', 'Worship Team', 'Leading church worship and music ministry', 'worship', '#3B82F6', 1),
  ('default-church-id', 'Youth Ministry', 'Ministry for young people and teenagers', 'youth', '#10B981', 2),
  ('default-church-id', 'Children Ministry', 'Sunday school and children programs', 'children', '#F59E0B', 3),
  ('default-church-id', 'Evangelism', 'Outreach and soul winning ministry', 'evangelism', '#EF4444', 4),
  ('default-church-id', 'Ushering', 'Church service coordination and hospitality', 'ushering', '#8B5CF6', 5),
  ('default-church-id', 'Media Team', 'Audio, video, and technical support', 'media', '#06B6D4', 6),
  ('default-church-id', 'Prayer Ministry', 'Intercessory prayer and spiritual warfare', 'prayer', '#EC4899', 7),
  ('default-church-id', 'Administration', 'Church administration and management', 'administration', '#6B7280', 8)
ON CONFLICT DO NOTHING;

-- Insert pastor user (will be linked to auth user when they sign up)
INSERT INTO users (
  id,
  church_id,
  email,
  full_name,
  role,
  language,
  is_confirmed,
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
  CURRENT_DATE,
  now()
) ON CONFLICT (email) DO UPDATE SET
  role = 'pastor',
  is_confirmed = true,
  updated_at = now();

-- Update church with pastor_id
UPDATE churches 
SET pastor_id = 'pastor-user-id' 
WHERE id = 'default-church-id';

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    church_id,
    user_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values
  ) VALUES (
    COALESCE(NEW.church_id, OLD.church_id),
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
CREATE TRIGGER users_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER tasks_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Create birthday update trigger
CREATE OR REPLACE FUNCTION update_birthday_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.birthday IS NOT NULL THEN
    NEW.birthday_month := EXTRACT(MONTH FROM NEW.birthday);
    NEW.birthday_day := EXTRACT(DAY FROM NEW.birthday);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_birthday_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  WHEN (NEW.birthday IS NOT NULL)
  EXECUTE FUNCTION update_birthday_fields();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated, anon;

-- Insert sample data for testing
INSERT INTO prayer_requests (church_id, title, message, submitted_by, status, prayer_count) VALUES
  ('default-church-id', 'Healing Prayer', 'Please pray for my family member who is sick', 'pastor-user-id', 'active', 5),
  ('default-church-id', 'Thanksgiving', 'Thank God for His blessings this month', 'pastor-user-id', 'active', 12)
ON CONFLICT DO NOTHING;

INSERT INTO announcements (church_id, title, content, visible_to, created_by, status) VALUES
  ('default-church-id', 'Welcome to Church Management System', 'Welcome to our new digital church management platform!', 'all', 'pastor-user-id', 'active'),
  ('default-church-id', 'Sunday Service Update', 'Service time has been updated to 10:00 AM', 'all', 'pastor-user-id', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO events (church_id, title, description, date, start_time, location, type, created_by) VALUES
  ('default-church-id', 'Sunday Morning Service', 'Weekly worship service', CURRENT_DATE + INTERVAL '7 days', '10:00:00', 'Main Sanctuary', 'service', 'pastor-user-id'),
  ('default-church-id', 'Prayer Meeting', 'Midweek prayer and fellowship', CURRENT_DATE + INTERVAL '3 days', '18:00:00', 'Prayer Room', 'meeting', 'pastor-user-id')
ON CONFLICT DO NOTHING;

-- Final verification
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Tables created: %', (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public');
  RAISE NOTICE 'RLS enabled on all tables';
  RAISE NOTICE 'Storage buckets configured';
  RAISE NOTICE 'Default data inserted';
  RAISE NOTICE 'Pastor account ready: officialezepetervictor@gmail.com';
END $$;