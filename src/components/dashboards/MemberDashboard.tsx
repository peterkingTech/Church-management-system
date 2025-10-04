import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Award, 
  Heart, 
  Calendar,
  UserCheck,
  Sparkles,
  MessageSquare,
  Book,
  Target,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function MemberDashboard() {
  const { userProfile } = useAuth();
  const [discipleshipProgress, setDiscipleshipProgress] = useState<any>({});
  const [soulWinningRecords, setSoulWinningRecords] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMemberData();
  }, [userProfile]);

  const loadMemberData = async () => {
    if (!userProfile?.church_id) return;

    try {
      setLoading(true);

      // Load discipleship progress
      const { data: progress } = await supabase
        .from('user_progress')
        .select(`
          *,
          course:discipleship_courses(title, level)
        `)
        .eq('user_id', userProfile.id);

      const progressSummary = {
        completed: progress?.filter(p => p.status === 'completed').length || 0,
        inProgress: progress?.filter(p => p.status === 'in_progress').length || 0,
        total: progress?.length || 0
      };

      setDiscipleshipProgress(progressSummary);

      // Load soul winning records
      const { data: soulWinning } = await supabase
        .from('soul_winning_records')
        .select('*')
        .eq('won_by', userProfile.id)
        .order('date_won', { ascending: false })
        .limit(5);

      setSoulWinningRecords(soulWinning || []);

      // Load upcoming events
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('church_id', userProfile.church_id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(5);

      setUpcomingEvents(events || []);

    } catch (error) {
      console.error('Error loading member data:', error);
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
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <GraduationCap className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Member Dashboard</h1>
            <p className="text-green-100">Growing in Faith & Service</p>
          </div>
        </div>
        <p className="text-green-100">
          Continue your spiritual journey through discipleship, soul winning, and active participation.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Discipleship Progress</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {discipleshipProgress.completed || 0}/{discipleshipProgress.total || 0}
              </p>
            </div>
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Souls Won</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {soulWinningRecords.length}
              </p>
            </div>
            <Award className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance Rate</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">92%</p>
            </div>
            <UserCheck className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming Events</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {upcomingEvents.length}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Member Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <GraduationCap className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-900 dark:text-blue-400">
              Continue Course
            </span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <UserPlus className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-900 dark:text-purple-400">
              Log Soul Won
            </span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <Heart className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-900 dark:text-green-400">
              Submit Prayer
            </span>
          </button>
          
          <button className="flex flex-col items-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors">
            <Sparkles className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-900 dark:text-yellow-400">
              Share Testimony
            </span>
          </button>
        </div>
      </div>

      {/* Current Discipleship Course */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Current Discipleship Course
          </h3>
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Book className="w-6 h-6 text-blue-600" />
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Foundation Course</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">Module 3 of 8</p>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: '37%' }}></div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Next: "Understanding Baptism and Church Membership"
            </p>
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Continue Learning
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent Soul Winning
          </h3>
          <div className="space-y-3">
            {soulWinningRecords.map((record) => (
              <div key={record.id} className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Award className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {record.convert_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(record.date_won).toLocaleDateString()} - {record.event_type}
                  </p>
                </div>
              </div>
            ))}
            {soulWinningRecords.length === 0 && (
              <div className="text-center py-4">
                <Award className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No souls won yet</p>
                <p className="text-sm text-gray-400">Start sharing the Gospel!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}