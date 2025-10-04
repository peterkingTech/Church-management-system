import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced configuration check with helpful error messages
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase environment variables not configured');
  console.log('📋 To connect to Supabase:');
  console.log('1. Go to https://supabase.com');
  console.log('2. Create/open your project');
  console.log('3. Go to Settings → API');
  console.log('4. Copy your Project URL and anon key');
  console.log('5. Update the .env file with your credentials');
}

// Check if using placeholder values
if (supabaseUrl?.includes('your-project') || supabaseAnonKey?.includes('your_anon_key')) {
  console.warn('🔧 Please update .env file with your actual Supabase credentials');
}

// Enhanced Supabase client with comprehensive configuration
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder-key', 
  {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'church-management-system'
    }
  }
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact' }).limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error);
    return false;
  }
};

// Enhanced helper functions with comprehensive error handling

// Helper function to check if user has permission
export const hasPermission = async (permissionName: string, resourceId?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc('user_has_permission', {
      permission_name: permissionName,
      resource_id: resourceId
    });
    
    if (error) {
      console.error('Permission check error:', error);
      return false;
    }
    
    return data || false;
  } catch (error) {
    console.error('Permission check exception:', error);
    return false;
  }
};

// Helper function to get user's church ID
export const getUserChurchId = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('church_id')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data.church_id || null;
  } catch (error) {
    console.error('Error getting user church ID:', error);
    return null;
  }
};

// Enhanced profile image upload with validation
// Helper function to upload profile image
export const uploadProfileImage = async (file: File, userId: string): Promise<{ data: string | null; error: any }> => {
  try {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return { data: null, error: new Error('File size exceeds 5MB limit') };
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { data: null, error: new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.') };
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Update user profile with new image URL
    await supabase
      .from('users')
      .update({ profile_photo_url: publicUrl })
      .eq('id', userId);
    return { data: publicUrl, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Enhanced user creation with comprehensive setup
// Helper function to create a new user (Admin only)
export const createUser = async (userData: {
  email: string;
  password: string;
  full_name: string;
  role?: string;
  department_id?: string;
  phone?: string;
  address?: string;
  language: string;
}) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          full_name: userData.full_name,
          role: userData.role || 'member',
          language: userData.language
        }
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // The trigger will automatically create the user profile
      // But we can update it with additional information
      const { error: profileError } = await supabase
        .from('users')
        .update({
          full_name: userData.full_name,
          role: userData.role || 'member',
          department_id: userData.department_id || null,
          phone: userData.phone || null,
          address: userData.address || null,
          language: userData.language,
          church_id: userData.church_id,
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);

      if (profileError) throw profileError;

      // Assign to department if specified
      if (userData.department_id) {
        await supabase
          .from('user_departments')
          .insert({
            user_id: authData.user.id,
            department_id: userData.department_id,
            role: 'member'
          });
      }
      
      return { data: authData.user, error: null };
    }

    return { data: null, error: new Error('Failed to create user') };
  } catch (error) {
    console.error('Create user error:', error);
    return { data: null, error };
  }
};

// Enhanced user existence check
// Helper function to check if user exists
export const checkUserExists = async (email: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    return !error && !!data;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};

// Enhanced user profile creation
// Create user profile in database
export const createUserProfile = async (userData: any) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert({
        id: userData.id,
        church_id: userData.church_id,
        full_name: userData.full_name,
        email: userData.email.toLowerCase().trim(),
        language: userData.language,
        phone: userData.phone || null,
        profile_photo_url: userData.profile_photo_url || null,
        is_confirmed: true,
        church_joined_at: new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { data: null, error };
  }
};

// Enhanced password reset
// Helper function to reset user password
export const resetUserPassword = async (email: string) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Enhanced user retrieval with comprehensive data
// Helper function to get all users (Admin only)
export const getAllUsers = async () => {
  try {
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
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return { data: null, error };
  }
};

// Enhanced user update
// Helper function to update user
export const updateUser = async (userId: string, userData: any) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    return { error };
  } catch (error) {
    return { error };
  }
};

// Enhanced user deletion with cleanup
// Helper function to delete user
export const deleteUser = async (userId: string) => {
  try {
    // Clean up related records first
    await supabase.from('user_roles').delete().eq('user_id', userId);
    await supabase.from('user_departments').delete().eq('user_id', userId);
    await supabase.from('notifications').delete().eq('user_id', userId);
    
    // Delete user profile
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    return { error };
  } catch (error) {
    return { error };
  }
};

// Enhanced department retrieval
// Helper function to get departments
export const getDepartments = async () => {
  try {
    const { data, error } = await supabase
      .from('departments')
      .select(`
        *,
        leader:users(full_name, email),
        user_departments(
          user:users(full_name, email)
        )
      `)
      .eq('is_active', true)
      .order('name');

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Enhanced notification creation
// Helper function to create notification
export const createNotification = async (notification: {
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  related_entity_type?: string;
  related_entity_id?: string;
  action_url?: string;
  priority?: string;
}) => {
  try {
    // Get current user's church_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('User not authenticated') };

    const { data: userData } = await supabase
      .from('users')
      .select('church_id')
      .eq('id', user.id)
      .single();

    if (!userData) return { error: new Error('User not found') };

    const { error } = await supabase
      .from('notifications')
      .insert({
        church_id: userData.church_id,
        ...notification
      });

    return { error };
  } catch (error) {
    return { error };
  }
};

// Enhanced notification marking
// Helper function to mark notification as read
export const markNotificationAsRead = async (notificationId: string) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId);

    return { error };
  } catch (error) {
    return { error };
  }
};

// Enhanced church settings retrieval
// Helper function to get church settings
export const getChurchSettings = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error('User not authenticated') };

    const { data: userData } = await supabase
      .from('users')
      .select('church_id')
      .eq('id', user.id)
      .single();

    if (!userData) return { data: null, error: new Error('User not found') };

    const { data, error } = await supabase
      .from('churches')
      .select('*')
      .eq('id', userData.church_id)
      .single();

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Enhanced church settings update
// Helper function to update church settings
export const updateChurchSettings = async (settings: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error('User not authenticated') };

    const { data: userData } = await supabase
      .from('users')
      .select('church_id')
      .eq('id', user.id)
      .single();

    if (!userData) return { error: new Error('User not found') };

    const { error } = await supabase
      .from('churches')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', userData.church_id);

    return { error };
  } catch (error) {
    return { error };
  }
};

// ============================================================================
// REAL-TIME SUBSCRIPTION HELPERS
// ============================================================================

// Subscribe to user notifications
export const subscribeToNotifications = (userId: string, callback: (payload: any) => void) => {
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
};

// Subscribe to church announcements
export const subscribeToAnnouncements = (churchId: string, callback: (payload: any) => void) => {
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
};

// Subscribe to task updates
export const subscribeToTasks = (userId: string, callback: (payload: any) => void) => {
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
};

// Subscribe to attendance updates
export const subscribeToAttendance = (churchId: string, callback: (payload: any) => void) => {
  return supabase
    .channel('attendance')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance',
        filter: `church_id=eq.${churchId}`
      },
      callback
    )
    .subscribe();
};

// Unsubscribe from channel
export const unsubscribeFromChannel = (subscription: any) => {
  return supabase.removeChannel(subscription);
};

// ============================================================================
// API RATE LIMITING AND SECURITY
// ============================================================================

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, limit: number = 100, windowMs: number = 60000): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
};

// Security headers helper
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
  };
};