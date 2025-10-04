import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Permission {
  module: string;
  actions: string[];
}

interface UsePermissionsReturn {
  permissions: Permission[];
  hasPermission: (module: string, action?: string) => boolean;
  loading: boolean;
  error: string | null;
}

export function usePermissions(): UsePermissionsReturn {
  const { userProfile } = useAuth();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userProfile?.user_roles?.[0]?.role) {
      loadPermissions();
    }
  }, [userProfile]);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const rolePermissions = userProfile?.user_roles?.[0]?.role?.permissions || {};
      
      // Convert role permissions to Permission array
      const permissionArray: Permission[] = Object.entries(rolePermissions).map(([module, actions]) => ({
        module,
        actions: Array.isArray(actions) ? actions : actions === true ? ['all'] : []
      }));

      setPermissions(permissionArray);
    } catch (err) {
      console.error('Error loading permissions:', err);
      setError('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (module: string, action: string = 'read'): boolean => {
    // Pastor role has all permissions
    if (userProfile?.user_roles?.[0]?.role?.name === 'Pastor') {
      return true;
    }

    // Check if user has specific permission
    const rolePermissions = userProfile?.user_roles?.[0]?.role?.permissions || {};
    
    // Check for module-level permission
    if (rolePermissions[module] === true || rolePermissions.all === true) {
      return true;
    }

    // Check for specific action permission
    if (rolePermissions[module] && typeof rolePermissions[module] === 'object') {
      return rolePermissions[module][action] === true;
    }

    // Check for action-specific permission
    if (rolePermissions[`${module}_${action}`] === true) {
      return true;
    }

    return false;
  };

  return {
    permissions,
    hasPermission,
    loading,
    error
  };
}

// Permission constants for type safety
export const PERMISSIONS = {
  USERS: {
    MODULE: 'users',
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE_ROLES: 'manage_roles'
  },
  ATTENDANCE: {
    MODULE: 'attendance',
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    MARK_OTHERS: 'mark_others'
  },
  TASKS: {
    MODULE: 'tasks',
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    ASSIGN: 'assign'
  },
  EVENTS: {
    MODULE: 'events',
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE: 'manage'
  },
  FINANCES: {
    MODULE: 'finances',
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    APPROVE: 'approve'
  },
  REPORTS: {
    MODULE: 'reports',
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    EXPORT: 'export'
  },
  SETTINGS: {
    MODULE: 'settings',
    READ: 'read',
    UPDATE: 'update',
    CHURCH_SETTINGS: 'church_settings',
    USER_SETTINGS: 'user_settings'
  }
} as const;

// Helper hook for specific permission checks
export function usePermission(module: string, action: string = 'read') {
  const { hasPermission, loading } = usePermissions();
  return {
    allowed: hasPermission(module, action),
    loading
  };
}