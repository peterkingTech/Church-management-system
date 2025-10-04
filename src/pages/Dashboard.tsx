import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Heart, 
  Bell, 
  UserCheck, 
  CheckSquare, 
  UserPlus, 
  TrendingUp,
  LogOut,
  Church,
  Crown,
  Award,
  Target,
  GraduationCap,
  Sparkles,
  MessageSquare,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import LanguageSelector from '../components/LanguageSelector';
import ThemeToggle from '../components/ThemeToggle';
import PWAInstallPrompt from '../components/PWAInstallPrompt';

// Import role-specific components
import PastorDashboard from '../components/dashboards/PastorDashboard';
import WorkerDashboard from '../components/dashboards/WorkerDashboard';
import MemberDashboard from '../components/dashboards/MemberDashboard';
import NewcomerDashboard from '../components/dashboards/NewcomerDashboard'; // Keep this, it exists

// Import feature components
import ManageUsers from '../components/ManageUsers';
import UserPromotions from '../components/UserPromotions';
import ChurchSettings from '../components/ChurchSettings';
import FinanceDashboard from '../components/FinanceDashboard';
import Departments from '../components/Departments';
import FollowUps from '../components/FollowUps';
import Reports from '../components/Reports'; // Corrected import name
import Analytics from '../components/Analytics'; // This component exists
import RegistrationLinks from '../components/RegistrationLinks'; // This component exists
import Events from '../components/Events';
import Prayers from '../components/Prayers';
import Announcements from '../components/Announcements';
import Attendance from '../components/Attendance';
import Notifications from '../components/Notifications';
import MyProfile from '../components/MyProfile';
import Notes from '../components/Notes';
import Settings from '../components/Settings';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, userProfile, church, signOut } = useAuth();
  const [activeItem, setActiveItem] = useState('dashboard');

  const userRole = userProfile?.role || 'newcomer';
  const userName = userProfile?.full_name || 'User';
  const churchName = church?.name || 'Church';

  // Redirect if not logged in
  if (!user || !userProfile) {
    return <Navigate to="/login" replace />;
  }

  const renderMainContent = () => {
    switch (activeItem) {
      // Dashboard Views (Role-specific)
      case 'dashboard':
        switch (userRole) {
          case 'pastor':
          case 'admin':
            return <PastorDashboard />;
          case 'worker':
            return <WorkerDashboard />;
          case 'member':
            return <MemberDashboard />;
          case 'newcomer':
            return <NewcomerDashboard />;
          default:
            return <NewcomerDashboard />;
        }
      
      // Pastor/Admin Only Features
      case 'manage-users':
        return <ManageUsers />;
      case 'registration-links':
        return <RegistrationLinks />;
      case 'user-promotions':
        return <UserPromotions />;
      case 'church-settings':
        return <ChurchSettings />;
      case 'finance-dashboard':
        return <FinanceDashboard />;
      case 'analytics':
        return <Analytics />;
      case 'registration-links':
        return <RegistrationLinks />;
      
      // Worker Features
      case 'follow-ups':
        return <FollowUps />;
      
      // Member Features
      
      // Newcomer Features
      // The following components are not found in src/components and are removed.
      // If you intend to implement them, please create the corresponding files.
      case 'departments': return <Departments />;
      case 'reports': return <Reports />;
      case 'attendance': return <Attendance />;
      
      // Common Features
      case 'events':
        return <Events />;
      case 'prayers':
        return <Prayers />;
      case 'announcements':
        return <Announcements />;
      case 'attendance':
        return <Attendance />;
      case 'notifications':
        return <Notifications />;
      
      // Personal Features
      case 'my-profile':
        return <MyProfile />;
      case 'notes':
        return <Notes />;
      case 'settings':
        return <Settings />;
      
      default:
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeItem.charAt(0).toUpperCase() + activeItem.slice(1).replace('-', ' ')}
            </h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-600 dark:text-gray-300">
                Welcome to {activeItem.charAt(0).toUpperCase() + activeItem.slice(1).replace('-', ' ')}
              </p>
            </div>
          </div>
        );
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'pastor': return 'from-purple-600 to-purple-800';
      case 'admin': return 'from-red-600 to-red-800';
      case 'worker': return 'from-blue-600 to-blue-800';
      case 'member': return 'from-green-600 to-green-800';
      case 'newcomer': return 'from-yellow-600 to-yellow-800';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* Sidebar */}
      <Sidebar 
        activeItem={activeItem} 
        onItemClick={setActiveItem}
        userRole={userRole}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-40">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-xs md:text-sm font-medium text-gray-900 dark:text-white">
                  {churchName.toUpperCase()} - CHURCH MANAGEMENT SYSTEM
                </span>
              </div>
              {/* Role Badge */}
              <div className={`px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getRoleColor(userRole)}`}>
                {userRole === 'pastor' ? '👑 Pastor' : 
                 userRole === 'admin' ? '🛡️ Admin' :
                 userRole === 'worker' ? '⚡ Worker' :
                 userRole === 'member' ? '👥 Member' : '✨ Newcomer'}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <ThemeToggle />
              
              {/* Notifications */}
              <button 
                onClick={() => setActiveItem('notifications')}
                className="relative p-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Info */}
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 bg-gradient-to-r ${getRoleColor(userRole)} rounded-full flex items-center justify-center overflow-hidden`}>
                  {userProfile?.profile_image_url ? (
                    <img 
                      src={userProfile.profile_image_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span className="text-white text-sm font-medium">
                      {userName.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {userName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {getRoleLabel(userRole)}
                  </p>
                </div>
              </div>

              <button
                onClick={signOut}
                className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {renderMainContent()}
        </main>

        {/* Footer */}
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {churchName} - Hierarchical Management System
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Powered by <span className="bg-gradient-to-r from-purple-600 to-yellow-500 bg-clip-text text-transparent font-semibold">AMEN TECH</span> — Matthew 6:33
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}