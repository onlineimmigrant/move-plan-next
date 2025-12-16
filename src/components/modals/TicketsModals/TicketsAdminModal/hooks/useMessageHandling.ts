import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Ticket, TicketResponse } from '../types';
import * as TicketAPI from '../utils/ticketApi';
import { uploadFileOnly } from '@/lib/fileUpload';

interface UseMessageHandlingProps {
  selectedTicket: Ticket | null;
  selectedAvatar: { id: string } | null;
  setSelectedTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
  setToast: (toast: { message: string; type: 'success' | 'error' }) => void;
  getCurrentISOString: () => string;
  loadAttachmentUrls: (responses: TicketResponse[]) => void;
  fetchInternalNotes: (ticketId: string) => void;
  setShowInternalNotes: React.Dispatch<React.SetStateAction<boolean>>;
  setInternalNotes: React.Dispatch<React.SetStateAction<any[]>>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
}

interface UseMessageHandlingReturn {
  responseMessage: string;
  setResponseMessage: React.Dispatch<React.SetStateAction<string>>;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  isSending: boolean;
  markMessagesAsRead: (ticketId: string) => Promise<void>;
  handleAdminRespond: () => Promise<void>;
  handleTicketSelect: (ticket: Ticket) => Promise<void>;
  broadcastTyping: () => void;
  handleMessageChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  scrollToBottom: () => void;
}

export function useMessageHandling({
  selectedTicket,
  selectedAvatar,
  setSelectedTicket,
  setTickets,
  setToast,
  getCurrentISOString,
  loadAttachmentUrls,
  fetchInternalNotes,
  setShowInternalNotes,
  setInternalNotes,
  messagesContainerRef,
}: UseMessageHandlingProps): UseMessageHandlingReturn {
  const [responseMessage, setResponseMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);

  const scrollToBottom = useCallback(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messagesContainerRef]);

  const markMessagesAsRead = useCallback(async (ticketId: string) => {
    try {
      await TicketAPI.markMessagesAsRead(ticketId);

      // Mark all customer messages as read in the selectedTicket
      setSelectedTicket((t) =>
        t && t.id === ticketId
          ? {
              ...t,
              ticket_responses: t.ticket_responses.map((r) => ({
                ...r,
                is_read: r.is_admin ? r.is_read : true,
              })),
            }
          : t
      );

      // Also update the tickets array to refresh the unread badge
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === ticketId
            ? {
                ...ticket,
                ticket_responses: ticket.ticket_responses.map((r) => ({
                  ...r,
                  is_read: r.is_admin ? r.is_read : true,
                })),
              }
            : ticket
        )
      );
    } catch (error) {
      // Silently fail - marking as read is not critical
      console.error('Failed to mark messages as read:', error);
    }
  }, [setSelectedTicket, setTickets]);

  const broadcastTyping = useCallback(() => {
    if (!selectedTicket?.id) return;
    
    const channel = supabase.channel(`typing-${selectedTicket.id}`);
    channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        ticketId: selectedTicket.id,
        isAdmin: true,
        timestamp: Date.now(),
      },
    });
  }, [selectedTicket?.id]);

  const handleMessageChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponseMessage(e.target.value);
    broadcastTyping();
  }, [broadcastTyping]);

  const handleAdminRespond = useCallback(async () => {
    if (!responseMessage.trim() && selectedFiles.length === 0) return;
    if (!selectedTicket || !selectedAvatar) return;

    const tempMessage = responseMessage;
    const tempId = `temp-${Date.now()}`;
    const filesToUpload = [...selectedFiles];

    // Optimistic update - add message immediately
    const optimisticResponse: TicketResponse = {
      id: tempId,
      message: tempMessage,
      is_admin: true,
      created_at: getCurrentISOString(),
      avatar_id: selectedAvatar.id !== 'default' ? selectedAvatar.id : undefined,
      is_read: false,
      attachments: [],
    };

    setSelectedTicket((t) =>
      t && t.id === selectedTicket.id
        ? {
            ...t,
            ticket_responses: [...t.ticket_responses, optimisticResponse],
          }
        : t
    );
    setResponseMessage('');
    setSelectedFiles([]);
    scrollToBottom();

    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Upload files first to get file paths and metadata
      const uploadedFileData: Array<{ path: string; name: string; type: string; size: number }> = [];
      if (filesToUpload.length > 0) {
        for (const file of filesToUpload) {
          const { path, error: uploadError } = await uploadFileOnly(
            file,
            selectedTicket.id,
            'temp-response-id' // Temporary ID for storage path
          );

          if (uploadError) {
            console.error('Upload error:', uploadError);
            setToast({ message: `Failed to upload ${file.name}: ${uploadError}`, type: 'error' });
          } else if (path) {
            uploadedFileData.push({
              path,
              name: file.name,
              type: file.type,
              size: file.size
            });
          }
        }
      }

      // Send response using API
      const responseData = await TicketAPI.sendAdminResponse({
        ticketId: selectedTicket.id,
        message: tempMessage,
        avatarId: selectedAvatar.id !== 'default' ? selectedAvatar.id : null,
        userId: user?.id || null,
        attachmentData: uploadedFileData
      });

      // Replace optimistic message with real one including attachments
      setSelectedTicket((t) =>
        t && t.id === selectedTicket.id
          ? {
              ...t,
              ticket_responses: t.ticket_responses.map(r =>
                r.id === tempId ? { ...responseData, attachments: responseData.attachments || [] } : r
              ),
            }
          : t
      );

      // Load attachment URLs for the newly uploaded attachments
      if (responseData.attachments && responseData.attachments.length > 0) {
        loadAttachmentUrls([responseData]);
      }

      // No toast needed - message appearance in thread and read receipts provide sufficient feedback
    } catch (error: any) {
      console.error('Failed to submit response:', error);
      // Revert optimistic update on error
      setSelectedTicket((t) =>
        t && t.id === selectedTicket.id
          ? {
              ...t,
              ticket_responses: t.ticket_responses.filter(r => r.id !== tempId),
            }
          : t
      );
      setResponseMessage(tempMessage);
      setSelectedFiles(filesToUpload);
      setToast({ message: error.message || 'Failed to submit response', type: 'error' });
    } finally {
      setIsSending(false);
    }
  }, [
    responseMessage,
    selectedFiles,
    selectedTicket,
    selectedAvatar,
    getCurrentISOString,
    setSelectedTicket,
    setResponseMessage,
    setSelectedFiles,
    scrollToBottom,
    setToast,
    loadAttachmentUrls,
  ]);

  /**
   * Handle ticket selection
   * Fetches fresh ticket data to ensure all messages are loaded
   */
  const handleTicketSelect = useCallback(async (ticket: Ticket) => {
    // Immediately set the ticket for responsive UI
    setSelectedTicket(ticket);
    setShowInternalNotes(false); // Reset notes visibility when switching tickets
    setInternalNotes([]); // Clear previous notes
    
    try {
      // Fetch fresh ticket data with all messages to prevent stale data
      const freshTicket = await TicketAPI.refreshSelectedTicket(ticket.id);
      
      if (freshTicket) {
        // Update with fresh data including latest messages
        setSelectedTicket(freshTicket);
        
        // Load attachment URLs for any images
        if (freshTicket.ticket_responses && freshTicket.ticket_responses.length > 0) {
          loadAttachmentUrls(freshTicket.ticket_responses);
        }
        
        // Scroll to bottom after messages load (use setTimeout to ensure DOM is updated)
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Failed to fetch fresh ticket data:', error);
      // Continue with original ticket data rather than breaking the UI
      if (ticket.ticket_responses) {
        loadAttachmentUrls(ticket.ticket_responses);
      }
      // Still try to scroll even with error
      setTimeout(() => scrollToBottom(), 100);
    }
    
    // Fetch notes for the selected ticket
    fetchInternalNotes(ticket.id);
    // Mark customer messages as read when admin opens the ticket
    markMessagesAsRead(ticket.id);
  }, [
    setSelectedTicket,
    setShowInternalNotes,
    setInternalNotes,
    fetchInternalNotes,
    markMessagesAsRead,
    loadAttachmentUrls,
  ]);

  return {
    responseMessage,
    setResponseMessage,
    selectedFiles,
    setSelectedFiles,
    isSending,
    markMessagesAsRead,
    handleAdminRespond,
    handleTicketSelect,
    broadcastTyping,
    handleMessageChange,
    scrollToBottom,
  };
}
