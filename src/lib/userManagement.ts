import { supabase } from './supabase';

export interface CreateUserData {
  full_name: string;
  email: string;
  password: string;
  role: 'admin' | 'worker' | 'member' | 'newcomer';
  department_id?: string;
  phone?: string;
  address?: string;
  language: string;
}

export interface UpdateUserData {
  full_name?: string;
  email?: string;
  role?: 'admin' | 'worker' | 'member' | 'newcomer';
  department_id?: string;
  phone?: string;
  address?: string;
  language?: string;
  is_confirmed?: boolean;
}

// Create a new user (Admin only)
export const createUser = async (userData: CreateUserData) => {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        full_name: userData.full_name,
        role: userData.role,
        language: userData.language
      }
    });

    if (authError) throw authError;

    if (authData.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          full_name: userData.full_name,
          email: userData.email,
          role: userData.role,
          department_id: userData.department_id || null,
          phone: userData.phone || null,
          address: userData.address || null,
          language: userData.language,
          is_confirmed: true,
          church_joined_at: new Date().toISOString().split('T')[0]
        });

      if (profileError) throw profileError;

      // Assign to department if specified
      if (userData.department_id) {
        await assignUserToDepartment(authData.user.id, userData.department_id);
      }

      return { data: authData.user, error: null };
    }

    return { data: null, error: new Error('Failed to create user') };
  } catch (error) {
    return { data: null, error };
  }
};

// Update user data (Admin only)
export const updateUser = async (userId: string, userData: UpdateUserData) => {
  try {
    // Update user profile
    const { error: profileError } = await supabase
      .from('users')
      .update(userData)
      .eq('id', userId);

    if (profileError) throw profileError;

    // Update auth metadata if needed
    if (userData.email || userData.full_name || userData.role || userData.language) {
      const updateData: any = {};
      
      if (userData.email) updateData.email = userData.email;
      
      if (userData.full_name || userData.role || userData.language) {
        updateData.user_metadata = {};
        if (userData.full_name) updateData.user_metadata.full_name = userData.full_name;
        if (userData.role) updateData.user_metadata.role = userData.role;
        if (userData.language) updateData.user_metadata.language = userData.language;
      }

      const { error: authError } = await supabase.auth.admin.updateUserById(
        userId,
        updateData
      );

      if (authError) console.warn('Could not update auth metadata:', authError);
    }

    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Delete user (Admin only)
export const deleteUser = async (userId: string) => {
  try {
    // Delete user profile (this will cascade to related records)
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) throw profileError;

    // Delete auth user
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) console.warn('Could not delete auth user:', authError);

    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Get all users with departments (Admin only)
export const getAllUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        departments (
          id,
          name,
          description
        )
      `)
      .order('created_at', { ascending: false });

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get users by role
export const getUsersByRole = async (role: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .order('full_name');

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get users by department
export const getUsersByDepartment = async (departmentId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_departments!inner (
          role,
          assigned_at
        )
      `)
      .eq('user_departments.department_id', departmentId)
      .order('full_name');

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Assign user to department
export const assignUserToDepartment = async (
  userId: string, 
  departmentId: string, 
  role: string = 'member'
) => {
  try {
    const { error } = await supabase
      .from('user_departments')
      .upsert({
        user_id: userId,
        department_id: departmentId,
        role: role
      });

    return { error };
  } catch (error) {
    return { error };
  }
};

// Remove user from department
export const removeUserFromDepartment = async (userId: string, departmentId: string) => {
  try {
    const { error } = await supabase
      .from('user_departments')
      .delete()
      .eq('user_id', userId)
      .eq('department_id', departmentId);

    return { error };
  } catch (error) {
    return { error };
  }
};

// Get user's departments
export const getUserDepartments = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_departments')
      .select(`
        *,
        departments (
          id,
          name,
          description
        )
      `)
      .eq('user_id', userId);

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Toggle user status (activate/deactivate)
export const toggleUserStatus = async (userId: string, isActive: boolean) => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_confirmed: isActive })
      .eq('id', userId);

    return { error };
  } catch (error) {
    return { error };
  }
};

// Search users
export const searchUsers = async (searchTerm: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        departments (
          name
        )
      `)
      .or(`full_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('full_name');

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

// Get user statistics
export const getUserStatistics = async () => {
  try {
    const { data: totalUsers, error: totalError } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    const { data: activeUsers, error: activeError } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .eq('is_confirmed', true);

    const { data: newUsersThisMonth, error: newError } = await supabase
      .from('users')
      .select('id', { count: 'exact' })
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    const { data: usersByRole, error: roleError } = await supabase
      .from('users')
      .select('role')
      .order('role');

    if (totalError || activeError || newError || roleError) {
      throw new Error('Failed to fetch statistics');
    }

    // Count users by role
    const roleCounts = usersByRole?.reduce((acc: any, user: any) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {}) || {};

    return {
      data: {
        total: totalUsers?.length || 0,
        active: activeUsers?.length || 0,
        newThisMonth: newUsersThisMonth?.length || 0,
        byRole: roleCounts
      },
      error: null
    };
  } catch (error) {
    return { data: null, error };
  }
};