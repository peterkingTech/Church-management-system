import React, { useState } from 'react';
import { Plus, MessageCircle, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

// Prayer hands icon component
const PrayerHands = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C10.9 2 10 2.9 10 4V8.5C10 9.3 9.3 10 8.5 10S7 9.3 7 8.5V4C7 2.9 6.1 2 5 2S3 2.9 3 4V12C3 16.4 6.6 20 11 20H13C17.4 20 21 16.4 21 12V4C21 2.9 20.1 2 19 2S17 2.9 17 4V8.5C17 9.3 16.3 10 15.5 10S14 9.3 14 8.5V4C14 2.9 13.1 2 12 2Z"/>
  </svg>
);
const mockPrayers = [
  {
    id: '1',
    message: 'Please pray for my family as we go through a difficult time. Your prayers mean everything to us.',
    submitted_by: 'Anonymous',
    status: 'pending',
    prayer_count: 15,
    created_at: '2024-01-15',
    responses: [
      { id: '1', user: 'Sister Mary', message: 'Praying for you and your family. God is with you.', date: '2024-01-15' },
      { id: '2', user: 'Brother John', message: 'Lifting you up in prayer. Stay strong in faith.', date: '2024-01-16' }
    ]
  },
  {
    id: '2',
    message: 'Thanksgiving prayer for God\'s provision and blessings in my life. Praise the Lord!',
    submitted_by: 'Sarah Johnson',
    status: 'answered',
    prayer_count: 23,
    created_at: '2024-01-12',
    responses: [
      { id: '3', user: 'Pastor John', message: 'Praise God! Thank you for sharing this testimony.', date: '2024-01-12' }
    ]
  },
  {
    id: '3',
    message: 'Please pray for healing for my mother who is in the hospital. We trust in God\'s healing power.',
    submitted_by: 'David Wilson',
    status: 'pending',
    prayer_count: 31,
    created_at: '2024-01-10',
    responses: []
  },
];

export default function Prayers() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPrayer, setSelectedPrayer] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [prayers, setPrayers] = useState(mockPrayers);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredPrayers = mockPrayers.filter(prayer => 
    filterStatus === 'all' || prayer.status === filterStatus
  );

  // Remove the problematic prayers API call since the table doesn't exist
  // Instead, use the mock data or implement proper prayer request functionality
  React.useEffect(() => {
    // Use mock data since prayers table doesn't exist yet
    // This prevents 404 errors while maintaining functionality
    setPrayers(mockPrayers);
  }, []);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'answered': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const handlePrayForRequest = (prayerId: string) => {
    // In a real app, this would update the prayer count in the database
    console.log(`Praying for request ${prayerId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('prayers')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Prayer requests and testimonies
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Prayer</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <PrayerHands className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Prayers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockPrayers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">People Praying</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockPrayers.reduce((sum, prayer) => sum + prayer.prayer_count, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <MessageCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Answered</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockPrayers.filter(p => p.status === 'answered').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">All Prayers</option>
          <option value="pending">Pending</option>
          <option value="answered">Answered</option>
        </select>
      </div>

      {/* Prayer Requests */}
      <div className="space-y-4">
        {filteredPrayers.map((prayer) => (
          <div key={prayer.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                  <PrayerHands className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {prayer.submitted_by}
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(prayer.status)}`}>
                      {prayer.status}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(prayer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {prayer.message}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => handlePrayForRequest(prayer.id)}
                  className="flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 px-3 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <PrayerHands className="w-4 h-4" />
                  <span>I Prayed ({prayer.prayer_count})</span>
                </button>
                <button 
                  onClick={() => setSelectedPrayer(selectedPrayer === prayer.id ? null : prayer.id)}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Responses ({prayer.responses.length})</span>
                </button>
              </div>
            </div>

            {/* Responses */}
            {selectedPrayer === prayer.id && prayer.responses.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Prayer Responses:</h4>
                <div className="space-y-3">
                  {prayer.responses.map((response) => (
                    <div key={response.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                          {response.user}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(response.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {response.message}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit Prayer Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Submit Prayer Request
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prayer Request
                </label>
                <textarea
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Share your prayer request..."
                />
              </div>
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Submit anonymously
                  </span>
                </label>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Submit Prayer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}