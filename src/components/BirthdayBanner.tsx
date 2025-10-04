import React, { useState, useEffect } from 'react';
import { Gift, Cake, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface BirthdayUser {
  id: string;
  full_name: string;
  birthday_month: number;
  birthday_day: number;
  days_until_birthday: number;
}

export default function BirthdayBanner() {
  const { church } = useAuth();
  const [upcomingBirthdays, setUpcomingBirthdays] = useState<BirthdayUser[]>([]);
  const [todaysBirthdays, setTodaysBirthdays] = useState<BirthdayUser[]>([]);

  useEffect(() => {
    if (church?.id) {
      loadUpcomingBirthdays();
    }
  }, [church]);

  const loadUpcomingBirthdays = async () => {
    if (!church?.id) return;

    try {
      // Get users with birthdays in the next 7 days
      const { data, error } = await supabase
        .rpc('get_upcoming_birthdays', {
          church_id_param: church.id,
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
      // Demo data for development
      const today = new Date();
      if (today.getDate() === 15) { // Demo: show birthday on 15th
        setTodaysBirthdays([{
          id: '1',
          full_name: 'John Doe',
          birthday_month: today.getMonth() + 1,
          birthday_day: today.getDate(),
          days_until_birthday: 0
        }]);
      }
    }
  };

  if (todaysBirthdays.length === 0 && upcomingBirthdays.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Today's Birthdays - Blinking Banner */}
      {todaysBirthdays.length > 0 && (
        <div className="animate-pulse bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Cake className="w-8 h-8 animate-bounce" />
            <h2 className="text-2xl font-bold">🎉 Birthday Celebration! 🎉</h2>
            <Sparkles className="w-8 h-8 animate-bounce" />
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
    </div>
  );
}