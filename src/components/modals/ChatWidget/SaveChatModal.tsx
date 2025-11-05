'use client';
import { useState, useEffect } from 'react';
import { XMarkIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import Button from '@/ui/Button';

interface SaveChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  isSaving: boolean;
}

export default function SaveChatModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
}: SaveChatModalProps) {
  const [chatName, setChatName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setChatName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (chatName.trim()) {
      onSave(chatName.trim());
      setChatName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && chatName.trim() && !isSaving) {
      handleSave();
    }
  };

  return (
    <div className="fixed inset-0 z-[10000010] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <BookmarkIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Save Chat
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
            aria-label="Close"
            disabled={isSaving}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="mb-4">
            <label
              htmlFor="chatName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Chat Name
            </label>
            <input
              id="chatName"
              type="text"
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter a name for this chat..."
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white placeholder-gray-400 transition-all duration-200"
              autoFocus
              disabled={isSaving}
            />
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Give your conversation a memorable name to easily find it later.
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-xl transition-all duration-200"
              disabled={isSaving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!chatName.trim() || isSaving}
              className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white font-medium rounded-xl transition-all duration-200 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                'Save Chat'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
