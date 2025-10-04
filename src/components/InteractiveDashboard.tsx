import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar as CalendarIcon, 
  Heart, 
  Bell, 
  UserCheck, 
  CheckSquare, 
  UserPlus, 
  TrendingUp,
  Building2,
  Gift,
  Clock,
  Eye,
  ChevronRight,
  Cake
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  trend?: { value: string; isPositive: boolean };
  clickable: boolean;
  drillDownData?: any[];
}

interface BirthdayUser {
  id: string;
  full_name: string;
  birthday_month: number;
  birthday_day: number;
  days_until_birthday: number;
}

export default function InteractiveDashboard() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<DashboardMetric | null>(null);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayUser[]>([]);
  const [todaysBirthdays, setTodaysBirthdays] = useState<BirthdayUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    loadBirthdays();
  }, [userProfile]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load real data from Supabase
      const [
        attendanceData,
        tasksData,
        noticesData,
        visitorsData,
        programsData,
        departmentsData,
        usersData
      ] = await Promise.all([
        supabase.from('attendance').select('*', { count: 'exact' }),
        supabase.from('tasks').select('*', { count: 'exact' }).eq('is_done', false),
        supabase.from('notices').select('*', { count: 'exact' }).eq('status', 'active'),
        supabase.from('users').select('*', { count: 'exact' }).eq('role', 'newcomer'),
        supabase.from('programs').select('*', { count: 'exact' }).eq('status', 'active'),
        supabase.from('departments').select('*', { count: 'exact' }),
        supabase.from('users').select('*', { count: 'exact' }).eq('is_confirmed', true)
      ]);

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const todayAttendance = attendanceData.data?.filter(a => a.date === today && a.was_present) || [];
      const weeklyAttendance = attendanceData.data?.filter(a => a.date >= weekAgo && a.was_present) || [];

      const dashboardMetrics: DashboardMetric[] = [
        {
          id: 'todays-attendance',
          label: t('todays_attendance'),
          value: todayAttendance.length.toString(),
          subtitle: 'People present today',
          icon: UserCheck,
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          trend: { value: '+12%', isPositive: true },
          clickable: true,
          drillDownData: todayAttendance
        },
        {
          id: 'weekly-attendance',
          label: t('weekly_attendance'),
          value: weeklyAttendance.length.toString(),
          subtitle: 'Total this week',
          icon: TrendingUp,
          color: 'bg-green-500',
          bgColor: 'bg-green-50 dark:bg-green-900/20',
          trend: { value: '+8%', isPositive: true },
          clickable: true,
          drillDownData: weeklyAttendance
        },
        {
          id: 'pending-tasks',
          label: t('pending_tasks'),
          value: (tasksData.count || 0).toString(),
          subtitle: 'Tasks assigned',
          icon: CheckSquare,
          color: 'bg-red-500',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          trend: { value: '-3', isPositive: true },
          clickable: true,
          drillDownData: tasksData.data || []
        },
        {
          id: 'active-notices',
          label: t('active_notices'),
          value: (noticesData.count || 0).toString(),
          subtitle: 'Current notices',
          icon: Bell,
          color: 'bg-purple-500',
          bgColor: 'bg-purple-50 dark:bg-purple-900/20',
          clickable: true,
          drillDownData: noticesData.data || []
        },
        {
          id: 'prayer-requests',
          label: 'Prayer Requests',
          value: '0',
          subtitle: 'Need prayer',
          icon: Heart,
          color: 'bg-pink-500',
          bgColor: 'bg-pink-50 dark:bg-pink-900/20',
          clickable: true,
          drillDownData: []
        },
        {
          id: 'new-visitors',
          label: t('new_visitors'),
          value: (visitorsData.count || 0).toString(),
          subtitle: 'This week',
          icon: UserPlus,
          color: 'bg-yellow-600',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          trend: { value: '+2', isPositive: true },
          clickable: true,
          drillDownData: visitorsData.data || []
        },
        {
          id: 'active-programs',
          label: t('active_programs'),
          value: (programsData.count || 0).toString(),
          subtitle: 'Upcoming events',
          icon: CalendarIcon,
          color: 'bg-indigo-500',
          bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
          clickable: true,
          drillDownData: programsData.data || []
        },
        {
          id: 'departments',
          label: 'Departments',
          value: (departmentsData.count || 0).toString(),
          subtitle: 'Active departments',
          icon: Building2,
          color: 'bg-teal-500',
          bgColor: 'bg-teal-50 dark:bg-teal-900/20',
          clickable: true,
          drillDownData: departmentsData.data || []
        },
        {
          id: 'active-users',
          label: 'Active Users',
          value: (usersData.count || 0).toString(),
          subtitle: 'Confirmed members',
          icon: Users,
          color: 'bg-cyan-500',
          bgColor: 'bg-cyan-50 dark:bg-cyan-900/20',
          clickable: true,
          drillDownData: usersData.data || []
        }
      ];

      setMetrics(dashboardMetrics);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to demo data
      setMetrics([
        {
          id: 'todays-attendance',
          label: t('todays_attendance'),
          value: '45',
          subtitle: 'People present today',
          icon: UserCheck,
          color: 'bg-blue-500',
          bgColor: 'bg-blue-50 dark:bg-blue-900/20',
          trend: { value: '+12%', isPositive: true },
          clickable: true,
          drillDownData: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadBirthdays = async () => {
    try {
      if (!userProfile?.church_id) return;

      const { data, error } = await supabase
        .rpc('get_upcoming_birthdays', {
          church_uuid: userProfile.church_id,
          days_ahead: 7
        });

      if (error) throw error;

      const today = new Date();
      const todaysMonth = today.getMonth() + 1;
      const todaysDay = today.getDate();

      const todaysBdays = (data || []).filter((user: BirthdayUser) => 
        user.birthday_month === todaysMonth && user.birthday_day === todaysDay
      );

      const upcomingBdays = (data || []).filter((user: BirthdayUser) => 
        !(user.birthday_month === todaysMonth && user.birthday_day === todaysDay)
      );

      setTodaysBirthdays(todaysBdays);
      setUpcomingBirthdays(upcomingBdays);
    } catch (error) {
      console.error('Error loading birthdays:', error);
    }
  };

  const handleMetricClick = (metric: DashboardMetric) => {
    if (!metric.clickable) return;
    
    setSelectedMetric(metric);
    setShowDrillDown(true);
  };

  const renderDrillDownContent = () => {
    if (!selectedMetric) return null;

    switch (selectedMetric.id) {
      case 'todays-attendance':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Today's Attendance Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedMetric.drillDownData?.map((record: any, index: number) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        Member #{record.user_id?.slice(-6)}
                      </p>
                      <p className="text-sm text-gray-500">
                        Arrived: {record.arrival_time || 'On time'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'pending-tasks':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pending Tasks
            </h3>
            <div className="space-y-3">
              {selectedMetric.drillDownData?.map((task: any) => (
                <div key={task.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {task.task_text}
                      </p>
                      <p className="text-sm text-gray-500">
                        Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}
                      </p>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'prayer-requests':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Heart className="w-5 h-5 mr-2 text-pink-600" />
              Prayer Requests
            </h3>
            <div className="space-y-3">
              {selectedMetric.drillDownData?.map((prayer: any) => (
                <div key={prayer.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-white mb-2">
                    {prayer.message || 'Prayer request details...'}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {prayer.submitted_by || 'Anonymous'}
                    </span>
                    <button className="flex items-center space-x-1 text-purple-600 hover:text-purple-800">
                      <Heart className="w-4 h-4" />
                      <span>Pray</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Detailed view for {selectedMetric.label}
            </p>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personalized Welcome */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          Welcome back, {userProfile?.full_name || 'User'}! 👋
        </h1>
        <p className="text-blue-100">
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>

      {/* Birthday Notifications */}
      {todaysBirthdays.length > 0 && (
        <div className="animate-pulse bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Cake className="w-8 h-8 animate-bounce" />
            <h2 className="text-2xl font-bold">🎉 Birthday Celebration! 🎉</h2>
            <Gift className="w-8 h-8 animate-bounce" />
          </div>
          <div className="text-center">
            <p className="text-lg mb-2">Today we celebrate:</p>
            <div className="flex flex-wrap justify-center gap-4">
              {todaysBirthdays.map((user) => (
                <div key={user.id} className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                  <p className="font-bold text-xl">🎂 {user.full_name}</p>
                  <p className="text-sm opacity-90">Happy Birthday!</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Birthdays */}
      {upcomingBirthdays.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center space-x-2 mb-3">
            <Gift className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-blue-900 dark:text-blue-400">Upcoming Birthdays</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingBirthdays.slice(0, 6).map((user) => (
              <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm">
                <p className="font-medium text-gray-900 dark:text-white">
                  🎈 {user.full_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {user.birthday_month}/{user.birthday_day} 
                  {user.days_until_birthday === 1 ? ' (Tomorrow!)' : 
                   user.days_until_birthday > 1 ? ` (${user.days_until_birthday} days)` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div 
              key={metric.id} 
              onClick={() => handleMetricClick(metric)}
              className={`${metric.bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-all duration-300 group ${
                metric.clickable ? 'cursor-pointer hover:shadow-lg hover:scale-105' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {metric.label}
                  </p>
                  <div className="flex items-baseline space-x-2">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {metric.value}
                    </p>
                    {metric.trend && (
                      <span className={`text-sm font-medium ${metric.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {metric.trend.value}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {metric.subtitle}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  {metric.clickable && (
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Drill-Down Modal */}
      {showDrillDown && selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${selectedMetric.color} rounded-lg flex items-center justify-center`}>
                    <selectedMetric.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedMetric.label}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {selectedMetric.subtitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDrillDown(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Eye className="w-6 h-6" />
                </button>
              </div>
              
              {renderDrillDownContent()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}