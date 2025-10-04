/*
  # Complete Church Management System Database Setup

  This migration fixes all critical issues and implements the complete church management system:

  1. Critical Bug Fixes
    - Fix 'phone' column schema cache error
    - Resolve RLS policy conflicts
    - Add missing tables and relationships

  2. New Tables
    - `file_uploads` - Secure file management with versioning
    - `audit_logs` - Comprehensive change tracking
    - `user_sessions` - Session management
    - `church_events` - Enhanced event management
    - `birthday_notifications` - Birthday tracking system
    - `announcement_confirmations` - Announcement read receipts

  3. Enhanced Features
    - Role-based access control
    - File upload/download system
    - Audit trail functionality
    - Birthday notification system
    - Interactive dashboard metrics

  4. Security
    - Church-scoped data isolation
    - Role-based RLS policies
    - Secure file access controls
    - Audit trail for all changes
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Drop existing policies to prevent conflicts
DROP POLICY IF EXISTS "All users can view departments" ON departments;
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance;

-- Fix users table schema (add missing columns)
DO $$
BEGIN
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;

  -- Add address column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'address'
  ) THEN
    ALTER TABLE users ADD COLUMN address text;
  END IF;

  -- Add birthday columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'birthday_month'
  ) THEN
    ALTER TABLE users ADD COLUMN birthday_month integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'birthday_day'
  ) THEN
    ALTER TABLE users ADD COLUMN birthday_day integer;
  END IF;

  -- Add church_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE users ADD COLUMN church_id uuid;
  END IF;
END $$;

-- Create churches table for multi-tenant support
CREATE TABLE IF NOT EXISTS churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  website text,
  pastor_id uuid,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE churches ENABLE ROW LEVEL SECURITY;

-- Create file_uploads table for comprehensive file management
CREATE TABLE IF NOT EXISTS file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  uploaded_by uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  mime_type text NOT NULL,
  entity_type text NOT NULL, -- 'event', 'report', 'announcement', 'general'
  entity_id uuid,
  version integer DEFAULT 1,
  is_current_version boolean DEFAULT true,
  access_level text DEFAULT 'church' CHECK (access_level IN ('public', 'church', 'role', 'private')),
  allowed_roles text[] DEFAULT ARRAY['pastor', 'admin', 'worker', 'member'],
  download_count integer DEFAULT 0,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Create audit_logs table for comprehensive tracking
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create user_sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  church_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create church_events table for enhanced event management
CREATE TABLE IF NOT EXISTS church_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  location text,
  event_type text DEFAULT 'service' CHECK (event_type IN ('service', 'meeting', 'crusade', 'outreach', 'training', 'social')),
  max_attendees integer,
  registration_required boolean DEFAULT false,
  image_url text,
  created_by uuid NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'draft')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE church_events ENABLE ROW LEVEL SECURITY;

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES church_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  church_id uuid NOT NULL,
  registration_date timestamptz DEFAULT now(),
  status text DEFAULT 'registered' CHECK (status IN ('registered', 'attended', 'no_show', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Create birthday_notifications table
CREATE TABLE IF NOT EXISTS birthday_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  user_id uuid NOT NULL,
  birthday_date date NOT NULL,
  notification_sent boolean DEFAULT false,
  acknowledged_by uuid[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE birthday_notifications ENABLE ROW LEVEL SECURITY;

-- Create announcement_confirmations table
CREATE TABLE IF NOT EXISTS announcement_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id uuid NOT NULL,
  user_id uuid NOT NULL,
  church_id uuid NOT NULL,
  confirmed_at timestamptz DEFAULT now(),
  UNIQUE(announcement_id, user_id)
);

ALTER TABLE announcement_confirmations ENABLE ROW LEVEL SECURITY;

-- Create dashboard_metrics table for tracking
CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL,
  metric_type text NOT NULL,
  metric_value integer NOT NULL,
  date date DEFAULT CURRENT_DATE,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(church_id, metric_type, date)
);

ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Add church_id to existing tables if missing
DO $$
BEGIN
  -- Add church_id to departments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'departments' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE departments ADD COLUMN church_id uuid;
  END IF;

  -- Add church_id to tasks
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN church_id uuid;
  END IF;

  -- Add church_id to attendance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE attendance ADD COLUMN church_id uuid;
  END IF;

  -- Add church_id to finance_records
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'finance_records' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE finance_records ADD COLUMN church_id uuid;
  END IF;

  -- Add church_id to notifications
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE notifications ADD COLUMN church_id uuid;
  END IF;

  -- Add church_id to notes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE notes ADD COLUMN church_id uuid;
  END IF;
END $$;

-- Create helper function to get user's church_id
CREATE OR REPLACE FUNCTION get_user_church_id(user_uuid uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT church_id FROM users WHERE id = user_uuid LIMIT 1;
$$;

-- Create helper function to check if user is pastor
CREATE OR REPLACE FUNCTION is_pastor(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role = 'pastor' FROM users WHERE id = user_uuid LIMIT 1;
$$;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin_or_pastor(user_uuid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role IN ('pastor', 'admin') FROM users WHERE id = user_uuid LIMIT 1;
$$;

-- Create function to get upcoming birthdays
CREATE OR REPLACE FUNCTION get_upcoming_birthdays(church_uuid uuid, days_ahead integer DEFAULT 7)
RETURNS TABLE (
  id uuid,
  full_name text,
  birthday_month integer,
  birthday_day integer,
  days_until_birthday integer
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    u.id,
    u.full_name,
    u.birthday_month,
    u.birthday_day,
    CASE 
      WHEN EXTRACT(DOY FROM (CURRENT_DATE + INTERVAL '1 year')) + 
           (u.birthday_month * 31 + u.birthday_day) - EXTRACT(DOY FROM CURRENT_DATE) <= days_ahead
      THEN (EXTRACT(DOY FROM (CURRENT_DATE + INTERVAL '1 year')) + 
            (u.birthday_month * 31 + u.birthday_day) - EXTRACT(DOY FROM CURRENT_DATE))::integer
      WHEN (u.birthday_month * 31 + u.birthday_day) - EXTRACT(DOY FROM CURRENT_DATE) <= days_ahead
      THEN ((u.birthday_month * 31 + u.birthday_day) - EXTRACT(DOY FROM CURRENT_DATE))::integer
      ELSE NULL
    END as days_until_birthday
  FROM users u
  WHERE u.church_id = church_uuid 
    AND u.birthday_month IS NOT NULL 
    AND u.birthday_day IS NOT NULL
    AND (
      (u.birthday_month * 31 + u.birthday_day) - EXTRACT(DOY FROM CURRENT_DATE) <= days_ahead
      OR 
      EXTRACT(DOY FROM (CURRENT_DATE + INTERVAL '1 year')) + 
      (u.birthday_month * 31 + u.birthday_day) - EXTRACT(DOY FROM CURRENT_DATE) <= days_ahead
    )
  ORDER BY days_until_birthday ASC;
$$;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('church-files', 'church-files', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('event-images', 'event-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for Churches
CREATE POLICY "churches_select_own" ON churches
  FOR SELECT TO authenticated
  USING (pastor_id = auth.uid() OR id = get_user_church_id(auth.uid()));

CREATE POLICY "churches_insert_pastor" ON churches
  FOR INSERT TO authenticated
  WITH CHECK (pastor_id = auth.uid());

CREATE POLICY "churches_update_pastor" ON churches
  FOR UPDATE TO authenticated
  USING (pastor_id = auth.uid())
  WITH CHECK (pastor_id = auth.uid());

-- RLS Policies for Users (Fixed - No Recursion)
CREATE POLICY "users_select_church_members" ON users
  FOR SELECT TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) OR 
    auth.uid() = id
  );

CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own_or_admin" ON users
  FOR UPDATE TO authenticated
  USING (
    id = auth.uid() OR 
    is_admin_or_pastor(auth.uid())
  )
  WITH CHECK (
    id = auth.uid() OR 
    is_admin_or_pastor(auth.uid())
  );

-- RLS Policies for Departments (Fixed)
CREATE POLICY "departments_select_church" ON departments
  FOR SELECT TO authenticated
  USING (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "departments_insert_admin" ON departments
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) AND
    is_admin_or_pastor(auth.uid())
  );

CREATE POLICY "departments_update_admin" ON departments
  FOR UPDATE TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    is_admin_or_pastor(auth.uid())
  );

-- RLS Policies for Tasks
CREATE POLICY "tasks_select_involved" ON tasks
  FOR SELECT TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    (assigned_to = auth.uid() OR assigned_by = auth.uid() OR is_admin_or_pastor(auth.uid()))
  );

CREATE POLICY "tasks_insert_authorized" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) AND
    assigned_by = auth.uid()
  );

CREATE POLICY "tasks_update_involved" ON tasks
  FOR UPDATE TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    (assigned_to = auth.uid() OR assigned_by = auth.uid() OR is_admin_or_pastor(auth.uid()))
  );

-- RLS Policies for Attendance
CREATE POLICY "attendance_select_own_or_admin" ON attendance
  FOR SELECT TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    (user_id = auth.uid() OR is_admin_or_pastor(auth.uid()))
  );

CREATE POLICY "attendance_insert_own_or_admin" ON attendance
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) AND
    (user_id = auth.uid() OR is_admin_or_pastor(auth.uid()))
  );

CREATE POLICY "attendance_update_own_or_admin" ON attendance
  FOR UPDATE TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    (user_id = auth.uid() OR is_admin_or_pastor(auth.uid()))
  );

-- RLS Policies for Finance Records
CREATE POLICY "finance_select_authorized" ON finance_records
  FOR SELECT TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    (is_pastor(auth.uid()) OR 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'finance_admin'))
  );

CREATE POLICY "finance_insert_authorized" ON finance_records
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) AND
    (is_pastor(auth.uid()) OR 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'finance_admin'))
  );

-- RLS Policies for File Uploads
CREATE POLICY "files_select_authorized" ON file_uploads
  FOR SELECT TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    (
      access_level = 'public' OR
      access_level = 'church' OR
      (access_level = 'role' AND EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = ANY(allowed_roles)
      )) OR
      (access_level = 'private' AND uploaded_by = auth.uid())
    )
  );

CREATE POLICY "files_insert_church_members" ON file_uploads
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) AND
    uploaded_by = auth.uid()
  );

CREATE POLICY "files_update_owner_or_admin" ON file_uploads
  FOR UPDATE TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    (uploaded_by = auth.uid() OR is_admin_or_pastor(auth.uid()))
  );

-- RLS Policies for Church Events
CREATE POLICY "events_select_church" ON church_events
  FOR SELECT TO authenticated
  USING (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "events_insert_authorized" ON church_events
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) AND
    created_by = auth.uid() AND
    (is_admin_or_pastor(auth.uid()) OR 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'worker'))
  );

-- RLS Policies for Event Registrations
CREATE POLICY "registrations_select_church" ON event_registrations
  FOR SELECT TO authenticated
  USING (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "registrations_insert_own" ON event_registrations
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) AND
    user_id = auth.uid()
  );

-- RLS Policies for Birthday Notifications
CREATE POLICY "birthdays_select_church" ON birthday_notifications
  FOR SELECT TO authenticated
  USING (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "birthdays_insert_system" ON birthday_notifications
  FOR INSERT TO authenticated
  WITH CHECK (church_id = get_user_church_id(auth.uid()));

-- RLS Policies for Announcement Confirmations
CREATE POLICY "confirmations_select_church" ON announcement_confirmations
  FOR SELECT TO authenticated
  USING (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "confirmations_insert_own" ON announcement_confirmations
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) AND
    user_id = auth.uid()
  );

-- RLS Policies for Dashboard Metrics
CREATE POLICY "metrics_select_church" ON dashboard_metrics
  FOR SELECT TO authenticated
  USING (church_id = get_user_church_id(auth.uid()));

CREATE POLICY "metrics_insert_admin" ON dashboard_metrics
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) AND
    is_admin_or_pastor(auth.uid())
  );

-- RLS Policies for Audit Logs
CREATE POLICY "audit_select_admin" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) AND
    is_admin_or_pastor(auth.uid())
  );

-- RLS Policies for User Sessions
CREATE POLICY "sessions_select_own" ON user_sessions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "sessions_insert_own" ON user_sessions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Storage Policies
CREATE POLICY "church_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'church-files' AND (storage.foldername(name))[1] = get_user_church_id(auth.uid())::text);

CREATE POLICY "church_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'church-files' AND (storage.foldername(name))[1] = get_user_church_id(auth.uid())::text);

CREATE POLICY "event_images_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'event-images');

CREATE POLICY "event_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-images' AND (storage.foldername(name))[1] = get_user_church_id(auth.uid())::text);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_church_id ON users(church_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_birthday ON users(birthday_month, birthday_day);
CREATE INDEX IF NOT EXISTS idx_departments_church_id ON departments(church_id);
CREATE INDEX IF NOT EXISTS idx_tasks_church_id ON tasks(church_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_attendance_church_id ON attendance(church_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_finance_church_id ON finance_records(church_id);
CREATE INDEX IF NOT EXISTS idx_events_church_id ON church_events(church_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON church_events(event_date);
CREATE INDEX IF NOT EXISTS idx_file_uploads_church_id ON file_uploads(church_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_church_id ON audit_logs(church_id);

-- Add audit triggers to important tables
DROP TRIGGER IF EXISTS audit_users_trigger ON users;
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_tasks_trigger ON tasks;
CREATE TRIGGER audit_tasks_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tasks
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

DROP TRIGGER IF EXISTS audit_finance_trigger ON finance_records;
CREATE TRIGGER audit_finance_trigger
  AFTER INSERT OR UPDATE OR DELETE ON finance_records
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Insert default church settings
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

-- Insert default departments
INSERT INTO departments (name, description) VALUES
  ('Worship Team', 'Leading church worship and music'),
  ('Youth Ministry', 'Ministry for young people'),
  ('Children Ministry', 'Sunday school and children programs'),
  ('Evangelism', 'Outreach and soul winning'),
  ('Ushering', 'Church service coordination'),
  ('Media Team', 'Audio, video, and technical support'),
  ('Prayer Ministry', 'Intercessory prayer and prayer meetings'),
  ('Administration', 'Church administration and management')
ON CONFLICT (name) DO NOTHING;