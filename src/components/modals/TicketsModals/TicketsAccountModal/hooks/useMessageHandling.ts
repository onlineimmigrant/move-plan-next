/**
 * useMessageHandling Hook
 * Manages message sending, file uploads, and typing indicators
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { uploadAttachment } from '@/lib/fileUpload';
import { broadcastTyping, scrollToBottom, loadAttachmentUrls } from '../../shared/utils';
import type { Ticket, TicketResponse, TicketAttachment } from '../../shared/types';

interface UseMessageHandlingProps {
  selectedTicket: Ticket | null;
  setSelectedTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
  setAttachmentUrls: React.Dispatch<React.SetStateAction<{[key: string]: string}>>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onToast: (message: string, type: 'success' | 'error') => void;
}

interface UseMessageHandlingReturn {
  responseMessage: string;
  setResponseMessage: React.Dispatch<React.SetStateAction<string>>;
  isSending: boolean;
  handleMessageChange: (value: string) => void;
  handleRespond: () => Promise<void>;
}

export const useMessageHandling = ({
  selectedTicket,
  setSelectedTicket,
  setAttachmentUrls,
  messagesContainerRef,
  selectedFiles,
  setSelectedFiles,
  onToast,
}: UseMessageHandlingProps): UseMessageHandlingReturn => {
  const [responseMessage, setResponseMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  /**
   * Handle message input change and broadcast typing indicator
   */
  const handleMessageChange = useCallback((value: string) => {
    setResponseMessage(value);
    if (selectedTicket?.id) {
      broadcastTyping(selectedTicket.id, false); // false = customer typing
    }
  }, [selectedTicket?.id]);

  /**
   * Handle sending a response with optional file attachments
   */
  const handleRespond = useCallback(async () => {
    if (!responseMessage.trim() && selectedFiles.length === 0) return;
    if (!selectedTicket) return;

    const tempMessage = responseMessage;
    const tempId = `temp-${Date.now()}`;
    const filesToUpload = [...selectedFiles];
    
    // Optimistic update - add message immediately
    const optimisticResponse: TicketResponse = {
      id: tempId,
      message: tempMessage,
      is_admin: false,
      created_at: new Date().toISOString(),
      is_read: false,
      attachments: [], // Will be populated after upload
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
    scrollToBottom(messagesContainerRef);
    
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Create the response first
      const { data, error } = await supabase.from('ticket_responses').insert({
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: tempMessage,
        is_admin: false,
        is_read: false,
        created_at: new Date().toISOString(),
      }).select().single();

      if (error) throw new Error(error.message);

      const responseId = data.id;
      const uploadedAttachments: TicketAttachment[] = [];

      // Upload files if any
      if (filesToUpload.length > 0) {
        for (const file of filesToUpload) {
          const { attachment, error: uploadError } = await uploadAttachment(
            file,
            selectedTicket.id,
            responseId
          );

          if (uploadError) {
            onToast(`Failed to upload ${file.name}: ${uploadError}`, 'error');
          } else if (attachment) {
            uploadedAttachments.push(attachment);
          }
        }
      }

      // Replace optimistic message with real one including attachments
      const responseWithAttachments = { ...data, attachments: uploadedAttachments };
      
      setSelectedTicket((t) =>
        t && t.id === selectedTicket.id
          ? {
              ...t,
              ticket_responses: t.ticket_responses.map(r => 
                r.id === tempId ? responseWithAttachments : r
              ),
            }
          : t
      );
      
      // Load attachment URLs for the newly uploaded attachments - immediately, not in timeout
      if (uploadedAttachments.length > 0) {
        const urlsMap = await loadAttachmentUrls([responseWithAttachments]);
        setAttachmentUrls(prev => ({ ...prev, ...urlsMap }));
      }
      
      // Force a small delay to ensure URLs are in state before realtime refresh
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error: any) {
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
      onToast(error.message || 'Failed to submit response', 'error');
    } finally {
      setIsSending(false);
    }
  }, [responseMessage, selectedFiles, selectedTicket, setSelectedTicket, setResponseMessage, setSelectedFiles, messagesContainerRef, setAttachmentUrls, onToast]);

  return {
    responseMessage,
    setResponseMessage,
    isSending,
    handleMessageChange,
    handleRespond,
  };
};
