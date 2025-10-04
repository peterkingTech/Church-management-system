import React, { useState } from 'react';
import { MessageSquare, Send, Inbox, Archive, User, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const mockReports = [
  {
    id: '1',
    sender_id: 'worker1',
    receiver_id: 'pastor1',
    sender: { full_name: 'Worker Sarah', role: 'worker' },
    receiver: { full_name: 'Pastor John', role: 'pastor' },
    message: 'Sunday service went well. We had 45 people in attendance. The new members class was successful with 8 participants.',
    type: 'report',
    date_sent: '2024-01-21T14:30:00Z',
    read: false,
    read_at: null
  },
  {
    id: '2',
    sender_id: 'pastor1',
    receiver_id: 'worker1',
    sender: { full_name: 'Pastor John', role: 'pastor' },
    receiver: { full_name: 'Worker Sarah', role: 'worker' },
    message: 'Please prepare the foundation class materials for next week. Focus on baptism and church membership.',
    type: 'directive',
    date_sent: '2024-01-20T10:15:00Z',
    read: true,
    read_at: '2024-01-20T11:00:00Z'
  }
];

export default function PDReports() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent'>('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'report' | 'directive'>('report');
  const [recipient, setRecipient] = useState('');

  const isPastor = userProfile?.role === 'pastor';
  
  const inboxReports = mockReports.filter(r => r.receiver_id === userProfile?.id);
  const sentReports = mockReports.filter(r => r.sender_id === userProfile?.id);
  const currentReports = activeTab === 'inbox' ? inboxReports : sentReports;

  const getTypeColor = (type: string) => {
    return type === 'directive' 
      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  };

  const selectedReportData = mockReports.find(r => r.id === selectedReport);

  const markAsRead = (reportId: string) => {
    setReports(prev => prev.map(report => 
      report.id === reportId 
        ? { ...report, read: true, read_at: new Date().toISOString() }
        : report
    ));
  };

  const handleReportClick = (reportId: string) => {
    setSelectedReport(reportId);
    const report = mockReports.find(r => r.id === reportId);
    if (report && !report.read && activeTab === 'inbox') {
      markAsRead(reportId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            PD Reports
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Pastor's Desk communication system
          </p>
        </div>
        <button 
          onClick={() => setShowCompose(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>Compose</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setActiveTab('inbox')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === 'inbox'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Inbox className="w-4 h-4" />
                  <span>Inbox</span>
                  {inboxReports.filter(r => !r.read).length > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {inboxReports.filter(r => !r.read).length}
                    </span>
                  )}
                </div>
              </button>
              <button
                onClick={() => setActiveTab('sent')}
                className={`flex-1 px-4 py-3 text-sm font-medium ${
                  activeTab === 'sent'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Archive className="w-4 h-4" />
                  <span>Sent</span>
                </div>
              </button>
            </div>

            {/* Reports */}
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {currentReports.map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleReportClick(report.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedReport === report.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  } ${!report.read && activeTab === 'inbox' ? 'bg-blue-25 dark:bg-blue-950/10' : ''}`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activeTab === 'inbox' ? report.sender?.full_name : report.receiver?.full_name}
                        </p>
                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(report.type)}`}>
                          {report.type}
                        </span>
                        {!report.read && activeTab === 'inbox' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                        {report.read && report.read_at && (
                          <span className="text-xs text-green-600 dark:text-green-400">✓ Read</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                        {report.message}
                      </p>
                      <div className="flex items-center space-x-1 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {new Date(report.date_sent).toLocaleDateString()}
                        </span>
                        {report.read && report.read_at && (
                          <span className="text-xs text-gray-400">
                            • Read {new Date(report.read_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Content */}
        <div className="lg:col-span-2">
          {selectedReportData ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {/* Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {activeTab === 'inbox' ? 'From' : 'To'}: {
                          activeTab === 'inbox' 
                            ? selectedReportData.sender?.full_name 
                            : selectedReportData.receiver?.full_name
                        }
                      </h2>
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(selectedReportData.type)}`}>
                        {selectedReportData.type}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>{new Date(selectedReportData.date_sent).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedReportData.message}
                  </p>
                </div>
              </div>

              {/* Reply Section */}
              <div className="p-6 border-t border-gray-200 dark:border-gray-600">
                <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                  <Send className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a Report
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a report from the list to view its contents
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Compose Message
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Type
                  </label>
                  <select 
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value as 'report' | 'directive')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="report">Report</option>
                    {isPastor && <option value="directive">Directive</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {messageType === 'report' ? 'To Pastor' : 'To Worker'}
                  </label>
                  <select 
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Select recipient</option>
                    <option value="pastor1">Pastor John</option>
                    <option value="worker1">Worker Sarah</option>
                    <option value="worker2">Worker David</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Message
                </label>
                <textarea
                  rows={6}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={messageType === 'report' ? 'Enter your service report...' : 'Enter your directive...'}
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCompose(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowCompose(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}