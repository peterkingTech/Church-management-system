import React, { useState, useRef, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Globe, Upload, Camera, Building2, Book } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import UserManualModal from '../components/UserManualModal';
import { useSearchParams } from 'react-router-dom';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasUrl = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseUrl.includes('supabase.co');
  const hasKey = supabaseAnonKey && supabaseAnonKey !== 'placeholder-key';
  return !!(hasUrl && hasKey);
};

export default function Register() {
  const { t, i18n } = useTranslation();
  const { user, userProfile } = useAuth();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUserManual, setShowUserManual] = useState(false);
  const [inviteData, setInviteData] = useState<any>(null);
  const [validatingInvite, setValidatingInvite] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'newcomer',
    phone: '',
    birthday: '',
    preferredLanguage: i18n.language,
    profileImage: null as File | null
  });
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redirect if already logged in
  if (user && userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  // Validate invite code on component mount
  useEffect(() => {
    if (inviteCode) {
      validateInviteCode(inviteCode);
    }
  }, [inviteCode]);

  const validateInviteCode = async (code: string) => {
    try {
      setValidatingInvite(true);
      
      const { data, error } = await supabase
        .from('invite_links')
        .select(`
          *,
          church:churches(name),
          department:departments(name)
        `)
        .eq('code', code)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        setErrors({ general: 'Invalid or expired invitation code' });
        return;
      }

      setInviteData(data);
      setFormData(prev => ({ ...prev, role: data.role }));
      
    } catch (error) {
      setErrors({ general: 'Failed to validate invitation code' });
    } finally {
      setValidatingInvite(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, profileImage: 'Image size must be less than 5MB' }));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, profileImage: 'Please select a valid image file' }));
        return;
      }

      setFormData(prev => ({ ...prev, profileImage: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfileImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      if (errors.profileImage) {
        setErrors(prev => ({ ...prev, profileImage: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if registration is allowed
  if (!inviteCode) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      // Verify invite is still valid
      if (!inviteData) {
        setErrors({ general: 'Invalid invitation. Please use a valid invite link.' });
        return;
      }

      // Check Supabase configuration first
      if (!isSupabaseConfigured()) {
        setErrors({ general: 'System configuration error. Please contact your church administrator.' });
        setLoading(false);
        return;
      }

      // Create auth user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: inviteData.role,
            language: formData.preferredLanguage,
            phone: formData.phone,
            invite_code: inviteCode
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        
        // Provide specific error messages based on error type
        if (error.message.includes('already registered')) {
          setErrors({ email: 'This email is already registered. Please try signing in or use a different email.' });
        } else if (error.message.includes('invalid email')) {
          setErrors({ email: 'Please enter a valid email address.' });
        } else if (error.message.includes('weak password')) {
          setErrors({ password: 'Password is too weak. Please use at least 6 characters with a mix of letters and numbers.' });
        } else if (error.message.includes('rate limit')) {
          setErrors({ general: 'Too many registration attempts. Please wait a few minutes before trying again.' });
        } else {
          setErrors({ general: error.message || 'Registration failed. Please check your information and try again.' });
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Create user profile in the database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            church_id: inviteData.church_id,
            full_name: formData.fullName.trim(),
            email: formData.email.toLowerCase().trim(),
            role: inviteData.role,
            phone: formData.phone || null,
            birthday: formData.birthday || null,
            language: formData.preferredLanguage,
            invited_by: inviteData.created_by,
            department_id: inviteData.department_id,
            is_confirmed: true,
            created_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Clean up auth user if profile creation fails
          await supabase.auth.admin.deleteUser(data.user.id);
          setErrors({ general: 'Failed to create user profile. Please try again.' });
          setLoading(false);
          return;
        }

        // Update invite link usage
        await supabase
          .from('invite_links')
          .update({ 
            current_uses: inviteData.current_uses + 1 
          })
          .eq('id', inviteData.id);

        try {
          let profileImageUrl = '';
          
          // Upload profile image if provided
          if (formData.profileImage) {
            try {
              const fileExt = formData.profileImage.name.split('.').pop();
              const fileName = `${data.user.id}-${Date.now()}.${fileExt}`;
              const filePath = `${inviteData.church_id}/avatars/${fileName}`;

              const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, formData.profileImage);

              if (!uploadError && uploadData) {
                const { data: { publicUrl } } = supabase.storage
                  .from('avatars')
                  .getPublicUrl(filePath);
                profileImageUrl = publicUrl;
              }
            } catch (uploadErr) {
              console.warn('Profile image upload failed, continuing without image:', uploadErr);
              // Don't fail registration for image upload issues
            }
          }
          
          // Update profile image if uploaded
          if (profileImageUrl) {
            await supabase
              .from('users')
              .update({ profile_image_url: profileImageUrl })
              .eq('id', data.user.id);
          }
          
          // Success message with next steps
          alert(`Registration successful! 🎉\n\nWelcome to the church family, ${formData.fullName}!\n\nYou can now sign in with:\nEmail: ${formData.email}\nPassword: [your password]\n\nClick OK to go to the login page.`);
          
          // Redirect to login page
          window.location.href = '/login';
          
        } catch (profileCreationError) {
          console.error('Profile creation exception:', profileCreationError);
          setErrors({ general: 'Registration failed during profile setup. Please try again.' });
          setLoading(false);
        }
      }
    } catch (err) {
      console.error('Registration exception:', err);
      
      // Handle different types of exceptions
      if (err instanceof TypeError) {
        setErrors({ general: 'Network error. Please check your internet connection and try again.' });
      } else if (err.message?.includes('fetch')) {
        setErrors({ general: 'Unable to connect to the server. Please check your internet connection.' });
      } else {
        setErrors({ general: 'An unexpected error occurred. Please try again or contact support.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center p-4">
      {/* User Manual Button */}
      <button
        onClick={() => setShowUserManual(true)}
        className="absolute top-4 left-4 flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
      >
        <Book className="w-4 h-4" />
        <span>{t('menu.user_manual')}</span>
      </button>

      {/* Language and Theme Controls */}
      <div className="absolute top-4 right-4 flex items-center space-x-3">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      {/* Invitation Info */}
      {inviteData && (
        <div className="max-w-2xl w-full mb-6">
          <div className="bg-gradient-to-r from-purple-50 to-yellow-50 dark:from-purple-900/20 dark:to-yellow-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <h3 className="font-semibold text-purple-900 dark:text-purple-400 mb-2">
              You're Invited to Join {inviteData.church?.name}!
            </h3>
            <p className="text-purple-700 dark:text-purple-200 text-sm">
              Role: <span className="font-medium capitalize">{inviteData.role}</span>
              {inviteData.department && ` • Department: ${inviteData.department.name}`}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
              CHURCH DATA LOG MANAGEMENT SYSTEM
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Complete Your Registration
            </p>

            {/* AMEN TECH Branding */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-xl font-bold text-white">AMEN TECH</span>
              </div>
              <p className="text-blue-100 text-sm italic">
                "Building systems that serves God's kingdom"
              </p>
              <p className="text-blue-200 text-xs mt-1">Matthew 6:33</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                {errors.general}
              </div>
            )}

            {/* Profile Picture Upload */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Profile Picture (Optional)
              </p>
              {errors.profileImage && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.profileImage}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleInputChange('fullName')}
                    required
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.fullName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {errors.fullName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.fullName}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="john.doe@example.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    required
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>
            </div>

            {/* Role Display (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assigned Role
              </label>
              <div className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <span className="text-gray-900 dark:text-white font-medium capitalize">
                  {inviteData?.role || 'Newcomer'}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {inviteData?.role === 'worker' ? 'Department leader with management privileges' :
                   inviteData?.role === 'member' ? 'Full church member with participation access' :
                   'New visitor with limited access until promoted'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Birthday */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Birthday (Optional)
                </label>
                <input
                  type="date"
                  value={formData.birthday}
                  onChange={handleInputChange('birthday')}
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Language Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('auth.preferred_language')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Globe className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={formData.preferredLanguage}
                    onChange={handleInputChange('preferredLanguage')}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="en">🇺🇸 English</option>
                    <option value="de">🇩🇪 Deutsch</option>
                    <option value="fr">🇫🇷 Français</option>
                    <option value="es">🇪🇸 Español</option>
                    <option value="pt">🇵🇹 Português</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={handleInputChange('phone')}
                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter phone number"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    required
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.password ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange('confirmPassword')}
                    required
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-yellow-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Joining Church...
                </div>
              ) : (
                'Complete Registration'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-500 font-medium"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* User Manual Modal */}
        <UserManualModal 
          isOpen={showUserManual} 
          onClose={() => setShowUserManual(false)} 
        />

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Powered by AMEN TECH
          </p>
        </div>
      </div>
    </div>
  );
}