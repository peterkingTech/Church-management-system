import React, { useState } from 'react';
import { Shield, Users, Check, X, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const availablePermissions = [
  { id: 'manage_users', label: 'Manage Users', description: 'Create, edit, and delete user accounts' },
  { id: 'mark_attendance_others', label: 'Mark Attendance for Others', description: 'Mark attendance for other members' },
  { id: 'view_reports', label: 'View Reports', description: 'Access church reports and analytics' },
  { id: 'create_events', label: 'Create Events', description: 'Create and manage church events' },
  { id: 'send_announcements', label: 'Send Announcements', description: 'Post church-wide announcements' },
  { id: 'manage_departments', label: 'Manage Departments', description: 'Create and manage church departments' },
  { id: 'export_data', label: 'Export Data', description: 'Export church data and reports' },
  { id: 'view_analytics', label: 'View Analytics', description: 'Access detailed church analytics' }
];

export default function UserPermissions() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([
    {
      id: '1',
      full_name: 'Worker Sarah',
      email: 'sarah@church.com',
      role: 'worker',
      permissions: ['mark_attendance_others', 'create_events']
    },
    {
      id: '2',
      full_name: 'Worker David',
      email: 'david@church.com',
      role: 'worker',
      permissions: ['view_reports', 'send_announcements']
    }
  ]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  const togglePermission = (userId: string, permissionId: string) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const hasPermission = user.permissions.includes(permissionId);
        return {
          ...user,
          permissions: hasPermission 
            ? user.permissions.filter(p => p !== permissionId)
            : [...user.permissions, permissionId]
        };
      }
      return user;
    }));
  };

  if (userProfile?.role !== 'pastor') {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 dark:text-gray-400">
          Access denied. Only pastors can manage user permissions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          User Permissions
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage user roles and permissions for church operations
        </p>
      </div>

      {/* Users with Permissions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            User Permissions
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-600">
          {users.map((user) => (
            <div key={user.id} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">
                      {user.full_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {user.full_name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email} • {user.role}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(user.id);
                    setShowPermissionModal(true);
                  }}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manage</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {availablePermissions.map((permission) => {
                  const hasPermission = user.permissions.includes(permission.id);
                  return (
                    <div
                      key={permission.id}
                      onClick={() => togglePermission(user.id, permission.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        hasPermission
                          ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${
                            hasPermission 
                              ? 'text-green-900 dark:text-green-400' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {permission.label}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {permission.description}
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          hasPermission 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}>
                          {hasPermission ? (
                            <Check className="w-3 h-3" />
                          ) : (
                            <X className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permission Modal */}
      {showPermissionModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Manage Permissions
            </h3>
            <div className="space-y-4">
              {availablePermissions.map((permission) => {
                const user = users.find(u => u.id === selectedUser);
                const hasPermission = user?.permissions.includes(permission.id);
                return (
                  <div key={permission.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {permission.label}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {permission.description}
                      </p>
                    </div>
                    <button
                      onClick={() => togglePermission(selectedUser, permission.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        hasPermission ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-600'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          hasPermission ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowPermissionModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}