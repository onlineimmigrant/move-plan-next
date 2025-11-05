'use client';
import { useState, useRef, useEffect } from 'react';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  BookmarkIcon,
  PencilIcon,
  CheckIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { ChatHistory } from './types';

interface SearchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatHistories: ChatHistory[];
  onSelectHistory: (history: ChatHistory) => void;
  onToggleBookmark: (historyId: number, bookmarked: boolean) => Promise<void>;
  onRenameHistory: (historyId: number, newName: string) => Promise<void>;
  onNewChat: () => void;
}

// Helper to group chats by date
function groupChatsByDate(chats: ChatHistory[]): Map<string, ChatHistory[]> {
  const groups = new Map<string, ChatHistory[]>();
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  chats.forEach(chat => {
    const chatDate = new Date(chat.updated_at);
    const chatDateStr = chatDate.toDateString();
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();

    let label: string;
    if (chatDateStr === todayStr) {
      label = 'Today';
    } else if (chatDateStr === yesterdayStr) {
      label = 'Yesterday';
    } else if (chatDate > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
      label = 'Last 7 Days';
    } else if (chatDate > new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)) {
      label = 'Last 30 Days';
    } else {
      label = chatDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(chat);
  });

  return groups;
}

export default function SearchHistoryModal({
  isOpen,
  onClose,
  chatHistories,
  onSelectHistory,
  onToggleBookmark,
  onRenameHistory,
  onNewChat,
}: SearchHistoryModalProps) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingId !== null && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleStartEdit = (chat: ChatHistory) => {
    setEditingId(chat.id);
    setEditingName(chat.name);
  };

  const handleSaveEdit = async () => {
    if (editingId !== null && editingName.trim()) {
      await onRenameHistory(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Filter chats
  const filteredChats = query
    ? chatHistories.filter((history) =>
        history.name.toLowerCase().includes(query.toLowerCase())
      )
    : chatHistories;

  // Sort by updated_at (most recent first)
  const sortedChats = [...filteredChats].sort((a, b) => 
    new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
  );

  // Group by date
  const groupedChats = groupChatsByDate(sortedChats);

  return (
    <div 
      className="fixed inset-0 z-[10000010] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
              <MagnifyingGlassIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Chat History
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Search and New Chat Button */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search chats..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>
          <button
            onClick={() => {
              onNewChat();
              onClose();
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            <PlusIcon className="h-5 w-5" />
            <span className="hidden sm:inline">New Chat</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {sortedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                {query ? 'No chats found' : 'No chat history yet'}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                {query ? 'Try a different search term' : 'Start a conversation to see your chat history'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Array.from(groupedChats.entries()).map(([dateLabel, chats]) => (
                <div key={dateLabel}>
                  {/* Date Header */}
                  <div className="sticky top-0 bg-white dark:bg-gray-800 py-2 mb-2 z-10">
                    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {dateLabel}
                    </h3>
                  </div>

                  {/* Chats in this date group */}
                  <div className="space-y-1">
                    {chats.map((chat) => (
                      <div
                        key={chat.id}
                        className="group flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        {/* Bookmark Toggle */}
                        <button
                          onClick={() => onToggleBookmark(chat.id, !chat.bookmarked)}
                          className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                          aria-label={chat.bookmarked ? 'Remove bookmark' : 'Add bookmark'}
                        >
                          {chat.bookmarked ? (
                            <BookmarkSolidIcon className="h-5 w-5 text-yellow-500" />
                          ) : (
                            <BookmarkIcon className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
                          )}
                        </button>

                        {/* Chat Name or Edit Input */}
                        {editingId === chat.id ? (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={handleKeyDown}
                              className="flex-1 px-2 py-1 bg-white dark:bg-gray-900 border border-blue-500 rounded text-sm text-gray-900 dark:text-white focus:outline-none"
                            />
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 hover:bg-green-100 dark:hover:bg-green-900 rounded text-green-600 dark:text-green-400"
                              aria-label="Save"
                            >
                              <CheckIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-1 hover:bg-red-100 dark:hover:bg-red-900 rounded text-red-600 dark:text-red-400"
                              aria-label="Cancel"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                onSelectHistory(chat);
                                onClose();
                              }}
                              className="flex-1 text-left"
                            >
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {chat.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                {chat.messages.length} {chat.messages.length === 1 ? 'message' : 'messages'}
                                {' • '}
                                {new Date(chat.updated_at).toLocaleString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                })}
                              </p>
                            </button>

                            {/* Edit Button (visible on hover) */}
                            <button
                              onClick={() => handleStartEdit(chat)}
                              className="flex-shrink-0 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-all"
                              aria-label="Rename"
                            >
                              <PencilIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            💡 Chats are automatically saved for 60 days. Bookmark important chats to keep them forever.
          </p>
        </div>
      </div>
    </div>
  );
}
