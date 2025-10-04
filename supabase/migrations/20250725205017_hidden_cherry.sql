/*
  # Fix User Creation Database Issues

  1. Database Schema
    - Ensure users table exists with all required columns
    - Add proper constraints and indexes
    - Set up default values for required fields

  2. Security
    - Enable RLS on users table
    - Add policies for user creation and management
    - Set up proper permissions

  3. Triggers
    - Add trigger for automatic user profile creation
    - Handle auth user creation workflow
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT 'User',
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer')),
  department_id uuid REFERENCES departments(id),
  profile_image_url text,
  language text NOT NULL DEFAULT 'en',
  church_joined_at date DEFAULT CURRENT_DATE,
  is_confirmed boolean DEFAULT true,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  notes text,
  birthday_month integer CHECK (birthday_month >= 1 AND birthday_month <= 12),
  birthday_day integer CHECK (birthday_day >= 1 AND birthday_day <= 31)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_users_birthday ON users(birthday_month, birthday_day);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Users can view basic user info" ON users;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage all users" ON users
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'pastor')
    )
  );

CREATE POLICY "Users can view basic user info" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  leader_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on departments
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;

-- Drop existing department policies
DROP POLICY IF EXISTS "All users can view departments" ON departments;
DROP POLICY IF EXISTS "Admins can manage departments" ON departments;

-- Create department policies
CREATE POLICY "All users can view departments" ON departments
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage departments" ON departments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'pastor')
    )
  );

-- Insert default departments if they don't exist
INSERT INTO departments (name, description) VALUES
  ('Worship Team', 'Music and worship ministry'),
  ('Youth Ministry', 'Ministry for young people'),
  ('Children Ministry', 'Sunday school and children programs'),
  ('Evangelism', 'Outreach and soul winning'),
  ('Ushering', 'Church service coordination'),
  ('Media Team', 'Audio, video, and technical support'),
  ('Prayer Team', 'Intercessory prayer ministry'),
  ('Finance Team', 'Financial management and stewardship')
ON CONFLICT (name) DO NOTHING;

-- Create user_departments junction table
CREATE TABLE IF NOT EXISTS user_departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  department_id uuid REFERENCES departments(id) ON DELETE CASCADE,
  role text DEFAULT 'member',
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(user_id, department_id)
);

-- Enable RLS on user_departments
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;

-- Drop existing user_departments policies
DROP POLICY IF EXISTS "Users can view their own department assignments" ON user_departments;
DROP POLICY IF EXISTS "Admins can manage user departments" ON user_departments;

-- Create user_departments policies
CREATE POLICY "Users can view their own department assignments" ON user_departments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage user departments" ON user_departments
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'pastor')
    )
  );

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert user profile when auth user is created
  INSERT INTO public.users (id, email, full_name, language, is_confirmed)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN true ELSE false END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    language = COALESCE(EXCLUDED.language, users.language),
    is_confirmed = EXCLUDED.is_confirmed,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create church_settings table for church configuration
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

-- Enable RLS on church_settings
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing church_settings policies
DROP POLICY IF EXISTS "All users can view church settings" ON church_settings;
DROP POLICY IF EXISTS "Pastors can manage church settings" ON church_settings;

-- Create church_settings policies
CREATE POLICY "All users can view church settings" ON church_settings
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Pastors can manage church settings" ON church_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'pastor'
    )
  );

-- Insert default church settings
INSERT INTO church_settings (church_name, welcome_message) VALUES
  ('AMEN TECH Church', 'Welcome to our church family! We are glad you are here.')
ON CONFLICT DO NOTHING;

-- Create tasks table for task management
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assigned_by uuid NOT NULL REFERENCES users(id),
  assigned_to uuid NOT NULL REFERENCES users(id),
  task_text text NOT NULL,
  description text,
  due_date date,
  is_done boolean DEFAULT false,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create task policies
CREATE POLICY "Users can view their own tasks" ON tasks
  FOR SELECT TO authenticated
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT TO authenticated
  WITH CHECK (assigned_by = auth.uid());

CREATE POLICY "Users can update their own tasks" ON tasks
  FOR UPDATE TO authenticated
  USING (assigned_to = auth.uid() OR assigned_by = auth.uid());

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL CHECK (type IN ('task', 'event', 'pd_report', 'general', 'announcement', 'prayer')),
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now(),
  read_at timestamptz
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create notification policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create notes table for personal notes
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

-- Create index for notes
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned);

-- Enable RLS on notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- Create notes policies
CREATE POLICY "Users can manage own notes" ON notes
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  program_id uuid,
  date date NOT NULL DEFAULT CURRENT_DATE,
  arrival_time time,
  was_present boolean DEFAULT true,
  notes text,
  recorded_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create indexes for attendance
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

-- Enable RLS on attendance
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Create attendance policies
CREATE POLICY "Users can view own attendance" ON attendance
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark own attendance" ON attendance
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all attendance" ON attendance
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('admin', 'pastor', 'worker')
    )
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

-- Create indexes for finance_records
CREATE INDEX IF NOT EXISTS idx_finance_records_type ON finance_records(type);
CREATE INDEX IF NOT EXISTS idx_finance_records_date ON finance_records(date);

-- Enable RLS on finance_records
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;

-- Create finance_records policies
CREATE POLICY "Finance admins and pastors can manage finance records" ON finance_records
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('pastor', 'finance_admin')
    )
  );

-- Create registration_links table for QR code registration
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

-- Create indexes for registration_links
CREATE INDEX IF NOT EXISTS idx_registration_links_code ON registration_links(code);
CREATE INDEX IF NOT EXISTS idx_registration_links_expires_at ON registration_links(expires_at);

-- Enable RLS on registration_links
ALTER TABLE registration_links ENABLE ROW LEVEL SECURITY;

-- Create registration_links policies
CREATE POLICY "Pastors and admins can manage registration links" ON registration_links
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('pastor', 'admin')
    )
  );

-- Create birthday_reminders table
CREATE TABLE IF NOT EXISTS birthday_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reminder_days_before integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on birthday_reminders
ALTER TABLE birthday_reminders ENABLE ROW LEVEL SECURITY;

-- Create birthday_reminders policies
CREATE POLICY "Users can manage own birthday reminders" ON birthday_reminders
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

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
      WHEN u.birthday_month IS NULL OR u.birthday_day IS NULL THEN NULL
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
  WHERE u.birthday_month IS NOT NULL 
    AND u.birthday_day IS NOT NULL
    AND u.is_confirmed = true
    AND (
      CASE 
        WHEN u.birthday_month IS NULL OR u.birthday_day IS NULL THEN false
        ELSE (
          DATE_PART('day', 
            (DATE '2024-01-01' + INTERVAL '1 year' * 
              CASE WHEN 
                MAKE_DATE(2024, u.birthday_month, u.birthday_day) < CURRENT_DATE 
              THEN 1 ELSE 0 END + 
              MAKE_DATE(2024, u.birthday_month, u.birthday_day) - CURRENT_DATE
            )
          ) <= days_ahead
        )
      END
    )
  ORDER BY days_until_birthday ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Update RLS to allow the trigger function to work
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

COMMIT;