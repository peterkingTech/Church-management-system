import React, { useState } from 'react';
import { CalendarDays, Plus, Users, MapPin, Clock, Award } from 'lucide-react';

const mockPrograms = [
  {
    id: '1',
    name: 'Sunday Morning Service',
    type: 'sunday',
    description: 'Weekly worship service',
    schedule: 'Every Sunday 10:00 AM',
    location: 'Main Sanctuary',
    status: 'active',
    attendance_count: 45,
    souls_won: 2
  },
  {
    id: '2',
    name: 'Youth Crusade',
    type: 'crusade',
    description: 'Special evangelistic event for young people',
    schedule: 'Monthly - Last Saturday',
    location: 'Youth Center',
    status: 'active',
    attendance_count: 85,
    souls_won: 12
  },
  {
    id: '3',
    name: 'Community Outreach',
    type: 'evangelism',
    description: 'Reaching out to the community',
    schedule: 'Bi-weekly Saturdays',
    location: 'Various Locations',
    status: 'active',
    attendance_count: 25,
    souls_won: 8
  }
];

export default function Programs() {
  const [showAddProgram, setShowAddProgram] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<string | null>(null);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'sunday': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'crusade': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'evangelism': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'youth': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'prayer': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Church Programs
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage church programs and track attendance
          </p>
        </div>
        <button 
          onClick={() => setShowAddProgram(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Program</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CalendarDays className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Programs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{mockPrograms.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Attendance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockPrograms.reduce((sum, p) => sum + p.attendance_count, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Award className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Souls Won</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockPrograms.reduce((sum, p) => sum + p.souls_won, 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <CalendarDays className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Programs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {mockPrograms.filter(p => p.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockPrograms.map((program) => (
          <div key={program.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex space-x-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(program.type)}`}>
                  {program.type}
                </span>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(program.status)}`}>
                  {program.status}
                </span>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {program.name}
            </h3>
            
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
              {program.description}
            </p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-2" />
                <span>{program.schedule}</span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{program.location}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{program.attendance_count}</p>
                <p className="text-xs text-gray-500">Attendance</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{program.souls_won}</p>
                <p className="text-xs text-gray-500">Souls Won</p>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <button className="flex-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                View Details
              </button>
              <button className="flex-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                Mark Attendance
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Program Modal */}
      {showAddProgram && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add New Program
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Program Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter program name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="sunday">Sunday Service</option>
                  <option value="crusade">Crusade</option>
                  <option value="evangelism">Evangelism</option>
                  <option value="youth">Youth Program</option>
                  <option value="prayer">Prayer Meeting</option>
                  <option value="special">Special Event</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter program description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Schedule
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Every Sunday 10:00 AM"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter location"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddProgram(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddProgram(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}