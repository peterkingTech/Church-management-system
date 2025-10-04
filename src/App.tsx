import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/ui/ErrorBoundary';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateChurchAccount from './pages/CreateChurchAccount';
import Dashboard from './pages/Dashboard';
import { User } from 'lucide-react';
import './i18n';

// Check if Supabase is properly configured
const isSupabaseConfigured = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const hasUrl = supabaseUrl && supabaseUrl !== 'https://placeholder.supabase.co' && supabaseUrl.includes('supabase.co');
  const hasKey = supabaseAnonKey && supabaseAnonKey !== 'placeholder-key';
  return !!(hasUrl && hasKey);
};

function AuthRoutes() {
  const { user, userProfile, loading } = useAuth();

  // Simplified loading state with shorter timeout
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading Church Management System...</p>
          <p className="text-sm text-gray-500 mt-2">Initializing application...</p>
        </div>
      </div>
    );
  }

  // Show configuration error if Supabase is not set up
  if (!isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold text-red-600 mb-4">Configuration Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Please configure your Supabase credentials in the .env file:
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-left text-sm">
            <code>
              VITE_SUPABASE_URL=https://your-project.supabase.co<br/>
              VITE_SUPABASE_ANON_KEY=your_anon_key
            </code>
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p className="text-blue-800 dark:text-blue-200 text-sm">
              <strong>Quick Fix:</strong> Click "Connect to Supabase" in the top right corner to set up your database connection.
            </p>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // If user is signed in but no profile, show profile setup
  if (user && !userProfile && !loading && isSupabaseConfigured()) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile Setup Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">Your account needs a profile to continue.</p>
          <button 
            onClick={() => {
              // Force navigation to dashboard which will handle profile creation
              window.location.href = '/dashboard';
            }} 
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Continue to Dashboard
          </button>
          <p className="text-xs text-gray-500 mt-4">
            If this continues, please contact your church administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user && userProfile ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user && userProfile ? <Navigate to="/dashboard" replace /> : <Register />} 
        />
        <Route 
          path="/create-church" 
          element={user && userProfile ? <Navigate to="/dashboard" replace /> : <CreateChurchAccount />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AuthRoutes />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;