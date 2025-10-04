import React, { useState } from 'react';
import { History as HistoryIcon, MessageSquare, CheckSquare, Calendar, FileText, Filter } from 'lucide-react';

const mockHistory = [
  {
    id: '1',
    type: 'pd_report',
    title: 'Sunday Service Report',
    content: 'Service went well with 45 attendees. Great response to the message.',
    user: 'Worker Sarah',
    date: '2024-01-21T14:30:00Z',
    category: 'Service Report'
  },
  {
    id: '2',
    type: 'task',
    title: 'Task Completed: Prepare Youth Event',
    content: 'Youth event preparation completed successfully. All materials ready.',
    user: 'Worker David',
    date: '2024-01-21T10:15:00Z',
    category: 'Task Update'
  },
  {
    id: '3',
    type: 'directive',
    title: 'Pastor Directive: Foundation Class',
    content: 'Please prepare foundation class materials for next week focusing on baptism.',
    user: 'Pastor John',
    date: '2024-01-20T16:45:00Z',
    category: 'Directive'
  },
  {
    id: '4',
    type: 'comment',
    title: 'Folder Comment: Integration Program',
    content: 'Added new materials for member integration process.',
    user: 'Worker Sarah',
    date: '2024-01-20T09:20:00Z',
    category: 'Folder Update'
  },
  {
    id: '5',
    type: 'meeting',
    title: 'Leadership Meeting Notes',
    content: 'Discussed upcoming events and ministry assignments for February.',
    user: 'Pastor John',
    date: '2024-01-19T19:00:00Z',
    category: 'Meeting Notes'
  },
  {
    id: '6',
    type: 'feedback',
    title: 'Event Feedback: Youth Crusade',
    content: 'Excellent turnout with 85 attendees. 12 souls won for Christ!',
    user: 'Worker David',
    date: '2024-01-18T21:30:00Z',
    category: 'Event Feedback'
  }
];

export default function History() {
  const [filterType, setFilterType] = useState('all');
  const [filterUser, setFilterUser] = useState('all');

  const filteredHistory = mockHistory.filter(item => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesUser = filterUser === 'all' || item.user === filterUser;
    return matchesType && matchesUser;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pd_report': return MessageSquare;
      case 'task': return CheckSquare;
      case 'directive': return FileText;
      case 'comment': return MessageSquare;
      case 'meeting': return Calendar;
      case 'feedback': return MessageSquare;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'pd_report': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'task': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'directive': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'comment': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'meeting': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'feedback': return 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const uniqueUsers = [...new Set(mockHistory.map(item => item.user))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          History & Feedback
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Complete record of all church activities, communications, and feedback
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <HistoryIcon className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Records</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockHistory.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <MessageSquare className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">PD Reports</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockHistory.filter(h => h.type === 'pd_report').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CheckSquare className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Task Updates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockHistory.filter(h => h.type === 'task').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Week</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockHistory.filter(h => {
                  const itemDate = new Date(h.date);
                  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return itemDate >= weekAgo;
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="pd_report">PD Reports</option>
            <option value="task">Task Updates</option>
            <option value="directive">Directives</option>
            <option value="comment">Comments</option>
            <option value="meeting">Meeting Notes</option>
            <option value="feedback">Feedback</option>
          </select>
          <select
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Users</option>
            {uniqueUsers.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
      </div>

      {/* History Timeline */}
      <div className="space-y-4">
        {filteredHistory.map((item) => {
          const Icon = getTypeIcon(item.type);
          return (
            <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getTypeColor(item.type)}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {item.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(item.type)}`}>
                      {item.category}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {item.content}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>By: {item.user}</span>
                    <span>{formatTime(item.date)}</span>
                    <span>{new Date(item.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredHistory.length === 0 && (
        <div className="text-center py-12">
          <HistoryIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No history records found for the selected filters
          </p>
        </div>
      )}
    </div>
  );
}