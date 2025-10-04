import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { User as AppUser, Church } from '../types';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasUrl = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseUrl.includes('supabase.co');
  const hasKey = supabaseAnonKey && supabaseAnonKey !== 'placeholder-key';
  return !!(hasUrl && hasKey);
};

interface AuthContextType {
  user: User | null;
  userProfile: AppUser | null;
  church: Church | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<void>;
  updateUserProfile: (userData: Partial<AppUser>) => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  checkUserExists: (email: string) => Promise<boolean>;
  promoteUser: (userId: string, newRole: AppUser['role']) => Promise<any>;
  assignWorkerToNewcomer: (newcomerId: string, workerId: string) => Promise<any>;
  signUpPastorAndChurch: (userData: any) => Promise<any>;
  signUpWithInvite: (userData: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<AppUser | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);

        if (!isSupabaseConfigured()) {
          console.log('Supabase not configured - using demo mode');
          if (mounted) {
            setLoading(false);
            // Create demo user for development
            setUser({ id: 'demo-user', email: 'demo@example.com' } as User);
            setUserProfile({
              id: 'demo-user',
              church_id: 'demo-church',
              email: 'demo@example.com',
              full_name: 'Demo Pastor',
              role: 'pastor',
              language: 'en',
              is_confirmed: true,
              church_joined_at: new Date().toISOString().split('T')[0],
              permissions: [],
              metadata: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            setChurch({
              id: 'demo-church',
              name: 'AMEN TECH Demo Church',
              theme_colors: {
                primary: '#7C3AED',
                secondary: '#F59E0B',
                accent: '#EF4444'
              },
              default_language: 'en',
              timezone: 'UTC',
              pastor_id: 'demo-user',
              subscription_plan: 'premium',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
          return;
        }

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (session?.user && mounted) {
          setUser(session.user);
          await loadUserProfile(session.user.id);
        } else if (mounted) {
          setLoading(false);
        }

      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes only if Supabase is configured
    let subscription: any = null;
    if (isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return;
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await loadUserProfile(session.user.id);
        } else {
          setUserProfile(null);
          setChurch(null);
          setLoading(false);
        }
      });
      subscription = data.subscription;
    }

    return () => {
      mounted = false;
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    if (!isSupabaseConfigured() || !userId) {
      console.warn('Cannot load user profile: Supabase not configured or no user ID');
      return;
    }

    try {
      setLoading(true);
      
      // Load user profile with church and permissions
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          church:churches(*),
          department:departments(id, name, type, color),
          assigned_worker:users!users_assigned_worker_id_fkey(id, full_name),
          permissions:user_permissions(*)
        `)
        .eq('id', userId)
        .single();

      if (profileError) {
        console.warn('Profile loading error:', profileError);
        
        // Create basic profile if doesn't exist
        if (profileError.code === 'PGRST116') {
          const { data: { user } } = await supabase.auth.getUser();
          const userMetadata = user?.user_metadata || {};
          
          // Check if this is the first user (pastor)
          const { data: existingUsers } = await supabase
            .from('users')
            .select('id')
            .limit(1);

          const isFirstUser = !existingUsers || existingUsers.length === 0;
          const role = isFirstUser ? 'pastor' : 'newcomer';

          // Create church if first user (pastor)
          let churchId = null;
          if (isFirstUser) {
            const { data: newChurch, error: churchError } = await supabase
              .from('churches')
              .insert({
                name: userMetadata.church_name || 'New Church',
                pastor_id: userId,
                theme_colors: {
                  primary: '#7C3AED',
                  secondary: '#F59E0B', 
                  accent: '#EF4444'
                }
              })
              .select()
              .single();

            if (!churchError && newChurch) {
              churchId = newChurch.id;
              setChurch(newChurch);
            }
          }

          const { error: createError } = await supabase
            .from('users')
            .insert({
              id: userId,
              church_id: churchId,
              full_name: userMetadata.full_name || user?.email?.split('@')[0] || 'New User',
              email: user?.email || 'user@example.com',
              role: role,
              language: userMetadata.language || 'en',
              is_confirmed: true,
              church_joined_at: new Date().toISOString().split('T')[0],
              permissions: [],
              metadata: {}
            });
          
          if (!createError) {
            // Retry loading the profile
            const { data: newProfile } = await supabase
              .from('users')
              .select(`
                *,
                church:churches(*),
                department:departments(id, name, type, color),
                assigned_worker:users!users_assigned_worker_id_fkey(id, full_name),
                permissions:user_permissions(*)
              `)
              .eq('id', userId)
              .single();
            
            if (newProfile) {
              setUserProfile(newProfile);
              if (newProfile.church) {
                setChurch(newProfile.church);
              }
              setLoading(false);
              return;
            }
          }
        }
        
        // Create fallback profile
        const { data: { user } } = await supabase.auth.getUser();
        setUserProfile({
          id: userId,
          church_id: 'demo-church',
          email: user?.email || 'user@example.com',
          full_name: user?.user_metadata?.full_name || 'User',
          role: 'newcomer',
          language: 'en',
          is_confirmed: true,
          church_joined_at: new Date().toISOString().split('T')[0],
          permissions: [],
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        setLoading(false);
        return;
      }

      if (profile) {
        setUserProfile(profile);
        if (profile.church) {
          setChurch(profile.church);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Authentication error:', error);
        setLoading(false);
        
        let userFriendlyError = error.message;
        if (error.message.includes('Invalid login credentials')) {
          userFriendlyError = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          userFriendlyError = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          userFriendlyError = 'Too many login attempts. Please wait a few minutes before trying again.';
        }
        
        return { data, error: { ...error, message: userFriendlyError } };
      }
      
      // Update last login time
      if (data.user) {
        try {
          await supabase
            .from('users')
            .update({ last_login: new Date().toISOString() })
            .eq('id', data.user.id);
        } catch (updateError) {
          console.warn('Failed to update last login time:', updateError);
        }
      }
      
      return { data, error };
    } catch (error) {
      console.error('Sign in exception:', error);
      setLoading(false);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setUserProfile(null);
      setChurch(null);
      return;
    }

    try {
      await supabase.auth.signOut();
      setUserProfile(null);
      setChurch(null);
    } catch (error) {
      console.error('Sign out error:', error);
      setUser(null);
      setUserProfile(null);
      setChurch(null);
    }
  };

  const updateUserProfile = async (userData: Partial<AppUser>) => {
    if (!user || !isSupabaseConfigured()) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (!error) {
        setUserProfile(prev => prev ? { ...prev, ...userData } : null);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const resetPassword = async (email: string) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const checkUserExists = async (email: string): Promise<boolean> => {
    if (!isSupabaseConfigured()) return false;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase().trim())
        .maybeSingle();

      return !error && !!data;
    } catch (error) {
      return false;
    }
  };

  const promoteUser = async (userId: string, newRole: AppUser['role']) => {
    if (!userProfile || userProfile.role !== 'pastor') {
      return { error: new Error('Only pastors can promote users') };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Create notification for promoted user
      await supabase
        .from('notifications')
        .insert({
          church_id: userProfile.church_id,
          user_id: userId,
          title: 'Role Updated',
          message: `You have been promoted to ${newRole}`,
          type: 'announcement',
          priority: 'high',
          created_by: userProfile.id
        });

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const assignWorkerToNewcomer = async (newcomerId: string, workerId: string) => {
    if (!userProfile || !['pastor', 'admin'].includes(userProfile.role)) {
      return { error: new Error('Only pastors and admins can assign workers') };
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          assigned_worker_id: workerId,
          updated_at: new Date().toISOString()
        })
        .eq('id', newcomerId);

      if (error) throw error;

      // Create notifications for both users
      await supabase
        .from('notifications')
        .insert([
          {
            church_id: userProfile.church_id,
            user_id: workerId,
            title: 'New Newcomer Assigned',
            message: 'You have been assigned a new newcomer for follow-up',
            type: 'task',
            priority: 'high',
            created_by: userProfile.id
          },
          {
            church_id: userProfile.church_id,
            user_id: newcomerId,
            title: 'Welcome to the Family',
            message: 'A worker has been assigned to help you get connected',
            type: 'announcement',
            priority: 'normal',
            created_by: userProfile.id
          }
        ]);

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const signUpPastorAndChurch = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    church_name: string;
    language: string;
    phone?: string;
    date_of_birth?: string;
  }) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    try {
      // First create the church record
      const { data: churchData, error: churchError } = await supabase
        .from('churches')
        .insert({
          name: userData.church_name,
          theme_colors: {
            primary: '#7C3AED',
            secondary: '#F59E0B',
            accent: '#EF4444'
          },
          default_language: userData.language,
          timezone: 'UTC',
          subscription_plan: 'premium',
          is_active: true
        })
        .select()
        .single();

      if (churchError) {
        console.error('Church creation error:', churchError);
        return { data: null, error: churchError };
      }

      // Now create the pastor account with the church_id
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            full_name: `${userData.first_name} ${userData.last_name}`,
            role: 'pastor',
            church_id: churchData.id,
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
      
      if (error) {
        // If user creation fails, clean up the church record
        await supabase
          .from('churches')
          .delete()
          .eq('id', churchData.id);
        
        return { data, error };
      }

      // Update the church with the pastor_id
      if (data.user) {
        await supabase
          .from('churches')
          .update({ pastor_id: data.user.id })
          .eq('id', churchData.id);
      }

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  };

  const signUpWithInvite = async (userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    church_id: string;
    role: string;
    language: string;
    phone?: string;
    birthday?: string;
    invite_code: string;
  }) => {
    if (!isSupabaseConfigured()) {
      return { data: null, error: new Error('Supabase not configured') };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            first_name: userData.first_name,
            last_name: userData.last_name,
            full_name: `${userData.first_name} ${userData.last_name}`,
            role: userData.role,
            church_id: userData.church_id,
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
    } catch (error) {
      return { data: null, error };
    }
  };

  const value = {
    user,
    userProfile,
    church,
    loading,
    signIn,
    signOut,
    updateUserProfile,
    resetPassword,
    checkUserExists,
    promoteUser,
    assignWorkerToNewcomer,
    signUpPastorAndChurch,
    signUpWithInvite
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};