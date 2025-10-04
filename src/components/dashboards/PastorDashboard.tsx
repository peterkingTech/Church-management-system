import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  DollarSign, 
  TrendingUp, 
  UserPlus, 
  Award, 
  Calendar,
  Bell,
  Target,
  BarChart3,
  Church,
  Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface DashboardMetric {
  label: string;
  value: string;
  change: string;
  icon: React.ComponentType<any>;
  color: string;
  isPositive: boolean;
}

export default function PastorDashboard() {
  const { userProfile, church } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [userProfile]);

  const loadDashboardData = async () => {
    if (!userProfile?.church_id) return;

    try {
      setLoading(true);

      // Load church statistics
      const [
        totalUsers,
        newUsersThisMonth,
        totalDepartments,
        pendingPromotions,
        monthlyGiving,
        soulWinningCount,
        activeEvents,
        pendingFollowUps
      ] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact' }).eq('church_id', userProfile.church_id),
        supabase.from('users').select('id', { count: 'exact' }).eq('church_id', userProfile.church_id).gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
        supabase.from('departments').select('id', { count: 'exact' }).eq('church_id', userProfile.church_id),
        supabase.from('users').select('id', { count: 'exact' }).eq('church_id', userProfile.church_id).eq('role', 'newcomer'),
        supabase.from('financial_records').select('amount').eq('church_id', userProfile.church_id).gte('transaction_date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        supabase.from('soul_winning_records').select('id', { count: 'exact' }).eq('church_id', userProfile.church_id).gte('date_won', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]),
        supabase.from('events').select('id', { count: 'exact' }).eq('church_id', userProfile.church_id).gte('date', new Date().toISOString().split('T')[0]),
        supabase.from('users').select('id', { count: 'exact' }).eq('church_id', userProfile.church_id).eq('role', 'newcomer').is('assigned_worker_id', null)
      ]);

      const monthlyGivingTotal = monthlyGiving.data?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;

      const dashboardMetrics: DashboardMetric[] = [
        {
          label: 'Total Members',
          value: (totalUsers.count || 0).toString(),
          change: `+${newUsersThisMonth.count || 0} this month`,
          icon: Users,
          color: 'bg-blue-500',
          isPositive: true
        },
        {
          label: 'Monthly Giving',
          value: `$${monthlyGivingTotal.toLocaleString()}`,
          change: '+12% from last month',
          icon: DollarSign,
          color: 'bg-green-500',
          isPositive: true
        },
        {
          label: 'Souls Won',
          value: (soulWinningCount.count || 0).toString(),
          change: 'This month',
          icon: Award,
          color: 'bg-purple-500',
          isPositive: true
        },
        {
          label: 'Pending Follow-ups',
          value: (pendingFollowUps.count || 0).toString(),
          change: 'Need assignment',
          icon: Target,
          color: 'bg-yellow-500',
          isPositive: false
        },
        {
          label: 'Active Departments',
          value: (totalDepartments.count || 0).toString(),
          change: 'All departments',
          icon: Shield,
          color: 'bg-indigo-500',
          isPositive: true
        },
        {
          label: 'Upcoming Events',
          value: (activeEvents.count || 0).toString(),
          change: 'Next 30 days',
          icon: Calendar,
          color: 'bg-pink-500',
          isPositive: true
        }
      ];

      setMetrics(dashboardMetrics);

      // Load recent activity
      const { data: activity } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(full_name)
        `)
        .eq('church_id', userProfile.church_id)
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentActivity(activity || []);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-xl h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-yellow-500 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Crown className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Pastor Dashboard</h1>
            <p className="text-purple-100">Welcome back, {userName}!</p>
          </div>
        </div>
        <p className="text-purple-100">
          You have full administrative access to {churchName}. Manage your church family with wisdom and love.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {metric.label}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {metric.value}
                  </p>
                  <p className={`text-sm ${metric.isPositive ? 'text-green-600' : 'text-yellow-600'}`}>
                    {metric.change}
                  </p>
                </div>
                <div className={`w-12 h-12 ${metric.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Pastor Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveItem('invite-users')}
            className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
          >
            <UserPlus className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-400">
              Invite Users
            </span>
          </button>
          
          <button
            onClick={() => setActiveItem('user-promotions')}
            className="flex flex-col items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
          >
            <Crown className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-900 dark:text-yellow-400">
              Promote Users
            </span>
          </button>
          
          <button
            onClick={() => setActiveItem('finance-dashboard')}
            className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <DollarSign className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-900 dark:text-green-400">
              Finance
            </span>
          </button>
          
          <button
            onClick={() => setActiveItem('analytics')}
            className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <BarChart3 className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-400">
              Reports
            </span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Church Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {activity.user?.full_name || 'System'} {activity.action.toLowerCase()} {activity.table_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Church Growth Insights
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Member Retention</span>
              <span className="text-sm font-semibold text-green-600">94%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Discipleship Progress</span>
              <span className="text-sm font-semibold text-blue-600">78%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-300">Worker Engagement</span>
              <span className="text-sm font-semibold text-purple-600">89%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: '89%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Prophetic Alerts Section */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Bell className="w-6 h-6" />
          <h3 className="text-lg font-semibold">Prophetic Alerts</h3>
        </div>
        <p className="text-yellow-100 mb-4">
          Send urgent spiritual alerts and prophetic messages to your entire church family.
        </p>
        <button className="bg-white text-orange-600 px-6 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors">
          Send Prophetic Alert
        </button>
      </div>
    </div>
  );
}