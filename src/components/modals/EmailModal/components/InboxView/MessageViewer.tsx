'use client';

import React, { useState } from 'react';
import { useInbox } from '../../hooks/useInbox';
import { 
  ArrowLeft,
  Reply,
  ReplyAll,
  Forward,
  Archive,
  Trash2,
  MoreVertical,
  Paperclip,
  Download,
  User
} from 'lucide-react';
import { LoadingState } from '@/components/modals/ShopModal/components';
import { sanitizeHTML } from '../../utils/sanitize';

interface MessageViewerProps {
  threadId: number | null;
  onBack: () => void;
  onReply: (message: any) => void;
  primary: { base: string; hover: string };
}

export default function MessageViewer({ threadId, onBack, onReply, primary }: MessageViewerProps) {
  const { currentThread, messages, fetchThreadMessages, isLoading } = useInbox();
  const [expandedMessageIds, setExpandedMessageIds] = useState<number[]>([]);

  React.useEffect(() => {
    if (threadId) {
      fetchThreadMessages(String(threadId));
    }
  }, [threadId]);

  React.useEffect(() => {
    if (messages.length > 0) {
      // Auto-expand the last message
      setExpandedMessageIds([messages[messages.length - 1].id]);
    }
  }, [messages]);

  const toggleMessage = (messageId: number) => {
    setExpandedMessageIds((prev) =>
      prev.includes(messageId)
        ? prev.filter((id) => id !== messageId)
        : [...prev, messageId]
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!threadId) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No message selected
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a thread from the inbox to view messages
          </p>
        </div>
      </div>
    );
  }

  if (isLoading || !currentThread) {
    return <LoadingState message="Loading messages..." />;
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors lg:hidden flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-0 overflow-hidden">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
              {currentThread.subject || '(No subject)'}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
              {currentThread.message_count} message{currentThread.message_count !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
          <button
            onClick={() => messages.length > 0 && onReply(messages[messages.length - 1])}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 text-xs sm:text-sm rounded-lg transition-colors font-medium"
            style={{
              background: `linear-gradient(135deg, ${primary.base}, ${primary.hover})`,
              color: 'white'
            }}
          >
            <Reply className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Reply</span>
          </button>
          <button className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ReplyAll className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Forward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <div className="flex-1" />
          <button className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-red-600">
            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full">
        <div className="p-2 sm:p-4 space-y-3 sm:space-y-4 max-w-full">
          {messages.map((message, index) => {
            const isExpanded = expandedMessageIds.includes(message.id);
            const isLast = index === messages.length - 1;

            return (
              <div
                key={message.id}
                className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl rounded-xl border border-white/20 max-w-full"
              >
                {/* Message Header */}
                <div
                  onClick={() => !isLast && toggleMessage(message.id)}
                  className={`p-3 sm:p-4 ${!isLast ? 'cursor-pointer hover:bg-white/20 dark:hover:bg-gray-700/20' : ''} transition-colors`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {message.from_name
                          ? message.from_name.charAt(0).toUpperCase()
                          : message.from_email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">
                            {message.from_name || message.from_email}
                          </p>
                          {!message.is_read && (
                            <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-primary text-white rounded flex-shrink-0">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">
                          {message.from_email}
                        </p>
                        {isExpanded && message.to_emails && (
                          <p className="text-[10px] sm:text-xs text-gray-500 mt-1 truncate">
                            to {message.to_emails.join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] sm:text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                      {formatDateTime(message.received_at)}
                    </span>
                  </div>
                </div>

              {/* Message Body */}
              {isExpanded && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4 w-full">
                  <div
                    className="prose prose-sm sm:prose dark:prose-invert max-w-full text-sm sm:text-base overflow-x-auto"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHTML(message.body_html || message.body_text?.replace(/\n/g, '<br />') || ''),
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
