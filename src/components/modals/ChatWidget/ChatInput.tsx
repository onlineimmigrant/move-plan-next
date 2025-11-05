'use client';
import { useRef, useEffect, useState } from 'react';
import { ArrowUpIcon, MagnifyingGlassIcon, BookmarkIcon, PlusIcon, Cog6ToothIcon, PaperClipIcon, XMarkIcon, FolderIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import TaskManagerModal from './TaskManagerModal';
import { ChatHistory, Task, Role, Model } from './types';
import styles from './ChatWidget.module.css';
import Button from '@/ui/Button';
import { useThemeColors } from '@/hooks/useThemeColors';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  sendMessage: () => void;
  isAuthenticated: boolean;
  isTyping: boolean;
  showSearchInput: boolean;
  toggleSearchInput: () => void;
  showSaveInput: boolean;
  toggleSaveInput: () => void;
  historyName: string;
  setHistoryName: (name: string) => void;
  saveChatHistory: () => void;
  loadChatHistory: (history: ChatHistory) => void;
  isSaving: boolean;
  chatHistories: ChatHistory[];
  query: string;
  setQuery: (query: string) => void;
  tasks: Task[];
  selectedTask: Task | null;
  setSelectedTask: (task: Task | null) => void;
  model: Model | null;
  userRole: Role;
  accessToken: string | null;
  onTasksUpdated: (tasks: Task[]) => void;
  defaultSettings: Record<string, any>;
  selectedSettings: Record<string, any> | null;
  setSelectedSettings: (settings: Record<string, any> | null) => void;
  onSettingsUpdated: (settings: Record<string, any>) => void;
  onModalOpen: () => void;
  onModalClose: () => void;
  userId: string | null;
  chatSessionId: string;
  attachedFiles: Array<{id: string; name: string; size: number}>;
  onFilesAttached: (files: Array<{id: string; name: string; size: number}>) => void;
  onFileRemoved: (fileId: string) => void;
  onOpenFiles: () => void;
  onOpenSettings: () => void;
}

export default function ChatInput({
  input,
  setInput,
  sendMessage,
  isAuthenticated,
  isTyping,
  showSearchInput,
  toggleSearchInput,
  showSaveInput,
  toggleSaveInput,
  historyName,
  setHistoryName,
  saveChatHistory,
  loadChatHistory,
  isSaving,
  chatHistories,
  query,
  setQuery,
  tasks,
  selectedTask,
  setSelectedTask,
  model,
  userRole,
  accessToken,
  onTasksUpdated,
  defaultSettings,
  selectedSettings,
  setSelectedSettings,
  onSettingsUpdated,
  onModalOpen,
  onModalClose,
  userId,
  chatSessionId,
  attachedFiles,
  onFilesAttached,
  onFileRemoved,
  onOpenFiles,
  onOpenSettings,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const themeColors = useThemeColors();

  // Initialize selectedSettings to defaultSettings on mount or when defaultSettings changes
  useEffect(() => {
    if (!isSettingsInitialized && defaultSettings && Object.keys(defaultSettings).length > 0) {
      setSelectedSettings(defaultSettings);
      setIsSettingsInitialized(true);
    }
  }, [defaultSettings, isSettingsInitialized, setSelectedSettings]);

  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Handle file upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !accessToken) return;

    setIsUploading(true);

    try {
      const uploadedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('chatSessionId', chatSessionId);

        const response = await fetch('/api/chat/files/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`
          },
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        uploadedFiles.push({
          id: data.file.id,
          name: data.file.name,
          size: data.file.size
        });
      }

      if (uploadedFiles.length > 0) {
        onFilesAttached([...attachedFiles, ...uploadedFiles]);
      }

    } catch (error: any) {
      console.error('File upload error:', error);
      alert(`Failed to upload file: ${error.message}`);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div>
      {isAuthenticated && (
        <>
          <div className={styles.taskBadgeContainer}>
            <div className="flex items-center gap-2 px-1">
              <Tooltip content="Manage Tasks">
                <button
                  onClick={() => {
                    setIsTaskModalOpen(true);
                    onModalOpen();
                  }}
                  className={styles.addTaskButton}
                  disabled={!model}
                >
                  <PlusIcon className="h-5 w-5" />
                </button>
              </Tooltip>
              {tasks.map((task) => (
                <button
                  key={task.name}
                  onClick={() => setSelectedTask(task.name === selectedTask?.name ? null : task)}
                  className={`${styles.taskBadge} ${task.name === selectedTask?.name ? styles.selected : ''} flex-shrink-0 whitespace-nowrap`}
                >
                  {task.name}
                </button>
              ))}
            </div>
          </div>
          <TaskManagerModal
            isOpen={isTaskModalOpen}
            onClose={() => {
              setIsTaskModalOpen(false);
              onModalClose();
            }}
            model={model}
            userRole={userRole}
            accessToken={accessToken}
            onTasksUpdated={onTasksUpdated}
          />
        </>
      )}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200">
        {/* Attached Files Display */}
        {attachedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {attachedFiles.map((file) => (
              <div
                key={file.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-sm"
              >
                <PaperClipIcon className="h-4 w-4 text-blue-600" />
                <span className="text-blue-900 font-medium truncate max-w-[150px]">
                  {file.name}
                </span>
                <span className="text-blue-600 text-xs">
                  {formatFileSize(file.size)}
                </span>
                <button
                  onClick={() => onFileRemoved(file.id)}
                  className="p-0.5 hover:bg-blue-200 rounded transition-colors"
                  title="Remove file"
                >
                  <XMarkIcon className="h-3.5 w-3.5 text-blue-600" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* File Attachment Button - visible on both mobile and desktop */}
          <Tooltip content="Attach files">
            <label className="cursor-pointer flex-shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt,.md,image/*"
                onChange={handleFileSelect}
                disabled={!isAuthenticated || isUploading}
                className="hidden"
              />
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 focus:outline-none ${
                isUploading
                  ? 'text-slate-300 cursor-not-allowed bg-slate-100'
                  : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 cursor-pointer'
              } ${attachedFiles.length > 0 ? 'text-blue-600 bg-blue-50' : ''}`}>
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <PaperClipIcon className="h-5 w-5" />
                )}
              </div>
            </label>
          </Tooltip>

          <div className="flex-1 relative flex flex-col gap-2">
            {/* Show task badge above input when task is selected */}
            {selectedTask && (
              <div className="flex items-center gap-2 px-1">
                <span 
                  className={`${styles.taskBadge} ${styles.selected}`}
                  style={{
                    backgroundColor: themeColors.cssVars.primary.lighter,
                    color: themeColors.cssVars.primary.base
                  }}
                >
                  {selectedTask.name}
                </span>
              </div>
            )}
            
            {/* Input always available */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              className="w-full resize-none border-0 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-base leading-relaxed min-h-[40px] max-h-[120px] py-2"
              placeholder={selectedTask ? `Ask about "${selectedTask.name}"...` : 'Ask anything...'}
              disabled={!isAuthenticated || isTyping}
              rows={1}
            />
          </div>

          <Tooltip content="Send message">
            <button
              onClick={sendMessage}
              className="flex items-center justify-center flex-shrink-0 w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:cursor-not-allowed"
              disabled={!isAuthenticated || isTyping || (!input.trim() && !selectedTask)}
            >
              <ArrowUpIcon className="h-5 w-5" />
            </button>
          </Tooltip>
        </div>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
          {/* Left side buttons - visible only on mobile */}
          <div className="flex items-center gap-2 sm:hidden">
            <Tooltip content="Search history">
              <button
                onClick={toggleSearchInput}
                className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isAuthenticated}
              >
                <MagnifyingGlassIcon className="h-4 w-4" />
              </button>
            </Tooltip>

            <Tooltip content="Save chat">
              <button
                onClick={toggleSaveInput}
                className="flex items-center justify-center w-8 h-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!isAuthenticated}
              >
                <BookmarkIcon className="h-4 w-4" />
              </button>
            </Tooltip>
          </div>

          {/* Right side buttons - Files and Settings */}
          <div className="flex items-center gap-2 sm:ml-auto">
            {/* Files button - visible only on mobile */}
            <div className="sm:hidden">
              <Tooltip content="Files">
                <button
                  onClick={onOpenFiles}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!isAuthenticated}
                >
                  <FolderIcon className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>

            {/* Settings button - visible only on mobile */}
            <div className="sm:hidden">
              <Tooltip content="Settings">
                <button
                  onClick={onOpenSettings}
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                    selectedSettings && Object.keys(selectedSettings).length > 0
                      ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                      : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                  disabled={!isAuthenticated}
                >
                  <Cog6ToothIcon className="h-4 w-4" />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}