import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  File, 
  Download, 
  Trash2, 
  Eye, 
  FolderPlus, 
  Search,
  Filter,
  MoreVertical,
  FileText,
  Image,
  Video,
  Music,
  Archive
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface FileItem {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  entity_type: string;
  entity_id?: string;
  version: number;
  is_current_version: boolean;
  access_level: string;
  allowed_roles: string[];
  download_count: number;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  uploader_name?: string;
}

export default function FileManager() {
  const { userProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    entity_type: 'general',
    entity_id: '',
    access_level: 'church',
    allowed_roles: ['pastor', 'admin', 'worker', 'member']
  });

  React.useEffect(() => {
    loadFiles();
  }, [userProfile]);

  const loadFiles = async () => {
    if (!userProfile?.church_id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('file_uploads')
        .select(`
          *,
          uploader:users!file_uploads_uploaded_by_fkey(full_name)
        `)
        .eq('church_id', userProfile.church_id)
        .eq('is_current_version', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFiles(data?.map(file => ({
        ...file,
        uploader_name: file.uploader?.full_name
      })) || []);
    } catch (error) {
      console.error('Error loading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileUpload = async (fileList: File[]) => {
    if (!userProfile?.church_id || fileList.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(0);

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = `${userProfile.church_id}/${uploadForm.entity_type}/${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('church-files')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Save file metadata
        const { error: dbError } = await supabase
          .from('file_uploads')
          .insert({
            church_id: userProfile.church_id,
            uploaded_by: userProfile.id,
            file_name: file.name,
            file_path: filePath,
            file_size: file.size,
            file_type: fileExt || 'unknown',
            mime_type: file.type,
            entity_type: uploadForm.entity_type,
            entity_id: uploadForm.entity_id || null,
            access_level: uploadForm.access_level,
            allowed_roles: uploadForm.allowed_roles
          });

        if (dbError) throw dbError;

        setUploadProgress(((i + 1) / fileList.length) * 100);
      }

      await loadFiles();
      setShowUploadModal(false);
      alert(`Successfully uploaded ${fileList.length} file(s)!`);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const { data, error } = await supabase.storage
        .from('church-files')
        .download(file.file_path);

      if (error) throw error;

      // Create download link
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update download count
      await supabase
        .from('file_uploads')
        .update({ download_count: file.download_count + 1 })
        .eq('id', file.id);

      await loadFiles();
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file.');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('church-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('file_uploads')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      await loadFiles();
      alert('File deleted successfully!');
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file.');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType.startsWith('video/')) return Video;
    if (mimeType.startsWith('audio/')) return Music;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || file.entity_type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            File Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage church documents, images, and files
          </p>
        </div>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Files</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Files</option>
            <option value="general">General</option>
            <option value="event">Events</option>
            <option value="report">Reports</option>
            <option value="announcement">Announcements</option>
          </select>
        </div>
      </div>

      {/* Files Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFiles.map((file) => {
          const FileIcon = getFileIcon(file.mime_type);
          return (
            <div key={file.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <FileIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="relative">
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <h3 className="font-medium text-gray-900 dark:text-white mb-2 truncate" title={file.file_name}>
                {file.file_name}
              </h3>
              
              <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
                <p>Size: {formatFileSize(file.file_size)}</p>
                <p>Type: {file.file_type.toUpperCase()}</p>
                <p>Uploaded by: {file.uploader_name}</p>
                <p>Downloads: {file.download_count}</p>
                <p>Version: {file.version}</p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleDownload(file)}
                  className="flex-1 flex items-center justify-center space-x-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded text-xs hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => handleDelete(file.id)}
                  className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-1 rounded text-xs hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFiles.length === 0 && !loading && (
        <div className="text-center py-12">
          <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No files found matching your search.' : 'No files uploaded yet.'}
          </p>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Upload Files
              </h3>
              
              {/* Drag and Drop Area */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-300 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Supports: PDF, Images, Documents (Max 50MB)
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => e.target.files && handleFileUpload(Array.from(e.target.files))}
                className="hidden"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
              />

              {/* Upload Options */}
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={uploadForm.entity_type}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, entity_type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="general">General</option>
                    <option value="event">Event</option>
                    <option value="report">Report</option>
                    <option value="announcement">Announcement</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Access Level
                  </label>
                  <select
                    value={uploadForm.access_level}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, access_level: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="public">Public</option>
                    <option value="church">Church Members</option>
                    <option value="role">Specific Roles</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                    <span>Uploading...</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowUploadModal(false)}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}