'use client';

import React, { useEffect, useState } from 'react';
import { useInbox } from '../../hooks/useInbox';
import { 
  Inbox,
  Search,
  RefreshCw,
  Filter,
  Mail,
  MailOpen,
  Paperclip,
  Star,
  Archive,
  Trash2,
  MoreVertical
} from 'lucide-react';
import { LoadingState, EmptyState } from '@/components/modals/ShopModal/components';

interface InboxFilters {
  dateFrom?: string;
  dateTo?: string;
  fromEmail?: string;
  toEmail?: string;
  hasAttachments?: boolean;
  isRead?: boolean | null;
  isStarred?: boolean | null;
  labels?: string[];
}

interface ThreadListProps {
  onSelectThread: (threadId: number) => void;
  selectedThreadId: number | null;
  initialSearchQuery?: string;
  filters?: InboxFilters;
  primary: { base: string; hover: string };
}

export default function ThreadList({ onSelectThread, selectedThreadId, initialSearchQuery, filters, primary }: ThreadListProps) {
  const { threads, isLoading, fetchThreads, markThreadAsRead, markThreadAsUnread, syncEmails } = useInbox();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [filterRead, setFilterRead] = useState<'all' | 'unread' | 'read'>('all');
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (initialSearchQuery !== undefined) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const handleSync = async () => {
    setSyncing(true);
    await syncEmails();
    setSyncing(false);
  };

  const handleFilterChange = (filter: 'all' | 'unread' | 'read') => {
    setFilterRead(filter);
    if (filter === 'all') {
      fetchThreads();
    } else {
      fetchThreads({ isRead: filter === 'read' });
    }
  };

  const filteredThreads = threads.filter((thread) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        thread.subject.toLowerCase().includes(query) ||
        thread.participants.some((p) => p.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return <LoadingState message="Loading inbox..." />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {/* Filters with Sync Button */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                filterRead !== 'all'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  : ''
              }`}
              style={filterRead === 'all' ? {
                background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
                color: 'white'
              } : undefined}
            >
              All
            </button>
            <button
            onClick={() => handleFilterChange('unread')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              filterRead !== 'unread'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                : ''
            }`}
            style={filterRead === 'unread' ? {
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              color: 'white'
            } : undefined}
          >
            Unread
          </button>
          <button
            onClick={() => handleFilterChange('read')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              filterRead !== 'read'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                : ''
            }`}
            style={filterRead === 'read' ? {
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              color: 'white'
            } : undefined}
          >
            Read
          </button>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            title="Sync emails"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {filteredThreads.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredThreads.map((thread) => (
              <div
                key={thread.id}
                onClick={() => {
                  onSelectThread(thread.id);
                  if (!thread.is_read) {
                    markThreadAsRead(String(thread.id));
                  }
                }}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                  selectedThreadId === thread.id ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                } ${!thread.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {thread.is_read ? (
                      <MailOpen className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Mail className="w-5 h-5 text-primary" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${
                          thread.is_read 
                            ? 'text-gray-700 dark:text-gray-300' 
                            : 'text-gray-900 dark:text-white font-semibold'
                        }`}>
                          {thread.participants[0] || 'Unknown'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                        {formatDate(thread.last_message_at)}
                      </span>
                    </div>

                    <p className={`text-sm mb-1 truncate ${
                      thread.is_read 
                        ? 'text-gray-600 dark:text-gray-400' 
                        : 'text-gray-900 dark:text-white font-medium'
                    }`}>
                      {thread.subject || '(No subject)'}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      {thread.has_attachments && (
                        <span className="flex items-center gap-1">
                          <Paperclip className="w-3 h-3" />
                        </span>
                      )}
                      <span>{thread.message_count} message{thread.message_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Inbox className="w-12 h-12 text-gray-400 mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {searchQuery ? 'No emails found' : 'No emails'}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              {searchQuery 
                ? 'Try a different search term' 
                : 'Connect your email account to start receiving emails'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
