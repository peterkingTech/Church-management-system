import React from 'react';
import { Book, Download, Users, Calendar, CheckSquare, Heart, Bell, BarChart3, Settings, Church } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function UserManual() {
  const { t } = useTranslation();

  const sections = [
    {
      title: 'Getting Started',
      icon: Church,
      content: [
        'Welcome to AMEN TECH Church Management System',
        'Create your account by selecting your role (Admin, Worker, Member, or Newcomer)',
        'Upload a profile picture and set your preferred language',
        'Complete your profile information for better experience'
      ]
    },
    {
      title: 'Dashboard Overview',
      icon: BarChart3,
      content: [
        'View real-time church statistics and metrics',
        'Monitor attendance, tasks, events, and prayer requests',
        'Access quick actions for common tasks',
        'See recent activity and upcoming events'
      ]
    },
    {
      title: 'User Management',
      icon: Users,
      content: [
        'Admins can manage all church members',
        'Add new users and assign roles',
        'View member profiles and activity',
        'Export member data for reports'
      ]
    },
    {
      title: 'Attendance Tracking',
      icon: CheckSquare,
      content: [
        'Mark attendance for services and events',
        'View attendance history and trends',
        'Generate attendance reports',
        'Track member participation'
      ]
    },
    {
      title: 'Event Management',
      icon: Calendar,
      content: [
        'Create and manage church events',
        'Send event invitations and reminders',
        'Track RSVPs and attendance',
        'View calendar of upcoming events'
      ]
    },
    {
      title: 'Prayer Wall',
      icon: Heart,
      content: [
        'Submit prayer requests anonymously or publicly',
        'Pray for others and show support',
        'View answered prayers and testimonies',
        'Receive prayer notifications'
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      content: [
        'Receive real-time notifications for important updates',
        'Get reminders for tasks and events',
        'Stay informed about church announcements',
        'Customize notification preferences'
      ]
    },
    {
      title: 'Settings & Preferences',
      icon: Settings,
      content: [
        'Customize your profile and preferences',
        'Change language and theme settings',
        'Manage notification preferences',
        'Update security settings'
      ]
    }
  ];

  const roleGuide = [
    {
      role: 'Admin (Pastor/Leader)',
      color: 'bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-400',
      permissions: [
        'Full access to all features',
        'Manage users and departments',
        'Create and manage events',
        'View analytics and reports',
        'Export data and generate reports',
        'Send announcements to all members'
      ]
    },
    {
      role: 'Worker (Department Leader)',
      color: 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400',
      permissions: [
        'Manage department members',
        'Create and assign tasks',
        'Mark attendance for department',
        'Submit department reports',
        'View department analytics',
        'Send announcements to department'
      ]
    },
    {
      role: 'Member',
      color: 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400',
      permissions: [
        'View events and RSVP',
        'Submit prayer requests',
        'Mark personal attendance',
        'View announcements',
        'Access prayer wall',
        'Update personal profile'
      ]
    },
    {
      role: 'Newcomer',
      color: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400',
      permissions: [
        'View church information',
        'Submit prayer requests',
        'Connect with church leaders',
        'View public announcements',
        'Complete newcomer forms',
        'Request to join departments'
      ]
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('user_manual')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Complete guide to using AMEN TECH Church Management System
          </p>
        </div>
        <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Download className="w-4 h-4" />
          <span>Download PDF</span>
        </button>
      </div>

      {/* AMEN TECH Branding */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Church className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">AMEN TECH</h2>
            <p className="text-blue-100">Church Management System</p>
          </div>
        </div>
        <p className="text-blue-100 mb-2">
          "Building systems that serves God's kingdom"
        </p>
        <p className="text-blue-200 text-sm">Matthew 6:33</p>
      </div>

      {/* Role-Based Access Guide */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Role-Based Access Guide
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roleGuide.map((role, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${role.color}`}>
                {role.role}
              </div>
              <ul className="space-y-2">
                {role.permissions.map((permission, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sections.map((section, index) => {
          const Icon = section.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {section.title}
                </h3>
              </div>
              <ul className="space-y-2">
                {section.content.map((item, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Quick Tips */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Tips for Success
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-400 mb-2">Mobile First</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              The app is designed mobile-first and works perfectly on all devices
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-400 mb-2">Offline Support</h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Many features work offline and sync when you're back online
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <h4 className="font-medium text-purple-900 dark:text-purple-400 mb-2">Multi-Language</h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Available in multiple languages for global accessibility
            </p>
          </div>
        </div>
      </div>

      {/* Support Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Need Help?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <Book className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Documentation</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Comprehensive guides and tutorials
            </p>
          </div>
          <div className="text-center">
            <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Community</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Connect with other church administrators
            </p>
          </div>
          <div className="text-center">
            <Bell className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-white mb-1">Support</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Contact us at amentech.contact@gmail.com
            </p>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Contact & Support
        </h3>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mb-4">
            <Church className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            AMEN TECH Support
          </h4>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            For technical support, feature requests, or general inquiries
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-blue-900 dark:text-blue-400 font-medium">
              📧 amentech.contact@gmail.com
            </p>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            We typically respond within 24 hours
          </p>
        </div>
      </div>
    </div>
  );
}