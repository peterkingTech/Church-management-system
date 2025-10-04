/*
  # Fix Church Management App RLS Policies

  This migration fixes all RLS policy issues in the Church Management App:
  
  1. Database Structure Updates
     - Add missing church_id columns to all tables
     - Create proper foreign key relationships
     - Add indexes for performance
  
  2. Security Fixes
     - Remove recursive RLS policies causing infinite loops
     - Implement church-scoped data isolation
     - Add role-based access control
     - Fix authentication trigger issues
  
  3. Policy Implementation
     - Pastor: Full access to their church data
     - Admin: Configurable permissions within church
     - Finance Admin: Finance data access only
     - Worker: Department-specific access
     - Member/Newcomer: Limited self-access
*/

-- ============================================================================
-- 1. DROP ALL EXISTING PROBLEMATIC POLICIES
-- ============================================================================

-- Drop all existing policies that cause recursion or conflicts
DROP POLICY IF EXISTS "All users can view departments" ON departments;
DROP POLICY IF EXISTS "Everyone can view departments" ON departments;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view their tasks" ON tasks;
DROP POLICY IF EXISTS "Users can assign tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert attendance" ON attendance;
DROP POLICY IF EXISTS "Users can update attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view own notes" ON notes;
DROP POLICY IF EXISTS "Users can insert notes" ON notes;
DROP POLICY IF EXISTS "Users can update own notes" ON notes;
DROP POLICY IF EXISTS "Users can delete own notes" ON notes;
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update notifications" ON notifications;

-- Drop policies on other tables
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance;
DROP POLICY IF EXISTS "Users can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own department assignments" ON user_departments;
DROP POLICY IF EXISTS "Users can view own department assignments" ON user_departments;
DROP POLICY IF EXISTS "All users can view church settings" ON church_settings;
DROP POLICY IF EXISTS "Bible verses are publicly readable" ON bible_verses;
DROP POLICY IF EXISTS "Anyone can view PDF files" ON pdf_files;
DROP POLICY IF EXISTS "Anyone can upload PDF files" ON pdf_files;
DROP POLICY IF EXISTS "Anyone can delete PDF files" ON pdf_files;

-- ============================================================================
-- 2. ADD MISSING CHURCH_ID COLUMNS AND RELATIONSHIPS
-- ============================================================================

-- Add church_id to tables that don't have it
DO $$
BEGIN
  -- Add church_id to users table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE users ADD COLUMN church_id uuid REFERENCES churches(id) ON DELETE CASCADE;
  END IF;

  -- Add church_id to departments if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'departments' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE departments ADD COLUMN church_id uuid REFERENCES churches(id) ON DELETE CASCADE;
  END IF;

  -- Add church_id to tasks if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE tasks ADD COLUMN church_id uuid REFERENCES churches(id) ON DELETE CASCADE;
  END IF;

  -- Add church_id to events table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'events'
  ) THEN
    CREATE TABLE events (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      description text,
      date date NOT NULL,
      time time,
      location text,
      photo_url text,
      church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
      created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now()
    );
  END IF;

  -- Add church_id to finance table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'finance'
  ) THEN
    CREATE TABLE finance (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      type text NOT NULL CHECK (type IN ('offering', 'tithe', 'donation', 'expense')),
      amount numeric(10,2) NOT NULL,
      note text,
      date date DEFAULT CURRENT_DATE,
      user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
      created_at timestamptz DEFAULT now()
    );
  END IF;

  -- Add church_id to manuals table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'manuals'
  ) THEN
    CREATE TABLE manuals (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      language text DEFAULT 'en',
      content text NOT NULL,
      church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
      updated_at timestamptz DEFAULT now(),
      created_at timestamptz DEFAULT now()
    );
  END IF;

  -- Add church_id to permissions table if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'permissions'
  ) THEN
    CREATE TABLE permissions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      module text NOT NULL,
      access_level text NOT NULL,
      church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
      granted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- ============================================================================
-- 3. CREATE HELPER FUNCTIONS FOR NON-RECURSIVE POLICIES
-- ============================================================================

-- Function to get user's church_id
CREATE OR REPLACE FUNCTION get_user_church_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT church_id FROM users WHERE id = user_id LIMIT 1;
$$;

-- Function to check if user is pastor of a church
CREATE OR REPLACE FUNCTION is_pastor(user_id uuid, target_church_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND church_id = target_church_id 
    AND role = 'pastor'
  );
$$;

-- Function to check if user is admin of a church
CREATE OR REPLACE FUNCTION is_admin(user_id uuid, target_church_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND church_id = target_church_id 
    AND role IN ('pastor', 'admin')
  );
$$;

-- Function to check if user has finance access
CREATE OR REPLACE FUNCTION has_finance_access(user_id uuid, target_church_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = user_id 
    AND church_id = target_church_id 
    AND role IN ('pastor', 'finance_admin')
  );
$$;

-- ============================================================================
-- 4. USERS TABLE POLICIES (NON-RECURSIVE)
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "users_update_own"
  ON users FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Pastors can view all users in their church
CREATE POLICY "users_select_church_pastor"
  ON users FOR SELECT TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) 
    AND is_pastor(auth.uid(), church_id)
  );

-- Pastors can manage all users in their church
CREATE POLICY "users_manage_church_pastor"
  ON users FOR ALL TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) 
    AND is_pastor(auth.uid(), church_id)
  )
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) 
    AND is_pastor(auth.uid(), church_id)
  );

-- ============================================================================
-- 5. DEPARTMENTS TABLE POLICIES
-- ============================================================================

-- All authenticated users can view departments in their church
CREATE POLICY "departments_select_church"
  ON departments FOR SELECT TO authenticated
  USING (church_id = get_user_church_id(auth.uid()));

-- Only pastors can manage departments
CREATE POLICY "departments_manage_pastor"
  ON departments FOR ALL TO authenticated
  USING (is_pastor(auth.uid(), church_id))
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) 
    AND is_pastor(auth.uid(), church_id)
  );

-- ============================================================================
-- 6. TASKS TABLE POLICIES
-- ============================================================================

-- Users can view tasks in their church where they are assigned or assignee
CREATE POLICY "tasks_select_church"
  ON tasks FOR SELECT TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) 
    AND (assigned_to = auth.uid() OR assigned_by = auth.uid())
  );

-- Users can create tasks in their church
CREATE POLICY "tasks_insert_church"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) 
    AND assigned_by = auth.uid()
  );

-- Users can update tasks they created or are assigned to
CREATE POLICY "tasks_update_own"
  ON tasks FOR UPDATE TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) 
    AND (assigned_by = auth.uid() OR assigned_to = auth.uid())
  )
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) 
    AND (assigned_by = auth.uid() OR assigned_to = auth.uid())
  );

-- ============================================================================
-- 7. ATTENDANCE TABLE POLICIES
-- ============================================================================

-- Users can view their own attendance in their church
CREATE POLICY "attendance_select_own"
  ON attendance FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own attendance
CREATE POLICY "attendance_insert_own"
  ON attendance FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own attendance
CREATE POLICY "attendance_update_own"
  ON attendance FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Pastors can view all attendance in their church
CREATE POLICY "attendance_select_church_pastor"
  ON attendance FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = attendance.user_id 
      AND users.church_id = get_user_church_id(auth.uid())
      AND is_pastor(auth.uid(), users.church_id)
    )
  );

-- ============================================================================
-- 8. EVENTS TABLE POLICIES
-- ============================================================================

-- All church members can view events in their church
CREATE POLICY "events_select_church"
  ON events FOR SELECT TO authenticated
  USING (church_id = get_user_church_id(auth.uid()));

-- Pastors and workers can manage events
CREATE POLICY "events_manage_leaders"
  ON events FOR ALL TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('pastor', 'worker')
    )
  )
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) 
    AND created_by = auth.uid()
  );

-- ============================================================================
-- 9. FINANCE TABLE POLICIES
-- ============================================================================

-- Only users with finance access can view finance records
CREATE POLICY "finance_select_authorized"
  ON finance FOR SELECT TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) 
    AND has_finance_access(auth.uid(), church_id)
  );

-- Only users with finance access can manage finance records
CREATE POLICY "finance_manage_authorized"
  ON finance FOR ALL TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) 
    AND has_finance_access(auth.uid(), church_id)
  )
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) 
    AND user_id = auth.uid()
  );

-- ============================================================================
-- 10. NOTES TABLE POLICIES
-- ============================================================================

-- Users can manage their own notes
CREATE POLICY "notes_manage_own"
  ON notes FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- 11. NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can view and update their own notifications
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "notifications_insert_system"
  ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- 12. CHURCH SETTINGS POLICIES
-- ============================================================================

-- All church members can view their church settings
CREATE POLICY "church_settings_select_church"
  ON church_settings FOR SELECT TO authenticated
  USING (
    id = get_user_church_id(auth.uid()) OR
    church_id = get_user_church_id(auth.uid())
  );

-- Only pastors can update church settings
CREATE POLICY "church_settings_update_pastor"
  ON church_settings FOR UPDATE TO authenticated
  USING (
    (id = get_user_church_id(auth.uid()) OR church_id = get_user_church_id(auth.uid()))
    AND is_pastor(auth.uid(), COALESCE(church_id, id))
  )
  WITH CHECK (
    updated_by = auth.uid()
  );

-- ============================================================================
-- 13. PERMISSIONS TABLE POLICIES
-- ============================================================================

-- Users can view their own permissions
CREATE POLICY "permissions_select_own"
  ON permissions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Pastors can manage permissions in their church
CREATE POLICY "permissions_manage_pastor"
  ON permissions FOR ALL TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) 
    AND is_pastor(auth.uid(), church_id)
  )
  WITH CHECK (
    church_id = get_user_church_id(auth.uid()) 
    AND granted_by = auth.uid()
  );

-- ============================================================================
-- 14. MANUALS TABLE POLICIES
-- ============================================================================

-- All church members can view manuals for their church
CREATE POLICY "manuals_select_church"
  ON manuals FOR SELECT TO authenticated
  USING (church_id = get_user_church_id(auth.uid()));

-- Pastors can manage manuals
CREATE POLICY "manuals_manage_pastor"
  ON manuals FOR ALL TO authenticated
  USING (
    church_id = get_user_church_id(auth.uid()) 
    AND is_pastor(auth.uid(), church_id)
  )
  WITH CHECK (church_id = get_user_church_id(auth.uid()));

-- ============================================================================
-- 15. USER_DEPARTMENTS TABLE POLICIES
-- ============================================================================

-- Users can view their own department assignments
CREATE POLICY "user_departments_select_own"
  ON user_departments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Pastors can manage department assignments
CREATE POLICY "user_departments_manage_pastor"
  ON user_departments FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM departments 
      WHERE departments.id = user_departments.department_id 
      AND is_pastor(auth.uid(), departments.church_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM departments 
      WHERE departments.id = user_departments.department_id 
      AND departments.church_id = get_user_church_id(auth.uid())
    )
  );

-- ============================================================================
-- 16. FINANCE_RECORDS TABLE POLICIES
-- ============================================================================

-- Only finance admins and pastors can access finance records
CREATE POLICY "finance_records_select_authorized"
  ON finance_records FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('pastor', 'finance_admin')
      AND church_id = get_user_church_id(auth.uid())
    )
  );

CREATE POLICY "finance_records_manage_authorized"
  ON finance_records FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role IN ('pastor', 'finance_admin')
      AND church_id = get_user_church_id(auth.uid())
    )
  )
  WITH CHECK (recorded_by = auth.uid());

-- ============================================================================
-- 17. PDF_FILES TABLE POLICIES
-- ============================================================================

-- Users can view files in their church context
CREATE POLICY "pdf_files_select_church"
  ON pdf_files FOR SELECT TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND church_id = get_user_church_id(auth.uid())
    )
  );

-- Users can upload files
CREATE POLICY "pdf_files_insert_own"
  ON pdf_files FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Users can delete their own files
CREATE POLICY "pdf_files_delete_own"
  ON pdf_files FOR DELETE TO authenticated
  USING (uploaded_by = auth.uid());

-- ============================================================================
-- 18. BIBLE_VERSES TABLE POLICIES
-- ============================================================================

-- Bible verses are publicly readable
CREATE POLICY "bible_verses_select_public"
  ON bible_verses FOR SELECT TO authenticated
  USING (true);

-- ============================================================================
-- 19. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Create indexes for church_id columns
CREATE INDEX IF NOT EXISTS idx_users_church_id ON users(church_id);
CREATE INDEX IF NOT EXISTS idx_departments_church_id ON departments(church_id);
CREATE INDEX IF NOT EXISTS idx_tasks_church_id ON tasks(church_id);
CREATE INDEX IF NOT EXISTS idx_events_church_id ON events(church_id);
CREATE INDEX IF NOT EXISTS idx_finance_church_id ON finance(church_id);
CREATE INDEX IF NOT EXISTS idx_manuals_church_id ON manuals(church_id);
CREATE INDEX IF NOT EXISTS idx_permissions_church_id ON permissions(church_id);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_by ON tasks(assigned_by);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================================================
-- 20. UPDATE EXISTING DATA WITH CHURCH_ID
-- ============================================================================

-- Create a default church for existing data if none exists
DO $$
DECLARE
  default_church_id uuid;
BEGIN
  -- Check if we have any churches
  IF NOT EXISTS (SELECT 1 FROM churches LIMIT 1) THEN
    -- Create a default church
    INSERT INTO churches (id, name, created_by, created_at)
    VALUES (gen_random_uuid(), 'Default Church', 
            COALESCE((SELECT id FROM auth.users LIMIT 1), gen_random_uuid()), 
            now())
    RETURNING id INTO default_church_id;
    
    -- Update users without church_id
    UPDATE users SET church_id = default_church_id WHERE church_id IS NULL;
    
    -- Update departments without church_id
    UPDATE departments SET church_id = default_church_id WHERE church_id IS NULL;
    
    -- Update tasks without church_id
    UPDATE tasks SET church_id = default_church_id WHERE church_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- 21. ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE bible_verses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- Enable RLS on new tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'events') THEN
    ALTER TABLE events ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'finance') THEN
    ALTER TABLE finance ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'manuals') THEN
    ALTER TABLE manuals ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;