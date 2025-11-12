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
  console.log('🔄 Messages component RENDERING with attachmentUrls keys:', Object.keys(attachmentUrls).length);
  
  React.useEffect(() => {
    console.log('📨 Messages component received attachmentUrls:', Object.keys(attachmentUrls).length, 'keys:', Object.keys(attachmentUrls).slice(0, 3));
    console.log('📨 Messages component received selectedTicket with', selectedTicket?.ticket_responses?.length || 0, 'responses');
  }, [attachmentUrls, selectedTicket?.ticket_responses?.length]);

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

  return (
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-800/50">
      <div className={`${size === 'fullscreen' || size === 'half' ? 'max-w-2xl mx-auto' : ''}`}>
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
          <div className="flex-1 border-t border-slate-300 dark:border-gray-600"></div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {renderAvatar(null, 'You', false)}
            <span>You started the conversation</span>
          </div>
          <div className="flex-1 border-t border-slate-300 dark:border-gray-600"></div>
        </div>
        
        <div className="flex justify-end items-start mt-4 animate-slide-in motion-reduce:animate-none">
          <div className={getAdaptiveWidth(selectedTicket.message)}>
            <div 
              className="backdrop-blur-md border text-slate-900 dark:text-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow px-3.5 py-2.5"
              style={{
                background: 'color-mix(in srgb, var(--color-primary-base) 8%, rgb(255 255 255 / 0.6))',
                borderColor: 'color-mix(in srgb, var(--color-primary-base) 15%, rgb(255 255 255 / 0.2))',
              }}
            >
              <div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedTicket.message}</p>
                
                {/* Footer: Timestamp and Read Receipts */}
                <div className="flex items-center gap-1.5 mt-1.5 justify-between">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                    {new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <ReadReceipts isRead={true} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Responses */}
        {selectedTicket.ticket_responses.map((response, index) => {
          const avatar = getAvatarForResponse(response, avatars);
          const displayName = response.is_admin 
            ? (avatar?.full_name || avatar?.title || 'Support')
            : 'You';
          
          const isGrouped = shouldGroupWithPrevious(index, response);
          const widthClass = getAdaptiveWidth(response.message || '');
          
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
              
              <div className={`flex items-start ${response.is_admin ? 'justify-start' : 'justify-end'} ${isGrouped ? 'mt-1' : 'mt-4'} animate-slide-in motion-reduce:animate-none`}>
                <div className={widthClass}>
                  <div 
                    className={`${
                      response.is_admin 
                        ? 'bg-white/50 dark:bg-gray-900/40 backdrop-blur-md border border-white/20 dark:border-gray-700/20 text-slate-800 dark:text-slate-200' 
                        : 'backdrop-blur-md border text-slate-900 dark:text-slate-100'
                    } rounded-2xl shadow-sm hover:shadow-md transition-shadow px-3.5 py-2.5`}
                    style={!response.is_admin ? {
                      background: 'color-mix(in srgb, var(--color-primary-base) 8%, rgb(255 255 255 / 0.6))',
                      borderColor: 'color-mix(in srgb, var(--color-primary-base) 15%, rgb(255 255 255 / 0.2))',
                    } : undefined}
                  >
                    <div>
                      {response.message && (
                        <>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{response.message}</p>
                          
                          {/* Footer: Timestamp and Read Receipts */}
                          <div className="flex items-center gap-1.5 mt-1.5 justify-between">
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                              {new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {!response.is_admin && <ReadReceipts isRead={response.is_read || false} />}
                          </div>
                        </>
                      )}
                    
                    {/* Attachments */}
                    {response.attachments && response.attachments.length > 0 && (
                      <div className={`${response.message ? 'mt-2' : ''} space-y-2`}>
                        {response.attachments.map((attachment) => {
                          const isImage = isImageFile(attachment.file_type);
                          const imageUrl = attachmentUrls[attachment.id];
                          
                          console.log('🎨 Rendering attachment:', attachment.id, 'isImage:', isImage, 'hasUrl:', !!imageUrl, 'url:', imageUrl?.substring(0, 50));
                          
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
                            // File download button - glass card style
                            <button
                              key={attachment.id}
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
                              <svg className="w-4 h-4 flex-shrink-0 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Show timestamp and read receipts if no message (attachment only) */}
                    {!response.message && (
                      <div className="flex items-center gap-1.5 mt-1.5 justify-between">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap">
                          {new Date(response.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {!response.is_admin && <ReadReceipts isRead={response.is_read || false} />}
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
        {isAdminTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
