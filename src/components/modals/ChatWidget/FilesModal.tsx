'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createClient } from '@supabase/supabase-js';
import { XMarkIcon, TrashIcon, DocumentArrowDownIcon, PencilIcon, ChevronDownIcon, DocumentTextIcon, FolderIcon, FolderPlusIcon, ArrowLeftIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import { 
  DocumentIcon, 
  FolderIcon as FolderIconSolid,
  LinkIcon,
  ListBulletIcon,
  CodeBracketIcon,
  PhotoIcon,
  Bars3BottomLeftIcon
} from '@heroicons/react/24/solid';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions, Transition } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import Button from '@/ui/Button';
import styles from './ChatWidget.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const MAX_FILE_SIZE = 100 * 1024; // 100KB in bytes

interface File {
  filename: string;
  format: 'txt' | 'pdf' | 'md' | 'json' | 'doc';
  content: string; // Base64 for binary files, plain text for text files
  created_at: string;
  folder?: string; // Folder path, undefined means root
}

type SortKey = 'filename' | 'format' | 'created_at';
type SortOrder = 'asc' | 'desc';

interface FilesModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string | null;
}

export default function FilesModal({ isOpen, onClose, userId }: FilesModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);
  const [newFilename, setNewFilename] = useState<string>('');
  const [viewingFile, setViewingFile] = useState<File | null>(null);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editedContent, setEditedContent] = useState<string>('');
  const [isEditingFilename, setIsEditingFilename] = useState(false);
  const [editedFilename, setEditedFilename] = useState<string>('');
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentFolder, setCurrentFolder] = useState<string | null>(null); // null = root
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [movingFile, setMovingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingContent, setIsSavingContent] = useState(false);

  // Fetch files
  useEffect(() => {
    const fetchFiles = async () => {
      if (!userId || !isOpen) return;

      try {
        const { data, error: settingsError } = await supabase
          .from('ai_user_settings')
          .select('files')
          .eq('user_id', userId)
          .single();

        if (settingsError) {
          throw new Error('Failed to fetch files: ' + settingsError.message);
        }

        const fetchedFiles = Array.isArray(data?.files) ? data.files : [];
        const sortedFiles = fetchedFiles.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setFiles(sortedFiles);
        setError(null);
      } catch (err: any) {
        console.error('[FilesModal] Fetch error:', err);
        setError(err.message || 'Failed to load files');
      }
    };

    fetchFiles();
  }, [userId, isOpen]);

  // Sort files
  const sortFiles = (key: SortKey, order: SortOrder) => {
    const sorted = [...files].sort((a, b) => {
      if (key === 'created_at') {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (key === 'filename') {
        return order === 'asc'
          ? a.filename.localeCompare(b.filename)
          : b.filename.localeCompare(a.filename);
      } else {
        return order === 'asc'
          ? a.format.localeCompare(b.format)
          : b.format.localeCompare(a.format);
      }
    });
    setFiles(sorted);
    setSortKey(key);
    setSortOrder(order);
  };

  // Download file
  const downloadFile = (file: File) => {
    try {
      if (file.format === 'txt' || file.format === 'md' || file.format === 'json') {
        const mimeTypes = {
          txt: 'text/plain',
          md: 'text/markdown',
          json: 'application/json'
        };
        const blob = new Blob([file.content], { type: mimeTypes[file.format] || 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (file.format === 'pdf' || file.format === 'doc') {
        const mimeTypes = {
          pdf: 'application/pdf',
          doc: 'application/msword'
        };
        const binary = atob(file.content);
        const len = binary.length;
        const buffer = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          buffer[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([buffer], { type: mimeTypes[file.format] });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('[FilesModal] Download error:', err);
      setError('Failed to download file');
    }
  };

  // Delete file
  const deleteFile = async (filename: string) => {
    if (!userId) {
      setError('Please log in to delete files.');
      return;
    }

    try {
      const updatedFiles = files.filter((f) => f.filename !== filename);
      const { error: updateError } = await supabase
        .from('ai_user_settings')
        .update({ files: updatedFiles })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to delete file: ' + updateError.message);
      }

      setFiles(updatedFiles);
      setError(null);
    } catch (err: any) {
      console.error('[FilesModal] Delete error:', err);
      setError(err.message || 'Failed to delete file');
    }
  };

  // Update filename
  const updateFilename = async () => {
    if (!userId || !editingFile) {
      setError('Please log in to update files.');
      return;
    }

    try {
      const updatedFiles = files.map((f) =>
        f.filename === editingFile.filename
          ? { ...f, filename: `${newFilename}.${f.format}` }
          : f
      );
      const { error: updateError } = await supabase
        .from('ai_user_settings')
        .update({ files: updatedFiles })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to update filename: ' + updateError.message);
      }

      setFiles(updatedFiles);
      setEditingFile(null);
      setNewFilename('');
      setError(null);
    } catch (err: any) {
      console.error('[FilesModal] Update error:', err);
      setError(err.message || 'Failed to update filename');
    }
  };

  // View file content
  const viewFileContent = (file: File) => {
    setViewingFile(file);
    setIsEditingContent(false);
    setEditedContent(file.content);
    setIsEditingFilename(false);
    const nameWithoutExtension = file.filename.replace(/\.[^/.]+$/, '');
    setEditedFilename(nameWithoutExtension);
  };

  // Save edited content
  const saveEditedContent = async () => {
    if (!userId || !viewingFile) {
      setError('Please log in to save changes.');
      return;
    }

    setIsSavingContent(true);
    try {
      const updatedFiles = files.map((f) =>
        f.filename === viewingFile.filename && f.folder === viewingFile.folder
          ? { ...f, content: editedContent }
          : f
      );

      const { error: updateError } = await supabase
        .from('ai_user_settings')
        .update({ files: updatedFiles })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to save changes: ' + updateError.message);
      }

      setFiles(updatedFiles);
      setViewingFile({ ...viewingFile, content: editedContent });
      setIsEditingContent(false);
      setError(null);
    } catch (err: any) {
      console.error('[FilesModal] Save content error:', err);
      setError(err.message || 'Failed to save changes');
    } finally {
      setIsSavingContent(false);
    }
  };

  // Save edited filename
  const saveEditedFilename = async () => {
    if (!userId || !viewingFile || !editedFilename.trim()) {
      setError('Filename cannot be empty.');
      return;
    }

    const newFullFilename = `${editedFilename.trim()}.${viewingFile.format}`;
    
    // Check for duplicate
    if (files.some(f => f.filename === newFullFilename && f.folder === viewingFile.folder && f.filename !== viewingFile.filename)) {
      setError(`A file named "${newFullFilename}" already exists in this ${viewingFile.folder ? 'folder' : 'location'}.`);
      return;
    }

    setIsSavingContent(true);
    try {
      const updatedFiles = files.map((f) =>
        f.filename === viewingFile.filename && f.folder === viewingFile.folder
          ? { ...f, filename: newFullFilename }
          : f
      );

      const { error: updateError } = await supabase
        .from('ai_user_settings')
        .update({ files: updatedFiles })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to update filename: ' + updateError.message);
      }

      setFiles(updatedFiles);
      setViewingFile({ ...viewingFile, filename: newFullFilename });
      setIsEditingFilename(false);
      setError(null);
    } catch (err: any) {
      console.error('[FilesModal] Save filename error:', err);
      setError(err.message || 'Failed to update filename');
    } finally {
      setIsSavingContent(false);
    }
  };

  // Markdown formatting helpers
  const insertMarkdown = (before: string, after: string = '', placeholder: string = 'text') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = editedContent.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newText = 
      editedContent.substring(0, start) + 
      before + textToInsert + after + 
      editedContent.substring(end);
    
    setEditedContent(newText);
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const insertHeading = (level: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = editedContent.lastIndexOf('\n', start - 1) + 1;
    const prefix = '#'.repeat(level) + ' ';
    
    const newText = 
      editedContent.substring(0, lineStart) + 
      prefix + 
      editedContent.substring(lineStart);
    
    setEditedContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  const insertList = (ordered: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = editedContent.lastIndexOf('\n', start - 1) + 1;
    const prefix = ordered ? '1. ' : '- ';
    
    const newText = 
      editedContent.substring(0, lineStart) + 
      prefix + 
      editedContent.substring(lineStart);
    
    setEditedContent(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length);
    }, 0);
  };

  // Get unique folders from files
  const getFolders = (): string[] => {
    const folderSet = new Set<string>();
    files.forEach(file => {
      if (file.folder) {
        folderSet.add(file.folder);
      }
    });
    return Array.from(folderSet).sort();
  };

  // Create new folder
  const createFolder = async () => {
    if (!userId || !newFolderName.trim()) {
      setError('Folder name is required.');
      return;
    }

    const folderName = newFolderName.trim();
    const folders = getFolders();
    if (folders.includes(folderName)) {
      setError('Folder already exists.');
      return;
    }

    try {
      // Create a folder marker file to ensure the folder persists
      const folderMarker: File = {
        filename: '.folder',
        format: 'txt',
        content: 'Folder marker',
        created_at: new Date().toISOString(),
        folder: folderName,
      };

      const updatedFiles = [...files, folderMarker];
      
      const { error: updateError } = await supabase
        .from('ai_user_settings')
        .update({ files: updatedFiles })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to create folder: ' + updateError.message);
      }

      setFiles(updatedFiles);
      setIsCreatingFolder(false);
      setNewFolderName('');
      setCurrentFolder(folderName);
      setError(null);
    } catch (err: any) {
      console.error('[FilesModal] Create folder error:', err);
      setError(err.message || 'Failed to create folder');
    }
  };

  // Move file to folder
  const moveFileToFolder = async (file: File, targetFolder: string | null) => {
    if (!userId) {
      setError('Please log in to move files.');
      return;
    }

    try {
      const updatedFiles = files.map((f) =>
        f.filename === file.filename
          ? { ...f, folder: targetFolder || undefined }
          : f
      );
      const { error: updateError } = await supabase
        .from('ai_user_settings')
        .update({ files: updatedFiles })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to move file: ' + updateError.message);
      }

      setFiles(updatedFiles);
      setMovingFile(null);
      setError(null);
    } catch (err: any) {
      console.error('[FilesModal] Move file error:', err);
      setError(err.message || 'Failed to move file');
    }
  };

  // Delete folder
  const deleteFolder = async (folderName: string) => {
    if (!userId) {
      setError('Please log in to delete folders.');
      return;
    }

    // Check if folder has files (excluding the marker)
    const filesInFolder = files.filter(f => f.folder === folderName && f.filename !== '.folder');
    if (filesInFolder.length > 0) {
      setError(`Cannot delete folder "${folderName}". Move or delete files first.`);
      return;
    }

    try {
      // Remove all files with this folder (including marker)
      const updatedFiles = files.filter(f => f.folder !== folderName);
      
      const { error: updateError } = await supabase
        .from('ai_user_settings')
        .update({ files: updatedFiles })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to delete folder: ' + updateError.message);
      }

      setFiles(updatedFiles);
      setCurrentFolder(null);
      setError(null);
    } catch (err: any) {
      console.error('[FilesModal] Delete folder error:', err);
      setError(err.message || 'Failed to delete folder');
    }
  };

  // Upload file
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (!uploadedFile || !userId) {
      setError('Please log in to upload files.');
      return;
    }

    // Check file size
    if (uploadedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 100KB limit. Your file is ${(uploadedFile.size / 1024).toFixed(2)}KB.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check file format
    const fileExtension = uploadedFile.name.split('.').pop()?.toLowerCase();
    const allowedFormats = ['json', 'md', 'pdf', 'doc', 'txt'];
    if (!fileExtension || !allowedFormats.includes(fileExtension)) {
      setError('Only .json, .md, .pdf, .doc, and .txt files are allowed.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // Check for duplicate filename
    const baseFilename = uploadedFile.name;
    if (files.some(f => f.filename === baseFilename && f.folder === currentFolder)) {
      setError(`A file named "${baseFilename}" already exists in this ${currentFolder ? 'folder' : 'location'}.`);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      let content: string;
      const format = fileExtension as 'txt' | 'pdf' | 'md' | 'json' | 'doc';

      // Read file based on format
      if (format === 'pdf' || format === 'doc') {
        // Binary files - convert to base64
        const reader = new FileReader();
        content = await new Promise((resolve, reject) => {
          reader.onload = () => {
            const arrayBuffer = reader.result as ArrayBuffer;
            const bytes = new Uint8Array(arrayBuffer);
            const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
            resolve(btoa(binary));
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(uploadedFile);
        });
      } else {
        // Text files - read as text
        const reader = new FileReader();
        content = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(uploadedFile);
        });
      }

      const newFile: File = {
        filename: baseFilename,
        format,
        content,
        created_at: new Date().toISOString(),
        folder: currentFolder || undefined,
      };

      const updatedFiles = [...files, newFile];

      const { error: updateError } = await supabase
        .from('ai_user_settings')
        .update({ files: updatedFiles })
        .eq('user_id', userId);

      if (updateError) {
        throw new Error('Failed to upload file: ' + updateError.message);
      }

      setFiles(updatedFiles);
      setError(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('[FilesModal] Upload error:', err);
      setError(err.message || 'Failed to upload file');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsUploading(false);
    }
  };

  // Get file icon based on format
  const getFileIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <DocumentIcon className="h-8 w-8 text-red-500 dark:text-red-400" />;
      case 'doc':
        return <DocumentIcon className="h-8 w-8 text-blue-600 dark:text-blue-500" />;
      case 'md':
        return <DocumentTextIcon className="h-8 w-8 text-purple-500 dark:text-purple-400" />;
      case 'json':
        return <DocumentTextIcon className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />;
      case 'txt':
      default:
        return <DocumentTextIcon className="h-8 w-8 text-blue-500 dark:text-blue-400" />;
    }
  };

  if (!isOpen) return null;

  const folders = getFolders();
  // Filter out .folder marker files from display
  const visibleFiles = files.filter(f => f.filename !== '.folder');
  const currentFiles = currentFolder 
    ? visibleFiles.filter(f => f.folder === currentFolder)
    : visibleFiles.filter(f => !f.folder);

  // Calculate totals
  const totalFolders = folders.length;
  const totalFiles = visibleFiles.length;

  return createPortal(
    <div className={styles.modalOverlay} style={{ zIndex: 10000010 }}>
      <div 
        className="fixed backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 border-0 rounded-2xl shadow-lg flex flex-col overflow-hidden"
        style={{ 
          zIndex: 10000011, 
          maxWidth: '56rem',
          width: '90%',
          maxHeight: '85vh',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        {/* Header */}
        <div className="backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 border-b border-slate-200/50 dark:border-gray-700/50 px-6 py-4">
          <div className="flex justify-between items-start w-full">
            <div className="flex-1">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Manage Files</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {currentFolder ? (
                  <>
                    <span className="text-amber-600 dark:text-amber-400">{currentFolder}</span>
                    <span className="mx-1.5">•</span>
                    <span>{currentFiles.length} {currentFiles.length === 1 ? 'file' : 'files'}</span>
                  </>
                ) : (
                  <>
                    <span>{totalFolders} {totalFolders === 1 ? 'folder' : 'folders'}</span>
                    <span className="mx-1.5">•</span>
                    <span>{totalFiles} {totalFiles === 1 ? 'file' : 'files'}</span>
                  </>
                )}
              </p>
            </div>
            <button 
              onClick={onClose} 
              className="ml-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-gray-800/50 transition-all duration-200"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error && (
            <div className="mb-4 p-3 backdrop-blur-xl bg-red-500/20 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg border border-red-500/30">
              {error}
            </div>
          )}

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setCurrentFolder(null)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                currentFolder === null
                  ? 'bg-blue-500/20 dark:bg-blue-400/20 text-blue-700 dark:text-blue-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <FolderIcon className="h-4 w-4" />
              All Files
            </button>
            {currentFolder && (
              <>
                <span className="text-slate-400 dark:text-slate-600">/</span>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500/20 dark:bg-blue-400/20 text-blue-700 dark:text-blue-300">
                  <FolderIconSolid className="h-4 w-4" />
                  {currentFolder}
                </div>
              </>
            )}
          </div>

          {/* Search and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            {/* Search Input */}
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="w-full px-4 py-2 backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border border-slate-300/50 dark:border-slate-600/50 rounded-lg text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              />
            </div>

            {/* Upload File Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-blue-500/20 dark:bg-blue-400/20 hover:bg-blue-500/30 dark:hover:bg-blue-400/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUpTrayIcon className="h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.md,.pdf,.doc,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* New Folder Button */}
            <button
              onClick={() => setIsCreatingFolder(true)}
              className="flex items-center gap-2 px-4 py-2 backdrop-blur-xl bg-green-500/20 dark:bg-green-400/20 hover:bg-green-500/30 dark:hover:bg-green-400/30 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <FolderPlusIcon className="h-4 w-4" />
              New Folder
            </button>

            {/* Sort Dropdown */}
            <Listbox
              value={{ key: sortKey, order: sortOrder }}
              onChange={(value) => sortFiles(value.key, value.order)}
            >
              {({ open }) => (
                <div className="relative">
                  <ListboxButton className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:opacity-70 transition-all duration-200 whitespace-nowrap">
                    Sort: {sortKey} ({sortOrder.toUpperCase()})
                    <ChevronDownIcon className={`h-4 w-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                  </ListboxButton>
                  <Transition
                    enter="transition ease-out duration-100"
                    enterFrom="opacity-0 scale-95"
                    enterTo="opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="opacity-100 scale-100"
                    leaveTo="opacity-0 scale-95"
                  >
                    <ListboxOptions className="absolute z-50 right-0 mt-2 w-48 max-h-60 overflow-auto rounded-xl backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 py-2 shadow-lg border-0 focus:outline-none">
                      {[
                        { key: 'filename', order: 'asc', label: 'Filename (A-Z)' },
                        { key: 'filename', order: 'desc', label: 'Filename (Z-A)' },
                        { key: 'format', order: 'asc', label: 'Format (TXT-PDF)' },
                        { key: 'format', order: 'desc', label: 'Format (PDF-TXT)' },
                        { key: 'created_at', order: 'asc', label: 'Date (Oldest)' },
                        { key: 'created_at', order: 'desc', label: 'Date (Newest)' },
                      ].map((option) => (
                        <ListboxOption
                          key={`${option.key}-${option.order}`}
                          value={option}
                          className={({ active }) =>
                            `cursor-pointer px-4 py-2 mx-2 rounded-lg text-sm transition-all duration-200 ${
                              active
                                ? 'bg-blue-500/20 dark:bg-blue-400/20 backdrop-blur-xl'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-white/30 dark:hover:bg-gray-800/30'
                            }`
                          }
                        >
                          {option.label}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </Transition>
                </div>
              )}
            </Listbox>
          </div>

          {/* Folders and Files List */}
          {(() => {
            // Filter files based on search query and current folder
            const filteredFiles = searchQuery
              ? files.filter((file) =>
                  file.filename.toLowerCase().includes(searchQuery.toLowerCase())
                )
              : currentFiles;

            return (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2">
                {/* Show folders when at root level */}
                {!currentFolder && !searchQuery && folders.length > 0 && (
                  <div className="mb-3">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
                      Folders
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {folders.map((folder) => {
                        // Exclude .folder marker files from count
                        const filesInFolder = visibleFiles.filter(f => f.folder === folder).length;
                        return (
                          <div
                            key={folder}
                            className="group flex flex-col items-center gap-2 p-4 backdrop-blur-xl bg-amber-500/10 dark:bg-amber-400/10 rounded-lg hover:bg-amber-500/20 dark:hover:bg-amber-400/20 transition-all duration-200 hover:scale-[1.02] cursor-pointer relative"
                            onClick={() => setCurrentFolder(folder)}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteFolder(folder);
                              }}
                              className="absolute top-2 right-2 p-1.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-400/20 backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100"
                              title="Delete Folder"
                            >
                              <TrashIcon className="h-3.5 w-3.5" />
                            </button>
                            <FolderIconSolid className="h-12 w-12 text-amber-500 dark:text-amber-400 flex-shrink-0" />
                            <div className="text-center w-full">
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                                {folder}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {filesInFolder} {filesInFolder === 1 ? 'file' : 'files'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Files section */}
                {filteredFiles.length > 0 && (
                  <>
                    {!currentFolder && !searchQuery && folders.length > 0 && (
                      <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 px-1 mt-4">
                        Files
                      </h3>
                    )}
                    {filteredFiles.map((file, index) => (
                  <div
                    key={`${file.folder || 'root'}-${file.filename}-${file.created_at}-${index}`}
                    className="group flex items-center gap-3 p-3 backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 hover:scale-[1.01]"
                  >
                    {/* Left: File Type Icon */}
                    <div className="flex-shrink-0">
                      {getFileIcon(file.format)}
                    </div>

                    {/* Center: Filename (largest section) */}
                    <div className="flex-1 min-w-0">
                      <button
                        onClick={() => viewFileContent(file)}
                        className="text-left text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block w-full"
                      >
                        {file.filename}
                      </button>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {file.format.toUpperCase()}
                      </p>
                    </div>

                    {/* Right: Date and Time */}
                    <div className="flex-shrink-0 text-right hidden sm:block">
                      <p className="text-xs text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                        {new Date(file.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5 whitespace-nowrap">
                        {new Date(file.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => setMovingFile(file)}
                        className="p-2 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 dark:hover:bg-amber-400/20 backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-95"
                        title="Move to Folder"
                      >
                        <FolderIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingFile(file);
                          setNewFilename(file.filename.replace(`.${file.format}`, ''));
                        }}
                        className="p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 dark:hover:bg-blue-400/20 backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-95"
                        title="Edit Filename"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => downloadFile(file)}
                        className="p-2 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-500/20 dark:hover:bg-green-400/20 backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-95"
                        title="Download"
                      >
                        <DocumentArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteFile(file.filename)}
                        className="p-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-400/20 backdrop-blur-xl transition-all duration-200 hover:scale-110 active:scale-95"
                        title="Delete"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                  </>
                )}

                {/* No files message */}
                {filteredFiles.length === 0 && (currentFolder || searchQuery || folders.length === 0) && (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">
                    {searchQuery ? 'No files match your search.' : 'No files found.'}
                  </p>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Create Folder Modal */}
      {isCreatingFolder && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[10000012]">
          <div className="backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg border-0">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Create New Folder</h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value.replace(/[^a-zA-Z0-9-_ ]/g, ''))}
              className="w-full p-3 backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border border-slate-300/50 dark:border-slate-600/50 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder="Folder name"
              autoFocus
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={createFolder}>Create</Button>
            </div>
          </div>
        </div>
      )}

      {/* Move File to Folder Modal */}
      {movingFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[10000012]">
          <div className="backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg border-0">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Move to Folder</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Move <span className="font-medium">{movingFile.filename}</span> to:
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {/* Root option */}
              <button
                onClick={() => moveFileToFolder(movingFile, null)}
                className="w-full text-left px-4 py-3 rounded-lg backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 flex items-center gap-3"
              >
                <FolderIcon className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                <span className="text-sm text-slate-700 dark:text-slate-200">Root (No folder)</span>
              </button>
              {/* Folder options */}
              {folders.map((folder) => (
                <button
                  key={folder}
                  onClick={() => moveFileToFolder(movingFile, folder)}
                  className="w-full text-left px-4 py-3 rounded-lg backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200 flex items-center gap-3"
                >
                  <FolderIconSolid className="h-5 w-5 text-amber-500 dark:text-amber-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-200">{folder}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setMovingFile(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Filename Modal */}
      {editingFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[10000012]">
          <div className="backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 rounded-xl p-6 max-w-sm w-full mx-4 shadow-lg border-0">
            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4">Edit Filename</h3>
            <input
              type="text"
              value={newFilename}
              onChange={(e) => setNewFilename(e.target.value.replace(/[^a-zA-Z0-9-_]/g, ''))}
              className="w-full p-3 backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border border-slate-300/50 dark:border-slate-600/50 rounded-lg text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              placeholder="Enter new filename"
            />
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setEditingFile(null);
                  setNewFilename('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={updateFilename}>Save</Button>
            </div>
          </div>
        </div>
      )}

      {/* View File Modal */}
      {viewingFile && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[10000012] p-4">
          <div className="backdrop-blur-2xl bg-white/50 dark:bg-gray-900/50 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-lg border-0">
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-4 border-b border-slate-200/50 dark:border-gray-700/50">
              {isEditingFilename ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editedFilename}
                    onChange={(e) => setEditedFilename(e.target.value)}
                    className="flex-1 px-3 py-1.5 backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border border-slate-300/50 dark:border-slate-600/50 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                    placeholder="Enter filename"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        saveEditedFilename();
                      }
                      if (e.key === 'Escape') {
                        setIsEditingFilename(false);
                        const nameWithoutExtension = viewingFile.filename.replace(/\.[^/.]+$/, '');
                        setEditedFilename(nameWithoutExtension);
                      }
                    }}
                    onBlur={() => {
                      setIsEditingFilename(false);
                      const nameWithoutExtension = viewingFile.filename.replace(/\.[^/.]+$/, '');
                      setEditedFilename(nameWithoutExtension);
                    }}
                  />
                  <span className="text-slate-500 dark:text-slate-400">.{viewingFile.format}</span>
                </div>
              ) : (
                <h3 
                  className="text-lg font-bold text-slate-700 dark:text-slate-200 truncate cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={() => setIsEditingFilename(true)}
                  title="Click to edit filename"
                >
                  {viewingFile.filename}
                </h3>
              )}
              <button
                onClick={() => {
                  setViewingFile(null);
                  setIsEditingContent(false);
                  setIsEditingFilename(false);
                }}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-red-500/20 dark:hover:bg-red-400/20 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 hover:scale-110 active:scale-95 ml-4"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {viewingFile.format === 'md' ? (
                isEditingContent ? (
                  <div className="flex flex-col h-full gap-3">
                    {/* Markdown Toolbar */}
                    <div className="flex flex-wrap gap-1 p-2 backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 rounded-lg border border-slate-300/50 dark:border-slate-600/50">
                      {/* Headings */}
                      <button
                        onClick={() => insertHeading(1)}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Heading 1"
                      >
                        <span className="font-bold text-sm">H1</span>
                      </button>
                      <button
                        onClick={() => insertHeading(2)}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Heading 2"
                      >
                        <span className="font-bold text-sm">H2</span>
                      </button>
                      <button
                        onClick={() => insertHeading(3)}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Heading 3"
                      >
                        <span className="font-bold text-sm">H3</span>
                      </button>
                      
                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                      
                      {/* Text Formatting */}
                      <button
                        onClick={() => insertMarkdown('**', '**', 'bold text')}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Bold"
                      >
                        <span className="font-bold">B</span>
                      </button>
                      <button
                        onClick={() => insertMarkdown('*', '*', 'italic text')}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Italic"
                      >
                        <span className="italic">I</span>
                      </button>
                      <button
                        onClick={() => insertMarkdown('~~', '~~', 'strikethrough')}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Strikethrough"
                      >
                        <span className="line-through">S</span>
                      </button>
                      <button
                        onClick={() => insertMarkdown('`', '`', 'code')}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Inline Code"
                      >
                        <CodeBracketIcon className="h-4 w-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                      
                      {/* Lists */}
                      <button
                        onClick={() => insertList(false)}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Bullet List"
                      >
                        <ListBulletIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => insertList(true)}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Numbered List"
                      >
                        <Bars3BottomLeftIcon className="h-4 w-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                      
                      {/* Links & Images */}
                      <button
                        onClick={() => insertMarkdown('[', '](url)', 'link text')}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Link"
                      >
                        <LinkIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => insertMarkdown('![', '](url)', 'alt text')}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Image"
                      >
                        <PhotoIcon className="h-4 w-4" />
                      </button>
                      
                      <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                      
                      {/* Quote & Code Block */}
                      <button
                        onClick={() => insertMarkdown('> ', '', 'quote')}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Quote"
                      >
                        <span className="font-bold">"</span>
                      </button>
                      <button
                        onClick={() => insertMarkdown('```\n', '\n```', 'code block')}
                        className="p-2 rounded hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                        title="Code Block"
                      >
                        <span className="font-mono text-xs">{'{ }'}</span>
                      </button>
                    </div>
                    
                    {/* Textarea */}
                    <textarea
                      ref={textareaRef}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="flex-1 p-4 backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border border-slate-300/50 dark:border-slate-600/50 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                      placeholder="Enter markdown content..."
                    />
                  </div>
                ) : (
                  <div className="prose prose-slate dark:prose-invert max-w-none backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 p-6 rounded-lg h-full overflow-auto">
                    <ReactMarkdown>{viewingFile.content}</ReactMarkdown>
                  </div>
                )
              ) : viewingFile.format === 'txt' || viewingFile.format === 'json' ? (
                isEditingContent ? (
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="w-full h-full p-4 backdrop-blur-xl bg-white/50 dark:bg-gray-800/50 border border-slate-300/50 dark:border-slate-600/50 rounded-lg text-slate-800 dark:text-slate-200 font-mono text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none"
                    placeholder="Enter content..."
                  />
                ) : (
                  <pre className="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap backdrop-blur-xl bg-white/30 dark:bg-gray-800/30 p-4 rounded-lg h-full overflow-auto font-mono">
                    {viewingFile.content}
                  </pre>
                )
              ) : viewingFile.format === 'pdf' ? (
                <iframe
                  src={`data:application/pdf;base64,${viewingFile.content}`}
                  className="w-full h-[60vh] rounded-lg backdrop-blur-xl bg-white/30 dark:bg-gray-800/30"
                  title={viewingFile.filename}
                />
              ) : (
                <div className="text-slate-600 dark:text-slate-400 text-center py-8">
                  <p className="mb-4">Preview not available for .{viewingFile.format} files</p>
                  <Button onClick={() => downloadFile(viewingFile)}>
                    Download File
                  </Button>
                </div>
              )}
            </div>

            {/* Footer - Action Buttons */}
            <div className="flex justify-between items-center gap-3 p-6 pt-4 border-t border-slate-200/50 dark:border-gray-700/50">
              {/* Left side - Edit button for content */}
              <div>
                {!isEditingContent && (viewingFile.format === 'md' || viewingFile.format === 'txt' || viewingFile.format === 'json') && (
                  <Button
                    onClick={() => setIsEditingContent(true)}
                  >
                    <PencilIcon className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>

              {/* Right side - Save/Cancel buttons for content editing */}
              <div className="flex gap-3">
                {isEditingContent && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingContent(false);
                        setEditedContent(viewingFile.content);
                      }}
                      disabled={isSavingContent}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveEditedContent}
                      disabled={isSavingContent}
                    >
                      {isSavingContent ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
