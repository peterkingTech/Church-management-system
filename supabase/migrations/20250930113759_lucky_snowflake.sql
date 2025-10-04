/*
  # Add Churches Table

  1. New Tables
    - `churches`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `address` (text, optional)
      - `phone` (text, optional)
      - `email` (text, optional)
      - `website` (text, optional)
      - `logo_url` (text, optional)
      - `theme_colors` (jsonb, default colors)
      - `default_language` (text, default 'en')
      - `timezone` (text, default 'UTC')
      - `pastor_id` (uuid, foreign key to auth.users)
      - `subscription_plan` (text, default 'basic')
      - `subscription_expires_at` (timestamptz, optional)
      - `is_active` (boolean, default true)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `churches` table
    - Add policies for church access control

  3. Indexes
    - Index on `pastor_id` for fast lookups
    - Index on `is_active` for filtering
    - Index on `name` for searching
*/

-- Create churches table
CREATE TABLE IF NOT EXISTS public.churches (
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
  pastor_id uuid REFERENCES auth.users(id),
  subscription_plan text DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'premium', 'enterprise')),
  subscription_expires_at timestamptz,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_churches_pastor_id ON public.churches(pastor_id);
CREATE INDEX IF NOT EXISTS idx_churches_is_active ON public.churches(is_active);
CREATE INDEX IF NOT EXISTS idx_churches_name ON public.churches(name);

-- RLS Policies for churches table
CREATE POLICY "Churches are viewable by authenticated users"
  ON public.churches
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Pastors can update their own church"
  ON public.churches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = pastor_id);

CREATE POLICY "Pastors can insert their own church"
  ON public.churches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = pastor_id);

-- Update users table to reference churches
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'church_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN church_id uuid REFERENCES public.churches(id);
    CREATE INDEX IF NOT EXISTS idx_users_church_id ON public.users(church_id);
  END IF;
END $$;

-- Update users RLS policies to include church isolation
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
CREATE POLICY "Users can view own data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can view church members"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Pastors can manage church users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    church_id IN (
      SELECT id FROM public.churches WHERE pastor_id = auth.uid()
    )
  );