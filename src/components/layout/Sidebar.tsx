import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Calendar, 
  CheckSquare, 
  CalendarDays, 
  UserCheck, 
  Megaphone, 
  Heart, 
  FileText, 
  Bell, 
  Settings, 
  User, 
  Download,
  BarChart3,
  DollarSign,
  TrendingUp,
  Shield,
  Palette,
  Globe
} from 'lucide-react';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  isCollapsed?: boolean;
}

interface MenuItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  roles: string[];
  badge?: number;
  color?: string;
}

export default function Sidebar({ activeItem, onItemClick, isCollapsed = false }: SidebarProps) {
  const { t } = useTranslation();
  const { userProfile } = useAuth();

  const userRole = userProfile?.user_roles?.[0]?.role?.name || 'Newcomer';

  // Define menu items with role-based access control
  const menuItems: MenuItem[] = [
    // Core Navigation
    { 
      id: 'dashboard', 
      icon: LayoutDashboard, 
      label: t('navigation.dashboard'), 
      roles: ['Pastor', 'Admin', 'Worker', 'Member', 'Newcomer'],
      color: 'text-blue-600'
    },
    
    // User Management (Pastor/Admin only)
    { 
      id: 'users', 
      icon: Users, 
      label: t('navigation.users'), 
      roles: ['Pastor', 'Admin'],
      color: 'text-purple-600'
    },
    
    // Attendance Management
    { 
      id: 'attendance', 
      icon: UserCheck, 
      label: t('navigation.attendance'), 
      roles: ['Pastor', 'Admin', 'Worker', 'Member'],
      color: 'text-green-600'
    },
    
    // Task Management
    { 
      id: 'tasks', 
      icon: CheckSquare, 
      label: t('navigation.tasks'), 
      roles: ['Pastor', 'Admin', 'Worker', 'Member'],
      color: 'text-orange-600'
    },
    
    // Events & Calendar
    { 
      id: 'events', 
      icon: CalendarDays, 
      label: t('navigation.events'), 
      roles: ['Pastor', 'Admin', 'Worker', 'Member', 'Newcomer'],
      color: 'text-indigo-600'
    },
    { 
      id: 'calendar', 
      icon: Calendar, 
      label: t('navigation.calendar'), 
      roles: ['Pastor', 'Admin', 'Worker', 'Member'],
      color: 'text-blue-500'
    },
    
    // Communication
    { 
      id: 'prayers', 
      icon: Heart, 
      label: t('navigation.prayers'), 
      roles: ['Pastor', 'Admin', 'Worker', 'Member', 'Newcomer'],
      color: 'text-pink-600'
    },
    { 
      id: 'announcements', 
      icon: Megaphone, 
      label: t('navigation.announcements'), 
      roles: ['Pastor', 'Admin', 'Worker', 'Member', 'Newcomer'],
      color: 'text-red-600'
    },
    { 
      id: 'notifications', 
      icon: Bell, 
      label: t('navigation.notifications'), 
      roles: ['Pastor', 'Admin', 'Worker', 'Member', 'Newcomer'],
      color: 'text-yellow-600'
    },
    
    // Organization
    { 
      id: 'departments', 
      icon: Building2, 
      label: t('navigation.departments'), 
      roles: ['Pastor', 'Admin', 'Worker', 'Member'],
      color: 'text-gray-600'
    },
    
    // Financial Management (Pastor/Admin/Treasurer only)
    { 
      id: 'finances', 
      icon: DollarSign, 
      label: t('navigation.finances'), 
      roles: ['Pastor', 'Admin', 'Treasurer'],
      color: 'text-emerald-600'
    },
    
    // Reports & Analytics
    { 
      id: 'reports', 
      icon: FileText, 
      label: t('navigation.reports'), 
      roles: ['Pastor', 'Admin', 'Worker'],
      color: 'text-slate-600'
    },
    { 
      id: 'analytics', 
      icon: BarChart3, 
      label: t('navigation.analytics'), 
      roles: ['Pastor', 'Admin'],
      color: 'text-cyan-600'
    },
    
    // Settings & Profile
    { 
      id: 'settings', 
      icon: Settings, 
      label: t('navigation.settings'), 
      roles: ['Pastor', 'Admin', 'Worker', 'Member', 'Newcomer'],
      color: 'text-gray-500'
    },
    { 
      id: 'profile', 
      icon: User, 
      label: t('navigation.profile'), 
      roles: ['Pastor', 'Admin', 'Worker', 'Member', 'Newcomer'],
      color: 'text-blue-500'
    }
  ];

  // Filter menu items based on user role
  const visibleMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole) || item.roles.includes('all')
  );

  // Group menu items by category
  const menuGroups = [
    {
      title: 'Main',
      items: visibleMenuItems.filter(item => 
        ['dashboard', 'attendance', 'tasks', 'events', 'calendar'].includes(item.id)
      )
    },
    {
      title: 'Communication',
      items: visibleMenuItems.filter(item => 
        ['prayers', 'announcements', 'notifications'].includes(item.id)
      )
    },
    {
      title: 'Management',
      items: visibleMenuItems.filter(item => 
        ['users', 'departments', 'finances', 'reports', 'analytics'].includes(item.id)
      )
    },
    {
      title: 'Personal',
      items: visibleMenuItems.filter(item => 
        ['settings', 'profile'].includes(item.id)
      )
    }
  ];

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const isActive = activeItem === item.id;
    
    return (
      <li key={item.id}>
        <button
          onClick={() => onItemClick(item.id)}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
            isActive
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white hover:scale-102'
          }`}
          title={isCollapsed ? item.label : undefined}
        >
          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color} transition-colors`} />
          {!isCollapsed && (
            <>
              <span className="text-sm font-medium flex-1">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <span className={`px-2 py-1 text-xs rounded-full ${
                  isActive 
                    ? 'bg-white bg-opacity-20 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </>
          )}
        </button>
      </li>
    );
  };

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col transition-all duration-300`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          {!isCollapsed && (
            <div>
              <h2 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {userProfile?.church?.name || 'Church Management'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('app.tagline')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* User Info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
              {userProfile?.profile_photo_url ? (
                <img 
                  src={userProfile.profile_photo_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {userProfile?.full_name?.charAt(0) || 'U'}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {userProfile?.full_name || 'User'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {userProfile?.user_roles?.[0]?.role?.display_name || 'Member'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {isCollapsed ? (
          <ul className="space-y-2">
            {visibleMenuItems.map(renderMenuItem)}
          </ul>
        ) : (
          <div className="space-y-6">
            {menuGroups.map((group, index) => (
              group.items.length > 0 && (
                <div key={index}>
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                    {group.title}
                  </h3>
                  <ul className="space-y-1">
                    {group.items.map(renderMenuItem)}
                  </ul>
                </div>
              )
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('app.footer')}
            </p>
            <div className="flex items-center justify-center space-x-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 dark:text-green-400">
                Online
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}