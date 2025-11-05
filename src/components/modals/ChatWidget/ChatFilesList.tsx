'use client';
import { useState, useEffect } from 'react';
import { 
  DocumentIcon, 
  DocumentTextIcon, 
  PhotoIcon,
  TrashIcon,
  XMarkIcon,
  PaperClipIcon,
  CloudArrowUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import styles from './ChatWidget.module.css';

interface ChatFile {
  id: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  expires_at: string;
  url: string;
}

interface ChatFilesListProps {
  isOpen: boolean;
  onClose: () => void;
  accessToken: string | null;
  userId: string | null;
  chatSessionId?: string;
  onFilesSelected?: (files: Array<{id: string; name: string; size: number}>) => void;
}

export default function ChatFilesList({
  isOpen,
  onClose,
  accessToken,
  userId,
  chatSessionId,
  onFilesSelected
}: ChatFilesListProps) {
  const [files, setFiles] = useState<ChatFile[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quota, setQuota] = useState({ used: 0, max: 50 * 1024 * 1024, percentage: 0 });

  useEffect(() => {
    if (isOpen && accessToken) {
      fetchFiles();
    }
  }, [isOpen, accessToken, chatSessionId]);

  const fetchFiles = async () => {
    if (!accessToken) return;

    setLoading(true);
    setError(null);

    try {
      const url = chatSessionId 
        ? `/api/chat/files/upload?chatSessionId=${chatSessionId}`
        : '/api/chat/files/upload';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.files || []);
      setQuota(data.quota || quota);
    } catch (err: any) {
      console.error('Fetch files error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (chatSessionId) {
        formData.append('chatSessionId', chatSessionId);
      }

      const response = await fetch('/api/chat/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Upload failed');
      }

      const data = await response.json();
      
      // Refresh file list
      await fetchFiles();

      // Auto-select newly uploaded file
      setSelectedFileIds(prev => [...prev, data.file.id]);

    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!accessToken || !confirm('Delete this file?')) return;

    try {
      const response = await fetch('/api/chat/files/upload', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileId })
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      // Remove from selected files
      setSelectedFileIds(prev => prev.filter(id => id !== fileId));
      
      // Refresh file list
      await fetchFiles();

    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleApplyFiles = () => {
    if (onFilesSelected) {
      const selectedFiles = files
        .filter(f => selectedFileIds.includes(f.id))
        .map(f => ({
          id: f.id,
          name: f.file_name,
          size: f.file_size
        }));
      onFilesSelected(selectedFiles);
    }
    onClose();
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <PhotoIcon className="h-5 w-5" />;
    if (mimeType === 'application/pdf') return <DocumentIcon className="h-5 w-5" />;
    return <DocumentTextIcon className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        style={{
          maxWidth: '600px',
          width: '95vw',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(32px)',
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ 
          flexShrink: 0,
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          padding: '16px 20px'
        }}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <PaperClipIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Attached Files</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              <XMarkIcon className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Storage Quota */}
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Storage Used</span>
              <span>{formatFileSize(quota.used)} / {formatFileSize(quota.max)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  quota.percentage > 90 ? 'bg-red-500' : 
                  quota.percentage > 70 ? 'bg-yellow-500' : 
                  'bg-blue-500'
                }`}
                style={{ width: `${Math.min(quota.percentage, 100)}%` }}
              />
            </div>
            {quota.percentage > 90 && (
              <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                <ExclamationTriangleIcon className="h-3 w-3" />
                Storage almost full. Oldest files will be deleted automatically.
              </p>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
          {/* Upload Button */}
          <label className="block mb-4">
            <input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md,image/*"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
            <div className={`
              flex items-center justify-center gap-2 px-4 py-3 
              border-2 border-dashed rounded-lg cursor-pointer
              transition-all duration-200
              ${uploading 
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                : 'border-blue-400 hover:border-blue-600 hover:bg-blue-50'
              }
            `}>
              <CloudArrowUpIcon className={`h-5 w-5 ${uploading ? 'text-gray-400' : 'text-blue-600'}`} />
              <span className={`text-sm font-medium ${uploading ? 'text-gray-400' : 'text-blue-600'}`}>
                {uploading ? 'Uploading...' : 'Upload File'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              PDF, DOCX, TXT, MD, Images (Max 10MB)
            </p>
          </label>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Files List */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm">Loading files...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <PaperClipIcon className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-sm">No files uploaded yet</p>
              <p className="text-xs mt-1">Upload files to provide context for AI analysis</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map(file => {
                const isSelected = selectedFileIds.includes(file.id);
                const expiresIn = Math.ceil((new Date(file.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div
                    key={file.id}
                    className={`
                      p-3 rounded-lg border transition-all duration-200 cursor-pointer
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                      }
                    `}
                    onClick={() => toggleFileSelection(file.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                        {getFileIcon(file.mime_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                          {file.file_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {formatFileSize(file.file_size)} • {formatDate(file.created_at)}
                          {expiresIn <= 2 && (
                            <span className="ml-2 text-orange-600">Expires in {expiresIn}d</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        className="p-1.5 hover:bg-red-100 rounded transition-colors"
                        title="Delete file"
                      >
                        <TrashIcon className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          flexShrink: 0,
          backdropFilter: 'blur(16px)',
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          padding: '16px 20px'
        }}>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {selectedFileIds.length} file{selectedFileIds.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white/50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyFiles}
                disabled={selectedFileIds.length === 0}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-colors
                  ${selectedFileIds.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }
                `}
              >
                Add to Chat ({selectedFileIds.length})
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
