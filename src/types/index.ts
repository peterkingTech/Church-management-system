// Enhanced types for hierarchical church management system

export interface Church {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  theme_colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  default_language: string;
  timezone: string;
  pastor_id: string;
  subscription_plan: 'basic' | 'premium' | 'enterprise';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  church_id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  role: 'pastor' | 'admin' | 'worker' | 'member' | 'newcomer';
  department_id?: string;
  profile_image_url?: string;
  phone?: string;
  address?: string;
  birthday?: string;
  language: string;
  is_confirmed: boolean;
  church_joined_at: string;
  last_login?: string;
  assigned_worker_id?: string; // For newcomers
  discipleship_level?: 'foundation' | 'growth' | 'leadership' | 'certified';
  permissions: UserPermission[];
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface UserPermission {
  id: string;
  user_id: string;
  permission: string;
  resource_type?: string;
  resource_id?: string;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
}

export interface Department {
  id: string;
  church_id: string;
  name: string;
  description?: string;
  type: 'music' | 'ushering' | 'evangelism' | 'youth' | 'media' | 'prayer' | 'children' | 'administration';
  leader_id?: string;
  color: string;
  is_active: boolean;
  member_count: number;
  created_at: string;
}

export interface InviteLink {
  id: string;
  church_id: string;
  code: string;
  role: 'worker' | 'member' | 'newcomer';
  department_id?: string;
  expires_at: string;
  max_uses: number;
  current_uses: number;
  created_by: string;
  is_active: boolean;
  qr_code_url?: string;
  created_at: string;
}

export interface DiscipleshipCourse {
  id: string;
  church_id: string;
  title: string;
  description: string;
  level: 'foundation' | 'growth' | 'leadership';
  modules: DiscipleshipModule[];
  duration_weeks: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
}

export interface DiscipleshipModule {
  id: string;
  course_id: string;
  title: string;
  content: string;
  order_index: number;
  required_for_completion: boolean;
  resources: string[];
}

export interface UserProgress {
  id: string;
  user_id: string;
  course_id: string;
  module_id: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completion_date?: string;
  score?: number;
  notes?: string;
}

export interface FinancialRecord {
  id: string;
  church_id: string;
  type: 'tithe' | 'offering' | 'seed' | 'missions' | 'expense';
  amount: number;
  currency: string;
  description: string;
  category?: string;
  payment_method: 'cash' | 'card' | 'transfer' | 'online';
  reference_number?: string;
  receipt_url?: string;
  recorded_by: string;
  approved_by?: string;
  status: 'pending' | 'approved' | 'rejected';
  transaction_date: string;
  created_at: string;
}

export interface PrayerRequest {
  id: string;
  church_id: string;
  title?: string;
  message: string;
  submitted_by: string;
  is_anonymous: boolean;
  category: 'healing' | 'provision' | 'guidance' | 'thanksgiving' | 'other';
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  status: 'active' | 'answered' | 'archived';
  prayer_count: number;
  visibility: 'public' | 'church' | 'leaders' | 'private';
  answered_at?: string;
  testimony?: string;
  created_at: string;
}

export interface Testimony {
  id: string;
  church_id: string;
  title: string;
  content: string;
  submitted_by: string;
  category: 'salvation' | 'healing' | 'provision' | 'breakthrough' | 'other';
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  is_featured: boolean;
  created_at: string;
}

export interface CounselingSession {
  id: string;
  church_id: string;
  counselor_id: string;
  counselee_id: string;
  session_type: 'individual' | 'couple' | 'family' | 'group';
  topic: string;
  scheduled_date: string;
  duration_minutes: number;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';
  notes?: string;
  follow_up_required: boolean;
  created_at: string;
}

export interface Event {
  id: string;
  church_id: string;
  title: string;
  description: string;
  event_type: 'service' | 'crusade' | 'outreach' | 'training' | 'social' | 'prayer';
  date: string;
  start_time: string;
  end_time?: string;
  location: string;
  max_attendees?: number;
  requires_registration: boolean;
  volunteer_roles: VolunteerRole[];
  created_by: string;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  created_at: string;
}

export interface VolunteerRole {
  id: string;
  event_id: string;
  role_name: string;
  description: string;
  required_count: number;
  assigned_users: string[];
  requirements?: string[];
}

export interface Attendance {
  id: string;
  church_id: string;
  user_id: string;
  event_id?: string;
  program_type: 'service' | 'bible_school' | 'prayer_meeting' | 'outreach';
  date: string;
  check_in_time?: string;
  check_out_time?: string;
  was_present: boolean;
  notes?: string;
  marked_by: string;
  created_at: string;
}

export interface Notification {
  id: string;
  church_id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'announcement' | 'task' | 'event' | 'prayer' | 'discipleship' | 'prophetic';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  action_url?: string;
  expires_at?: string;
  created_by: string;
  created_at: string;
}

export interface Task {
  id: string;
  church_id: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_by: string;
  department_id?: string;
  due_date?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  completion_percentage: number;
  created_at: string;
}

export interface Report {
  id: string;
  church_id: string;
  title: string;
  type: 'membership' | 'soul_winning' | 'discipleship' | 'attendance' | 'finance' | 'growth';
  period_start: string;
  period_end: string;
  data: Record<string, any>;
  generated_by: string;
  file_url?: string;
  created_at: string;
}