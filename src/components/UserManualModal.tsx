import React, { useState } from 'react';
import { X, Book, Users, Shield, Calendar, CheckSquare, Heart, Bell, BarChart3, Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UserManualModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserManualModal({ isOpen, onClose }: UserManualModalProps) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('getting_started');

  if (!isOpen) return null;

  const sections = [
    {
      id: 'getting_started',
      title: t('manual.getting_started'),
      icon: Book,
      content: [
        'Welcome to Church Data Log Management System',
        'Select your role during registration (Pastor, Admin, Worker, Member, User)',
        'Complete your profile with photo and language preference',
        'Explore features based on your assigned role'
      ]
    },
    {
      id: 'pastor_guide',
      title: t('manual.pastor_guide'),
      icon: Shield,
      content: [
        'Full system access and administration',
        'User management and role assignment',
        'Church settings and customization',
        'Financial oversight and reporting',
        'Analytics and audit trail access',
        'QR code generation for registration'
      ]
    },
    {
      id: 'admin_guide',
      title: t('manual.admin_guide'),
      icon: Users,
      content: [
        'User management and content creation',
        'Department oversight and coordination',
        'Event creation and management',
        'Report generation and analytics',
        'Announcement management',
        'System configuration assistance'
      ]
    },
    {
      id: 'worker_guide',
      title: t('manual.worker_guide'),
      icon: CheckSquare,
      content: [
        'Department-specific administration',
        'Task assignment and tracking',
        'Attendance marking for department',
        'Event coordination and management',
        'Report submission and file uploads',
        'Member communication and support'
      ]
    },
    {
      id: 'member_guide',
      title: t('manual.member_guide'),
      icon: Calendar,
      content: [
        'Event viewing and RSVP',
        'Prayer request submission',
        'Personal attendance tracking',
        'Announcement viewing',
        'Community interaction',
        'Profile management'
      ]
    },
    {
      id: 'user_guide',
      title: t('manual.user_guide'),
      icon: Heart,
      content: [
        'Basic church information access',
        'Public announcement viewing',
        'Prayer wall participation',
        'Event information viewing',
        'Contact information for leaders',
        'Limited system interaction'
      ]
    }
  ];

  const features = [
    {
      title: 'Dashboard Overview',
      icon: BarChart3,
      description: 'Real-time church metrics and quick actions'
    },
    {
      title: 'User Management',
      icon: Users,
      description: 'Complete member lifecycle management'
    },
    {
      title: 'Event System',
      icon: Calendar,
      description: 'Event creation, registration, and attendance'
    },
    {
      title: 'Task Management',
      icon: CheckSquare,
      description: 'Assignment and tracking of church tasks'
    },
    {
      title: 'Prayer Wall',
      icon: Heart,
      description: 'Community prayer requests and support'
    },
    {
      title: 'Announcements',
      icon: Bell,
      description: 'Church-wide communication system'
    },
    {
      title: 'Settings',
      icon: Settings,
      description: 'Church customization and preferences'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center space-x-3">
            <Book className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('manual.title')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {t('manual.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* Sidebar */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-600 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Role Guides
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeSection === section.id
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  );
                })}
              </nav>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 mt-8">
                {t('manual.features')}
              </h3>
              <div className="space-y-3">
                {features.map((feature, index) => {
                  const Icon = feature.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3 p-2">
                      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {feature.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {sections.map((section) => {
                if (section.id !== activeSection) return null;
                
                const Icon = section.icon;
                return (
                  <div key={section.id}>
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                          {section.title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300">
                          {section.id === 'pastor_guide' && t('manual.pastor_features')}
                          {section.id === 'admin_guide' && t('manual.admin_features')}
                          {section.id === 'worker_guide' && t('manual.worker_features')}
                          {section.id === 'member_guide' && t('manual.member_features')}
                          {section.id === 'user_guide' && t('manual.user_features')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {section.content.map((item, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <p className="text-gray-700 dark:text-gray-300">{item}</p>
                        </div>
                      ))}
                    </div>

                    {section.id === 'getting_started' && (
                      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-400 mb-4">
                          Quick Start Tips
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                              For New Users
                            </h5>
                            <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                              <li>• Complete your profile setup</li>
                              <li>• Set your language preference</li>
                              <li>• Explore your role-specific features</li>
                              <li>• Join relevant departments</li>
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium text-blue-800 dark:text-blue-300 mb-2">
                              For Administrators
                            </h5>
                            <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
                              <li>• Configure church settings</li>
                              <li>• Set up departments</li>
              <li>• Create user accounts</li>
                              <li>• Generate QR codes for registration</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-600 p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Need help? Contact your church administrator
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}