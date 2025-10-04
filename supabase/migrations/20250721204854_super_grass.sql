/*
  # Multi-Tenant Church Management System Schema

  1. Churches Table
    - Each church is a separate tenant
    - Stores church-specific settings and branding
  
  2. Enhanced Users Table
    - Links users to their church
    - Includes birthday, phone, permissions
    
  3. Multi-tenant Data Tables
    - All data tables include church_id
    - RLS policies ensure church separation
    
  4. Security
    - Row Level Security on all tables
    - Church-based data isolation
    - Role-based permissions
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Churches table (multi-tenant)
CREATE TABLE IF NOT EXISTS churches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Church Name',
  address text,
  phone text,
  email text,
  logo_url text,
  theme_color text DEFAULT '#2563eb',
  secondary_color text DEFAULT '#7c3aed',
  accent_color text DEFAULT '#f59e0b',
  language text DEFAULT 'en',
  timezone text DEFAULT 'UTC',
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enhanced users table with all required fields
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
    ALTER TABLE users ADD COLUMN address text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'church_id') THEN
    ALTER TABLE users ADD COLUMN church_id uuid REFERENCES churches(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'permissions') THEN
    ALTER TABLE users ADD COLUMN permissions jsonb DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'is_online') THEN
    ALTER TABLE users ADD COLUMN is_online boolean DEFAULT false;
  END IF;
END $$;

-- Update users table role constraint
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'users_role_check') THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
  
  ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer'));
END $$;

-- Church settings table
CREATE TABLE IF NOT EXISTS church_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  setting_key text NOT NULL,
  setting_value jsonb,
  updated_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(church_id, setting_key)
);

-- Registration links table (QR codes)
CREATE TABLE IF NOT EXISTS registration_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('pastor', 'admin', 'finance_admin', 'worker', 'member', 'newcomer')),
  code text UNIQUE NOT NULL,
  qr_code text,
  expires_at date NOT NULL,
  created_by uuid REFERENCES users(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Events table with church separation
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time time,
  location text,
  type text DEFAULT 'service',
  photo_url text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Files table with church separation
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL,
  file_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  uploaded_by uuid REFERENCES users(id),
  uploaded_at timestamptz DEFAULT now()
);

-- Prayer requests table
CREATE TABLE IF NOT EXISTS prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  title text,
  message text NOT NULL,
  submitted_by uuid REFERENCES users(id),
  is_anonymous boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active', 'answered', 'archived')),
  prayer_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Birthday reminders table
CREATE TABLE IF NOT EXISTS birthday_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  reminder_days_before integer DEFAULT 1,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- History/audit log table
CREATE TABLE IF NOT EXISTS history_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid REFERENCES churches(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id),
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE history_log ENABLE ROW LEVEL SECURITY;

-- Churches policies
DROP POLICY IF EXISTS "Users can view own church" ON churches;
CREATE POLICY "Users can view own church"
  ON churches FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Pastors can manage own church" ON churches;
CREATE POLICY "Pastors can manage own church"
  ON churches FOR ALL
  TO authenticated
  USING (
    id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

-- Users policies (updated for multi-tenant)
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
CREATE POLICY "Church admins can manage church users"
  ON users FOR ALL
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

DROP POLICY IF EXISTS "Users can view church members" ON users;
CREATE POLICY "Users can view church members"
  ON users FOR SELECT
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

-- Church settings policies
DROP POLICY IF EXISTS "Church admins can manage settings" ON church_settings;
CREATE POLICY "Church admins can manage settings"
  ON church_settings FOR ALL
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

-- Registration links policies
DROP POLICY IF EXISTS "Church admins can manage registration links" ON registration_links;
CREATE POLICY "Church admins can manage registration links"
  ON registration_links FOR ALL
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

-- Events policies
DROP POLICY IF EXISTS "Church members can view events" ON events;
CREATE POLICY "Church members can view events"
  ON events FOR SELECT
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Church leaders can manage events" ON events;
CREATE POLICY "Church leaders can manage events"
  ON events FOR ALL
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker')
    )
  );

-- Files policies
DROP POLICY IF EXISTS "Church members can view files" ON files;
CREATE POLICY "Church members can view files"
  ON files FOR SELECT
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Church members can upload files" ON files;
CREATE POLICY "Church members can upload files"
  ON files FOR INSERT
  TO authenticated
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

-- Prayer requests policies
DROP POLICY IF EXISTS "Church members can view prayers" ON prayer_requests;
CREATE POLICY "Church members can view prayers"
  ON prayer_requests FOR SELECT
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Church members can submit prayers" ON prayer_requests;
CREATE POLICY "Church members can submit prayers"
  ON prayer_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

-- Birthday reminders policies
DROP POLICY IF EXISTS "Users can manage own birthday reminders" ON birthday_reminders;
CREATE POLICY "Users can manage own birthday reminders"
  ON birthday_reminders FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- History log policies
DROP POLICY IF EXISTS "Church members can view history" ON history_log;
CREATE POLICY "Church members can view history"
  ON history_log FOR SELECT
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users WHERE id = auth.uid()
    )
  );

-- Function to create new church when pastor registers
CREATE OR REPLACE FUNCTION create_church_for_pastor()
RETURNS trigger AS $$
DECLARE
  new_church_id uuid;
BEGIN
  -- Only create church if user is a pastor and doesn't have one
  IF NEW.role = 'pastor' AND NEW.church_id IS NULL THEN
    -- Create new church
    INSERT INTO churches (name, created_by)
    VALUES ('New Church', NEW.id)
    RETURNING id INTO new_church_id;
    
    -- Update user with church_id
    UPDATE users SET church_id = new_church_id WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for church creation
DROP TRIGGER IF EXISTS on_pastor_created ON users;
CREATE TRIGGER on_pastor_created
  AFTER INSERT ON users
  FOR EACH ROW EXECUTE FUNCTION create_church_for_pastor();

-- Function to log history changes
CREATE OR REPLACE FUNCTION log_history_changes()
RETURNS trigger AS $$
DECLARE
  church_id_val uuid;
BEGIN
  -- Get church_id from the record
  IF TG_TABLE_NAME = 'users' THEN
    church_id_val := COALESCE(NEW.church_id, OLD.church_id);
  ELSIF TG_TABLE_NAME = 'churches' THEN
    church_id_val := COALESCE(NEW.id, OLD.id);
  ELSE
    church_id_val := COALESCE(NEW.church_id, OLD.church_id);
  END IF;
  
  -- Log the change
  INSERT INTO history_log (
    church_id,
    user_id,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values
  ) VALUES (
    church_id_val,
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add history triggers to important tables
DROP TRIGGER IF EXISTS history_churches ON churches;
CREATE TRIGGER history_churches
  AFTER INSERT OR UPDATE OR DELETE ON churches
  FOR EACH ROW EXECUTE FUNCTION log_history_changes();

DROP TRIGGER IF EXISTS history_users ON users;
CREATE TRIGGER history_users
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION log_history_changes();

-- Function to get upcoming birthdays for a church
CREATE OR REPLACE FUNCTION get_upcoming_birthdays(church_id_param uuid, days_ahead integer DEFAULT 7)
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
      WHEN u.birthday_month IS NULL OR u.birthday_day IS NULL THEN NULL
      ELSE (
        DATE_PART('day', 
          DATE(EXTRACT(year FROM CURRENT_DATE) || '-' || u.birthday_month || '-' || u.birthday_day) - CURRENT_DATE
        )::integer + 
        CASE 
          WHEN DATE(EXTRACT(year FROM CURRENT_DATE) || '-' || u.birthday_month || '-' || u.birthday_day) < CURRENT_DATE 
          THEN 365 
          ELSE 0 
        END
      )
    END as days_until
  FROM users u
  WHERE u.church_id = church_id_param
    AND u.birthday_month IS NOT NULL 
    AND u.birthday_day IS NOT NULL
    AND (
      DATE_PART('day', 
        DATE(EXTRACT(year FROM CURRENT_DATE) || '-' || u.birthday_month || '-' || u.birthday_day) - CURRENT_DATE
      ) BETWEEN 0 AND days_ahead
      OR
      DATE_PART('day', 
        DATE(EXTRACT(year FROM CURRENT_DATE + INTERVAL '1 year') || '-' || u.birthday_month || '-' || u.birthday_day) - CURRENT_DATE
      ) BETWEEN 0 AND days_ahead
    )
  ORDER BY days_until;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_church_id ON users(church_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_birthday ON users(birthday_month, birthday_day);
CREATE INDEX IF NOT EXISTS idx_events_church_id ON events(church_id);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_files_church_id ON files(church_id);
CREATE INDEX IF NOT EXISTS idx_prayer_requests_church_id ON prayer_requests(church_id);
CREATE INDEX IF NOT EXISTS idx_registration_links_church_id ON registration_links(church_id);
CREATE INDEX IF NOT EXISTS idx_registration_links_code ON registration_links(code);