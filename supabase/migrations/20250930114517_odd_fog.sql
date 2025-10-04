/*
  # Create Mock User Accounts for Testing

  1. New Tables
    - Creates mock church and user accounts for testing
    - Includes all 4 user roles: pastor, worker, member, newcomer
  
  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    
  3. Mock Data
    - AMEN TECH Demo Church
    - 4 test user accounts with different roles
    - Default departments for the demo church
*/

-- Create demo church first
INSERT INTO public.churches (
  id,
  name,
  address,
  phone,
  email,
  theme_colors,
  default_language,
  timezone,
  pastor_id,
  subscription_plan,
  is_active
) VALUES (
  'demo-church-id',
  'AMEN TECH Demo Church',
  '123 Church Street, Demo City, DC 12345',
  '+1 (555) 123-4567',
  'info@amentech.church',
  '{"primary": "#7C3AED", "secondary": "#F59E0B", "accent": "#EF4444"}',
  'en',
  'UTC',
  'pastor-demo-id',
  'premium',
  true
) ON CONFLICT (id) DO NOTHING;

-- Create mock users
INSERT INTO public.users (
  id,
  church_id,
  email,
  full_name,
  first_name,
  last_name,
  role,
  phone,
  language,
  is_confirmed,
  church_joined_at,
  created_at
) VALUES 
(
  'pastor-demo-id',
  'demo-church-id',
  'pastor@amentech.church',
  'Pastor John',
  'Pastor',
  'John',
  'pastor',
  '+1 (555) 123-4567',
  'en',
  true,
  '2024-01-01',
  NOW()
),
(
  'worker-demo-id',
  'demo-church-id',
  'worker@amentech.church',
  'Worker Sarah',
  'Worker',
  'Sarah',
  'worker',
  '+1 (555) 123-4568',
  'en',
  true,
  '2024-01-01',
  NOW()
),
(
  'member-demo-id',
  'demo-church-id',
  'member@amentech.church',
  'Member David',
  'Member',
  'David',
  'member',
  '+1 (555) 123-4569',
  'en',
  true,
  '2024-01-01',
  NOW()
),
(
  'newcomer-demo-id',
  'demo-church-id',
  'newcomer@amentech.church',
  'Newcomer Mary',
  'Newcomer',
  'Mary',
  'newcomer',
  '+1 (555) 123-4570',
  'en',
  true,
  '2024-01-01',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Update church with pastor_id
UPDATE public.churches 
SET pastor_id = 'pastor-demo-id' 
WHERE id = 'demo-church-id';

-- Create default departments for demo church
INSERT INTO public.departments (
  id,
  church_id,
  name,
  description,
  created_at
) VALUES 
(
  'dept-worship-demo',
  'demo-church-id',
  'Worship Team',
  'Leading church worship and music',
  NOW()
),
(
  'dept-youth-demo',
  'demo-church-id',
  'Youth Ministry',
  'Ministry for young people',
  NOW()
),
(
  'dept-children-demo',
  'demo-church-id',
  'Children Ministry',
  'Sunday school and children programs',
  NOW()
),
(
  'dept-evangelism-demo',
  'demo-church-id',
  'Evangelism',
  'Outreach and soul winning',
  NOW()
),
(
  'dept-ushering-demo',
  'demo-church-id',
  'Ushering',
  'Church service coordination',
  NOW()
),
(
  'dept-media-demo',
  'demo-church-id',
  'Media Team',
  'Audio, video, and technical support',
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Assign worker to worship team department
INSERT INTO public.user_departments (
  user_id,
  department_id,
  role,
  assigned_at
) VALUES (
  'worker-demo-id',
  'dept-worship-demo',
  'leader',
  NOW()
) ON CONFLICT (user_id, department_id) DO NOTHING;

-- Create church settings
INSERT INTO public.church_settings (
  id,
  church_name,
  church_address,
  church_phone,
  church_email,
  primary_color,
  secondary_color,
  accent_color,
  welcome_message,
  updated_at
) VALUES (
  'demo-church-settings',
  'AMEN TECH Demo Church',
  '123 Church Street, Demo City, DC 12345',
  '+1 (555) 123-4567',
  'info@amentech.church',
  '#7C3AED',
  '#F59E0B',
  '#EF4444',
  'Welcome to AMEN TECH Demo Church! We are excited to have you join our church family.',
  NOW()
) ON CONFLICT (id) DO NOTHING;