/*
  # Activity Tables Setup
  
  1. New Tables
    - `tasks` - Task management
    - `attendance` - Attendance tracking
    - `events` - Church events
    - `notifications` - User notifications
  
  2. Security
    - Enable RLS on all tables
    - Add role-based policies
*/

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assigned_by uuid,
  assigned_to uuid,
  task_text text,
  description text,
  due_date date,
  is_done boolean DEFAULT false,
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  created_at timestamptz DEFAULT now()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid,
  program_id uuid,
  date date DEFAULT CURRENT_DATE,
  arrival_time time,
  was_present boolean DEFAULT true,
  notes text,
  recorded_by uuid,
  created_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  description text,
  date date NOT NULL,
  time time,
  location text,
  type text DEFAULT 'service' CHECK (type IN ('service', 'study', 'youth', 'prayer', 'crusade', 'special')),
  created_by uuid,
  reminders text[],
  created_at timestamptz DEFAULT now()
);

-- Notifications table
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

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can view assigned tasks" ON tasks FOR SELECT TO authenticated USING (assigned_to = auth.uid() OR assigned_by = auth.uid());
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE TO authenticated USING (assigned_to = auth.uid() OR assigned_by = auth.uid());
CREATE POLICY "User can insert task assigned by or to them" ON tasks FOR INSERT TO authenticated WITH CHECK (assigned_to = auth.uid() OR assigned_by = auth.uid());

-- Attendance policies
CREATE POLICY "Users can view own attendance" ON attendance FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own attendance" ON attendance FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Events policies
CREATE POLICY "All users can view events" ON events FOR SELECT TO authenticated USING (true);

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);