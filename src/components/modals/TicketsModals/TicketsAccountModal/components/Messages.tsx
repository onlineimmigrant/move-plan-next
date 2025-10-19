import React from 'react';
import TicketStatusTracker from '@/components/TicketStatusTracker/TicketStatusTracker';
import { downloadAttachment, isImageFile, getFileIcon, formatFileSize } from '@/lib/fileUpload';
import type { Ticket, Avatar, WidgetSize } from '../../shared/types';
import { renderAvatar, getAvatarForResponse } from '../utils';
import { TypingIndicator, AvatarChangeIndicator, ReadReceipts } from './';

interface MessagesProps {
  selectedTicket: Ticket;
  size: WidgetSize;
  avatars: Avatar[];
  attachmentUrls: Record<string, string>;
  isAdminTyping: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export default function Messages({
  selectedTicket,
  size,
  avatars,
  attachmentUrls,
  isAdminTyping,
  messagesContainerRef,
  messagesEndRef,
}: MessagesProps) {
  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-slate-50">
      <div className={`space-y-4 ${size === 'fullscreen' || size === 'half' ? 'max-w-2xl mx-auto' : ''}`}>
        {/* Ticket Status Tracker */}
        <TicketStatusTracker
          status={selectedTicket.status as 'open' | 'in-progress' | 'closed'}
          createdAt={selectedTicket.created_at}
          assignedTo={selectedTicket.assigned_to || undefined}
          assignedToName={(() => {
            if (!selectedTicket.assigned_to) return undefined;
            const avatar = avatars.find(a => a.id === selectedTicket.assigned_to);
            return avatar?.full_name || avatar?.title || 'Support Team';
          })()}
          lastUpdatedAt={selectedTicket.updated_at}
          className="mb-6"
        />
        
        {/* Initial message - show "You" indicator */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 border-t border-slate-300"></div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            {renderAvatar(null, 'You', false)}
            <span>You started the conversation</span>
          </div>
          <div className="flex-1 border-t border-slate-300"></div>
        </div>
        
        <div className="flex justify-end items-start">
          <div className="max-w-[80%] bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl rounded-tr-sm shadow-sm px-3 py-2">
            <div>
              <p className="text-sm leading-snug inline">{selectedTicket.message}</p>
              <span className="text-[11px] opacity-75 whitespace-nowrap ml-2">
                {new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              {/* Read receipts - always show double check for initial message (assumed read) */}
              <ReadReceipts isRead={true} />
            </div>
          </div>
        </div>

        {/* Responses */}
        {selectedTicket.ticket_responses.map((response, index) => {
          const avatar = getAvatarForResponse(response, avatars);
          const displayName = response.is_admin 
            ? (avatar?.full_name || avatar?.title || 'Support')
            : 'You';
          
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
            
          return (
            <React.Fragment key={response.id}>
              {/* Show avatar change indicator */}
              {avatarChanged && (
                <AvatarChangeIndicator
                  avatar={avatar}
                  displayName={displayName}
                  isAdmin={response.is_admin}
                  renderAvatar={renderAvatar}
                />
              )}
              
              <div className={`flex items-start ${response.is_admin ? 'justify-start' : 'justify-end'} animate-slide-in`}>
                <div className={`max-w-[80%] ${response.is_admin ? 'bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm' : 'bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl rounded-tr-sm'} shadow-sm px-3 py-2`}>
                  <div>
                    {response.message && (
                      <>
                        <p className="text-sm leading-snug whitespace-pre-wrap inline">{response.message}</p>
                        <span className={`text-[11px] ${response.is_admin ? 'text-slate-500' : 'opacity-75'} whitespace-nowrap ml-2`}>
                          {new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </>
                    )}
                    
                    {/* Attachments */}
                    {response.attachments && response.attachments.length > 0 && (
                      <div className={`${response.message ? 'mt-2' : ''} space-y-2`}>
                        {response.attachments.map((attachment) => {
                          const isImage = isImageFile(attachment.file_type);
                          const imageUrl = attachmentUrls[attachment.id];
                          
                          return isImage && imageUrl ? (
                            // Image preview
                            <div key={attachment.id} className="relative group">
                              <img
                                src={imageUrl}
                                alt={attachment.file_name}
                                className="max-w-full rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                style={{ maxHeight: '300px' }}
                                onClick={() => downloadAttachment(attachment.file_path, attachment.file_name)}
                              />
                              <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-xs font-medium backdrop-blur-sm ${
                                response.is_admin ? 'bg-white/90 text-slate-700' : 'bg-black/50 text-white'
                              }`}>
                                {attachment.file_name}
                              </div>
                              {/* Download overlay on hover */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                                <div className="bg-white rounded-full p-2 shadow-lg">
                                  <svg className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // File download button
                            <button
                              key={attachment.id}
                              onClick={() => downloadAttachment(attachment.file_path, attachment.file_name)}
                              className={`flex items-center gap-2 p-2 rounded-lg ${
                                response.is_admin 
                                  ? 'bg-slate-50 hover:bg-slate-100 border border-slate-200' 
                                  : 'bg-white/20 hover:bg-white/30 border border-white/30'
                              } transition-all duration-200 w-full text-left`}
                            >
                              <div className="flex-shrink-0 text-lg">
                                {getFileIcon(attachment.file_type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-xs font-medium truncate ${
                                  response.is_admin ? 'text-slate-700' : 'text-white'
                                }`}>
                                  {attachment.file_name}
                                </p>
                                <p className={`text-xs ${
                                  response.is_admin ? 'text-slate-500' : 'text-white/75'
                                }`}>
                                  {formatFileSize(attachment.file_size)}
                                </p>
                              </div>
                              <svg className={`h-4 w-4 flex-shrink-0 ${
                                response.is_admin ? 'text-slate-400' : 'text-white/75'
                              }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Show timestamp and read receipts if no message (attachment only) */}
                    {!response.message && (
                      <div>
                        <span className={`text-[11px] ${response.is_admin ? 'text-slate-500' : 'opacity-75'} whitespace-nowrap`}>
                          {new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {/* Show read receipts only for customer's messages */}
                        {!response.is_admin && <ReadReceipts isRead={response.is_read || false} />}
                      </div>
                    )}
                    
                    {/* Show read receipts for customer's messages with text */}
                    {response.message && !response.is_admin && <ReadReceipts isRead={response.is_read || false} />}
                  </div>
                </div>
              </div>
            </React.Fragment>
          );
        })}
        
        {/* Typing Indicator */}
        {isAdminTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
