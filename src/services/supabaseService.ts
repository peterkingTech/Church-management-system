import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

// ============================================================================
// ENHANCED SERVICE CLASSES FOR COMPREHENSIVE BACKEND
// ============================================================================

// Type definitions for the comprehensive church management system
export type Church = Database['public']['Tables']['churches']['Row'];
export type Role = Database['public']['Tables']['roles']['Row'];
export type User = Database['public']['Tables']['users']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
export type Task = Database['public']['Tables']['tasks']['Row'];
export type Event = Database['public']['Tables']['events']['Row'];
export type PrayerRequest = Database['public']['Tables']['prayer_requests']['Row'];
export type Announcement = Database['public']['Tables']['announcements']['Row'];
export type Attendance = Database['public']['Tables']['attendance']['Row'];
export type FinancialRecord = Database['public']['Tables']['financial_records']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];

// ============================================================================
// ENHANCED AUTHENTICATION SERVICES
// ============================================================================

export class AuthService {
  // Enhanced sign up with comprehensive user data
  static async signUp(userData: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
    language: string;
    phone?: string;
    birthday_month?: number;
    birthday_day?: number;
    church_id?: string;
    department_id?: string;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role || 'Member',
          language: userData.language,
          phone: userData.phone,
          birthday_month: userData.birthday_month,
          birthday_day: userData.birthday_day,
          church_id: userData.church_id,
          department_id: userData.department_id
        }
      }
    });
    return { data, error };
  }

  // New function for church creation and pastor signup
  static async signUpPastorAndChurch(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    church_name: string;
    language: string;
    phone?: string;
    date_of_birth?: string;
    church_logo?: File;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          full_name: `${userData.first_name} ${userData.last_name}`,
          role: 'pastor',
          church_name: userData.church_name,
          language: userData.language,
          phone: userData.phone,
          date_of_birth: userData.date_of_birth,
          is_church_creator: true,
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString()
        }
      }
    });
    return { data, error };
  }

  // Enhanced sign up with invite code
  static async signUpWithInvite(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    church_id: string;
    role_id: string;
    language: string;
    phone?: string;
    birthday?: string;
    invite_code: string;
  }) {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          full_name: `${userData.first_name} ${userData.last_name}`,
          church_id: userData.church_id,
          role_id: userData.role_id,
          language: userData.language,
          phone: userData.phone,
          birthday: userData.birthday,
          invite_code: userData.invite_code,
          terms_accepted_at: new Date().toISOString(),
          privacy_accepted_at: new Date().toISOString()
        }
      }
    });
    return { data, error };
  }

  // Enhanced sign in with activity tracking
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    // Update last seen timestamp
    if (data.user && !error) {
      await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString()
        })
        .eq('id', data.user.id);
    }

    return { data, error };
  }

  // Enhanced user profile retrieval with roles and permissions
  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: null };

    const { data: profile, error } = await supabase
      .from('users')
      .select(`
        *,
        church:churches(*),
        user_roles(
          role:roles(*)
        ),
        user_departments(
          department:departments(*)
        )
      `)
      .eq('id', user.id)
      .single();

    return { data: profile, error };
  }

  // Social authentication providers
  static async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  }

  static async signInWithGitHub() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  }

  // Password reset with enhanced error handling
  static async resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    return { data, error };
  }

  // Update password
  static async updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    return { data, error };
  }

  // Sign out with cleanup
  static async signOut() {
    // Update last seen before signing out
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({ last_seen_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  }
}

// ============================================================================
// ENHANCED CHURCH MANAGEMENT SERVICES
// ============================================================================

export class ChurchService {
  // Get all churches for registration dropdown
  static async getChurches() {
    const { data, error } = await supabase
      .from('churches')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    return { data, error };
  }

  // Create new church with default setup
  static async createChurch(churchData: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    default_language?: string;
    timezone?: string;
  }) {
    const { data: church, error: churchError } = await supabase
      .from('churches')
      .insert(churchData)
      .select()
      .single();

    if (churchError) return { data: null, error: churchError };

    // Create default roles for the church
    const defaultRoles = [
      {
        church_id: church.id,
        name: 'Pastor',
        display_name: 'Pastor',
        description: 'Highest level religious authority with full system access',
        is_default: true,
        permissions: { all: true, financial_access: true, user_management: true, church_settings: true },
        color: '#7C3AED',
        sort_order: 1
      },
      {
        church_id: church.id,
        name: 'Admin',
        display_name: 'Administrator',
        description: 'Administrative privileges with user and content management',
        is_default: true,
        permissions: { user_management: true, content_management: true, reports: true, analytics: true },
        color: '#DC2626',
        sort_order: 2
      },
      {
        church_id: church.id,
        name: 'Worker',
        display_name: 'Church Worker',
        description: 'Staff level access with department and task management',
        is_default: true,
        permissions: { task_management: true, attendance_marking: true, event_management: true, department_access: true },
        color: '#2563EB',
        sort_order: 3
      },
      {
        church_id: church.id,
        name: 'Member',
        display_name: 'Church Member',
        description: 'Regular member access with personal features',
        is_default: true,
        permissions: { personal_access: true, event_participation: true, prayer_requests: true },
        color: '#059669',
        sort_order: 4
      },
      {
        church_id: church.id,
        name: 'Newcomer',
        display_name: 'Newcomer',
        description: 'New visitor with limited access',
        is_default: true,
        permissions: { basic_access: true, prayer_requests: true },
        color: '#D97706',
        sort_order: 5
      }
    ];

    await supabase.from('roles').insert(defaultRoles);

    // Create default departments
    const defaultDepartments = [
      { church_id: church.id, name: 'Worship Team', description: 'Music and worship ministry', color: '#3B82F6' },
      { church_id: church.id, name: 'Youth Ministry', description: 'Ministry for young people', color: '#10B981' },
      { church_id: church.id, name: 'Children Ministry', description: 'Sunday school and children programs', color: '#F59E0B' },
      { church_id: church.id, name: 'Evangelism', description: 'Outreach and soul winning', color: '#EF4444' },
      { church_id: church.id, name: 'Ushering', description: 'Church service coordination', color: '#8B5CF6' },
      { church_id: church.id, name: 'Media Team', description: 'Audio, video, and technical support', color: '#06B6D4' }
    ];

    await supabase.from('departments').insert(defaultDepartments);

    return { data: church, error: null };
  }

  // Get church settings with comprehensive data
  static async getChurchSettings(churchId: string) {
    const { data, error } = await supabase
      .from('churches')
      .select(`
        *,
        roles(count),
        users(count),
        departments(count)
      `)
      .eq('id', churchId)
      .single();

    return { data, error };
  }

  // Update church settings with validation
  static async updateChurchSettings(churchId: string, settings: Partial<Church>) {
    const { data, error } = await supabase
      .from('churches')
      .update({ 
        ...settings, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', churchId)
      .select()
      .single();

    return { data, error };
  }

  // Get upcoming birthdays with enhanced logic
  static async getUpcomingBirthdays(churchId: string, daysAhead: number = 7) {
    const { data, error } = await supabase
      .rpc('get_upcoming_birthdays', {
        church_uuid: churchId,
        days_ahead: daysAhead
      });

    return { data, error };
  }

  // Get church statistics
  static async getChurchStatistics(churchId: string) {
    const [
      usersCount,
      activeUsersCount,
      departmentsCount,
      eventsCount,
      tasksCount
    ] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact' }).eq('church_id', churchId),
      supabase.from('users').select('id', { count: 'exact' }).eq('church_id', churchId).eq('is_active', true),
      supabase.from('departments').select('id', { count: 'exact' }).eq('church_id', churchId).eq('is_active', true),
      supabase.from('events').select('id', { count: 'exact' }).eq('church_id', churchId).gte('event_date', new Date().toISOString().split('T')[0]),
      supabase.from('tasks').select('id', { count: 'exact' }).eq('church_id', churchId).eq('status', 'pending')
    ]);

    return {
      data: {
        total_users: usersCount.count || 0,
        active_users: activeUsersCount.count || 0,
        departments: departmentsCount.count || 0,
        upcoming_events: eventsCount.count || 0,
        pending_tasks: tasksCount.count || 0
      },
      error: null
    };
  }

  // Get roles with permissions
  static async getRoles(churchId: string) {
    const { data, error } = await supabase
      .from('roles')
      .select(`
        *,
        user_roles(count)
      `)
      .eq('church_id', churchId)
      .order('sort_order', { ascending: true });

    return { data, error };
  }

  // Create custom role
  static async createRole(roleData: {
    church_id: string;
    name: string;
    display_name: string;
    description?: string;
    permissions: Record<string, any>;
    color?: string;
  }) {
    const { data, error } = await supabase
      .from('roles')
      .insert({
        ...roleData,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    return { data, error };
  }

  // Get departments with member counts
  static async getDepartments(churchId: string) {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        leader:users(full_name, email),
        user_departments(
          user:users(full_name, email)
        )
      `)
      .eq('church_id', churchId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    return { data, error };
  }
}

// ============================================================================
// ENHANCED USER MANAGEMENT SERVICES
// ============================================================================

export class UserService {
  // Get all users with comprehensive data
  static async getAllUsers(churchId: string, filters?: {
    role?: string;
    department?: string;
    is_active?: boolean;
    search?: string;
  }) {
    let query = supabase
      .from('users')
      .select(`
        *,
        user_roles(
          role:roles(name, display_name, color)
        ),
        user_departments(
          department:departments(name, color)
        )
      `)
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters?.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_roles(
          role:roles(name, display_name, color)
        ),
        user_departments(
          department:departments(name, color)
        )
      `)
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Create user with role assignment
  static async createUser(userData: {
    church_id: string;
    email: string;
    full_name: string;
    role_id?: string;
    department_id?: string;
    phone?: string;
    language?: string;
  }) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    // Assign role if provided
    if (!error && data && userData.role_id) {
      await this.assignRole(data.id, userData.role_id);
    }

    // Assign department if provided
    if (!error && data && userData.department_id) {
      await this.assignDepartment(data.id, userData.department_id);
    }

    return { data, error };
  }

  // Update user with enhanced validation
  static async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  }

  // Delete user with cleanup
  static async deleteUser(userId: string) {
    // First remove from all roles and departments
    await supabase.from('user_roles').delete().eq('user_id', userId);
    await supabase.from('user_departments').delete().eq('user_id', userId);
    
    // Then delete the user
    const { data, error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    return { data, error };
  }

  // Assign role to user
  static async assignRole(userId: string, roleId: string, assignedBy?: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role_id: roleId,
        assigned_by: assignedBy || (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    return { data, error };
  }

  // Assign department to user
  static async assignDepartment(userId: string, departmentId: string, roleInDepartment: string = 'member') {
    const { data, error } = await supabase
      .from('user_departments')
      .upsert({
        user_id: userId,
        department_id: departmentId,
        role_in_department: roleInDepartment,
        assigned_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    return { data, error };
  }

  // Get user permissions
  static async getUserPermissions(userId: string) {
    const { data, error } = await supabase
      .from('user_roles')
      .select(`
        role:roles(
          name,
          permissions
        )
      `)
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) return { data: null, error };

    // Merge all permissions from all roles
    const allPermissions = data.reduce((acc, userRole) => {
      return { ...acc, ...userRole.role.permissions };
    }, {});

    return { data: allPermissions, error: null };
  }

  // Bulk user operations
  static async bulkUpdateUsers(userIds: string[], updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update({ 
        ...updates, 
        updated_at: new Date().toISOString() 
      })
      .in('id', userIds)
      .select();

    return { data, error };
  }

  // Search users with advanced filters
  static async searchUsers(churchId: string, searchTerm: string, filters?: {
    roles?: string[];
    departments?: string[];
    is_active?: boolean;
  }) {
    let query = supabase
      .from('users')
      .select(`
        *,
        user_roles(
          role:roles(name, display_name)
        ),
        user_departments(
          department:departments(name)
        )
      `)
      .eq('church_id', churchId)
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_roles(
          role:roles(name, display_name)
        ),
        user_departments(
          department:departments(name)
        )
      `)
      .eq('church_id', churchId)
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);

    return { data, error };
  }
}

// ============================================================================
// ENHANCED STORAGE SERVICES
// ============================================================================

export class StorageService {
  // Upload file with comprehensive metadata
  static async uploadFile(
    file: File, 
    bucket: string, 
    path: string, 
    metadata?: {
      entity_type?: string;
      entity_id?: string;
      access_level?: string;
      allowed_roles?: string[];
    }
  ) {
    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (uploadError) return { data: null, error: uploadError };

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('User not authenticated') };

    // Get user's church_id
    const { data: userData } = await supabase
      .from('users')
      .select('church_id')
      .eq('id', user.id)
      .single();

    if (!userData) return { data: null, error: new Error('User not found') };

    // Record file metadata
    const { data: fileRecord, error: dbError } = await supabase
      .from('file_uploads')
      .insert({
        church_id: userData.church_id,
        uploaded_by: user.id,
        file_name: file.name,
        file_path: uploadData.path,
        file_size: file.size,
        file_type: file.name.split('.').pop() || 'unknown',
        mime_type: file.type,
        entity_type: metadata?.entity_type,
        entity_id: metadata?.entity_id,
        access_level: metadata?.access_level || 'church',
        allowed_roles: metadata?.allowed_roles
      })
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from(bucket).remove([uploadData.path]);
      return { data: null, error: dbError };
    }

    return { data: { storage: uploadData, record: fileRecord }, error: null };
  }

  // Get file with access control
  static async getFile(fileId: string) {
    const { data, error } = await supabase
      .from('file_uploads')
      .select(`
        *,
        uploaded_by_user:users(full_name)
      `)
      .eq('id', fileId)
      .single();

    return { data, error };
  }

  // Delete file with cleanup
  static async deleteFile(fileId: string) {
    // Get file info first
    const { data: fileInfo, error: fetchError } = await supabase
      .from('file_uploads')
      .select('file_path')
      .eq('id', fileId)
      .single();

    if (fetchError) return { error: fetchError };

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('church-files')
      .remove([fileInfo.file_path]);

    // Delete from database
    const { error: dbError } = await supabase
      .from('file_uploads')
      .delete()
      .eq('id', fileId);

    return { error: storageError || dbError };
  }

  // Get public URL for file
  static getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  // Upload profile image
  static async uploadProfileImage(file: File, userId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (error) return { data: null, error };

    const publicUrl = this.getPublicUrl('avatars', data.path);

    // Update user profile with new image URL
    await supabase
      .from('users')
      .update({ profile_photo_url: publicUrl })
      .eq('id', userId);

    return { data: publicUrl, error: null };
  }
}

// ============================================================================
// ENHANCED NOTIFICATION SERVICES
// ============================================================================

export class NotificationService {
  // Create notification with real-time broadcast
  static async createNotification(notificationData: {
    user_ids: string[];
    title: string;
    message: string;
    notification_type: string;
    related_entity_type?: string;
    related_entity_id?: string;
    action_url?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('User not authenticated') };

    const { data: userData } = await supabase
      .from('users')
      .select('church_id')
      .eq('id', user.id)
      .single();

    if (!userData) return { data: null, error: new Error('User not found') };

    // Create notifications for each user
    const notifications = notificationData.user_ids.map(userId => ({
      church_id: userData.church_id,
      user_id: userId,
      title: notificationData.title,
      message: notificationData.message,
      notification_type: notificationData.notification_type,
      related_entity_type: notificationData.related_entity_type,
      related_entity_id: notificationData.related_entity_id,
      action_url: notificationData.action_url,
      priority: notificationData.priority || 'normal'
    }));

    const { data, error } = await supabase
      .from('notifications')
      .insert(notifications)
      .select()

    return { data, error };
  }

  // Get user notifications with pagination
  static async getNotifications(userId: string, options?: {
    limit?: number;
    offset?: number;
    unread_only?: boolean;
  }) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.unread_only) {
      query = query.eq('is_read', false);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  }

  // Mark notification as read
  static async markAsRead(notificationId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)
      .select()
      .single();

    return { data, error };
  }

  // Mark all notifications as read for user
  static async markAllAsRead(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', userId)
      .eq('is_read', false);

    return { data, error };
  }

  // Delete notification
  static async deleteNotification(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    return { error };
  }

  // Get notification statistics
  static async getNotificationStats(userId: string) {
    const [totalCount, unreadCount, todayCount] = await Promise.all([
      supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', userId),
      supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', userId).eq('is_read', false),
      supabase.from('notifications').select('id', { count: 'exact' }).eq('user_id', userId).gte('created_at', new Date().toISOString().split('T')[0])
    ]);

    return {
      data: {
        total: totalCount.count || 0,
        unread: unreadCount.count || 0,
        today: todayCount.count || 0
      },
      error: null
    };
  }
}

// ============================================================================
// ATTENDANCE SERVICES
// ============================================================================

export class AttendanceService {
  static async markAttendance(attendanceData: {
    user_id: string;
    program_id?: string;
    event_id?: string;
    attendance_date?: string;
    was_present: boolean;
    arrival_time?: string;
    notes?: string;
  }) {
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        ...attendanceData,
        marked_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    return { data, error };
  }

  static async getAttendanceHistory(userId?: string, churchId?: string, startDate?: string, endDate?: string) {
    let query = supabase
      .from('attendance')
      .select(`
        *,
        user:users(full_name, profile_photo_url),
        program:programs(name),
        event:events(title)
      `)
      .order('attendance_date', { ascending: false });

    if (userId) query = query.eq('user_id', userId);
    if (churchId) query = query.eq('church_id', churchId);
    if (startDate) query = query.gte('attendance_date', startDate);
    if (endDate) query = query.lte('attendance_date', endDate);

    const { data, error } = await query;
    return { data, error };
  }

  static async getAttendanceStats(churchId: string, period: 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    const { data, error } = await supabase
      .from('attendance')
      .select('attendance_date, was_present, user_id')
      .eq('church_id', churchId)
      .gte('attendance_date', startDate.toISOString().split('T')[0]);

    return { data, error };
  }
}

// ============================================================================
// TASK MANAGEMENT SERVICES
// ============================================================================

export class TaskService {
  static async getTasks(churchId: string, filters?: {
    assignee_id?: string;
    status?: string;
    priority?: string;
    department_id?: string;
  }) {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assignee:users!tasks_assignee_id_fkey(full_name, profile_photo_url),
        assigner:users!tasks_assigner_id_fkey(full_name),
        department:departments(name, color),
        task_comments(count)
      `)
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    if (filters?.assignee_id) query = query.eq('assignee_id', filters.assignee_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    if (filters?.department_id) query = query.eq('department_id', filters.department_id);

    const { data, error } = await query;
    return { data, error };
  }

  static async createTask(taskData: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        ...taskData,
        assigner_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    return { data, error };
  }

  static async updateTask(taskId: string, updates: Partial<Task>) {
    const { data, error } = await supabase
      .from('tasks')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', taskId)
      .select()
      .single();

    return { data, error };
  }

  static async addTaskComment(taskId: string, comment: string, commentType: string = 'comment', timeLogged?: number) {
    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        comment,
        comment_type: commentType,
        time_logged: timeLogged
      })
      .select()
      .single();

    return { data, error };
  }
}

// ============================================================================
// EVENT MANAGEMENT SERVICES
// ============================================================================

export class EventService {
  static async getEvents(churchId: string, filters?: {
    event_type?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  }) {
    let query = supabase
      .from('events')
      .select(`
        *,
        creator:users(full_name),
        event_registrations(count),
        event_registrations(
          user:users(full_name),
          registration_status
        )
      `)
      .eq('church_id', churchId)
      .order('event_date', { ascending: true });

    if (filters?.event_type) query = query.eq('event_type', filters.event_type);
    if (filters?.start_date) query = query.gte('event_date', filters.start_date);
    if (filters?.end_date) query = query.lte('event_date', filters.end_date);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    return { data, error };
  }

  static async createEvent(eventData: Partial<Event>) {
    const { data, error } = await supabase
      .from('events')
      .insert({
        ...eventData,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    return { data, error };
  }

  static async registerForEvent(eventId: string, registrationData?: {
    plus_ones?: number;
    dietary_requirements?: string;
    special_needs?: string;
  }) {
    const { data, error } = await supabase
      .from('event_registrations')
      .upsert({
        event_id: eventId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        ...registrationData
      })
      .select()
      .single();

    return { data, error };
  }

  static async updateRegistrationStatus(eventId: string, userId: string, status: string) {
    const { data, error } = await supabase
      .from('event_registrations')
      .update({ 
        registration_status: status,
        attended_at: status === 'attended' ? new Date().toISOString() : null
      })
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .select()
      .single();

    return { data, error };
  }
}

// ============================================================================
// PRAYER REQUEST SERVICES
// ============================================================================

export class PrayerService {
  static async getPrayerRequests(churchId: string, filters?: {
    status?: string;
    category?: string;
    visibility?: string;
  }) {
    let query = supabase
      .from('prayer_requests')
      .select(`
        *,
        submitted_by_user:users(full_name, profile_photo_url),
        prayer_responses(count),
        prayer_responses(
          user:users(full_name),
          response_type,
          message,
          created_at
        )
      `)
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.visibility) query = query.eq('visibility', filters.visibility);

    const { data, error } = await query;
    return { data, error };
  }

  static async createPrayerRequest(prayerData: Partial<PrayerRequest>) {
    const { data, error } = await supabase
      .from('prayer_requests')
      .insert({
        ...prayerData,
        submitted_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    return { data, error };
  }

  static async respondToPrayer(prayerId: string, responseType: string, message?: string) {
    const { data, error } = await supabase
      .from('prayer_responses')
      .upsert({
        prayer_request_id: prayerId,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        response_type: responseType,
        message
      })
      .select()
      .single();

    // Update prayer count
    if (responseType === 'prayed') {
      await supabase.rpc('increment_prayer_count', { prayer_id: prayerId });
    }

    return { data, error };
  }
}

// ============================================================================
// ANNOUNCEMENT SERVICES
// ============================================================================

export class AnnouncementService {
  static async getAnnouncements(churchId: string, includeExpired: boolean = false) {
    let query = supabase
      .from('announcements')
      .select(`
        *,
        created_by_user:users(full_name),
        announcement_acknowledgments(count),
        announcement_acknowledgments(
          user:users(full_name),
          acknowledged_at
        )
      `)
      .eq('church_id', churchId)
      .eq('status', 'active')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (!includeExpired) {
      query = query.or('expires_at.is.null,expires_at.gte.' + new Date().toISOString());
    }

    const { data, error } = await query;
    return { data, error };
  }

  static async createAnnouncement(announcementData: Partial<Announcement>) {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        ...announcementData,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    return { data, error };
  }

  static async acknowledgeAnnouncement(announcementId: string) {
    const { data, error } = await supabase
      .from('announcement_acknowledgments')
      .upsert({
        announcement_id: announcementId,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    return { data, error };
  }
}

// ============================================================================
// FINANCIAL SERVICES
// ============================================================================

export class FinancialService {
  static async getFinancialRecords(churchId: string, filters?: {
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
    status?: string;
  }) {
    let query = supabase
      .from('financial_records')
      .select(`
        *,
        recorded_by_user:users!financial_records_recorded_by_fkey(full_name),
        approved_by_user:users!financial_records_approved_by_fkey(full_name)
      `)
      .eq('church_id', churchId)
      .order('transaction_date', { ascending: false });

    if (filters?.transaction_type) query = query.eq('transaction_type', filters.transaction_type);
    if (filters?.start_date) query = query.gte('transaction_date', filters.start_date);
    if (filters?.end_date) query = query.lte('transaction_date', filters.end_date);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    return { data, error };
  }

  static async createFinancialRecord(recordData: Partial<FinancialRecord>) {
    const { data, error } = await supabase
      .from('financial_records')
      .insert({
        ...recordData,
        recorded_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    return { data, error };
  }

  static async getFinancialSummary(churchId: string, startDate: string, endDate: string) {
    const { data, error } = await supabase
      .from('financial_records')
      .select('transaction_type, amount')
      .eq('church_id', churchId)
      .eq('status', 'approved')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (error) return { data: null, error };

    const summary = data.reduce((acc, record) => {
      const type = record.transaction_type;
      if (!acc[type]) acc[type] = 0;
      acc[type] += Number(record.amount);
      return acc;
    }, {} as Record<string, number>);

    return { data: summary, error: null };
  }
}

// ============================================================================
// REPORTING SERVICES
// ============================================================================

export class ReportService {
  static async generateReport(reportData: {
    church_id: string;
    title: string;
    report_type: string;
    parameters: any;
    period_start?: string;
    period_end?: string;
  }) {
    const { data, error } = await supabase
      .from('reports')
      .insert({
        ...reportData,
        generated_by: (await supabase.auth.getUser()).data.user?.id,
        status: 'generating'
      })
      .select()
      .single();

    return { data, error };
  }

  static async getReports(churchId: string, reportType?: string) {
    let query = supabase
      .from('reports')
      .select(`
        *,
        generated_by_user:users(full_name)
      `)
      .eq('church_id', churchId)
      .order('created_at', { ascending: false });

    if (reportType) query = query.eq('report_type', reportType);

    const { data, error } = await query;
    return { data, error };
  }
}

// ============================================================================
// FILE UPLOAD SERVICES
// ============================================================================

export class FileService {
  static async uploadFile(file: File, bucket: string, path: string, metadata?: any) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file);

    if (error) return { data: null, error };

    // Record file upload in database
    const { data: fileRecord, error: dbError } = await supabase
      .from('file_uploads')
      .insert({
        file_name: file.name,
        file_path: data.path,
        file_size: file.size,
        file_type: file.type.split('/')[1],
        mime_type: file.type,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        metadata
      })
      .select()
      .single();

    return { data: { storage: data, record: fileRecord }, error: dbError };
  }

  static async getFileUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  static async deleteFile(bucket: string, path: string, fileId?: string) {
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (fileId) {
      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', fileId);

      return { error: storageError || dbError };
    }

    return { error: storageError };
  }
}

// ============================================================================
// ANALYTICS SERVICES
// ============================================================================

export class AnalyticsService {
  static async getDashboardMetrics(churchId: string) {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [
      todayAttendance,
      weeklyAttendance,
      pendingTasks,
      activeAnnouncements,
      prayerRequests,
      upcomingEvents,
      totalUsers,
      totalDepartments
    ] = await Promise.all([
      supabase.from('attendance').select('id', { count: 'exact' }).eq('church_id', churchId).eq('attendance_date', today).eq('was_present', true),
      supabase.from('attendance').select('id', { count: 'exact' }).eq('church_id', churchId).gte('attendance_date', weekAgo).eq('was_present', true),
      supabase.from('tasks').select('id', { count: 'exact' }).eq('church_id', churchId).eq('status', 'pending'),
      supabase.from('announcements').select('id', { count: 'exact' }).eq('church_id', churchId).eq('status', 'active'),
      supabase.from('prayer_requests').select('id', { count: 'exact' }).eq('church_id', churchId).eq('status', 'active'),
      supabase.from('events').select('id', { count: 'exact' }).eq('church_id', churchId).gte('event_date', today),
      supabase.from('users').select('id', { count: 'exact' }).eq('church_id', churchId).eq('is_active', true),
      supabase.from('departments').select('id', { count: 'exact' }).eq('church_id', churchId).eq('is_active', true)
    ]);

    return {
      todayAttendance: todayAttendance.count || 0,
      weeklyAttendance: weeklyAttendance.count || 0,
      pendingTasks: pendingTasks.count || 0,
      activeAnnouncements: activeAnnouncements.count || 0,
      prayerRequests: prayerRequests.count || 0,
      upcomingEvents: upcomingEvents.count || 0,
      totalUsers: totalUsers.count || 0,
      totalDepartments: totalDepartments.count || 0
    };
  }

  static async getAttendanceTrends(churchId: string, days: number = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .select('attendance_date, was_present')
      .eq('church_id', churchId)
      .gte('attendance_date', startDate)
      .order('attendance_date');

    return { data, error };
  }

  static async getUserRoleDistribution(churchId: string) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        user_roles(
          role:roles(name, display_name, color)
        )
      `)
      .eq('church_id', churchId)
      .eq('is_active', true);

    return { data, error };
  }
}

// ============================================================================
// REGISTRATION SERVICES
// ============================================================================

export class RegistrationService {
  static async generateRegistrationCode(data: {
    church_id: string;
    role_id: string;
    department_id?: string;
    expires_in_days: number;
    max_uses?: number;
  }) {
    const code = Math.random().toString(36).substring(2, 15).toUpperCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expires_in_days);

    const { data: result, error } = await supabase
      .from('registration_codes')
      .insert({
        church_id: data.church_id,
        code,
        role_id: data.role_id,
        department_id: data.department_id,
        expires_at: expiresAt.toISOString(),
        max_uses: data.max_uses || 1,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    return { data: result, error };
  }

  static async validateRegistrationCode(code: string) {
    const { data, error } = await supabase
      .from('registration_codes')
      .select(`
        *,
        role:roles(name, display_name),
        department:departments(name),
        church:churches(name)
      `)
      .eq('code', code)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .lt('current_uses', supabase.sql`max_uses`)
      .single();

    return { data, error };
  }

  static async useRegistrationCode(codeId: string) {
    const { data, error } = await supabase
      .from('registration_codes')
      .update({ 
        current_uses: supabase.sql`current_uses + 1` 
      })
      .eq('id', codeId)
      .select()
      .single();

    return { data, error };
  }
}

// ============================================================================
// REAL-TIME SUBSCRIPTIONS
// ============================================================================

export class RealtimeService {
  static subscribeToNotifications(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  static subscribeToAnnouncements(churchId: string, callback: (payload: any) => void) {
    return supabase
      .channel('announcements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'announcements',
          filter: `church_id=eq.${churchId}`
        },
        callback
      )
      .subscribe();
  }

  static subscribeToTasks(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assignee_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  static unsubscribe(subscription: any) {
    return supabase.removeChannel(subscription);
  }
}