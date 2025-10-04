import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Book, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
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

export default function Login() {
  const { t } = useTranslation();
  const { signIn, user, userProfile, resetPassword, checkUserExists } = useAuth();
  const [showManual, setShowManual] = useState(false);
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showUserManual, setShowUserManual] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [diagnostics, setDiagnostics] = useState<any[]>([]);

  // Redirect if already logged in
  if (user && userProfile) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSupabaseConfigured()) {
      setError('System configuration issue. The app will work in demo mode.');
      // Allow demo login
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // First check if user exists
      const userExists = await checkUserExists(formData.email);
      if (!userExists) {
        setError('No account found with this email address. Please check your email or contact your church administrator.');
        setLoading(false);
        return;
      }
      
      const { data, error: signInError } = await signIn(formData.email, formData.password);
      
      if (signInError) {
        console.error('Sign in error details:', signInError);
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else if (signInError.message.includes('Too many requests')) {
          setError('Too many login attempts. Please wait a few minutes before trying again.');
        } else {
          setError(signInError.message || 'Failed to sign in. Please try again or contact support.');
        }
      } else if (data?.user) {
        console.log('Sign in successful, user:', data.user.email);
        // Let the auth context handle navigation
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail) {
      alert('Please enter your email address');
      return;
    }
    
    try {
      const { error } = await resetPassword(resetEmail);
      if (error) {
        alert('Failed to send reset email: ' + error.message);
      } else {
        alert('Password reset email sent! Check your inbox.');
        setShowPasswordReset(false);
        setResetEmail('');
      }
    } catch (error) {
      alert('Failed to send reset email');
    }
  };

  const runDiagnostics = async () => {
    const results = [];
    
    // Check Supabase configuration
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    results.push({
      test: 'Supabase Configuration',
      status: supabaseUrl && supabaseKey ? 'pass' : 'fail',
      message: supabaseUrl && supabaseKey ? 'Configuration found' : 'Missing environment variables'
    });
    
    // Check network connectivity
    try {
      const response = await fetch('https://httpbin.org/get', { signal: AbortSignal.timeout(3000) });
      results.push({
        test: 'Network Connection',
        status: response.ok ? 'pass' : 'fail',
        message: response.ok ? 'Internet connection active' : 'Network issues detected'
      });
    } catch (error) {
      results.push({
        test: 'Network Connection',
        status: 'fail',
        message: 'No internet connection'
      });
    }
    
    // Check Supabase API
    if (supabaseUrl && supabaseKey) {
      try {
        const response = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Prefer': 'count=exact'
          },
          signal: AbortSignal.timeout(5000)
        });
        results.push({
          test: 'Supabase API',
          status: response.ok ? 'pass' : 'fail',
          message: response.ok ? 'Database accessible' : `API error: ${response.status}`
        });
      } catch (error) {
        results.push({
          test: 'Supabase API',
          status: 'fail',
          message: 'Cannot reach Supabase'
        });
      }
    }
    
    setDiagnostics(results);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 flex items-center space-x-3">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      {/* User Manual Button */}
      <button
        onClick={() => setShowUserManual(true)}
        className="absolute top-4 left-4 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        <Book className="w-4 h-4" />
        <span>{t('menu.user_manual')}</span>
      </button>

      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">
              CHURCH DATA LOG MANAGEMENT SYSTEM
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Sign in to your church account
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
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p>{error}</p>
                    {error.includes('Supabase not configured') && (
                      <button
                        type="button"
                        onClick={() => setShowDiagnostics(true)}
                        className="mt-2 text-sm underline hover:no-underline"
                      >
                        Run Diagnostics
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  required
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  required
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-yellow-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-700 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Need to join our church?{' '}
                <span className="text-purple-600 dark:text-purple-400 font-medium">
                  Contact your pastor for an invitation link
                </span>
              </p>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  Starting a new church?
                </p>
                <Link
                  to="/create-church"
                  className="inline-flex items-center justify-center w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-green-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
                >
                  Sign Up — Create Church Account
                </Link>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  For pastors and church leaders only
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-500 mt-2"
              >
                Forgot your password?
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Powered by AMEN TECH
          </p>
        </div>
      </div>

      {/* User Manual Modal */}
      <UserManualModal 
        isOpen={showUserManual} 
        onClose={() => setShowUserManual(false)} 
      />

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <form onSubmit={handlePasswordReset} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Reset Password
                </h2>
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Reset Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diagnostics Modal */}
      {showDiagnostics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  System Diagnostics
                </h2>
                <button
                  onClick={() => setShowDiagnostics(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={runDiagnostics}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Run Diagnostics</span>
                </button>
                
                {diagnostics.map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className="font-medium text-gray-900 dark:text-white">{result.test}</span>
                    <div className="flex items-center space-x-2">
                      <span className={`text-sm ${result.status === 'pass' ? 'text-green-600' : 'text-red-600'}`}>
                        {result.message}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${result.status === 'pass' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Manual Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  User Manual
                </h2>
                <button
                  onClick={() => setShowManual(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-400 mb-2">
                    Getting Started
                  </h3>
                  <p className="text-blue-800 dark:text-blue-300 text-sm">
                    Learn how to use Church Data Log Management System
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-600 dark:text-purple-400 mb-2">
                      👑 Pastor/Admin
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Full access to all features, manage users, view analytics, export data
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">
                      👷 Worker
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Manage department, assign tasks, mark attendance, submit reports
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">
                      👥 Member
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      View events, submit prayers, mark attendance, access announcements
                    </p>
                  </div>
                  
                  <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">
                      🆕 Newcomer
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Submit forms, view information, connect with leaders
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}