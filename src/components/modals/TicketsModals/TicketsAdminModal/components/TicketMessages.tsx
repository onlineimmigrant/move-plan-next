/**
 * TicketMessages Component
 * Displays the conversation thread with all messages
 */

import React from 'react';
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

export function TicketMessages({
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
}: TicketMessagesProps) {
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
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
      {ticket.ticket_responses.map((response, index) => {
        const avatar = getAvatarForResponse(response);
        const displayName = getDisplayName(response);
        const isCurrentAvatar = response.is_admin && avatar && selectedAvatar && avatar.id === selectedAvatar.id;
        const showAvatarChange = hasAvatarChanged(index, response);

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
          />
        );
      })}

      {/* Typing Indicator */}
      {isCustomerTyping && (
        <div className="flex justify-start mb-3 fade-in">
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
              <span className="text-xs text-slate-500">Customer is typing...</span>
            </div>
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
}
