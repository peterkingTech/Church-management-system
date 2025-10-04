import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export default function Announcements() {
  const { t } = useTranslation();
  const { userProfile, church } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    visible_to: 'all'
  });

  useEffect(() => {
    if (church?.id) {
      loadAnnouncements();
    }
  }, [church]);

  const loadAnnouncements = async () => {
    if (!church?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('announcements')
        .select(`
          *,
          created_by_user:users!announcements_created_by_fkey(full_name)
        `)
        .eq('church_id', church.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
      // Fallback to empty array for demo
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(announcement => 
    filterVisibility === 'all' || announcement.visible_to === filterVisibility
  );

  const handleCreateAnnouncement = async () => {
    if (!formData.title.trim() || !formData.message.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          church_id: church?.id,
          title: formData.title,
          message: formData.message,
          visible_to: formData.visible_to,
          created_by: userProfile?.id,
          status: 'active'
        });

      if (error) throw error;

      setFormData({ title: '', message: '', visible_to: 'all' });
      setShowAddForm(false);
      alert('Announcement created successfully!');
      await loadAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert('Failed to create announcement');
    }
  };

  const handleEdit = async (announcement: any) => {
    setFormData({
      title: announcement.title,
      message: announcement.message,
      visible_to: announcement.visible_to
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      try {
        const { error } = await supabase
          .from('announcements')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        alert('Announcement deleted successfully!');
        await loadAnnouncements();
      } catch (error) {
        console.error('Error deleting announcement:', error);
        alert('Failed to delete announcement');
      }
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'all': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'members': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'workers': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'pastors': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('menu.announcements')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {t('menu.announcements')} and notices
          </p>
        </div>
        {(userProfile?.role === 'pastor' || userProfile?.role === 'worker') && (
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('actions.send_announcement')}</span>
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Filter by visibility:
          </label>
          <select
            value={filterVisibility}
            onChange={(e) => setFilterVisibility(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Announcements</option>
            <option value="all">Public</option>
            <option value="members">Members Only</option>
            <option value="workers">Workers Only</option>
            <option value="pastors">Pastors Only</option>
          </select>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Loading announcements...</p>
          </div>
        ) : (
        filteredAnnouncements.map((announcement) => (
          <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <Megaphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {announcement.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getVisibilityColor(announcement.visible_to)}`}>
                      {announcement.visible_to}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      by {announcement.created_by_user?.full_name || 'Unknown'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => console.log('View announcement:', announcement.id)}
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {(userProfile?.role === 'pastor' || userProfile?.role === 'admin' || announcement.created_by === userProfile?.id) && (
                  <>
                    <button 
                      onClick={() => handleEdit(announcement)}
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(announcement.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
            
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {announcement.message}
            </p>
            
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>Posted on {new Date(announcement.created_at).toLocaleDateString()}</span>
              <div className="flex space-x-4">
                <button className="hover:text-blue-600 dark:hover:text-blue-400">
                  Share
                </button>
                <button className="hover:text-blue-600 dark:hover:text-blue-400">
                  Pin
                </button>
              </div>
            </div>
          </div>
        ))
        )}
        
        {!loading && filteredAnnouncements.length === 0 && (
          <div className="text-center py-12">
            <Megaphone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No announcements found. Create your first announcement!
            </p>
          </div>
        )}
      </div>

      {/* Add Announcement Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Announcement
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.title')}
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('common.title')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.message')}
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={t('common.message')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('common.visible_to')}
                </label>
                <select 
                  value={formData.visible_to}
                  onChange={(e) => setFormData(prev => ({ ...prev, visible_to: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="all">Everyone</option>
                  <option value="members">Members Only</option>
                  <option value="workers">Workers Only</option>
                  <option value="pastors">Pastors Only</option>
                </select>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {t('actions.cancel')}
              </button>
              <button
                onClick={handleCreateAnnouncement}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('actions.send_announcement')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}