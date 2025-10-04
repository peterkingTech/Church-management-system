import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  Book, 
  Calendar,
  UserCheck,
  Sparkles,
  MessageSquare,
  Award,
  Clock,
  CheckCircle,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function NewcomerDashboard() {
  const { userProfile } = useAuth();
  const [assignedWorker, setAssignedWorker] = useState<any>(null);
  const [completedForms, setCompletedForms] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [devotionalProgress, setDevotionalProgress] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNewcomerData();
  }, [userProfile]);

  const loadNewcomerData = async () => {
    if (!userProfile?.church_id) return;

    try {
      setLoading(true);

      // Load assigned worker
      if (userProfile.assigned_worker_id) {
        const { data: worker } = await supabase
          .from('users')
          .select('id, full_name, phone, email')
          .eq('id', userProfile.assigned_worker_id)
          .single();

        setAssignedWorker(worker);
      }

      // Load upcoming events (public events)
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .eq('church_id', userProfile.church_id)
        .eq('is_public', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(3);

      setUpcomingEvents(events || []);

      // Mock devotional progress (would be real data in production)
      setDevotionalProgress({
        currentDay: 5,
        totalDays: 30,
        streak: 3
      });

    } catch (error) {
      console.error('Error loading newcomer data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
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
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Welcome to the Family!</h1>
            <p className="text-yellow-100">New Member Journey</p>
          </div>
        </div>
        <p className="text-yellow-100">
          We're so excited you're here! Your spiritual journey starts now. Let's get you connected and growing.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Devotional Progress</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {devotionalProgress.currentDay}/{devotionalProgress.totalDays}
              </p>
              <p className="text-sm text-green-600">
                {devotionalProgress.streak} day streak!
              </p>
            </div>
            <Book className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Forms Completed</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {completedForms.length}/3
              </p>
              <p className="text-sm text-yellow-600">
                Registration in progress
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Days as Newcomer</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {Math.floor((new Date().getTime() - new Date(userProfile.church_joined_at).getTime()) / (1000 * 60 * 60 * 24))}
              </p>
              <p className="text-sm text-purple-600">
                Growing daily!
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Assigned Worker */}
      {assignedWorker && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Your Assigned Worker
          </h3>
          <div className="flex items-center space-x-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {assignedWorker.full_name}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your personal guide and mentor
              </p>
              <div className="flex space-x-4 mt-2">
                {assignedWorker.phone && (
                  <span className="text-sm text-blue-600">📞 {assignedWorker.phone}</span>
                )}
                {assignedWorker.email && (
                  <span className="text-sm text-blue-600">✉️ {assignedWorker.email}</span>
                )}
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              Contact
            </button>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Next Steps
        </h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Complete Registration Forms</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Fill out your personal information</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Book className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Start Daily Devotionals</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Begin your 30-day newcomer journey</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Attend Newcomer's Class</p>
              <p className="text-sm text-gray-600 dark:text-gray-300">Learn about our church family</p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Events You Can Attend
        </h3>
        <div className="space-y-3">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {event.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(event.date).toLocaleDateString()} at {event.start_time}
                  </p>
                </div>
              </div>
              <button className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm hover:bg-blue-200 dark:hover:bg-blue-900/30">
                Learn More
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Encouragement */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-400 mb-2">
            "For I know the plans I have for you..."
          </h3>
          <p className="text-purple-700 dark:text-purple-300 text-sm">
            Jeremiah 29:11 - God has amazing plans for your life in this church family!
          </p>
        </div>
      </div>
    </div>
  );
}