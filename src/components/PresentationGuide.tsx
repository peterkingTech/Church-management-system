import React from 'react';
import { Book, Users, Calendar, CheckSquare, Heart, Bell, BarChart3, Settings, Church, Shield, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function PresentationGuide() {
  const { t } = useTranslation();

  const features = [
    {
      title: 'User Management',
      icon: Users,
      description: 'Complete user lifecycle management with role-based access control',
      capabilities: [
        'Create and manage user accounts',
        'Assign roles (Pastor, Admin, Worker, Member, Newcomer)',
        'Department assignments',
        'Profile management with photos',
        'Multi-language support'
      ]
    },
    {
      title: 'Interactive Dashboard',
      icon: BarChart3,
      description: 'Real-time church metrics with drill-down capabilities',
      capabilities: [
        'Live attendance tracking',
        'Task management overview',
        'Birthday notifications',
        'Quick action buttons',
        'Personalized welcome messages'
      ]
    },
    {
      title: 'File Management',
      icon: FileText,
      description: 'Secure document storage and sharing system',
      capabilities: [
        'Drag-and-drop file uploads',
        'Version control for documents',
        'Role-based access controls',
        'PDF and image support',
        'Download tracking'
      ]
    },
    {
      title: 'Task Management',
      icon: CheckSquare,
      description: 'Comprehensive task assignment and tracking',
      capabilities: [
        'Create and assign tasks',
        'Priority levels and due dates',
        'Progress tracking',
        'Notification system',
        'Department-specific tasks'
      ]
    },
    {
      title: 'Event Management',
      icon: Calendar,
      description: 'Church event planning and attendance tracking',
      capabilities: [
        'Event creation and scheduling',
        'RSVP management',
        'Attendance tracking',
        'Event photo uploads',
        'Reminder notifications'
      ]
    },
    {
      title: 'Prayer Wall',
      icon: Heart,
      description: 'Community prayer request and response system',
      capabilities: [
        'Submit prayer requests',
        'Anonymous or public submissions',
        'Prayer response tracking',
        'Answered prayer testimonies',
        'Community support features'
      ]
    },
    {
      title: 'Financial Management',
      icon: BarChart3,
      description: 'Church finance tracking and reporting',
      capabilities: [
        'Offering and tithe tracking',
        'Expense management',
        'Financial reports',
        'Budget analysis',
        'Export capabilities'
      ]
    },
    {
      title: 'Security & Audit',
      icon: Shield,
      description: 'Comprehensive security and change tracking',
      capabilities: [
        'Row Level Security (RLS)',
        'Audit trail for all changes',
        'Role-based permissions',
        'Data encryption',
        'Access logging'
      ]
    }
  ];

  const roles = [
    {
      role: 'Pastor',
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      permissions: [
        'Full system access and administration',
        'User role assignment and management',
        'Financial oversight and reporting',
        'Church settings configuration',
        'QR code generation for registration',
        'Complete audit trail access'
      ]
    },
    {
      role: 'Admin',
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
      permissions: [
        'User management and content creation',
        'Report generation and analytics',
        'Department management',
        'Event creation and management',
        'Limited financial access (if granted)',
        'System configuration'
      ]
    },
    {
      role: 'Worker',
      color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      permissions: [
        'Department-specific administration',
        'Task assignment and management',
        'Attendance marking for department',
        'Report submission and file uploads',
        'Event participation tracking',
        'Member communication'
      ]
    },
    {
      role: 'Member',
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      permissions: [
        'Personal profile management',
        'Event viewing and RSVP',
        'Prayer request submission',
        'Personal attendance marking',
        'File access based on permissions',
        'Announcement viewing'
      ]
    },
    {
      role: 'Newcomer',
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
      permissions: [
        'Registration completion',
        'Basic church information access',
        'Prayer request submission',
        'Public announcement viewing',
        'Contact information for leaders',
        'Limited system access until upgrade'
      ]
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
          <Church className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Church Management System
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
          Complete Digital Solution for Modern Churches
        </p>
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-4 text-white inline-block">
          <p className="font-semibold">AMEN TECH</p>
          <p className="text-sm opacity-90">"Building systems that serve God's kingdom"</p>
          <p className="text-xs opacity-75">Matthew 6:33</p>
        </div>
      </div>

      {/* Key Features */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Comprehensive Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  {feature.description}
                </p>
                <ul className="space-y-1">
                  {feature.capabilities.map((capability, idx) => (
                    <li key={idx} className="flex items-start space-x-2 text-xs text-gray-500 dark:text-gray-400">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 flex-shrink-0"></span>
                      <span>{capability}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* Role-Based Access */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Role-Based Access Control
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map((role, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${role.color}`}>
                {role.role}
              </div>
              <ul className="space-y-2">
                {role.permissions.map((permission, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{permission}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Technical Highlights */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Technical Excellence
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Security First</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Row Level Security, encrypted data, audit trails, and role-based access control
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Real-Time Analytics</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Live dashboards, interactive metrics, and comprehensive reporting
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Multi-Tenant</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Support for multiple churches with complete data isolation
            </p>
          </div>
        </div>
      </div>

      {/* Implementation Benefits */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Implementation Benefits
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">For Church Leadership</h3>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                <span className="text-gray-600 dark:text-gray-300">Streamlined member management and communication</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                <span className="text-gray-600 dark:text-gray-300">Real-time insights into church growth and engagement</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                <span className="text-gray-600 dark:text-gray-300">Automated reporting and analytics</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2"></span>
                <span className="text-gray-600 dark:text-gray-300">Secure financial tracking and transparency</span>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">For Church Members</h3>
            <ul className="space-y-2">
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                <span className="text-gray-600 dark:text-gray-300">Easy event discovery and RSVP</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                <span className="text-gray-600 dark:text-gray-300">Community prayer wall and support</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                <span className="text-gray-600 dark:text-gray-300">Personal attendance tracking</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2"></span>
                <span className="text-gray-600 dark:text-gray-300">Multi-language accessibility</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Ready to Transform Your Church Management?
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Experience the power of modern church management with AMEN TECH's comprehensive solution.
        </p>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 inline-block">
          <p className="text-blue-900 dark:text-blue-400 font-medium">
            📧 Contact: amentech.contact@gmail.com
          </p>
          <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
            For demos, support, and implementation assistance
          </p>
        </div>
      </div>
    </div>
  );
}