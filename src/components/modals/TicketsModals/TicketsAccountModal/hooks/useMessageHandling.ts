/**
 * useMessageHandling Hook
 * Manages message sending, file uploads, and typing indicators
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { uploadAttachment } from '@/lib/fileUpload';
import { broadcastTyping, scrollToBottom } from '../../shared/utils';
import type { Ticket, TicketResponse, TicketAttachment } from '../../shared/types';

interface UseMessageHandlingProps {
  selectedTicket: Ticket | null;
  setSelectedTicket: React.Dispatch<React.SetStateAction<Ticket | null>>;
  setAttachmentUrls: React.Dispatch<React.SetStateAction<{[key: string]: string}>>;
  messagesContainerRef: React.RefObject<HTMLDivElement>;
  selectedFiles: File[];
  setSelectedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onToast: (message: string, type: 'success' | 'error') => void;
  loadAttachmentUrls: (responses: any[]) => Promise<void>;
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
  loadAttachmentUrls,
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

    // Create a completely new ticket object for React to detect the change
    setSelectedTicket((t) => {
      if (!t || t.id !== selectedTicket.id) return t;
      return {
        ...t,
        ticket_responses: [...t.ticket_responses, optimisticResponse], // New array
        updated_at: new Date().toISOString(), // Force change
      };
    });
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
        console.log('📤 Uploading', filesToUpload.length, 'files for response', responseId);
        
        for (const file of filesToUpload) {
          console.log('  🔼 Uploading:', file.name, file.type, file.size);
          
          const { attachment, error: uploadError } = await uploadAttachment(
            file,
            selectedTicket.id,
            responseId
          );

          if (uploadError) {
            console.log('  ❌ Upload failed:', uploadError);
            onToast(`Failed to upload ${file.name}: ${uploadError}`, 'error');
          } else if (attachment) {
            console.log('  ✅ Uploaded attachment:', attachment.id, 'path:', attachment.file_path);
            uploadedAttachments.push(attachment);
          }
        }
      }

      console.log('📦 After upload - uploadedAttachments:', uploadedAttachments.length);

      // Replace optimistic message with real one including attachments
      const responseWithAttachments = { ...data, attachments: uploadedAttachments };
      
      console.log('📝 Response with attachments:', responseWithAttachments.id, 'attachments:', responseWithAttachments.attachments?.length);
      
      // IMMEDIATELY load attachment URLs - this is critical for immediate display
      if (uploadedAttachments.length > 0) {
        console.log('🎯 Loading attachment URLs IMMEDIATELY');
        await loadAttachmentUrls([responseWithAttachments]);
      }
      
      // Create a completely new ticket object to trigger React re-render
      console.log('📤 Updating selectedTicket state with new response');
      setSelectedTicket((t) => {
        if (!t || t.id !== selectedTicket.id) return t;
        
        const updatedResponses = t.ticket_responses.map(r => 
          r.id === tempId ? responseWithAttachments : r
        );
        
        console.log('📋 New ticket_responses count:', updatedResponses.length);
        console.log('📋 Response with attachments:', responseWithAttachments.id, 'has', responseWithAttachments.attachments?.length || 0, 'attachments');
        
        // Return a NEW object with NEW array reference
        return {
          ...t,
          ticket_responses: [...updatedResponses], // New array reference
          updated_at: new Date().toISOString(), // Force change detection
        };
      });
    } catch (error: any) {
      // Revert optimistic update on error - create new object
      setSelectedTicket((t) => {
        if (!t || t.id !== selectedTicket.id) return t;
        return {
          ...t,
          ticket_responses: t.ticket_responses.filter(r => r.id !== tempId),
          updated_at: new Date().toISOString(),
        };
      });
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
