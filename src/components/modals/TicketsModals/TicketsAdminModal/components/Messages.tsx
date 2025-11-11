import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import { Ticket, Avatar } from '../types';
import { TicketAttachment } from '@/lib/fileUpload';
import { TypingIndicator, AvatarChangeIndicator, ReadReceipts } from '../../shared/components';
import {
  formatFullDate,
  formatTimeOnly,
  getAvatarForResponse,
  getDisplayName,
  getAvatarDisplayName,
  getInitials,
  getAvatarClasses,
  getHighlightedParts,
} from '../utils/ticketHelpers';
import {
  isImageFile,
  downloadAttachment,
  getFileIcon,
  formatFileSize,
} from '@/lib/fileUpload';

interface MessagesProps {
  selectedTicket: Ticket;
  searchQuery: string;
  avatars: Avatar[];
  selectedAvatar: Avatar | null;
  attachmentUrls: Record<string, string>;
  isCustomerTyping: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function Messages({
  selectedTicket,
  searchQuery,
  avatars,
  selectedAvatar,
  attachmentUrls,
  isCustomerTyping,
  messagesContainerRef,
  messagesEndRef,
}: MessagesProps) {
  /**
   * Message grouping threshold in milliseconds (2 minutes)
   */
  const GROUP_TIME_THRESHOLD = 2 * 60 * 1000;

  /**
   * Determine if message should be grouped with previous one
   */
  const shouldGroupWithPrevious = (currentIndex: number, response: any): boolean => {
    if (currentIndex === 0) return false;

    const prevResponse = selectedTicket.ticket_responses[currentIndex - 1];
    
    // Must be same type (both admin or both customer)
    if (response.is_admin !== prevResponse.is_admin) return false;

    // For admin messages, must be same avatar
    if (response.is_admin) {
      const currentAvatar = getAvatarForResponse(response, avatars);
      const prevAvatar = getAvatarForResponse(prevResponse, avatars);
      if (!currentAvatar || !prevAvatar || currentAvatar.id !== prevAvatar.id) return false;
    }

    // Check time delta
    const currentTime = new Date(response.created_at).getTime();
    const prevTime = new Date(prevResponse.created_at).getTime();
    const timeDelta = currentTime - prevTime;

    return timeDelta <= GROUP_TIME_THRESHOLD;
  };

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

  // Helper function to highlight search text
  const highlightText = (text: string | undefined | null, query: string) => {
    const parts = getHighlightedParts(text, query);
    if (parts.length === 0) return text || '';
    
    return (
      <>
        {parts.map((part: any, index: number) => 
          part.highlight ? (
            <mark key={index} className="bg-yellow-200 text-gray-900 px-0.5 rounded">
              {part.text}
            </mark>
          ) : (
            part.text
          )
        )}
      </>
    );
  };

  // Helper function to render avatar
  const renderAvatar = (avatar: Avatar | null, displayName: string, isAdmin: boolean) => {
    const name = avatar?.full_name || avatar?.title || displayName;
    const initials = getInitials(name);
    
    if (avatar?.image) {
      return (
        <img 
          src={avatar.image} 
          alt={name}
          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
        />
      );
    }
    
    return (
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0 ${getAvatarClasses(isAdmin)}`}>
        {initials}
      </div>
    );
  };

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-slate-50">
      <div className="max-w-3xl mx-auto space-y-4">
        
        {/* Initial message - show customer indicator */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 border-t border-slate-300"></div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            {renderAvatar(null, getDisplayName(selectedTicket.full_name || null), false)}
            <span>{getDisplayName(selectedTicket.full_name || null)} started the conversation</span>
          </div>
          <div className="flex-1 border-t border-slate-300"></div>
        </div>
        
        <div className="flex justify-start items-start">
          <div className="max-w-[80%]">
            <Tooltip 
              content={`${getDisplayName(selectedTicket.full_name || null)}${selectedTicket.email ? ' • ' + selectedTicket.email : ''} • ${formatFullDate(selectedTicket.created_at)}`}
            >
              <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm px-3 py-2 cursor-help">
                <div>
                  <p className="text-sm leading-snug inline">{searchQuery ? highlightText(selectedTicket.message, searchQuery) : selectedTicket.message}</p>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap ml-2">
                    {formatTimeOnly(selectedTicket.created_at)}
                  </span>
                </div>
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Responses */}
        {selectedTicket.ticket_responses.map((response, index) => {
          const avatar = getAvatarForResponse(response, avatars);
          const displayName = response.is_admin 
            ? getAvatarDisplayName(avatar)
            : getDisplayName(selectedTicket.full_name || null);
          
          const isCurrentAvatar = response.is_admin && avatar && selectedAvatar && avatar.id === selectedAvatar.id;
          const isGrouped = shouldGroupWithPrevious(index, response);
          const isLastInGroup = index === selectedTicket.ticket_responses.length - 1 || !shouldGroupWithPrevious(index + 1, selectedTicket.ticket_responses[index + 1]);
          
          // Check if avatar changed (for admin messages only)
          let lastAdminAvatar = null;
          for (let i = index - 1; i >= 0; i--) {
            if (selectedTicket.ticket_responses[i].is_admin) {
              lastAdminAvatar = getAvatarForResponse(selectedTicket.ticket_responses[i], avatars);
              break;
            }
          }
          
          const avatarChanged = response.is_admin && (
            !lastAdminAvatar || lastAdminAvatar.id !== avatar?.id
          );
          
          return (
            <React.Fragment key={response.id}>
              {/* Show avatar change indicator */}
              {avatarChanged && (
                <AvatarChangeIndicator
                  avatar={avatar}
                  displayName={displayName}
                  isAdmin={response.is_admin}
                  isCurrentAvatar={isCurrentAvatar || false}
                  renderAvatar={renderAvatar}
                />
              )}
              
              <div className={`flex items-start ${response.is_admin ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mt-1' : 'mt-4'} animate-slide-in motion-reduce:animate-none`}>
                <div className={getAdaptiveWidth(response.message)}>
                  <div 
                    className={`${
                      response.is_admin 
                        ? 'backdrop-blur-md border text-slate-900 dark:text-slate-100 shadow-sm hover:shadow-md' 
                        : 'bg-white/50 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 dark:border-gray-700/20 text-slate-800 dark:text-slate-200 shadow-sm hover:shadow-md'
                    } rounded-2xl transition-shadow px-3.5 py-2.5`}
                    style={response.is_admin ? {
                      background: 'color-mix(in srgb, var(--color-primary-base) 8%, rgb(255 255 255 / 0.6))',
                      borderColor: 'color-mix(in srgb, var(--color-primary-base) 15%, rgb(255 255 255 / 0.2))',
                    } : undefined}
                    title={`${displayName} • ${new Date(response.created_at).toLocaleString()}`}
                  >
                    <div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{searchQuery ? highlightText(response.message, searchQuery) : response.message}</p>
                      
                      {/* Footer: Timestamp and Read Receipts */}
                      <div className="flex items-center gap-1.5 mt-1.5 justify-between">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {response.is_admin && <ReadReceipts isRead={response.is_read || false} />}
                      </div>
                        
                      {/* Display attachments */}
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
                                    onClick={() => downloadAttachment(attachment.file_path, attachment.file_name)}
                                  />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full p-2">
                                      <svg className="w-5 h-5 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
                                  onClick={() => downloadAttachment(attachment.file_path, attachment.file_name)}
                                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/40 dark:bg-gray-800/40 backdrop-blur-md border border-white/30 dark:border-gray-700/30 hover:bg-white/60 dark:hover:bg-gray-800/60 hover:shadow-md transition-all text-slate-700 dark:text-slate-200"
                                >
                                  <span className="text-xl flex-shrink-0">{getFileIcon(attachment.file_type)}</span>
                                  <div className="flex-1 text-left min-w-0">
                                    <p className="text-xs font-medium truncate">{attachment.file_name}</p>
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                      {formatFileSize(attachment.file_size)}
                                    </p>
                                  </div>
                                  <svg className="w-4 h-4 flex-shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
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
            </React.Fragment>
          );
        })}

        {/* Typing Indicator */}
        {isCustomerTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
