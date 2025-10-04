import React, { useState } from 'react';
import { UserCheck, Plus, Calendar, Clock, Users, CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

export default function Attendance() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showMarkForm, setShowMarkForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myAttendance, setMyAttendance] = useState<any[]>([
    {
      id: '1',
      date: '2024-01-21',
      status: 'present',
      arrival_time: '09:45 AM',
      service_type: 'Sunday Service'
    },
    {
      id: '2',
      date: '2024-01-17',
      status: 'present',
      arrival_time: '06:55 PM',
      service_type: 'Prayer Meeting'
    }
  ]);

  const canMarkForOthers = userProfile?.role === 'pastor' || userProfile?.role === 'admin' ||
    userProfile?.role === 'worker';

  const handleMarkMyAttendance = async () => {
    const today = new Date().toISOString().split('T')[0];
    const existingAttendance = myAttendance.find(a => a.date === today);
    
    if (existingAttendance) {
      alert('You have already marked attendance for today');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('attendance')
        .insert({
          user_id: userProfile?.id,
          date: today,
          was_present: true,
          arrival_time: new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        });

      if (error) throw error;

      const newAttendance = {
        id: Date.now().toString(),
        date: today,
        status: 'present',
        arrival_time: new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        service_type: 'Sunday Service'
      };

      setMyAttendance(prev => [newAttendance, ...prev]);
      alert('Attendance marked successfully!');
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'late': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'absent': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'late': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'absent': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <UserCheck className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('menu.attendance')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {t('attendance.track_church_attendance')}
          </p>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={handleMarkMyAttendance}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            <UserCheck className="w-4 h-4" />
            <span>{t('attendance.mark_my_attendance')}</span>
          </button>
          {canMarkForOthers && (
            <button 
              onClick={() => setShowMarkForm(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('attendance.mark_for_others')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Permission Notice */}
      {userProfile?.role === 'worker' && !canMarkForOthers && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">
            {t('attendance.permission_required')}
          </p>
        </div>
      )}

      {userProfile?.role === 'member' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200">
            {t('attendance.self_attendance_only')}
          </p>
        </div>
      )}

      {/* My Attendance History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('attendance.my_attendance_history')}
        </h3>
        <div className="space-y-3">
          {myAttendance.map((record) => (
            <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon(record.status)}
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {new Date(record.date).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {record.service_type}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                  {t(`status.${record.status}`)}
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {record.arrival_time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mark Attendance for Others Modal */}
      {showMarkForm && canMarkForOthers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('attendance.mark_attendance')}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.select_member')}
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="">{t('common.select_member')}</option>
                  <option value="1">John Smith</option>
                  <option value="2">Mary Johnson</option>
                  <option value="3">David Wilson</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.status')}
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="present">{t('status.present')}</option>
                  <option value="late">{t('status.late')}</option>
                  <option value="absent">{t('status.absent')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.date')}
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowMarkForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={() => {
                  setShowMarkForm(false);
                  alert(t('attendance.marked_successfully'));
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('attendance.mark_attendance')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}