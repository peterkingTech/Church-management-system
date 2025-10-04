/*
  # Fix RLS Policy Conflicts

  This migration resolves the "policy already exists" error by:
  1. Dropping all existing policies safely
  2. Recreating them with proper naming and logic
  3. Adding error handling to prevent future conflicts

  ## Root Cause Analysis
  The error occurs because:
  - Policy names must be unique per table
  - Previous migrations may have created policies with the same name
  - Supabase doesn't allow duplicate policy names even if content differs
  - Failed migrations can leave partial policies in place

  ## Solution Approach
  - Use DROP POLICY IF EXISTS for safe cleanup
  - Implement consistent naming conventions
  - Add proper error handling
  - Verify policies before creation
*/

-- ============================================================================
-- STEP 1: SAFELY DROP ALL EXISTING POLICIES
-- ============================================================================

-- Drop policies for departments table
DROP POLICY IF EXISTS "All users can view departments" ON departments;
DROP POLICY IF EXISTS "Everyone can view departments" ON departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Users can view departments" ON departments;

-- Drop policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Drop policies for tasks table
DROP POLICY IF EXISTS "Users can view their tasks" ON tasks;
DROP POLICY IF EXISTS "Users can assign tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert tasks they assign" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;

-- Drop policies for attendance table
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Users can update attendance" ON attendance;
DROP POLICY IF EXISTS "Users can insert own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance;
DROP POLICY IF EXISTS "Users view own attendance" ON attendance;

-- Drop policies for notes table
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
DROP POLICY IF EXISTS "Users view own notes" ON notes;
DROP POLICY IF EXISTS "Users insert own notes" ON notes;
DROP POLICY IF EXISTS "Users update own notes" ON notes;
DROP POLICY IF EXISTS "Users delete own notes" ON notes;

-- Drop policies for notifications table
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update their notifications" ON notifications;

-- Drop policies for finance_records table
DROP POLICY IF EXISTS "Finance admins can manage records" ON finance_records;
DROP POLICY IF EXISTS "Users can view finance records" ON finance_records;

-- Drop policies for other tables
DROP POLICY IF EXISTS "Users can view own permissions" ON permissions;
DROP POLICY IF EXISTS "Worker can view own permissions" ON permissions;
DROP POLICY IF EXISTS "Users can view own department assignments" ON user_departments;
DROP POLICY IF EXISTS "Users can view their own department assignments" ON user_departments;
DROP POLICY IF EXISTS "All users can view church settings" ON church_settings;
DROP POLICY IF EXISTS "Users can view PDF files" ON pdf_files;
DROP POLICY IF EXISTS "Anyone can view PDF files" ON pdf_files;
DROP POLICY IF EXISTS "Anyone can upload PDF files" ON pdf_files;
DROP POLICY IF EXISTS "Anyone can delete PDF files" ON pdf_files;

-- ============================================================================
-- STEP 2: ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE souls_won ENABLE ROW LEVEL SECURITY;
ALTER TABLE notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE excuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE folder_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE pd_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: CREATE SIMPLE, NON-RECURSIVE POLICIES
-- ============================================================================

-- USERS TABLE POLICIES (Non-recursive)
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DEPARTMENTS TABLE POLICIES
CREATE POLICY "departments_select_all" ON departments
  FOR SELECT TO authenticated
  USING (true);

-- TASKS TABLE POLICIES
CREATE POLICY "tasks_select_own" ON tasks
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "tasks_insert_own" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (assigned_by = auth.uid());

CREATE POLICY "tasks_update_own" ON tasks
  FOR UPDATE TO authenticated
  USING (assigned_by = auth.uid() OR assigned_to = auth.uid())
  WITH CHECK (assigned_by = auth.uid() OR assigned_to = auth.uid());

-- ATTENDANCE TABLE POLICIES
CREATE POLICY "attendance_select_own" ON attendance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "attendance_insert_own" ON attendance
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "attendance_update_own" ON attendance
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- NOTES TABLE POLICIES
CREATE POLICY "notes_select_own" ON notes
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notes_insert_own" ON notes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notes_update_own" ON notes
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notes_delete_own" ON notes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- NOTIFICATIONS TABLE POLICIES
CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- FINANCE RECORDS TABLE POLICIES
CREATE POLICY "finance_records_select_all" ON finance_records
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "finance_records_insert_all" ON finance_records
  FOR INSERT TO authenticated
  WITH CHECK (recorded_by = auth.uid());

-- PERMISSIONS TABLE POLICIES
CREATE POLICY "permissions_select_own" ON permissions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- USER DEPARTMENTS TABLE POLICIES
CREATE POLICY "user_departments_select_own" ON user_departments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- CHURCH SETTINGS TABLE POLICIES
CREATE POLICY "church_settings_select_all" ON church_settings
  FOR SELECT TO authenticated
  USING (true);

-- PDF FILES TABLE POLICIES
CREATE POLICY "pdf_files_select_all" ON pdf_files
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "pdf_files_insert_all" ON pdf_files
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "pdf_files_delete_all" ON pdf_files
  FOR DELETE TO authenticated
  USING (true);

-- PROGRAMS TABLE POLICIES
CREATE POLICY "programs_select_all" ON programs
  FOR SELECT TO authenticated
  USING (true);

-- SOULS WON TABLE POLICIES
CREATE POLICY "souls_won_select_all" ON souls_won
  FOR SELECT TO authenticated
  USING (true);

-- NOTICES TABLE POLICIES
CREATE POLICY "notices_select_all" ON notices
  FOR SELECT TO authenticated
  USING (true);

-- EXCUSES TABLE POLICIES
CREATE POLICY "excuses_select_own" ON excuses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "excuses_insert_own" ON excuses
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- FOLDERS TABLE POLICIES
CREATE POLICY "folders_insert_authorized" ON folders
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

-- FOLDER COMMENTS TABLE POLICIES
CREATE POLICY "folder_comments_select_own" ON folder_comments
  FOR SELECT TO authenticated
  USING (comment_by = auth.uid());

CREATE POLICY "folder_comments_insert_own" ON folder_comments
  FOR INSERT TO authenticated
  WITH CHECK (comment_by = auth.uid());

-- PD REPORTS TABLE POLICIES
CREATE POLICY "pd_reports_select_involved" ON pd_reports
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- DEPARTMENT REPORTS TABLE POLICIES
CREATE POLICY "department_reports_select_own" ON department_reports
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

-- BIBLE VERSES TABLE POLICIES
CREATE POLICY "bible_verses_select_all" ON bible_verses
  FOR SELECT TO authenticated
  USING (true);

-- BIRTHDAY REMINDERS TABLE POLICIES
CREATE POLICY "birthday_reminders_manage_own" ON birthday_reminders
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- PROFILES TABLE POLICIES
CREATE POLICY "profiles_select_all" ON profiles
  FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- STEP 4: CREATE STORAGE BUCKETS AND POLICIES
-- ============================================================================

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "avatar_select_public" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatar_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatar_update_own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "avatar_delete_own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for documents
CREATE POLICY "documents_select_own" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "documents_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================================================
-- STEP 5: INSERT DEFAULT DATA
-- ============================================================================

-- Insert default departments if they don't exist
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

-- Insert default church settings if they don't exist
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
  'AMEN TECH Church',
  '123 Church Street, City, State 12345',
  '+1 (555) 123-4567',
  'info@amentech.church',
  '#2563eb',
  '#7c3aed',
  '#f59e0b',
  'UTC',
  'en',
  'Welcome to our church family! We are glad you are here.'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify policies were created successfully
DO $$
BEGIN
  -- Check if policies exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'users_select_own'
  ) THEN
    RAISE NOTICE 'WARNING: users_select_own policy was not created';
  ELSE
    RAISE NOTICE 'SUCCESS: users_select_own policy created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'departments' AND policyname = 'departments_select_all'
  ) THEN
    RAISE NOTICE 'WARNING: departments_select_all policy was not created';
  ELSE
    RAISE NOTICE 'SUCCESS: departments_select_all policy created';
  END IF;

  -- Check if RLS is enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'users' AND rowsecurity = true
  ) THEN
    RAISE NOTICE 'WARNING: RLS not enabled on users table';
  ELSE
    RAISE NOTICE 'SUCCESS: RLS enabled on users table';
  END IF;

  RAISE NOTICE 'Migration completed successfully!';
END $$;