import React, { useState } from 'react';
import { Folder, Plus, MessageCircle, FileText, Clock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const mockFolders = [
  {
    id: '1',
    title: 'Foundation Class',
    type: 'foundation',
    description: 'New member foundation training materials',
    created_by: 'Pastor John',
    created_at: '2024-01-15',
    comments_count: 5
  },
  {
    id: '2',
    title: 'Integration Program',
    type: 'integration',
    description: 'Member integration and follow-up',
    created_by: 'Worker Sarah',
    created_at: '2024-01-10',
    comments_count: 3
  },
  {
    id: '3',
    title: 'Ministry Training',
    type: 'ministry',
    description: 'Training materials for ministry workers',
    created_by: 'Pastor John',
    created_at: '2024-01-08',
    comments_count: 8
  }
];

const mockComments = [
  {
    id: '1',
    folder_id: '1',
    comment_by: 'Pastor John',
    comment: 'Please review the foundation materials for next week\'s class.',
    type: 'directive',
    created_at: '2024-01-16T10:30:00Z'
  },
  {
    id: '2',
    folder_id: '1',
    comment_by: 'Worker Sarah',
    comment: 'Foundation class went well. 8 new members attended.',
    type: 'service_note',
    created_at: '2024-01-16T14:20:00Z'
  }
];

export default function Folders() {
  const { userProfile } = useAuth();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showAddComment, setShowAddComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('comment');

  const canCreateFolder = userProfile?.role === 'pastor' || userProfile?.role === 'worker';
  const selectedFolderData = mockFolders.find(f => f.id === selectedFolder);
  const folderComments = mockComments.filter(c => c.folder_id === selectedFolder);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'foundation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'integration': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'ministry': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case 'directive': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'service_note': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'pd_report': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Folders
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Organize church materials and communications
          </p>
        </div>
        {canCreateFolder && (
          <button 
            onClick={() => setShowAddFolder(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New Folder</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Folders List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-600">
              <h3 className="font-semibold text-gray-900 dark:text-white">All Folders</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600">
              {mockFolders.map((folder) => (
                <div
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedFolder === folder.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <Folder className="w-5 h-5 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">{folder.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{folder.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(folder.type)}`}>
                          {folder.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          {folder.comments_count} comments
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Folder Content */}
        <div className="lg:col-span-2">
          {selectedFolderData ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {/* Folder Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {selectedFolderData.title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mt-1">
                      {selectedFolderData.description}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(selectedFolderData.type)}`}>
                        {selectedFolderData.type}
                      </span>
                      <span className="text-sm text-gray-500">
                        Created by {selectedFolderData.created_by}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAddComment(true)}
                    className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Add Comment</span>
                  </button>
                </div>
              </div>

              {/* Comments */}
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Comments & Notes
                </h3>
                <div className="space-y-4">
                  {folderComments.map((comment) => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {comment.comment_by}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getCommentTypeColor(comment.type)}`}>
                            {comment.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(comment.created_at).toLocaleString()}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Select a Folder
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Choose a folder from the list to view its contents and comments
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Folder Modal */}
      {showAddFolder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Folder
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Folder Title
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter folder title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="foundation">Foundation</option>
                  <option value="integration">Integration</option>
                  <option value="ministry">Ministry</option>
                  <option value="general">General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter folder description"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddFolder(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddFolder(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {showAddComment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Comment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment Type
                </label>
                <select 
                  value={commentType}
                  onChange={(e) => setCommentType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="comment">General Comment</option>
                  <option value="service_note">Service Note</option>
                  <option value="pd_report">PD Report</option>
                  {userProfile?.role === 'pastor' && (
                    <option value="directive">Directive</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comment
                </label>
                <textarea
                  rows={4}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter your comment"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddComment(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddComment(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}