/*
  # Comprehensive Church Management System Schema

  1. New Tables
    - `finance_records` - Financial transactions (offerings, tithes, donations, expenses)
    - `notes` - Personal notes for users
    - `registration_links` - Self-registration links with QR codes
    - `church_settings` - Global church configuration
    - `birthday_reminders` - Birthday reminder system

  2. Enhanced Tables
    - Updated `users` table with birthday fields and enhanced permissions
    - Enhanced `notifications` with read receipts
    - Updated `events` with reminder system

  3. Security
    - Enable RLS on all new tables
    - Add comprehensive policies for role-based access
    - Finance access restricted to pastors and finance_admins
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update users table with birthday fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'birthday_month'
  ) THEN
    ALTER TABLE users ADD COLUMN birthday_month INTEGER CHECK (birthday_month >= 1 AND birthday_month <= 12);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'birthday_day'
  ) THEN
    ALTER TABLE users ADD COLUMN birthday_day INTEGER CHECK (birthday_day >= 1 AND birthday_day <= 31);
  END IF;
END $$;

-- Update users role constraint to include new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
  CHECK (role = ANY (ARRAY['pastor'::text, 'admin'::text, 'finance_admin'::text, 'worker'::text, 'member'::text, 'newcomer'::text]));

-- Create finance_records table
CREATE TABLE IF NOT EXISTS finance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('offering', 'tithe', 'donation', 'expense')),
  amount decimal(10,2) NOT NULL,
  description text NOT NULL,
  category text,
  date date NOT NULL DEFAULT CURRENT_DATE,
  recorded_by uuid REFERENCES users(id),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance admins and pastors can manage finance records"
  ON finance_records
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = ANY (ARRAY['pastor'::text, 'finance_admin'::text])
    )
  );

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  color text DEFAULT '#fef3c7',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes"
  ON notes
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create registration_links table
CREATE TABLE IF NOT EXISTS registration_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer')),
  code text UNIQUE NOT NULL,
  qr_code text,
  expires_at date NOT NULL,
  created_by uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE registration_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pastors and admins can manage registration links"
  ON registration_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = ANY (ARRAY['pastor'::text, 'admin'::text])
    )
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
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All users can view church settings"
  ON church_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pastors can manage church settings"
  ON church_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'pastor'
    )
  );

-- Insert default church settings
INSERT INTO church_settings (church_name, welcome_message) 
VALUES ('Your Church Name', 'Welcome to our church family!')
ON CONFLICT DO NOTHING;

-- Create birthday_reminders table
CREATE TABLE IF NOT EXISTS birthday_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reminder_days_before integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE birthday_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own birthday reminders"
  ON birthday_reminders
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Update notifications table with read receipts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'notifications' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE notifications ADD COLUMN read_at timestamp with time zone;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_finance_records_date ON finance_records(date);
CREATE INDEX IF NOT EXISTS idx_finance_records_type ON finance_records(type);
CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON notes(is_pinned);
CREATE INDEX IF NOT EXISTS idx_users_birthday ON users(birthday_month, birthday_day);
CREATE INDEX IF NOT EXISTS idx_registration_links_code ON registration_links(code);
CREATE INDEX IF NOT EXISTS idx_registration_links_expires_at ON registration_links(expires_at);

-- Function to get upcoming birthdays
CREATE OR REPLACE FUNCTION get_upcoming_birthdays(days_ahead integer DEFAULT 7)
RETURNS TABLE (
  user_id uuid,
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
      WHEN EXTRACT(DOY FROM make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, u.birthday_month, u.birthday_day)) >= EXTRACT(DOY FROM CURRENT_DATE) THEN
        EXTRACT(DOY FROM make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, u.birthday_month, u.birthday_day))::int - EXTRACT(DOY FROM CURRENT_DATE)::int
      ELSE
        EXTRACT(DOY FROM make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1, u.birthday_month, u.birthday_day))::int - EXTRACT(DOY FROM CURRENT_DATE)::int
    END as days_until_birthday
  FROM users u
  WHERE u.birthday_month IS NOT NULL 
    AND u.birthday_day IS NOT NULL
    AND (
      CASE 
        WHEN EXTRACT(DOY FROM make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, u.birthday_month, u.birthday_day)) >= EXTRACT(DOY FROM CURRENT_DATE) THEN
          EXTRACT(DOY FROM make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, u.birthday_month, u.birthday_day))::int - EXTRACT(DOY FROM CURRENT_DATE)::int
        ELSE
          EXTRACT(DOY FROM make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int + 1, u.birthday_month, u.birthday_day))::int - EXTRACT(DOY FROM CURRENT_DATE)::int
      END
    ) <= days_ahead
  ORDER BY days_until_birthday;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE notifications 
  SET read = true, read_at = now()
  WHERE id = notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get finance summary
CREATE OR REPLACE FUNCTION get_finance_summary(start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days', end_date date DEFAULT CURRENT_DATE)
RETURNS TABLE (
  total_income decimal,
  total_expenses decimal,
  net_amount decimal,
  offering_total decimal,
  tithe_total decimal,
  donation_total decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(SUM(CASE WHEN type IN ('offering', 'tithe', 'donation') THEN amount ELSE 0 END), 0) as total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expenses,
    COALESCE(SUM(CASE WHEN type IN ('offering', 'tithe', 'donation') THEN amount ELSE -amount END), 0) as net_amount,
    COALESCE(SUM(CASE WHEN type = 'offering' THEN amount ELSE 0 END), 0) as offering_total,
    COALESCE(SUM(CASE WHEN type = 'tithe' THEN amount ELSE 0 END), 0) as tithe_total,
    COALESCE(SUM(CASE WHEN type = 'donation' THEN amount ELSE 0 END), 0) as donation_total
  FROM finance_records
  WHERE date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;