import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Users, 
  Target, 
  CheckSquare, 
  UserCheck,
  Calendar,
  MessageSquare,
  TrendingUp,
  Clock,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function WorkerDashboard() {
  const { userProfile } = useAuth();
  const [departmentStats, setDepartmentStats] = useState<any>({});
  const [assignedNewcomers, setAssignedNewcomers] = useState<any[]>([]);
  const [recentTasks, setRecentTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkerData();
  }, [userProfile]);

  const loadWorkerData = async () => {
    if (!userProfile?.church_id) return;

    try {
      setLoading(true);

      // Load department statistics
      const { data: department } = await supabase
        .from('departments')
        .select(`
          *,
          members:user_departments(
            user:users(id, full_name, role)
          )
        `)
        .eq('id', userProfile.department_id)
        .single();

      setDepartmentStats(department || {});

      // Load assigned newcomers for follow-up
      const { data: newcomers } = await supabase
        .from('users')
        .select('*')
        .eq('church_id', userProfile.church_id)
        .eq('assigned_worker_id', userProfile.id)
        .eq('role', 'newcomer')
        .order('created_at', { ascending: false });

      setAssignedNewcomers(newcomers || []);

      // Load recent tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select(`
          *,
          assigned_by_user:users!tasks_assigned_by_fkey(full_name)
        `)
        .eq('assigned_to', userProfile.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentTasks(tasks || []);

    } catch (error) {
      console.error('Error loading worker data:', error);
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Award className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Worker Dashboard</h1>
            <p className="text-blue-100">Department Leader - {departmentStats.name || 'Department'}</p>
          </div>
        </div>
        <p className="text-blue-100">
          Lead your department with excellence and help newcomers grow in their faith journey.
        </p>
      </div>

      {/* Department Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Department Members</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {departmentStats.members?.length || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Assigned Newcomers</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {assignedNewcomers.length}
              </p>
            </div>
            <Target className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Tasks</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {recentTasks.filter(t => !t.is_done).length}
              </p>
            </div>
            <CheckSquare className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week's Attendance</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">85%</p>
            </div>
            <UserCheck className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Assigned Newcomers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assigned Newcomers for Follow-up
          </h3>
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {assignedNewcomers.slice(0, 5).map((newcomer) => (
            <div key={newcomer.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium">
                    {newcomer.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {newcomer.full_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Joined {new Date(newcomer.church_joined_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/30">
                  Contact
                </button>
                <button className="px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm hover:bg-green-200 dark:hover:bg-green-900/30">
                  Update
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Tasks
        </h3>
        <div className="space-y-3">
          {recentTasks.map((task) => (
            <div key={task.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckSquare className={`w-5 h-5 ${task.is_done ? 'text-green-600' : 'text-gray-400'}`} />
                <div>
                  <p className={`font-medium ${task.is_done ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                    {task.task_text}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    From: {task.assigned_by_user?.full_name}
                  </p>
                </div>
              </div>
              {task.due_date && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}