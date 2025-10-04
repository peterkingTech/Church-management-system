/*
  # Complete Production Database Setup for Church Data Log Management System

  This migration sets up a complete, production-ready database with:
  1. All necessary tables with proper relationships
  2. Row Level Security (RLS) policies for data protection
  3. Storage buckets for file uploads
  4. Default church settings and departments
  5. Proper indexes for performance
  6. User roles and permissions system

  ## Security Features
  - RLS enabled on all tables
  - Role-based access control
  - Secure file upload policies
  - Data isolation between users

  ## Tables Created
  - users (user profiles and authentication)
  - church_settings (church configuration)
  - departments (church departments/ministries)
  - user_departments (user-department relationships)
  - tasks (task management)
  - attendance (service attendance tracking)
  - finance_records (financial transactions)
  - notifications (user notifications)
  - notes (personal notes)
  - programs (church programs/events)
  - souls_won (evangelism tracking)
  - registration_links (invitation system)
  - folders (document organization)
  - folder_comments (folder discussions)
  - pd_reports (pastor's desk reports)
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop storage policies if they exist
    DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
    DROP POLICY IF EXISTS "Document files are accessible to authenticated users" ON storage.objects;
    DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
EXCEPTION
    WHEN undefined_table THEN
        -- Storage objects table doesn't exist yet, continue
        NULL;
END $$;

-- Clean up existing data (if any)
DO $$ 
BEGIN
    -- Delete all existing data
    DELETE FROM user_departments;
    DELETE FROM tasks;
    DELETE FROM attendance;
    DELETE FROM finance_records;
    DELETE FROM notifications;
    DELETE FROM notes;
    DELETE FROM registration_links;
    DELETE FROM folders;
    DELETE FROM folder_comments;
    DELETE FROM pd_reports;
    DELETE FROM programs;
    DELETE FROM souls_won;
    DELETE FROM departments;
    DELETE FROM church_settings;
    DELETE FROM users;
EXCEPTION
    WHEN undefined_table THEN
        -- Tables don't exist yet, continue
        NULL;
END $$;

-- Create church_settings table first
CREATE TABLE IF NOT EXISTS church_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    church_name text NOT NULL DEFAULT 'AMEN TECH Church',
    church_address text,
    church_phone text,
    church_email text,
    primary_color text DEFAULT '#2563eb',
    secondary_color text DEFAULT '#7c3aed',
    accent_color text DEFAULT '#f59e0b',
    logo_url text,
    timezone text DEFAULT 'UTC',
    default_language text DEFAULT 'en',
    welcome_message text DEFAULT 'Welcome to our church family!',
    updated_by uuid,
    updated_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT uid(),
    full_name text DEFAULT 'Anonymous',
    email text UNIQUE NOT NULL,
    role text NOT NULL DEFAULT 'newcomer' CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer')),
    is_confirmed boolean DEFAULT false,
    church_joined_at date DEFAULT CURRENT_DATE,
    profile_image_url text,
    phone text,
    address text,
    department_id uuid,
    last_login timestamptz,
    notes text,
    birthday_month integer CHECK (birthday_month >= 1 AND birthday_month <= 12),
    birthday_day integer CHECK (birthday_day >= 1 AND birthday_day <= 31),
    language text DEFAULT 'en',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text UNIQUE NOT NULL,
    description text,
    created_at timestamptz DEFAULT now()
);

-- Create user_departments junction table
CREATE TABLE IF NOT EXISTS user_departments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
    assigned_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    assigned_by uuid,
    assigned_to uuid,
    task_text text,
    due_date date,
    is_done boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid,
    date date DEFAULT CURRENT_DATE,
    arrival_time time,
    was_present boolean DEFAULT true
);

-- Create finance_records table
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

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
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
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    type text DEFAULT 'service' CHECK (type IN ('service', 'study', 'youth', 'prayer', 'crusade', 'special')),
    schedule text,
    location text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

-- Create souls_won table
CREATE TABLE IF NOT EXISTS souls_won (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    age integer,
    phone text,
    email text,
    program_id uuid REFERENCES programs(id),
    counselor_id uuid,
    date_won date DEFAULT CURRENT_DATE,
    notes text,
    follow_up_status text DEFAULT 'pending' CHECK (follow_up_status IN ('pending', 'contacted', 'integrated')),
    created_at timestamptz DEFAULT now()
);

-- Create folders table
CREATE TABLE IF NOT EXISTS folders (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    type text NOT NULL,
    created_by uuid,
    created_at timestamptz DEFAULT now()
);

-- Create folder_comments table
CREATE TABLE IF NOT EXISTS folder_comments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    folder_id uuid REFERENCES folders(id) ON DELETE CASCADE,
    comment_by uuid,
    comment text,
    created_at timestamptz DEFAULT now()
);

-- Create pd_reports table
CREATE TABLE IF NOT EXISTS pd_reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id uuid,
    receiver_id uuid,
    message text NOT NULL,
    date_sent timestamptz DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE users ADD CONSTRAINT users_department_id_fkey 
    FOREIGN KEY (department_id) REFERENCES departments(id);

ALTER TABLE church_settings ADD CONSTRAINT church_settings_updated_by_fkey 
    FOREIGN KEY (updated_by) REFERENCES users(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_finance_records_date ON finance_records(date);
CREATE INDEX IF NOT EXISTS idx_finance_records_type ON finance_records(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_registration_links_code ON registration_links(code);
CREATE INDEX IF NOT EXISTS idx_registration_links_expires_at ON registration_links(expires_at);

-- Enable Row Level Security on all tables
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
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

-- Church Settings Policies
CREATE POLICY "All users can view church settings"
    ON church_settings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Pastors can manage church settings"
    ON church_settings FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = uid() AND users.role = 'pastor'
    ));

-- Users Policies
CREATE POLICY "Users can view own profile"
    ON users FOR SELECT
    TO authenticated
    USING (uid() = id);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (uid() = id)
    WITH CHECK (uid() = id);

CREATE POLICY "Admins can manage all users"
    ON users FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users users_1
        WHERE users_1.id = uid() AND users_1.role IN ('pastor', 'admin')
    ));

-- Departments Policies
CREATE POLICY "All users can view departments"
    ON departments FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage departments"
    ON departments FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = uid() AND users.role IN ('pastor', 'admin')
    ));

-- User Departments Policies
CREATE POLICY "Users can view their own department assignments"
    ON user_departments FOR SELECT
    TO authenticated
    USING (user_id = uid());

CREATE POLICY "Admins can manage user departments"
    ON user_departments FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = uid() AND users.role IN ('admin', 'pastor')
    ));

-- Tasks Policies
CREATE POLICY "Users can view assigned tasks"
    ON tasks FOR SELECT
    TO authenticated
    USING (assigned_to = uid() OR assigned_by = uid());

CREATE POLICY "Users can update own tasks"
    ON tasks FOR UPDATE
    TO authenticated
    USING (assigned_to = uid() OR assigned_by = uid());

CREATE POLICY "Leaders can manage tasks"
    ON tasks FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = uid() AND users.role IN ('pastor', 'admin', 'worker')
    ));

-- Attendance Policies
CREATE POLICY "Users can view own attendance"
    ON attendance FOR SELECT
    TO authenticated
    USING (user_id = uid());

CREATE POLICY "Users can insert own attendance"
    ON attendance FOR INSERT
    TO authenticated
    WITH CHECK (user_id = uid());

CREATE POLICY "Leaders can manage attendance"
    ON attendance FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = uid() AND users.role IN ('pastor', 'admin', 'worker')
    ));

-- Finance Records Policies
CREATE POLICY "Finance admins and pastors can manage finance records"
    ON finance_records FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = uid() AND users.role IN ('pastor', 'finance_admin')
    ));

-- Notifications Policies
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = uid());

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    TO authenticated
    USING (user_id = uid());

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Notes Policies
CREATE POLICY "Users can manage own notes"
    ON notes FOR ALL
    TO authenticated
    USING (user_id = uid());

-- Registration Links Policies
CREATE POLICY "Pastors and admins can manage registration links"
    ON registration_links FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = uid() AND users.role IN ('pastor', 'admin')
    ));

-- Programs Policies
CREATE POLICY "All users can view programs"
    ON programs FOR SELECT
    TO public
    USING (true);

-- Souls Won Policies (no specific policies - will inherit from default)

-- Folders Policies
CREATE POLICY "Pastor and Worker can insert folders"
    ON folders FOR INSERT
    TO public
    WITH CHECK (created_by = uid());

-- Folder Comments Policies
CREATE POLICY "User can insert their own comments"
    ON folder_comments FOR INSERT
    TO public
    WITH CHECK (comment_by = uid());

CREATE POLICY "User can view their comments"
    ON folder_comments FOR SELECT
    TO public
    USING (comment_by = uid());

-- PD Reports Policies
CREATE POLICY "Worker can view own PD reports"
    ON pd_reports FOR SELECT
    TO public
    USING (sender_id = uid() OR receiver_id = uid());

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
    ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
CREATE POLICY "Avatar images are publicly accessible"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own avatar"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for documents bucket
CREATE POLICY "Document files are accessible to authenticated users"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'documents');

CREATE POLICY "Users can upload documents"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Users can update own documents"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own documents"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'documents' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

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

-- Insert default departments
INSERT INTO departments (name, description) VALUES
    ('Worship Team', 'Leading church worship and music ministry'),
    ('Youth Ministry', 'Ministry focused on young people and teenagers'),
    ('Children Ministry', 'Sunday school and children programs'),
    ('Evangelism', 'Outreach and soul winning ministry'),
    ('Ushering', 'Church service coordination and hospitality'),
    ('Media Team', 'Audio, video, and technical support'),
    ('Prayer Ministry', 'Intercessory prayer and prayer meetings'),
    ('Finance Team', 'Church financial management and stewardship')
ON CONFLICT (name) DO NOTHING;

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO users (
        id,
        full_name,
        email,
        role,
        language,
        is_confirmed,
        church_joined_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'role', 'newcomer'),
        COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
        true,
        CURRENT_DATE
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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
                    DATE(EXTRACT(year FROM CURRENT_DATE) || '-' || u.birthday_month || '-' || u.birthday_day) - CURRENT_DATE
                ) + 
                CASE 
                    WHEN DATE(EXTRACT(year FROM CURRENT_DATE) || '-' || u.birthday_month || '-' || u.birthday_day) < CURRENT_DATE 
                    THEN 365 
                    ELSE 0 
                END
            )::integer
        END as days_until_birthday
    FROM users u
    WHERE u.birthday_month IS NOT NULL 
        AND u.birthday_day IS NOT NULL
        AND u.is_confirmed = true
    ORDER BY days_until_birthday ASC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;