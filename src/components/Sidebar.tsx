import React from 'react';
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
  Church,
  Book,
  UserPlus,
  Award,
  Globe,
  Link,
  DollarSign,
  QrCode,
  StickyNote,
  GraduationCap,
  Target,
  MessageSquare,
  Shield,
  Crown,
  Sparkles
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppIcon from './AppIcon';

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  userRole: string;
}

export default function Sidebar({ activeItem, onItemClick, userRole }: SidebarProps) {
  const { t } = useTranslation();

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['pastor', 'admin', 'worker', 'member', 'newcomer'] }
    ];

    // Pastor/Admin Only Features (Root Account)
    const rootItems = [
      { id: 'manage-users', icon: Users, label: 'Manage Users', roles: ['pastor', 'admin'] },
      { id: 'invite-users', icon: Link, label: 'Invite Users', roles: ['pastor', 'admin'] },
      { id: 'user-promotions', icon: Crown, label: 'User Promotions', roles: ['pastor', 'admin'] },
      { id: 'church-settings', icon: Church, label: 'Church Settings', roles: ['pastor'] },
      { id: 'finance-dashboard', icon: DollarSign, label: 'Finance Dashboard', roles: ['pastor', 'admin'] },
      { id: 'analytics', icon: BarChart3, label: 'Analytics & Reports', roles: ['pastor', 'admin'] },
      { id: 'registration-links', icon: QrCode, label: 'Registration Links', roles: ['pastor', 'admin'] }
    ];

    // Worker/Leader Features
    const workerItems = [
      { id: 'departments', icon: Building2, label: 'My Department', roles: ['worker'] },
      { id: 'department-attendance', icon: UserCheck, label: 'Department Attendance', roles: ['worker'] },
      { id: 'follow-ups', icon: Target, label: 'Follow-ups', roles: ['worker'] },
      { id: 'department-reports', icon: FileText, label: 'Department Reports', roles: ['worker'] }
    ];

    // Member Features
    const memberItems = [
      { id: 'discipleship', icon: GraduationCap, label: 'Discipleship Courses', roles: ['member'] },
      { id: 'my-soul-winning', icon: UserPlus, label: 'My Soul Winning', roles: ['member'] },
      { id: 'testimonies', icon: Sparkles, label: 'Testimonies', roles: ['member'] },
      { id: 'counseling', icon: MessageSquare, label: 'Counseling Sessions', roles: ['member'] }
    ];

    // Newcomer Features
    const newcomerItems = [
      { id: 'newcomer-welcome', icon: Heart, label: 'Welcome Center', roles: ['newcomer'] },
      { id: 'devotionals', icon: Book, label: 'Daily Devotionals', roles: ['newcomer'] },
      { id: 'newcomer-forms', icon: FileText, label: 'Registration Forms', roles: ['newcomer'] }
    ];

    // Common Features (All Roles)
    const commonItems = [
      { id: 'events', icon: CalendarDays, label: 'Events & Calendar', roles: ['pastor', 'admin', 'worker', 'member', 'newcomer'] },
      { id: 'prayers', icon: Heart, label: 'Prayer Wall', roles: ['pastor', 'admin', 'worker', 'member', 'newcomer'] },
      { id: 'announcements', icon: Megaphone, label: 'Announcements', roles: ['pastor', 'admin', 'worker', 'member', 'newcomer'] },
      { id: 'attendance', icon: UserCheck, label: 'My Attendance', roles: ['worker', 'member', 'newcomer'] },
      { id: 'notifications', icon: Bell, label: 'Notifications', roles: ['pastor', 'admin', 'worker', 'member', 'newcomer'] }
    ];

    // Personal Features
    const personalItems = [
      { id: 'my-profile', icon: User, label: 'My Profile', roles: ['pastor', 'admin', 'worker', 'member', 'newcomer'] },
      { id: 'notes', icon: StickyNote, label: 'Personal Notes', roles: ['pastor', 'admin', 'worker', 'member'] },
      { id: 'settings', icon: Settings, label: 'Settings', roles: ['pastor', 'admin', 'worker', 'member', 'newcomer'] }
    ];

    return [...baseItems, ...rootItems, ...workerItems, ...memberItems, ...newcomerItems, ...commonItems, ...personalItems]
      .filter(item => item.roles.includes(userRole));
  };

  const menuItems = getMenuItems();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'pastor': return <Crown className="w-4 h-4 text-purple-500" />;
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'worker': return <Award className="w-4 h-4 text-blue-500" />;
      case 'member': return <User className="w-4 h-4 text-green-500" />;
      case 'newcomer': return <Sparkles className="w-4 h-4 text-yellow-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'pastor': return 'Pastor (Root)';
      case 'admin': return 'Administrator';
      case 'worker': return 'Worker/Leader';
      case 'member': return 'Member';
      case 'newcomer': return 'Newcomer';
      default: return 'User';
    }
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-yellow-500 rounded-lg flex items-center justify-center">
            <Church className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold bg-gradient-to-r from-purple-600 to-yellow-500 bg-clip-text text-transparent">
              AMEN TECH
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Church Management</p>
          </div>
        </div>
      </div>

      {/* User Role Badge */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-yellow-50 dark:from-purple-900/20 dark:to-yellow-900/20 rounded-lg p-3">
          {getRoleIcon(userRole)}
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {getRoleLabel(userRole)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {userRole === 'pastor' ? 'Full Access' : 
               userRole === 'admin' ? 'Administrative' :
               userRole === 'worker' ? 'Department Leader' :
               userRole === 'member' ? 'Church Member' : 'Limited Access'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onItemClick(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-purple-600 to-yellow-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            Powered by AMEN TECH
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            Matthew 6:33
          </p>
        </div>
      </div>
    </div>
  );
}