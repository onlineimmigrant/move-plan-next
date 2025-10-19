import React from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import Tooltip from '@/components/Tooltip';
import { Ticket, Avatar } from '../types';
import { TicketAttachment } from '@/lib/fileUpload';
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
          <div className="flex items-center gap-2 text-xs text-slate-500">
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
          
          // Check if this message was sent by the currently selected avatar
          const isCurrentAvatar = response.is_admin && avatar && selectedAvatar && avatar.id === selectedAvatar.id;
          
          // Check if avatar changed (for admin messages only)
          // Find the LAST admin message before this one (not just previous message)
          let lastAdminAvatar = null;
          for (let i = index - 1; i >= 0; i--) {
            if (selectedTicket.ticket_responses[i].is_admin) {
              lastAdminAvatar = getAvatarForResponse(selectedTicket.ticket_responses[i], avatars);
              break;
            }
          }
          
          // Show indicator when:
          // - This is an admin message AND
          // - Either no previous admin exists OR the avatar ID is different
          const avatarChanged = response.is_admin && (
            !lastAdminAvatar || lastAdminAvatar.id !== avatar?.id
          );
          
          // Debug logging
          if (response.is_admin && process.env.NODE_ENV === 'development') {
            console.log(`Admin Message ${index}: ${response.message.substring(0, 30)}...`);
            console.log(`  Current avatar ID: ${avatar?.id}`);
            console.log(`  Last admin avatar ID: ${lastAdminAvatar?.id}`);
            console.log(`  avatarChanged: ${avatarChanged}`);
          }
          
          return (
            <React.Fragment key={response.id}>
              {/* Show avatar change indicator */}
              {avatarChanged && (
                <div className="flex items-center gap-3 my-3 animate-fade-in">
                  <div className="flex-1 border-t border-slate-300"></div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {renderAvatar(avatar, displayName, response.is_admin)}
                    <span>{displayName} {isCurrentAvatar ? '(You)' : ''} joined the conversation</span>
                  </div>
                  <div className="flex-1 border-t border-slate-300"></div>
                </div>
              )}
              
              <div className={`flex items-start ${response.is_admin ? 'justify-end' : 'justify-start'} animate-slide-in`}>
                <div className="max-w-[80%]">
                  <Tooltip 
                    content={`${displayName}${!response.is_admin && selectedTicket.email ? ' • ' + selectedTicket.email : ''} • ${new Date(response.created_at).toLocaleString()}`}
                  >
                    <div className={`${response.is_admin ? 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl rounded-tr-sm' : 'bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm'} shadow-sm px-3 py-2 cursor-help`}>
                      <div>
                        <p className="text-sm leading-snug whitespace-pre-wrap inline">{searchQuery ? highlightText(response.message, searchQuery) : response.message}</p>
                        <span className={`text-[11px] ${response.is_admin ? 'opacity-75' : 'text-slate-500'} whitespace-nowrap ml-2`}>
                          {new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {/* Show read receipts only for admin messages */}
                        {response.is_admin && (
                          response.is_read ? (
                            // Double checkmark for read messages - bright color
                            <span className="inline-flex items-center ml-1 relative">
                              <CheckIcon className="h-3 w-3 text-cyan-300" />
                              <CheckIcon className="h-3 w-3 text-cyan-300 -ml-1.5" />
                            </span>
                          ) : (
                            // Single checkmark for sent but not read - dimmed
                            <span className="inline-flex ml-1">
                              <CheckIcon className="h-3 w-3 opacity-50" />
                            </span>
                          )
                        )}
                        
                        {/* Display attachments */}
                        {response.attachments && response.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {response.attachments.map((attachment: TicketAttachment) => (
                              <div key={attachment.id}>
                                {isImageFile(attachment.file_type) && attachmentUrls[attachment.id] ? (
                                  // Image preview with download on click
                                  <div className="relative group">
                                    <img 
                                      src={attachmentUrls[attachment.id]}
                                      alt={attachment.file_name}
                                      className="max-w-full max-h-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => downloadAttachment(attachment.file_path, attachment.file_name)}
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors rounded-lg flex items-center justify-center">
                                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2">
                                        <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                                      <p className="text-xs text-white truncate">{attachment.file_name}</p>
                                    </div>
                                  </div>
                                ) : (
                                  // File download button for non-images
                                  <button
                                    onClick={() => downloadAttachment(attachment.file_path, attachment.file_name)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                                      response.is_admin 
                                        ? 'bg-white/10 border-white/20 hover:bg-white/20 text-white'
                                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                                    }`}
                                  >
                                    <span className="text-lg">{getFileIcon(attachment.file_type)}</span>
                                    <div className="flex-1 text-left">
                                      <p className="text-xs font-medium truncate max-w-[200px]">{attachment.file_name}</p>
                                      <p className={`text-[10px] ${response.is_admin ? 'opacity-70' : 'text-slate-500'}`}>
                                        {formatFileSize(attachment.file_size)}
                                      </p>
                                    </div>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  </Tooltip>
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {/* Typing Indicator */}
        {isCustomerTyping && (
          <div className="flex justify-start mb-3 fade-in">
            <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
