import React, { useState } from 'react';
import { StickyNote, Plus, Pin, Palette, Search, Grid, List } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const noteColors = [
  { name: 'Yellow', value: '#fef3c7', text: '#92400e' },
  { name: 'Blue', value: '#dbeafe', text: '#1e40af' },
  { name: 'Green', value: '#d1fae5', text: '#065f46' },
  { name: 'Pink', value: '#fce7f3', text: '#be185d' },
  { name: 'Purple', value: '#e9d5ff', text: '#6b21a8' },
  { name: 'Orange', value: '#fed7aa', text: '#c2410c' },
  { name: 'Gray', value: '#f3f4f6', text: '#374151' }
];

export default function Notes() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [notes, setNotes] = useState([
    {
      id: '1',
      title: 'Sunday Service Notes',
      content: 'Remember to prepare worship songs for next Sunday. Focus on praise and worship theme.',
      user_id: userProfile?.id || '',
      is_pinned: true,
      color: '#fef3c7',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      title: 'Prayer Requests',
      content: 'Follow up with Sister Mary about her health condition. Schedule prayer meeting for Thursday.',
      user_id: userProfile?.id || '',
      is_pinned: false,
      color: '#dbeafe',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    color: '#fef3c7',
    is_pinned: false
  });

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter(note => note.is_pinned);
  const unpinnedNotes = filteredNotes.filter(note => !note.is_pinned);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingNote) {
      setNotes(prev => prev.map(note => 
        note.id === editingNote.id 
          ? { ...note, ...formData, updated_at: new Date().toISOString() }
          : note
      ));
    } else {
      const newNote = {
        id: Date.now().toString(),
        ...formData,
        user_id: userProfile?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      setNotes(prev => [newNote, ...prev]);
    }

    setFormData({ title: '', content: '', color: '#fef3c7', is_pinned: false });
    setShowAddForm(false);
    setEditingNote(null);
  };

  const handleEdit = (note: any) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      color: note.color,
      is_pinned: note.is_pinned
    });
    setShowAddForm(true);
  };

  const handleDelete = (noteId: string) => {
    if (confirm(t('notes.confirm_delete'))) {
      setNotes(prev => prev.filter(note => note.id !== noteId));
    }
  };

  const togglePin = (noteId: string) => {
    setNotes(prev => prev.map(note => 
      note.id === noteId 
        ? { ...note, is_pinned: !note.is_pinned, updated_at: new Date().toISOString() }
        : note
    ));
  };

  const NoteCard = ({ note }: { note: any }) => {
    const colorData = noteColors.find(c => c.value === note.color) || noteColors[0];
    
    return (
      <div 
        className="rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group"
        style={{ backgroundColor: note.color }}
        onClick={() => handleEdit(note)}
      >
        {note.is_pinned && (
          <Pin className="absolute top-2 right-2 w-4 h-4" style={{ color: colorData.text }} />
        )}
        <h3 className="font-semibold mb-2 pr-6" style={{ color: colorData.text }}>
          {note.title}
        </h3>
        <p className="text-sm line-clamp-4" style={{ color: colorData.text }}>
          {note.content}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs opacity-70" style={{ color: colorData.text }}>
            {new Date(note.updated_at).toLocaleDateString()}
          </span>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePin(note.id);
              }}
              className="p-1 rounded hover:bg-black hover:bg-opacity-10"
            >
              <Pin className="w-3 h-3" style={{ color: colorData.text }} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(note.id);
              }}
              className="p-1 rounded hover:bg-black hover:bg-opacity-10"
            >
              ×
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('notes.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {t('notes.subtitle')}
          </p>
        </div>
        <button 
          onClick={() => {
            setEditingNote(null);
            setFormData({ title: '', content: '', color: '#fef3c7', is_pinned: false });
            setShowAddForm(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t('notes.add_note')}</span>
        </button>
      </div>

      {/* Search and View Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t('notes.search_notes')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pinned Notes */}
      {pinnedNotes.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Pin className="w-5 h-5 mr-2" />
            {t('notes.pinned')}
          </h2>
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
          }>
            {pinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {/* Other Notes */}
      {unpinnedNotes.length > 0 && (
        <div>
          {pinnedNotes.length > 0 && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {t('notes.other_notes')}
            </h2>
          )}
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
            : 'space-y-3'
          }>
            {unpinnedNotes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        </div>
      )}

      {filteredNotes.length === 0 && (
        <div className="text-center py-12">
          <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? t('notes.no_notes_found') : t('notes.no_notes_yet')}
          </p>
        </div>
      )}

      {/* Add/Edit Note Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {editingNote ? t('notes.edit_note') : t('notes.add_note')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('notes.title')}
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={t('notes.enter_title')}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('notes.content')}
                  </label>
                  <textarea
                    rows={6}
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                    placeholder={t('notes.enter_content')}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('notes.color')}
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {noteColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                        className={`w-8 h-8 rounded-full border-2 ${
                          formData.color === color.value 
                            ? 'border-gray-900 dark:border-white' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="pin-note"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_pinned: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor="pin-note" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    {t('notes.pin_note')}
                  </label>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingNote(null);
                    setFormData({ title: '', content: '', color: '#fef3c7', is_pinned: false });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingNote ? t('actions.update') : t('actions.create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}