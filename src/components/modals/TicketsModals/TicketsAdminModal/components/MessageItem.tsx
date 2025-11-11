/**
 * MessageItem Component
 * Displays a single message/response in the conversation
 * Memoized for performance optimization
 */

import React, { memo } from 'react';
import { Check } from 'lucide-react';
import type { TicketResponse, Avatar } from '../types';
import type { TicketAttachment } from '@/lib/fileUpload';

interface MessageItemProps {
  response: TicketResponse;
  avatar?: Avatar | null;
  displayName: string;
  isCurrentAvatar: boolean;
  showAvatarChange: boolean;
  searchQuery?: string;
  attachmentUrls: Record<string, string>;
  renderAvatar: (avatar: Avatar | null | undefined, name: string, isAdmin: boolean) => React.ReactNode;
  onDownloadAttachment: (filePath: string, fileName: string) => void;
  isImageFile: (fileType: string) => boolean;
  getFileIcon: (fileType: string) => string;
  formatFileSize: (size: number) => string;
  isGrouped?: boolean;
  isLastInGroup?: boolean;
}

const MessageItemComponent = ({
  response,
  avatar,
  displayName,
  isCurrentAvatar,
  showAvatarChange,
  searchQuery = '',
  attachmentUrls,
  renderAvatar,
  onDownloadAttachment,
  isImageFile,
  getFileIcon,
  formatFileSize,
  isGrouped = false,
  isLastInGroup = true,
}: MessageItemProps) => {
  /**
   * Calculate adaptive width based on message length
   */
  const getAdaptiveWidth = (message: string): string => {
    const charCount = message.length;
    if (charCount < 20) return 'max-w-[30%]';
    if (charCount < 50) return 'max-w-[50%]';
    if (charCount < 100) return 'max-w-[65%]';
    return 'max-w-[80%]';
  };
  /**
   * Highlight search text
   */
  const highlightText = (text: string, query: string) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-slate-900 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  };

  return (
    <>
      {/* Show avatar change indicator */}
      {showAvatarChange && (
        <div className="flex items-center gap-3 my-3 animate-fade-in motion-reduce:animate-none">
          <div className="flex-1 border-t border-white/10 dark:border-gray-700/20"></div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            {renderAvatar(avatar, displayName, response.is_admin)}
            <span>
              {displayName} {isCurrentAvatar ? '(You)' : ''} joined the conversation
            </span>
          </div>
          <div className="flex-1 border-t border-white/10 dark:border-gray-700/20"></div>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`flex items-start ${
          response.is_admin ? 'justify-end' : 'justify-start'
        } ${isGrouped ? 'mt-1' : 'mt-4'} animate-slide-in motion-reduce:animate-none`}
      >
        <div className={getAdaptiveWidth(response.message)}>
          <div
            className={`${
              response.is_admin
                ? 'bg-white/60 dark:bg-gray-800/50 backdrop-blur-md border border-white/20 dark:border-gray-700/20 text-slate-900 dark:text-slate-100'
                : 'bg-white/50 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 dark:border-gray-700/20 text-slate-800 dark:text-slate-200'
            } ${
              isGrouped && !isLastInGroup
                ? 'rounded-2xl'
                : 'rounded-2xl'
            } shadow-sm hover:shadow-md transition-shadow px-3.5 py-2.5`}
            title={`${displayName} • ${new Date(response.created_at).toLocaleString()}`}
          >
            <div>
              {/* Message text */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {searchQuery ? highlightText(response.message, searchQuery) : response.message}
              </p>
              
              {/* Footer: Timestamp and Read Receipts */}
              <div className="flex items-center gap-1.5 mt-1.5 justify-between">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                  {new Date(response.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                
                {/* Read receipts for admin messages */}
                {response.is_admin && (
                  <div className="flex items-center">
                    {response.is_read ? (
                      <span className="inline-flex items-center" title="Read">
                        <Check className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                        <Check className="h-3 w-3 text-slate-400 dark:text-slate-500 -ml-1.5" />
                      </span>
                    ) : (
                      <span className="inline-flex" title="Delivered">
                        <Check className="h-3 w-3 text-slate-400/60 dark:text-slate-500/50" />
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Attachments */}
              {response.attachments && response.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {response.attachments.map((attachment: TicketAttachment) => (
                    <div key={attachment.id}>
                      {isImageFile(attachment.file_type) && attachmentUrls[attachment.id] ? (
                        // Image preview
                        <div className="relative group">
                          <img
                            src={attachmentUrls[attachment.id]}
                            alt={attachment.file_name}
                            className="max-w-full max-h-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() =>
                              onDownloadAttachment(attachment.file_path, attachment.file_name)
                            }
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors motion-reduce:transition-none rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity motion-reduce:transition-none bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-2">
                              <svg
                                className="w-5 h-5 text-slate-700 dark:text-slate-200"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                              </svg>
                            </div>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                            <p className="text-xs text-white truncate">{attachment.file_name}</p>
                          </div>
                        </div>
                      ) : (
                        // File download button - glass card style
                        <button
                          onClick={() =>
                            onDownloadAttachment(attachment.file_path, attachment.file_name)
                          }
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-700/30 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-md transition-all text-slate-700 dark:text-slate-200"
                        >
                          <span className="text-xl flex-shrink-0">{getFileIcon(attachment.file_type)}</span>
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-xs font-medium truncate">
                              {attachment.file_name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {formatFileSize(attachment.file_size)}
                            </p>
                          </div>
                          <svg
                            className="w-4 h-4 flex-shrink-0 text-slate-500 dark:text-slate-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Memoized MessageItem to prevent unnecessary re-renders
 * Only re-renders when critical props change
 */
export const MessageItem = memo(MessageItemComponent, (prevProps, nextProps) => {
  // Check if response has changed
  if (prevProps.response.id !== nextProps.response.id) return false;
  if (prevProps.response.message !== nextProps.response.message) return false;
  if (prevProps.response.created_at !== nextProps.response.created_at) return false;
  if (prevProps.response.is_admin !== nextProps.response.is_admin) return false;
  
  // Check avatar changes
  if (prevProps.avatar?.id !== nextProps.avatar?.id) return false;
  if (prevProps.displayName !== nextProps.displayName) return false;
  if (prevProps.isCurrentAvatar !== nextProps.isCurrentAvatar) return false;
  if (prevProps.showAvatarChange !== nextProps.showAvatarChange) return false;
  
  // Check grouping state
  if (prevProps.isGrouped !== nextProps.isGrouped) return false;
  if (prevProps.isLastInGroup !== nextProps.isLastInGroup) return false;
  
  // Check search query
  if (prevProps.searchQuery !== nextProps.searchQuery) return false;
  
  // Check attachments
  const prevAttachments = prevProps.response.attachments || [];
  const nextAttachments = nextProps.response.attachments || [];
  if (prevAttachments.length !== nextAttachments.length) return false;
  
  // Check attachment URLs for this response's attachments
  for (const attachment of prevAttachments) {
    const prevUrl = prevProps.attachmentUrls[attachment.file_path];
    const nextUrl = nextProps.attachmentUrls[attachment.file_path];
    if (prevUrl !== nextUrl) return false;
  }
  
  // All critical props are equal, skip re-render
  return true;
});
