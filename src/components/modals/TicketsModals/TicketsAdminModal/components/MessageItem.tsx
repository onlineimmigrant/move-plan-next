/**
 * MessageItem Component
 * Displays a single message/response in the conversation
 */

import React from 'react';
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
}

export function MessageItem({
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
}: MessageItemProps) {
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
        <div className="flex items-center gap-3 my-3 animate-fade-in">
          <div className="flex-1 border-t border-slate-300"></div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {renderAvatar(avatar, displayName, response.is_admin)}
            <span>
              {displayName} {isCurrentAvatar ? '(You)' : ''} joined the conversation
            </span>
          </div>
          <div className="flex-1 border-t border-slate-300"></div>
        </div>
      )}

      {/* Message bubble */}
      <div
        className={`flex items-start ${
          response.is_admin ? 'justify-end' : 'justify-start'
        } animate-slide-in`}
      >
        <div className="max-w-[80%]">
          <div
            className={`${
              response.is_admin
                ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl rounded-tr-sm'
                : 'bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'
            } shadow-sm px-3 py-2 cursor-help`}
            title={`${displayName} • ${new Date(response.created_at).toLocaleString()}`}
          >
            <div>
              {/* Message text */}
              <p className="text-sm leading-snug whitespace-pre-wrap inline">
                {searchQuery ? highlightText(response.message, searchQuery) : response.message}
              </p>
              
              {/* Timestamp */}
              <span
                className={`text-[11px] ${
                  response.is_admin ? 'opacity-75' : 'text-slate-500'
                } whitespace-nowrap ml-2`}
              >
                {new Date(response.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>

              {/* Read receipts for admin messages */}
              {response.is_admin && (
                response.is_read ? (
                  <span className="inline-flex items-center ml-1 relative">
                    <Check className="h-3 w-3 text-cyan-300" />
                    <Check className="h-3 w-3 text-cyan-300 -ml-1.5" />
                  </span>
                ) : (
                  <span className="inline-flex ml-1">
                    <Check className="h-3 w-3 opacity-50" />
                  </span>
                )
              )}

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
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-2">
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
                        // File download button
                        <button
                          onClick={() =>
                            onDownloadAttachment(attachment.file_path, attachment.file_name)
                          }
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                            response.is_admin
                              ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span className="text-lg">{getFileIcon(attachment.file_type)}</span>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-medium truncate max-w-[200px]">
                              {attachment.file_name}
                            </p>
                            <p
                              className={`text-[10px] ${
                                response.is_admin ? 'opacity-70' : 'text-slate-500'
                              }`}
                            >
                              {formatFileSize(attachment.file_size)}
                            </p>
                          </div>
                          <svg
                            className="w-4 h-4"
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
}
