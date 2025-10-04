import React, { useState, useRef } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { 
  Church, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Upload, 
  Camera, 
  Building2, 
  Book,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import UserManualModal from '../components/UserManualModal';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasUrl = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseUrl.includes('supabase.co');
  const hasKey = supabaseAnonKey && supabaseAnonKey !== 'placeholder-key';
  return !!(hasUrl && hasKey);
};

export default function CreateChurchAccount() {
  const { t } = useTranslation();
  const { user, userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showUserManual, setShowUserManual] = useState(false);
  const [formData, setFormData] = useState({
    churchName: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    churchLogo: null as File | null,
    termsAccepted: false,
    privacyAccepted: false,
    captchaAnswer: '',
    preferredLanguage: 'en'
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [captchaQuestion, setCaptchaQuestion] = useState({ question: '', answer: 0 });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Redirect if already logged in
  if (user && userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  // Generate simple math CAPTCHA
  React.useEffect(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion({
      question: `${num1} + ${num2} = ?`,
      answer: num1 + num2
    });
  }, []);

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleCheckboxChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.checked }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, churchLogo: 'Logo size must be less than 5MB' }));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, churchLogo: 'Please select a valid image file' }));
        return;
      }

      setFormData(prev => ({ ...prev, churchLogo: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      if (errors.churchLogo) {
        setErrors(prev => ({ ...prev, churchLogo: '' }));
      }
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Church name validation
    if (!formData.churchName.trim()) {
      newErrors.churchName = 'Church name is required';
    } else if (formData.churchName.trim().length < 3) {
      newErrors.churchName = 'Church name must be at least 3 characters';
    }

    // First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'First name must be at least 2 characters';
    }

    // Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Last name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, number, and special character';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Phone validation (optional but if provided, must be valid)
    if (formData.phone && !/^\+?[\d\s\-\(\)]{10,}$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    // Terms and privacy validation
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the Terms of Service';
    }

    if (!formData.privacyAccepted) {
      newErrors.privacyAccepted = 'You must accept the Privacy Policy';
    }

    // CAPTCHA validation
    if (!formData.captchaAnswer) {
      newErrors.captchaAnswer = 'Please solve the math problem';
    } else if (parseInt(formData.captchaAnswer) !== captchaQuestion.answer) {
      newErrors.captchaAnswer = 'Incorrect answer, please try again';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      // Check Supabase configuration first
      if (!isSupabaseConfigured()) {
        setErrors({ general: 'System configuration error. Please contact support.' });
        setLoading(false);
        return;
      }

      // Create church and pastor account using the auth context
      const { data, error } = await signUpPastorAndChurch({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        church_name: formData.churchName.trim(),
        language: formData.preferredLanguage,
        phone: formData.phone || null,
        date_of_birth: formData.dateOfBirth || null
      });

      if (error) {
        console.error('Registration error:', error);
        
        // Provide specific error messages based on error type
        if (error.message.includes('already registered')) {
          setErrors({ email: 'This email is already registered. Please try signing in or use a different email.' });
        } else if (error.message.includes('invalid email')) {
          setErrors({ email: 'Please enter a valid email address.' });
        } else if (error.message.includes('weak password')) {
          setErrors({ password: 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, number, and special character.' });
        } else if (error.message.includes('rate limit')) {
          setErrors({ general: 'Too many registration attempts. Please wait a few minutes before trying again.' });
        } else {
          setErrors({ general: error.message || 'Registration failed. Please check your information and try again.' });
        }
        setLoading(false);
        return;
      }

      if (data.user) {
        // Upload church logo if provided
        if (formData.churchLogo) {
          try {
            const fileExt = formData.churchLogo.name.split('.').pop();
            const fileName = `church-logo-${data.user.id}-${Date.now()}.${fileExt}`;
            const filePath = `church-logos/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(filePath, formData.churchLogo);

            if (!uploadError) {
              const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

              // Update church logo URL
              const churchId = data.user.user_metadata?.church_id;
              if (churchId) {
                await supabase
                  .from('churches')
                  .update({ logo_url: publicUrl })
                  .eq('id', churchId);
              }
              console.log('Church logo uploaded:', publicUrl);
            }
          } catch (uploadErr) {
            console.warn('Church logo upload failed, continuing without logo:', uploadErr);
          }
        }
        
        setRegistrationSuccess(true);
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

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Church Account Created! 🎉
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Welcome to the AMEN TECH Church Management System! Your church account for <strong>{formData.churchName}</strong> has been successfully created.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
              <p className="text-blue-900 dark:text-blue-400 font-medium mb-2">
                Next Steps:
              </p>
              <ul className="text-blue-800 dark:text-blue-300 text-sm text-left space-y-1">
                <li>• Check your email for verification link</li>
                <li>• Sign in with your credentials</li>
                <li>• Set up your church settings</li>
                <li>• Create invitation links for members</li>
              </ul>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 transition-all duration-200"
            >
              Continue to Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-green-900 flex items-center justify-center p-4">
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

      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full mb-4">
              <Church className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
              CREATE CHURCH ACCOUNT
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Start your church's digital journey with AMEN TECH
            </p>

            {/* AMEN TECH Branding */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <span className="text-xl font-bold text-white">AMEN TECH</span>
              </div>
              <p className="text-green-100 text-sm italic">
                "Building systems that serves God's kingdom"
              </p>
              <p className="text-green-200 text-xs mt-1">Matthew 6:33</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <p>{errors.general}</p>
                </div>
              </div>
            )}

            {/* Church Information Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-4">
                Church Information
              </h3>
              
              {/* Church Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Church Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Enter your church name"
                    value={formData.churchName}
                    onChange={handleInputChange('churchName')}
                    required
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.churchName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {errors.churchName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.churchName}</p>}
              </div>

              {/* Church Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Church Logo (Optional)
                </label>
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Church Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Upload Logo</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
                {errors.churchLogo && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.churchLogo}</p>}
              </div>
            </div>

            {/* Pastor Information Section */}
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-400 mb-4">
                Pastor Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="First name"
                      value={formData.firstName}
                      onChange={handleInputChange('firstName')}
                      required
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                        errors.firstName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  {errors.firstName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.firstName}</p>}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleInputChange('lastName')}
                      required
                      className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                        errors.lastName ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  {errors.lastName && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.lastName}</p>}
                </div>
              </div>

              {/* Email */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="pastor@yourchurch.com"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    required
                    className={`w-full pl-10 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.email ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={handleInputChange('password')}
                      required
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
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
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
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
            </div>

            {/* Optional Information Section */}
            <div className="bg-gray-50 dark:bg-gray-700/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Additional Information (Optional)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.phone ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.phone && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange('dateOfBirth')}
                    className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Language Selection */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred Language
                </label>
                <select
                  value={formData.preferredLanguage}
                  onChange={handleInputChange('preferredLanguage')}
                  className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="en">🇺🇸 English</option>
                  <option value="de">🇩🇪 Deutsch</option>
                  <option value="fr">🇫🇷 Français</option>
                  <option value="es">🇪🇸 Español</option>
                  <option value="pt">🇵🇹 Português</option>
                </select>
              </div>
            </div>

            {/* CAPTCHA Section */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-400 mb-4">
                Security Verification
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Please solve: {captchaQuestion.question} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter your answer"
                  value={formData.captchaAnswer}
                  onChange={handleInputChange('captchaAnswer')}
                  required
                  className={`w-full px-3 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 ${
                    errors.captchaAnswer ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.captchaAnswer && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.captchaAnswer}</p>}
              </div>
            </div>

            {/* Terms and Privacy Section */}
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={formData.termsAccepted}
                  onChange={handleCheckboxChange('termsAccepted')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 dark:text-gray-300">
                  I accept the <a href="#" className="text-green-600 hover:text-green-500 underline">Terms of Service</a> <span className="text-red-500">*</span>
                </label>
              </div>
              {errors.termsAccepted && <p className="text-sm text-red-600 dark:text-red-400">{errors.termsAccepted}</p>}

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="privacy"
                  checked={formData.privacyAccepted}
                  onChange={handleCheckboxChange('privacyAccepted')}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 dark:border-gray-600 rounded mt-1"
                />
                <label htmlFor="privacy" className="text-sm text-gray-700 dark:text-gray-300">
                  I accept the <a href="#" className="text-green-600 hover:text-green-500 underline">Privacy Policy</a> <span className="text-red-500">*</span>
                </label>
              </div>
              {errors.privacyAccepted && <p className="text-sm text-red-600 dark:text-red-400">{errors.privacyAccepted}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Church Account...
                </div>
              ) : (
                'Create Church Account'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="text-green-600 dark:text-green-400 hover:text-green-500 font-medium"
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