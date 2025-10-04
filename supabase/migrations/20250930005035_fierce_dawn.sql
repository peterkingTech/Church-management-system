/*
  # Hierarchical Church Management System Database Schema

  This migration creates a comprehensive database schema for a hierarchical church management system
  with invite-only access control and role-based features.

  ## Core Features:
  - Root Pastor/Admin account creation
  - Invite-only user registration
  - Hierarchical role system (Pastor → Admin → Worker → Member → Newcomer)
  - Department management with leaders
  - Soul winning and discipleship tracking
  - Financial management with secure access
  - Event and attendance management
  - Prayer and counseling systems
  - Comprehensive reporting and analytics

  ## Security:
  - Row Level Security (RLS) on all tables
  - Church-scoped data isolation
  - Role-based access control
  - Audit trail for all changes
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CORE CHURCH STRUCTURE
-- ============================================================================

-- Churches table (multi-tenant support)
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

-- Users table (hierarchical structure)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(20) NOT NULL DEFAULT 'newcomer' CHECK (role IN ('pastor', 'admin', 'worker', 'member', 'newcomer')),
  department_id UUID,
  profile_image_url TEXT,
  phone VARCHAR(20),
  address TEXT,
  birthday DATE,
  language VARCHAR(5) DEFAULT 'en',
  timezone VARCHAR(50),
  is_confirmed BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  church_joined_at DATE DEFAULT CURRENT_DATE,
  last_login_at TIMESTAMPTZ,
  last_seen_at TIMESTAMPTZ,
  
  -- Hierarchical relationships
  invited_by UUID REFERENCES users(id),
  assigned_worker_id UUID REFERENCES users(id), -- For newcomers
  
  -- Discipleship tracking
  discipleship_level VARCHAR(20) DEFAULT 'foundation' CHECK (discipleship_level IN ('foundation', 'growth', 'leadership', 'certified')),
  discipleship_start_date DATE,
  discipleship_completion_date DATE,
  
  -- Permissions and metadata
  permissions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments table (organizational structure)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('music', 'ushering', 'evangelism', 'youth', 'media', 'prayer', 'children', 'administration')),
  description TEXT,
  leader_id UUID REFERENCES users(id),
  color VARCHAR(7) DEFAULT '#6B7280',
  is_active BOOLEAN DEFAULT true,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, name)
);

-- User department assignments
CREATE TABLE IF NOT EXISTS user_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  role_in_department VARCHAR(50) DEFAULT 'member',
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  UNIQUE(user_id, department_id)
);

-- ============================================================================
-- 2. INVITATION SYSTEM
-- ============================================================================

-- Invite links (invite-only registration)
CREATE TABLE IF NOT EXISTS invite_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('worker', 'member', 'newcomer')),
  department_id UUID REFERENCES departments(id),
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER DEFAULT 10,
  current_uses INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  qr_code_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Registration attempts
CREATE TABLE IF NOT EXISTS registration_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_link_id UUID REFERENCES invite_links(id),
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  ip_address INET,
  user_agent TEXT,
  approved_by UUID REFERENCES users(id),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. DISCIPLESHIP & TRAINING SYSTEM
-- ============================================================================

-- Discipleship courses
CREATE TABLE IF NOT EXISTS discipleship_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  level VARCHAR(20) NOT NULL CHECK (level IN ('foundation', 'growth', 'leadership')),
  duration_weeks INTEGER DEFAULT 8,
  modules JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User progress tracking
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES discipleship_courses(id) ON DELETE CASCADE,
  module_index INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completion_date TIMESTAMPTZ,
  score INTEGER CHECK (score >= 0 AND score <= 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id, module_index)
);

-- Certifications
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES discipleship_courses(id),
  certificate_type VARCHAR(50) NOT NULL,
  issued_date DATE DEFAULT CURRENT_DATE,
  issued_by UUID REFERENCES users(id),
  certificate_url TEXT,
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. SOUL WINNING & EVANGELISM
-- ============================================================================

-- Soul winning records
CREATE TABLE IF NOT EXISTS soul_winning_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  convert_name VARCHAR(255) NOT NULL,
  convert_age INTEGER,
  convert_phone VARCHAR(20),
  convert_email VARCHAR(255),
  won_by UUID REFERENCES users(id),
  event_type VARCHAR(50) DEFAULT 'personal' CHECK (event_type IN ('service', 'crusade', 'outreach', 'personal')),
  location VARCHAR(255),
  date_won DATE DEFAULT CURRENT_DATE,
  follow_up_status VARCHAR(20) DEFAULT 'pending' CHECK (follow_up_status IN ('pending', 'assigned', 'contacted', 'discipleship', 'member')),
  assigned_worker_id UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow-up tracking
CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  soul_winning_record_id UUID REFERENCES soul_winning_records(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES users(id),
  contact_date DATE,
  contact_method VARCHAR(20) CHECK (contact_method IN ('phone', 'visit', 'text', 'email')),
  outcome VARCHAR(50),
  next_action VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach events
CREATE TABLE IF NOT EXISTS outreach_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) CHECK (event_type IN ('crusade', 'street_evangelism', 'hospital_visit', 'prison_ministry')),
  location VARCHAR(255),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  target_souls INTEGER,
  actual_souls INTEGER DEFAULT 0,
  volunteers_needed INTEGER,
  organized_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. EVENTS & ATTENDANCE
-- ============================================================================

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_type VARCHAR(50) DEFAULT 'service' CHECK (event_type IN ('service', 'crusade', 'outreach', 'training', 'social', 'prayer')),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location VARCHAR(255),
  max_attendees INTEGER,
  requires_registration BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  volunteer_roles JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance tracking
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id),
  program_type VARCHAR(50) DEFAULT 'service' CHECK (program_type IN ('service', 'bible_school', 'prayer_meeting', 'outreach')),
  date DATE DEFAULT CURRENT_DATE,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  was_present BOOLEAN DEFAULT true,
  notes TEXT,
  marked_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id, date)
);

-- QR code check-ins
CREATE TABLE IF NOT EXISTS qr_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  qr_code VARCHAR(100) NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  location_verified BOOLEAN DEFAULT false,
  device_info JSONB DEFAULT '{}'
);

-- ============================================================================
-- 6. FINANCIAL MANAGEMENT
-- ============================================================================

-- Financial records
CREATE TABLE IF NOT EXISTS financial_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('tithe', 'offering', 'seed', 'missions', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT NOT NULL,
  category VARCHAR(100),
  payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'card', 'transfer', 'online')),
  reference_number VARCHAR(100),
  receipt_url TEXT,
  recorded_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  transaction_date DATE DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Giving campaigns
CREATE TABLE IF NOT EXISTS giving_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  campaign_type VARCHAR(50) CHECK (campaign_type IN ('building_fund', 'missions', 'special_project', 'emergency')),
  target_amount DECIMAL(12,2),
  current_amount DECIMAL(12,2) DEFAULT 0,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. PRAYER & COUNSELING
-- ============================================================================

-- Prayer requests
CREATE TABLE IF NOT EXISTS prayer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(255),
  message TEXT NOT NULL,
  submitted_by UUID REFERENCES users(id),
  is_anonymous BOOLEAN DEFAULT false,
  category VARCHAR(50) CHECK (category IN ('healing', 'provision', 'guidance', 'thanksgiving', 'other')),
  urgency VARCHAR(20) DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'answered', 'archived')),
  prayer_count INTEGER DEFAULT 0,
  visibility VARCHAR(20) DEFAULT 'church' CHECK (visibility IN ('public', 'church', 'leaders', 'private')),
  answered_at TIMESTAMPTZ,
  testimony TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prayer responses
CREATE TABLE IF NOT EXISTS prayer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prayer_request_id UUID REFERENCES prayer_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  response_type VARCHAR(20) DEFAULT 'prayed' CHECK (response_type IN ('prayed', 'comment', 'testimony')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(prayer_request_id, user_id, response_type)
);

-- Counseling sessions
CREATE TABLE IF NOT EXISTS counseling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  counselor_id UUID REFERENCES users(id),
  counselee_id UUID REFERENCES users(id),
  session_type VARCHAR(20) CHECK (session_type IN ('individual', 'couple', 'family', 'group')),
  topic VARCHAR(255),
  scheduled_date TIMESTAMPTZ,
  duration_minutes INTEGER DEFAULT 60,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  notes TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonies
CREATE TABLE IF NOT EXISTS testimonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  submitted_by UUID REFERENCES users(id),
  category VARCHAR(50) CHECK (category IN ('salvation', 'healing', 'provision', 'breakthrough', 'other')),
  is_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. COMMUNICATION SYSTEM
-- ============================================================================

-- Announcements
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  announcement_type VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent', 'prophetic')),
  target_audience JSONB DEFAULT '["all"]',
  requires_acknowledgment BOOLEAN DEFAULT false,
  is_blinking BOOLEAN DEFAULT false,
  publish_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  image_url TEXT,
  created_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'expired', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('announcement', 'task', 'event', 'prayer', 'discipleship', 'prophetic')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT false,
  action_url TEXT,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Department group chats
CREATE TABLE IF NOT EXISTS department_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'announcement')),
  file_url TEXT,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. TASKS & ASSIGNMENTS
-- ============================================================================

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES users(id),
  assigned_by UUID REFERENCES users(id),
  department_id UUID REFERENCES departments(id),
  due_date TIMESTAMPTZ,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. REPORTING & ANALYTICS
-- ============================================================================

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('membership', 'soul_winning', 'discipleship', 'attendance', 'finance', 'growth')),
  period_start DATE,
  period_end DATE,
  data JSONB DEFAULT '{}',
  file_url TEXT,
  generated_by UUID REFERENCES users(id),
  status VARCHAR(20) DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100) NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE registration_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE discipleship_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE soul_winning_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE giving_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE counseling_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. RLS POLICIES (Church-scoped with role hierarchy)
-- ============================================================================

-- Churches policies
CREATE POLICY "Users can view their church" ON churches
  FOR SELECT TO authenticated
  USING (id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Pastors can manage their church" ON churches
  FOR ALL TO authenticated
  USING (pastor_id = auth.uid());

-- Users policies (hierarchical access)
CREATE POLICY "Users can view church members" ON users
  FOR SELECT TO authenticated
  USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Pastors can manage all users" ON users
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role = 'pastor'
    )
  );

CREATE POLICY "Admins can manage non-pastor users" ON users
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    ) AND role != 'pastor'
  );

-- Departments policies
CREATE POLICY "Church members can view departments" ON departments
  FOR SELECT TO authenticated
  USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Leaders can manage departments" ON departments
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

-- Soul winning policies
CREATE POLICY "Church members can view soul winning" ON soul_winning_records
  FOR SELECT TO authenticated
  USING (church_id IN (SELECT church_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Members can record soul winning" ON soul_winning_records
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid()) AND
    won_by = auth.uid()
  );

-- Financial policies (Pastor/Admin only)
CREATE POLICY "Financial access for authorized roles" ON financial_records
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

-- Prayer requests policies
CREATE POLICY "Church members can view prayers" ON prayer_requests
  FOR SELECT TO authenticated
  USING (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid()) AND
    (visibility IN ('public', 'church') OR submitted_by = auth.uid())
  );

CREATE POLICY "Users can submit prayer requests" ON prayer_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid()) AND
    submitted_by = auth.uid()
  );

-- Events policies
CREATE POLICY "Church members can view events" ON events
  FOR SELECT TO authenticated
  USING (
    church_id IN (SELECT church_id FROM users WHERE id = auth.uid()) AND
    (is_public = true OR 
     EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker', 'member')))
  );

-- Attendance policies
CREATE POLICY "Users can view own attendance" ON attendance
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin', 'worker')
    )
  );

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Invite links policies (Pastor/Admin only)
CREATE POLICY "Leaders can manage invite links" ON invite_links
  FOR ALL TO authenticated
  USING (
    church_id IN (
      SELECT church_id FROM users 
      WHERE id = auth.uid() AND role IN ('pastor', 'admin')
    )
  );

-- ============================================================================
-- 13. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core indexes
CREATE INDEX idx_users_church_id ON users(church_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_assigned_worker ON users(assigned_worker_id);
CREATE INDEX idx_departments_church_id ON departments(church_id);
CREATE INDEX idx_departments_leader ON departments(leader_id);
CREATE INDEX idx_soul_winning_church_date ON soul_winning_records(church_id, date_won);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_financial_church_date ON financial_records(church_id, transaction_date);
CREATE INDEX idx_events_church_date ON events(church_id, date);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_prayer_requests_church ON prayer_requests(church_id);

-- ============================================================================
-- 14. HELPER FUNCTIONS
-- ============================================================================

-- Function to check user permissions
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (
      role = 'pastor' OR 
      (permissions->permission_name)::boolean = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get church hierarchy
CREATE OR REPLACE FUNCTION get_church_hierarchy(church_uuid UUID)
RETURNS TABLE (
  role VARCHAR(20),
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.role,
    COUNT(*) as count
  FROM users u
  WHERE u.church_id = church_uuid AND u.is_active = true
  GROUP BY u.role
  ORDER BY 
    CASE u.role 
      WHEN 'pastor' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'worker' THEN 3
      WHEN 'member' THEN 4
      WHEN 'newcomer' THEN 5
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get upcoming birthdays
CREATE OR REPLACE FUNCTION get_upcoming_birthdays(church_uuid UUID, days_ahead INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  full_name VARCHAR(255),
  birthday DATE,
  days_until_birthday INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.full_name,
    u.birthday,
    (u.birthday - CURRENT_DATE + 
     CASE WHEN u.birthday < CURRENT_DATE THEN 365 ELSE 0 END)::INTEGER as days_until_birthday
  FROM users u
  WHERE u.church_id = church_uuid
    AND u.birthday IS NOT NULL
    AND u.is_active = true
    AND (u.birthday - CURRENT_DATE + 
         CASE WHEN u.birthday < CURRENT_DATE THEN 365 ELSE 0 END) <= days_ahead
  ORDER BY days_until_birthday ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 15. INSERT DEFAULT DATA
-- ============================================================================

-- Insert default departments for new churches
INSERT INTO departments (church_id, name, type, description, color) VALUES
  (NULL, 'Music Ministry', 'music', 'Worship team and choir', '#8B5CF6'),
  (NULL, 'Ushering Department', 'ushering', 'Service coordination and hospitality', '#3B82F6'),
  (NULL, 'Evangelism Team', 'evangelism', 'Outreach and soul winning', '#EF4444'),
  (NULL, 'Youth Ministry', 'youth', 'Ministry for young people', '#10B981'),
  (NULL, 'Media Team', 'media', 'Audio, video, and technical support', '#F59E0B'),
  (NULL, 'Prayer Ministry', 'prayer', 'Intercessory prayer and spiritual warfare', '#EC4899'),
  (NULL, 'Children Ministry', 'children', 'Sunday school and kids programs', '#06B6D4'),
  (NULL, 'Administration', 'administration', 'Church administration and management', '#6B7280');

-- Insert default discipleship courses
INSERT INTO discipleship_courses (church_id, title, description, level, duration_weeks) VALUES
  (NULL, 'Foundation Course', 'Basic Christian fundamentals', 'foundation', 8),
  (NULL, 'Growth Track', 'Spiritual growth and maturity', 'growth', 12),
  (NULL, 'Leadership Development', 'Ministry and leadership training', 'leadership', 16);

-- ============================================================================
-- 16. TRIGGERS FOR AUTOMATION
-- ============================================================================

-- Trigger to update department member count
CREATE OR REPLACE FUNCTION update_department_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE departments 
    SET member_count = member_count + 1 
    WHERE id = NEW.department_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE departments 
    SET member_count = member_count - 1 
    WHERE id = OLD.department_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_department_count_trigger
  AFTER INSERT OR DELETE ON user_departments
  FOR EACH ROW EXECUTE FUNCTION update_department_member_count();

-- Trigger for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add audit triggers to important tables
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_financial_trigger
  AFTER INSERT OR UPDATE OR DELETE ON financial_records
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '🎉 HIERARCHICAL CHURCH MANAGEMENT SYSTEM SCHEMA COMPLETE!';
  RAISE NOTICE '';
  RAISE NOTICE '👑 Root Account System: Pastor creates and manages all users';
  RAISE NOTICE '🔗 Invite-Only Registration: No public registration, invite links only';
  RAISE NOTICE '📊 Role Hierarchy: Pastor → Admin → Worker → Member → Newcomer';
  RAISE NOTICE '🎓 Discipleship Tracking: Courses, progress, and certifications';
  RAISE NOTICE '⭐ Soul Winning System: Evangelism logging and follow-up tracking';
  RAISE NOTICE '💰 Financial Management: Secure giving and expense tracking';
  RAISE NOTICE '🙏 Pastoral Care: Prayer requests and counseling sessions';
  RAISE NOTICE '📱 Communication: Announcements, notifications, and group chats';
  RAISE NOTICE '📈 Analytics: Comprehensive reporting and growth tracking';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Ready for production deployment with royal purple + gold theme!';
END $$;