import React, { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Bell, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const mockEvents = [
  { 
    id: '1', 
    title: 'Sunday Morning Service', 
    date: '2024-01-21', 
    time: '10:00 AM',
    location: 'Main Sanctuary',
    type: 'service',
    description: 'Weekly worship service',
    reminders: ['1 day before', '1 hour before']
  },
  { 
    id: '2', 
    title: 'Youth Bible Study', 
    date: '2024-01-22', 
    time: '7:00 PM',
    location: 'Youth Hall',
    type: 'study',
    description: 'Weekly youth Bible study session',
    reminders: ['2 hours before']
  },
  { 
    id: '3', 
    title: 'Prayer Meeting', 
    date: '2024-01-24', 
    time: '6:00 PM',
    location: 'Prayer Room',
    type: 'prayer',
    description: 'Midweek prayer and fellowship',
    reminders: ['30 minutes before']
  },
  { 
    id: '4', 
    title: 'Church Cleaning', 
    date: '2024-01-27', 
    time: '9:00 AM',
    location: 'Entire Church',
    type: 'service',
    description: 'Monthly church cleaning and maintenance',
    reminders: []
  },
];

export default function Calendar() {
  const { t } = useTranslation();
  const [events, setEvents] = useState(mockEvents);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    type: 'service',
    reminders: [] as string[]
  });

  const handleDateClick = (date: number) => {
    const clickedDate = new Date();
    clickedDate.setDate(date);
    const dateString = clickedDate.toISOString().split('T')[0];
    setSelectedDate(dateString);
    
    // Show events for this date
    const dayEvents = events.filter(event => event.date === dateString);
    if (dayEvents.length > 0) {
      setSelectedEvent(dayEvents[0]);
      setShowEventDetails(true);
    }
  };

  const handleCreateEvent = () => {
    if (!formData.title.trim() || !formData.date || !formData.time) {
      alert('Please fill in all required fields');
      return;
    }

    const newEvent = {
      id: Date.now().toString(),
      ...formData,
      reminders: formData.reminders
    };

    setEvents(prev => [...prev, newEvent]);
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      location: '',
      type: 'service',
      reminders: []
    });
    setShowAddForm(false);
    alert('Event created successfully!');
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setShowEventDetails(false);
      alert('Event deleted successfully!');
    }
  };

  const addReminder = (reminder: string) => {
    if (!formData.reminders.includes(reminder)) {
      setFormData(prev => ({
        ...prev,
        reminders: [...prev.reminders, reminder]
      }));
    }
  };

  const removeReminder = (reminder: string) => {
    setFormData(prev => ({
      ...prev,
      reminders: prev.reminders.filter(r => r !== reminder)
    }));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'service': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'study': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'prayer': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'youth': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const upcomingEvents = events
    .filter(event => new Date(event.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('calendar')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Church events and schedule management
          </p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {/* Calendar View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Widget */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex space-x-2">
                <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                  Previous
                </button>
                <button className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600">
                  Next
                </button>
              </div>
            </div>
            
            {/* Simple Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                  {day}
                </div>
              ))}
              {Array.from({ length: 35 }, (_, i) => {
                const date = i + 1;
                const hasEvent = events.some(event => 
                  new Date(event.date).getDate() === date
                );
                return (
                  <div 
                    key={i} 
                    onClick={() => handleDateClick(date)}
                    className={`p-2 text-center text-sm cursor-pointer rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                      hasEvent ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {date <= 31 ? date : ''}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upcoming Events
          </h3>
          {upcomingEvents.map((event) => (
            <div 
              key={event.id} 
              onClick={() => {
                setSelectedEvent(event);
                setShowEventDetails(true);
              }}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {event.title}
                </h4>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(event.type)}`}>
                  {event.type}
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {event.description}
              </p>
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <CalendarIcon className="w-3 h-3" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPin className="w-3 h-3" />
                  <span>{event.location}</span>
                </div>
                {event.reminders && event.reminders.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Bell className="w-3 h-3" />
                    <span>{event.reminders.length} reminder(s)</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Event Details Modal */}
      {showEventDetails && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedEvent.title}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setFormData({
                      title: selectedEvent.title,
                      description: selectedEvent.description,
                      date: selectedEvent.date,
                      time: selectedEvent.time,
                      location: selectedEvent.location,
                      type: selectedEvent.type,
                      reminders: selectedEvent.reminders || []
                    });
                    setShowEventDetails(false);
                    setShowAddForm(true);
                  }}
                  className="text-blue-600 hover:text-blue-900"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-300">
                {selectedEvent.description}
              </p>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span>{new Date(selectedEvent.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{selectedEvent.time}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{selectedEvent.location}</span>
                </div>
              </div>
              
              {selectedEvent.reminders && selectedEvent.reminders.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Reminders:</h4>
                  <div className="space-y-1">
                    {selectedEvent.reminders.map((reminder: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                        <Bell className="w-3 h-3" />
                        <span>{reminder}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              onClick={() => setShowEventDetails(false)}
              className="w-full mt-6 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {formData.title ? 'Edit Event' : 'Add New Event'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.description}
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Time
                </label>
                <input
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                  type="time"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter location"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Type
                </label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="service">Service</option>
                  <option value="study">Bible Study</option>
                  <option value="prayer">Prayer Meeting</option>
                  <option value="youth">Youth Event</option>
                </select>
              </div>
              
              {/* Reminders */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Reminders
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {formData.reminders.map((reminder, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400 text-xs rounded-full">
                        {reminder}
                        <button
                          type="button"
                          onClick={() => removeReminder(reminder)}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {['15 minutes before', '30 minutes before', '1 hour before', '1 day before'].map((reminder) => (
                      <button
                        key={reminder}
                        type="button"
                        onClick={() => addReminder(reminder)}
                        disabled={formData.reminders.includes(reminder)}
                        className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        + {reminder}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({
                    title: '',
                    description: '',
                    date: '',
                    time: '',
                    location: '',
                    type: 'service',
                    reminders: []
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateEvent}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {formData.title ? 'Update Event' : 'Add Event'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}