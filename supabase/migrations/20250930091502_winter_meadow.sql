/*
  # Add Registration Fields for Multi-Church User Registration

  1. Schema Updates
    - Add first_name and last_name columns to users table
    - Add terms_accepted_at and privacy_accepted_at columns
    - Add email_verified_at column for tracking verification
    - Ensure churches table exists for multi-church support

  2. Trigger Updates
    - Update handle_new_user trigger to populate new fields
    - Handle church creation for pastor signups
    - Set proper default roles and permissions

  3. Security
    - Maintain existing RLS policies
    - Add indexes for performance
    - Ensure data integrity
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure churches table exists
CREATE TABLE IF NOT EXISTS churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(255),
  logo_url TEXT,
  theme_colors JSONB DEFAULT '{"primary": "#7C3AED", "secondary": "#F59E0B", "accent": "#EF4444"}',
  default_language VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50) DEFAULT 'UTC',
  pastor_id UUID,
  subscription_plan VARCHAR(50) DEFAULT 'premium',
  subscription_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add new columns to users table if they don't exist
DO $$
BEGIN
  -- Add first_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE users ADD COLUMN first_name VARCHAR(100);
  END IF;

  -- Add last_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE users ADD COLUMN last_name VARCHAR(100);
  END IF;

  -- Add terms_accepted_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'terms_accepted_at'
  ) THEN
    ALTER TABLE users ADD COLUMN terms_accepted_at TIMESTAMPTZ;
  END IF;

  -- Add privacy_accepted_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'privacy_accepted_at'
  ) THEN
    ALTER TABLE users ADD COLUMN privacy_accepted_at TIMESTAMPTZ;
  END IF;

  -- Add email_verified_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email_verified_at'
  ) THEN
    ALTER TABLE users ADD COLUMN email_verified_at TIMESTAMPTZ;
  END IF;

  -- Ensure church_id column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE users ADD COLUMN church_id UUID REFERENCES churches(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_church_id ON users(church_id);
CREATE INDEX IF NOT EXISTS idx_users_first_last_name ON users(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_churches_name ON churches(name);
CREATE INDEX IF NOT EXISTS idx_churches_is_active ON churches(is_active);

-- Enable RLS on churches table
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;

-- Churches RLS policies
DROP POLICY IF EXISTS "Public can view active churches" ON churches;
CREATE POLICY "Public can view active churches" ON churches
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "Pastors can manage their church" ON churches;
CREATE POLICY "Pastors can manage their church" ON churches
  FOR ALL TO authenticated
  USING (pastor_id = auth.uid())
  WITH CHECK (pastor_id = auth.uid());

-- Update handle_new_user trigger to handle new registration fields
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_church_id UUID;
  default_role TEXT;
BEGIN
  -- Extract user metadata
  default_role := COALESCE(NEW.raw_user_meta_data->>'role', 'member');
  
  -- If user is creating a church (pastor signup)
  IF (NEW.raw_user_meta_data->>'is_church_creator')::boolean = true THEN
    -- Create new church
    INSERT INTO churches (name, pastor_id, default_language, created_at)
    VALUES (
      NEW.raw_user_meta_data->>'church_name',
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
      NOW()
    )
    RETURNING id INTO user_church_id;
    
    -- Set role to pastor
    default_role := 'pastor';
  ELSE
    -- For invite-based registration, get church_id from metadata
    user_church_id := (NEW.raw_user_meta_data->>'church_id')::UUID;
  END IF;

  -- Create user profile
  INSERT INTO users (
    id,
    church_id,
    email,
    full_name,
    first_name,
    last_name,
    role,
    language,
    phone,
    birthday,
    is_confirmed,
    terms_accepted_at,
    privacy_accepted_at,
    email_verified_at,
    created_at
  ) VALUES (
    NEW.id,
    user_church_id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 
             CONCAT(NEW.raw_user_meta_data->>'first_name', ' ', NEW.raw_user_meta_data->>'last_name')),
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    default_role,
    COALESCE(NEW.raw_user_meta_data->>'language', 'en'),
    NEW.raw_user_meta_data->>'phone',
    (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
    true,
    (NEW.raw_user_meta_data->>'terms_accepted_at')::TIMESTAMPTZ,
    (NEW.raw_user_meta_data->>'privacy_accepted_at')::TIMESTAMPTZ,
    NEW.email_confirmed_at,
    NOW()
  );

  -- If creating a church, also create default departments
  IF user_church_id IS NOT NULL AND default_role = 'pastor' THEN
    INSERT INTO departments (church_id, name, description, color) VALUES
      (user_church_id, 'Worship Team', 'Music and worship ministry', '#8B5CF6'),
      (user_church_id, 'Youth Ministry', 'Ministry for young people', '#3B82F6'),
      (user_church_id, 'Children Ministry', 'Sunday school and kids programs', '#10B981'),
      (user_church_id, 'Evangelism', 'Outreach and soul winning', '#EF4444'),
      (user_church_id, 'Ushering', 'Service coordination and hospitality', '#F59E0B'),
      (user_church_id, 'Media Team', 'Audio, video, and technical support', '#6B7280'),
      (user_church_id, 'Prayer Ministry', 'Prayer coordination and support', '#EC4899'),
      (user_church_id, 'Administration', 'Church administration and management', '#14B8A6');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create function to validate church name uniqueness
CREATE OR REPLACE FUNCTION is_church_name_available(church_name_param TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN NOT EXISTS (
    SELECT 1 FROM churches 
    WHERE LOWER(name) = LOWER(church_name_param)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get church statistics
CREATE OR REPLACE FUNCTION get_church_registration_stats()
RETURNS TABLE (
  total_churches BIGINT,
  active_churches BIGINT,
  total_users BIGINT,
  churches_this_month BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM churches) as total_churches,
    (SELECT COUNT(*) FROM churches WHERE is_active = true) as active_churches,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM churches WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)) as churches_this_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ REGISTRATION FIELDS MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added columns to users table:';
  RAISE NOTICE '- first_name (VARCHAR(100))';
  RAISE NOTICE '- last_name (VARCHAR(100))';
  RAISE NOTICE '- terms_accepted_at (TIMESTAMPTZ)';
  RAISE NOTICE '- privacy_accepted_at (TIMESTAMPTZ)';
  RAISE NOTICE '- email_verified_at (TIMESTAMPTZ)';
  RAISE NOTICE '';
  RAISE NOTICE 'Updated features:';
  RAISE NOTICE '- Enhanced handle_new_user trigger for church creation';
  RAISE NOTICE '- Church name validation function';
  RAISE NOTICE '- Registration statistics function';
  RAISE NOTICE '- Performance indexes for new columns';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready for multi-church user registration!';
END $$;