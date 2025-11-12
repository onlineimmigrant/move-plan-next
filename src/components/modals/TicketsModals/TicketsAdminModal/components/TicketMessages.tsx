/**
 * TicketMessages Component
 * Displays the conversation thread with all messages
 * Memoized for performance optimization
 */

import React, { memo } from 'react';
import { MessageItem } from './MessageItem';
import type { Ticket, TicketResponse, Avatar } from '../types';

interface TicketMessagesProps {
  ticket: Ticket;
  avatars: Avatar[];
  selectedAvatar?: Avatar | null;
  searchQuery?: string;
  isCustomerTyping: boolean;
  attachmentUrls: Record<string, string>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  getAvatarForResponse: (response: TicketResponse) => Avatar | null;
  renderAvatar: (avatar: Avatar | null | undefined, name: string, isAdmin: boolean) => React.ReactNode;
  onDownloadAttachment: (filePath: string, fileName: string) => void;
  isImageFile: (fileType: string) => boolean;
  getFileIcon: (fileType: string) => string;
  formatFileSize: (size: number) => string;
}

const TicketMessagesComponent = ({
  ticket,
  avatars,
  selectedAvatar,
  searchQuery = '',
  isCustomerTyping,
  attachmentUrls,
  messagesEndRef,
  getAvatarForResponse,
  renderAvatar,
  onDownloadAttachment,
  isImageFile,
  getFileIcon,
  formatFileSize,
}: TicketMessagesProps) => {
  /**
   * Message grouping threshold in milliseconds (2 minutes)
   */
  const GROUP_TIME_THRESHOLD = 2 * 60 * 1000;

  /**
   * Determine if message should be grouped with previous one
   */
  const shouldGroupWithPrevious = (currentIndex: number, response: TicketResponse): boolean => {
    if (currentIndex === 0) return false;

    const prevResponse = ticket.ticket_responses[currentIndex - 1];
    
    // Must be same type (both admin or both customer)
    if (response.is_admin !== prevResponse.is_admin) return false;

    // For admin messages, must be same avatar
    if (response.is_admin) {
      const currentAvatar = getAvatarForResponse(response);
      const prevAvatar = getAvatarForResponse(prevResponse);
      if (!currentAvatar || !prevAvatar || currentAvatar.id !== prevAvatar.id) return false;
    }

    // Check time delta
    const currentTime = new Date(response.created_at).getTime();
    const prevTime = new Date(prevResponse.created_at).getTime();
    const timeDelta = currentTime - prevTime;

    return timeDelta <= GROUP_TIME_THRESHOLD;
  };

  /**
   * Check if avatar changed from previous admin message
   */
  const hasAvatarChanged = (currentIndex: number, response: TicketResponse): boolean => {
    if (!response.is_admin) return false;

    const currentAvatar = getAvatarForResponse(response);
    
    // Find the last admin message before this one
    for (let i = currentIndex - 1; i >= 0; i--) {
      if (ticket.ticket_responses[i].is_admin) {
        const lastAdminAvatar = getAvatarForResponse(ticket.ticket_responses[i]);
        return !lastAdminAvatar || lastAdminAvatar.id !== currentAvatar?.id;
      }
    }
    
    // This is the first admin message
    return true;
  };

  /**
   * Get display name for a response
   */
  const getDisplayName = (response: TicketResponse): string => {
    if (!response.is_admin) {
      return ticket.full_name || 'Customer';
    }

    const avatar = getAvatarForResponse(response);
    if (avatar && avatar.title) {
      return avatar.title;
    }

    return 'Support';
  };

  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/20 dark:bg-gray-900/20 backdrop-blur-sm border-t border-white/10 dark:border-gray-700/20 motion-reduce:transition-none"
      role="log"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {ticket.ticket_responses.map((response, index) => {
        const avatar = getAvatarForResponse(response);
        const displayName = getDisplayName(response);
        const isCurrentAvatar = response.is_admin && avatar && selectedAvatar && avatar.id === selectedAvatar.id;
        const showAvatarChange = hasAvatarChanged(index, response);
        const isGrouped = shouldGroupWithPrevious(index, response);
        const isLastInGroup = index === ticket.ticket_responses.length - 1 || !shouldGroupWithPrevious(index + 1, ticket.ticket_responses[index + 1]);

        return (
          <MessageItem
            key={response.id}
            response={response}
            avatar={avatar}
            displayName={displayName}
            isCurrentAvatar={!!isCurrentAvatar}
            showAvatarChange={showAvatarChange}
            searchQuery={searchQuery}
            attachmentUrls={attachmentUrls}
            renderAvatar={renderAvatar}
            onDownloadAttachment={onDownloadAttachment}
            isImageFile={isImageFile}
            getFileIcon={getFileIcon}
            formatFileSize={formatFileSize}
            isGrouped={isGrouped}
            isLastInGroup={isLastInGroup}
          />
        );
      })}

      {/* Typing Indicator */}
      {isCustomerTyping && (
        <div className="flex justify-start mb-3 fade-in motion-reduce:animate-none" aria-live="polite" aria-atomic="true">
          <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border border-white/20 dark:border-gray-700/20 rounded-2xl px-4 py-3 shadow-sm max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce motion-reduce:animate-none"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce motion-reduce:animate-none"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce motion-reduce:animate-none"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <span className="text-xs text-slate-400 dark:text-slate-500">Customer is typing...</span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

/**
 * Memoized TicketMessages to prevent unnecessary re-renders
 */
export const TicketMessages = memo(TicketMessagesComponent, (prevProps, nextProps) => {
  // Check ticket changes
  if (prevProps.ticket.id !== nextProps.ticket.id) return false;
  
  // Check if messages array changed
  if (prevProps.ticket.ticket_responses.length !== nextProps.ticket.ticket_responses.length) return false;
  
  // Check if any message content changed (compare IDs and created_at)
  for (let i = 0; i < prevProps.ticket.ticket_responses.length; i++) {
    const prevResp = prevProps.ticket.ticket_responses[i];
    const nextResp = nextProps.ticket.ticket_responses[i];
    if (prevResp.id !== nextResp.id || prevResp.created_at !== nextResp.created_at) {
      return false;
    }
  }
  
  // Check selected avatar
  if (prevProps.selectedAvatar?.id !== nextProps.selectedAvatar?.id) return false;
  
  // Check search query
  if (prevProps.searchQuery !== nextProps.searchQuery) return false;
  
  // Check typing indicator
  if (prevProps.isCustomerTyping !== nextProps.isCustomerTyping) return false;
  
  // Check attachment URLs (only for current ticket's responses)
  const prevResponseIds = prevProps.ticket.ticket_responses
    .flatMap(r => r.attachments?.map(a => a.file_path) || []);
  const nextResponseIds = nextProps.ticket.ticket_responses
    .flatMap(r => r.attachments?.map(a => a.file_path) || []);
  
  for (const filePath of prevResponseIds) {
    if (prevProps.attachmentUrls[filePath] !== nextProps.attachmentUrls[filePath]) {
      return false;
    }
  }
  
  // All critical props are equal
  return true;
});
