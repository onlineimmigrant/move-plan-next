'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, CheckIcon } from '@heroicons/react/24/outline';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';
import Tooltip from '@/components/Tooltip';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import { TicketAttachment, FileUploadProgress, ALLOWED_MIME_TYPES, validateFile, uploadAttachment, downloadAttachment, getAttachmentUrl, deleteAttachment, isImageFile, isPdfFile, getFileIcon, formatFileSize, createLocalPreviewUrl } from '@/lib/fileUpload';

interface TicketResponse {
  id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  avatar_id?: string;
  is_read?: boolean;
  read_at?: string;
  attachments?: TicketAttachment[];
}

interface Ticket {
  id: string;
  subject: string;
  status: string;
  customer_id: string | null;
  created_at: string;
  message: string;
  preferred_contact_method: string | null;
  email: string;
  full_name?: string;
  ticket_responses: TicketResponse[];
}

interface Avatar {
  id: string;
  title: string;
  full_name?: string;
  image?: string;
}

interface TicketsAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WidgetSize = 'initial' | 'half' | 'fullscreen';

const statuses = ['in progress', 'open', 'closed'];

export default function TicketsAccountModal({ isOpen, onClose }: TicketsAccountModalProps) {
  const { t } = useAccountTranslations();
  const { settings } = useSettings();
  const [size, setSize] = useState<WidgetSize>('initial');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState(statuses[0]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [ticketsPerPage] = useState(20);
  const [hasMoreTickets, setHasMoreTickets] = useState<{[key: string]: boolean}>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<{[key: string]: string}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedTicketRef = useRef<Ticket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);

  useEffect(() => {
    if (isOpen) {
      fetchTickets();
      fetchAvatars();
      setupRealtimeSubscription();
    }

    return () => {
      console.log('🔌 Unsubscribing from realtime (customer modal)');
      supabase.channel('customer-tickets-channel').unsubscribe();
    };
  }, [isOpen]);

  // Track the previous number of responses to only scroll on new messages
  const prevResponseCountRef = useRef<number>(0);

  useEffect(() => {
    setTimeout(() => scrollToBottom(), 100); // Delay scroll to ensure ticket is rendered
    // Reset the response count when ticket changes
    if (selectedTicket) {
      prevResponseCountRef.current = selectedTicket.ticket_responses?.length || 0;
    }
  }, [selectedTicket?.id]); // Only trigger when ticket ID changes (not the whole object)

  // Scroll when NEW responses are added (not on every update)
  useEffect(() => {
    if (selectedTicket?.ticket_responses) {
      const currentCount = selectedTicket.ticket_responses.length;
      const prevCount = prevResponseCountRef.current;
      
      // Only scroll if responses were added (not updated)
      if (currentCount > prevCount) {
        setTimeout(() => {
          scrollToBottom();
        }, 100);
        prevResponseCountRef.current = currentCount;
      }
      
      // Only mark as read if modal is actually open and visible
      if (selectedTicket.id && isOpen) {
        markMessagesAsRead(selectedTicket.id);
      }
      
      // Load attachment URLs for images
      loadAttachmentUrls();
    }
  }, [selectedTicket?.ticket_responses?.length, isOpen]); // Watch length, not the array itself
  
  // Load signed URLs for image attachments
  const loadAttachmentUrls = async () => {
    if (!selectedTicket?.ticket_responses) return;
    
    const urls: {[key: string]: string} = {};
    
    for (const response of selectedTicket.ticket_responses) {
      if (response.attachments) {
        for (const attachment of response.attachments) {
          if (isImageFile(attachment.file_type)) {
            const { url } = await getAttachmentUrl(attachment.file_path);
            if (url) {
              urls[attachment.id] = url;
            }
          }
        }
      }
    }
    
    setAttachmentUrls(urls);
  };

  // Mark messages as read when user starts typing (indicates they're actively viewing)
  useEffect(() => {
    if (responseMessage && selectedTicket?.id && isOpen) {
      markMessagesAsRead(selectedTicket.id);
    }
  }, [responseMessage, isOpen]);

  // Mark messages as read periodically while ticket is open and modal is visible
  useEffect(() => {
    if (!selectedTicket?.id || !isOpen) return;

    const markAsReadInterval = setInterval(() => {
      // Only mark as read if:
      // 1. Document has focus (tab is active)
      // 2. Modal is open (isOpen = true)
      // 3. Page is visible (not minimized or in background tab)
      if (document.hasFocus() && isOpen && !document.hidden) {
        markMessagesAsRead(selectedTicket.id);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(markAsReadInterval);
  }, [selectedTicket?.id, isOpen]);

  // Mark messages as read when user returns to the tab/window
  useEffect(() => {
    if (!selectedTicket?.id || !isOpen) return;

    const handleVisibilityChange = () => {
      // When user switches back to this tab, mark messages as read
      if (!document.hidden && isOpen) {
        markMessagesAsRead(selectedTicket.id);
      }
    };

    const handleFocus = () => {
      // When window gains focus, mark messages as read
      if (!document.hidden && isOpen) {
        markMessagesAsRead(selectedTicket.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedTicket?.id, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [responseMessage]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modal
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Ctrl+Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (responseMessage.trim() && selectedTicket && !isSending) {
          handleRespond();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, responseMessage, selectedTicket, isSending]);

  // Separate effect for typing channel subscription
  useEffect(() => {
    if (!isOpen || !selectedTicket?.id) return;

    console.log('🔔 Setting up typing channel for ticket:', selectedTicket.id);

    const typingChannel = supabase
      .channel(`typing-${selectedTicket.id}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('🎯 Typing event received (Customer):', payload);
        if (payload.payload.ticketId === selectedTicket.id && payload.payload.isAdmin) {
          setIsAdminTyping(true);
          
          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          // Auto-hide after 3 seconds
          typingTimeoutRef.current = setTimeout(() => {
            setIsAdminTyping(false);
          }, 3000);
        }
      })
      .subscribe((status) => {
        console.log('📡 Typing channel status (Customer):', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from typing channel:', selectedTicket.id);
      typingChannel.unsubscribe();
    };
  }, [isOpen, selectedTicket?.id]);

  const refreshSelectedTicket = async () => {
    const currentTicket = selectedTicketRef.current;
    
    if (!currentTicket) {
      console.log('⚠️ No selected ticket to refresh (customer)');
      return;
    }
    
    console.log('🔍 Starting refresh for ticket (customer):', currentTicket.id);
    
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id, subject, status, customer_id, created_at, message, preferred_contact_method, email, full_name')
        .eq('id', currentTicket.id)
        .single();
      
      if (ticketError) {
        console.error('❌ Error fetching ticket:', ticketError);
        throw ticketError;
      }
      
      console.log('✅ Ticket data fetched (customer)');
      
      // Fetch responses separately with proper ordering and attachments
      const { data: responsesData, error: responsesError } = await supabase
        .from('ticket_responses')
        .select(`
          *,
          ticket_attachments(*)
        `)
        .eq('ticket_id', currentTicket.id)
        .order('created_at', { ascending: true });
      
      if (responsesError) {
        console.error('❌ Error fetching responses:', responsesError);
        throw responsesError;
      }
      
      console.log('✅ Responses fetched (customer):', responsesData?.length);
      
      // Process responses to flatten attachments
      const processedResponses = (responsesData || []).map((response: any) => ({
        ...response,
        attachments: response.ticket_attachments || []
      }));
      
      const updatedTicket = {
        ...ticketData,
        ticket_responses: processedResponses
      };
      
      console.log('🔄 Selected ticket refreshed (customer) - responses:', updatedTicket.ticket_responses.length, 'Previous:', currentTicket.ticket_responses?.length);
      setSelectedTicket(updatedTicket);
      // Force scroll after state update
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      console.error('❌ Error refreshing selected ticket:', err);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      const channel = supabase
        .channel('customer-tickets-channel', {
          config: {
            broadcast: { self: true },
            presence: { key: selectedTicket?.id || 'none' },
          },
        })
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'tickets'
          },
          (payload) => {
            console.log('✅ Realtime (Customer): Ticket change', payload);
            fetchTickets();
            refreshSelectedTicket();
          }
        )
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'ticket_responses'
          },
          (payload) => {
            console.log('✅ Realtime (Customer): Response change', payload);
            fetchTickets();
            refreshSelectedTicket();
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime status (Customer):', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime subscription active for customer modal');
          }
          if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime channel error (customer) - check RLS policies');
          }
          if (status === 'TIMED_OUT') {
            console.error('❌ Realtime subscription timed out (customer)');
          }
          if (status === 'CLOSED') {
            console.log('🔌 Realtime channel closed (customer)');
          }
        });
    } catch (err) {
      console.error('❌ Error setting up realtime subscription (customer):', err);
    }
  };

  const fetchTickets = async (loadMore: boolean = false) => {
    if (!loadMore) {
      setIsLoadingTickets(true);
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setToast({ message: 'User not authenticated', type: 'error' });
        return;
      }

      const startIndex = loadMore ? tickets.length : 0;
      const { data: ticketsData, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          id, 
          subject, 
          status, 
          customer_id, 
          created_at, 
          message, 
          preferred_contact_method, 
          email, 
          full_name, 
          ticket_responses(
            id,
            ticket_id,
            user_id,
            message,
            is_admin,
            avatar_id,
            is_read,
            read_at,
            created_at,
            ticket_attachments(*)
          )
        `)
        .eq('organization_id', settings.organization_id)
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false })
        .order('created_at', { foreignTable: 'ticket_responses', ascending: true })
        .range(startIndex, startIndex + ticketsPerPage - 1);

      if (ticketsError) {
        console.error('Error fetching tickets:', ticketsError);
        setToast({ message: 'Failed to load tickets', type: 'error' });
        return;
      }

      // Process tickets to flatten attachments
      const processedTickets = (ticketsData || []).map(ticket => ({
        ...ticket,
        ticket_responses: (ticket.ticket_responses || []).map((response: any) => ({
          ...response,
          attachments: response.ticket_attachments || []
        }))
      }));

      if (loadMore) {
        setTickets(prev => [...prev, ...processedTickets]);
      } else {
        setTickets(processedTickets);
      }

      // Check if there are more tickets for each status
      const hasMore: {[key: string]: boolean} = {};
      for (const status of statuses) {
        const statusTickets = ticketsData?.filter(t => t.status === status) || [];
        hasMore[status] = statusTickets.length === ticketsPerPage;
      }
      setHasMoreTickets(hasMore);
      
    } catch (error) {
      console.error('Unexpected error in fetchTickets:', error);
      setToast({ message: 'An unexpected error occurred', type: 'error' });
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const loadMoreTickets = async () => {
    setLoadingMore(true);
    await fetchTickets(true);
    setLoadingMore(false);
  };

  const markMessagesAsRead = async (ticketId: string) => {
    try {
      // Mark all admin messages in this ticket as read by the customer
      const { error } = await supabase
        .from('ticket_responses')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('ticket_id', ticketId)
        .eq('is_admin', true)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking messages as read:', error);
        return;
      }

      // Update local state to reflect the read status
      setSelectedTicket((t) => {
        if (!t || t.id !== ticketId) return t;
        return {
          ...t,
          ticket_responses: t.ticket_responses.map(response => 
            response.is_admin && !response.is_read
              ? { ...response, is_read: true, read_at: new Date().toISOString() }
              : response
          )
        };
      });
      
      // Also update in the tickets list
      setTickets(prev => prev.map(ticket => {
        if (ticket.id !== ticketId) return ticket;
        return {
          ...ticket,
          ticket_responses: ticket.ticket_responses.map(response =>
            response.is_admin && !response.is_read
              ? { ...response, is_read: true, read_at: new Date().toISOString() }
              : response
          )
        };
      }));
    } catch (err) {
      console.error('Unexpected error marking messages as read:', err);
    }
  };

  const broadcastTyping = () => {
    if (!selectedTicket?.id) return;
    
    supabase.channel(`typing-${selectedTicket.id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        ticketId: selectedTicket.id,
        isAdmin: false,
        timestamp: Date.now(),
      },
    });
  };

  const handleMessageChange = (value: string) => {
    setResponseMessage(value);
    broadcastTyping();
  };

  const fetchAvatars = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_avatars')
        .select('id, title, full_name, image')
        .eq('organization_id', settings.organization_id)
        .order('title', { ascending: true });

      if (error) {
        // Table doesn't exist - use default avatar only (this is expected)
        setAvatars([{ id: 'default', title: 'Support', full_name: undefined, image: undefined }]);
        return;
      }
      
      setAvatars([{ id: 'default', title: 'Support', full_name: undefined, image: undefined }, ...(data || [])]);
    } catch (err) {
      // Silently handle if table doesn't exist
      setAvatars([{ id: 'default', title: 'Support', full_name: undefined, image: undefined }]);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  // File handling functions
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of newFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setToast({ message: validation.error || 'Invalid file', type: 'error' });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const validFiles: File[] = [];
    
    for (const file of newFiles) {
      const validation = validateFile(file);
      if (!validation.valid) {
        setToast({ message: validation.error || 'Invalid file', type: 'error' });
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearFiles = () => {
    setSelectedFiles([]);
  };

  const handleRespond = async () => {
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
    scrollToBottom();
    
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
            console.error('Upload error:', uploadError);
            setToast({ message: `Failed to upload ${file.name}: ${uploadError}`, type: 'error' });
          } else if (attachment) {
            uploadedAttachments.push(attachment);
          }
        }
      }

      // Replace optimistic message with real one including attachments
      setSelectedTicket((t) =>
        t && t.id === selectedTicket.id
          ? {
              ...t,
              ticket_responses: t.ticket_responses.map(r => 
                r.id === tempId ? { ...data, attachments: uploadedAttachments } : r
              ),
            }
          : t
      );
      
      const successMessage = filesToUpload.length > 0 
        ? `Response sent with ${uploadedAttachments.length} file(s)` 
        : 'Response sent successfully';
      setToast({ message: successMessage, type: 'success' });
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
      setToast({ message: error.message || 'Failed to submit response', type: 'error' });
    } finally {
      setIsSending(false);
    }
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    // Mark admin messages as read when customer opens the ticket
    markMessagesAsRead(ticket.id);
  };

  const toggleSize = () => {
    setSize((prev) => {
      if (prev === 'initial') return 'half';
      if (prev === 'half') return 'fullscreen';
      return 'initial'; // fullscreen → initial
    });
  };

  const groupedTickets = statuses.reduce(
    (acc, status) => ({
      ...acc,
      [status]: tickets.filter((ticket) => ticket.status === status),
    }),
    {} as Record<string, Ticket[]>
  );

  const isWaitingForResponse = (ticket: Ticket) => {
    if (ticket.status === 'closed') return false;
    if (ticket.ticket_responses.length === 0) return false;
    const latestResponse = ticket.ticket_responses[ticket.ticket_responses.length - 1];
    return latestResponse.is_admin;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'closed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvatarForResponse = (response: TicketResponse) => {
    if (!response.is_admin) return null;
    return avatars.find((a) => a.id === response.avatar_id) || avatars[0];
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

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
      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold flex-shrink-0 ${
        isAdmin ? 'bg-blue-600 text-white' : 'bg-slate-400 text-white'
      }`}>
        {initials}
      </div>
    );
  };

  if (!isOpen) return null;

  const getContainerClasses = () => {
    const baseClasses = 'fixed bg-white border border-slate-200 shadow-xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden';
    
    switch (size) {
      case 'initial':
        return `${baseClasses} bottom-8 right-4 w-[400px] h-[750px] rounded-2xl`;
      case 'half':
        return `${baseClasses} bottom-0 right-0 w-full md:w-2/3 lg:w-1/2 h-screen md:h-5/6 md:bottom-4 md:right-4 md:rounded-2xl`;
      case 'fullscreen':
        return `${baseClasses} inset-0 w-full h-full rounded-none`;
      default:
        return baseClasses;
    }
  };

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[10000]"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className={`${getContainerClasses()} z-[10001]`}>
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200 rounded-t-2xl shadow-sm">
          <div className="flex items-center gap-2">
            {selectedTicket && (
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                aria-label="Back to list"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
            )}
            <button
              onClick={toggleSize}
              className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            >
              {size === 'fullscreen' ? (
                <ArrowsPointingInIcon className="h-4 w-4" />
              ) : (
                <ArrowsPointingOutIcon className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {/* Title - Show "Ticket" with admin avatars */}
          <div className="flex-1 flex items-center justify-center mx-4 gap-3">
            {selectedTicket ? (
              <>
                <span className="text-sm font-semibold text-slate-700">Ticket</span>
                {/* Show stacked admin avatars */}
                <div className="flex items-center -space-x-2">
                  {(() => {
                    // Get unique admin avatars from responses
                    const seenAvatarIds = new Set<string>();
                    const adminAvatars = selectedTicket.ticket_responses
                      .filter(r => r.is_admin && r.avatar_id)
                      .map(r => avatars.find(a => a.id === r.avatar_id))
                      .filter((avatar): avatar is Avatar => {
                        if (!avatar || seenAvatarIds.has(avatar.id)) {
                          return false;
                        }
                        seenAvatarIds.add(avatar.id);
                        return true;
                      })
                      .reverse(); // Most recent first
                    
                    return adminAvatars.length > 0 ? (
                      adminAvatars.map((avatar) => (
                        <Tooltip key={avatar.id} content={avatar.full_name || avatar.title || 'Admin'}>
                          <div className="relative">
                            {renderAvatar(avatar, avatar.full_name || avatar.title || 'Admin', true)}
                          </div>
                        </Tooltip>
                      ))
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
                        <span className="text-[9px] text-slate-500">?</span>
                      </div>
                    );
                  })()}
                </div>
              </>
            ) : (
              <h2 className="text-sm font-semibold text-slate-700">Support Tickets</h2>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-slate-50">
                <div className={`space-y-4 ${size === 'fullscreen' || size === 'half' ? 'max-w-2xl mx-auto' : ''}`}>
                
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
                      <span className="inline-flex items-center ml-1 relative">
                        <CheckIcon className="h-3 w-3 text-cyan-300" />
                        <CheckIcon className="h-3 w-3 text-cyan-300 -ml-1.5" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Responses */}
                {selectedTicket.ticket_responses.map((response, index) => {
                  const avatar = getAvatarForResponse(response);
                  const displayName = response.is_admin 
                    ? (avatar?.full_name || avatar?.title || 'Support')
                    : 'You';
                  
                  // Check if avatar changed (for admin messages only)
                  // Find the LAST admin message before this one (not just previous message)
                  let lastAdminAvatar = null;
                  for (let i = index - 1; i >= 0; i--) {
                    if (selectedTicket.ticket_responses[i].is_admin) {
                      lastAdminAvatar = getAvatarForResponse(selectedTicket.ticket_responses[i]);
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
                    console.log(`Message ${index}: ${response.message.substring(0, 30)}...`);
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
                            <span>{displayName} joined the conversation</span>
                          </div>
                          <div className="flex-1 border-t border-slate-300"></div>
                        </div>
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
                                {!response.is_admin && (
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
                              </div>
                            )}
                            
                            {/* Show read receipts for customer's messages with text */}
                            {response.message && !response.is_admin && (
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
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                
                {/* Typing Indicator */}
                {isAdminTyping && (
                  <div className="flex items-start justify-start animate-fade-in">
                    <div className="bg-white border border-slate-200 text-slate-600 rounded-2xl rounded-tl-sm shadow-sm px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-sm italic">Admin is typing...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-200">
                <div className={`${size === 'fullscreen' || size === 'half' ? 'max-w-2xl mx-auto' : ''}`}>
                
                {/* File Previews */}
                {selectedFiles.length > 0 && (
                  <div className="mb-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-slate-600">
                        {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
                      </span>
                      <button
                        onClick={clearFiles}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="space-y-2">
                      {selectedFiles.map((file, index) => {
                        const previewUrl = createLocalPreviewUrl(file);
                        return (
                          <div key={index} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200">
                            {previewUrl ? (
                              <img 
                                src={previewUrl} 
                                alt={file.name}
                                className="w-10 h-10 rounded object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center text-lg flex-shrink-0">
                                {getFileIcon(file.type)}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-700 truncate">{file.name}</p>
                              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                              onClick={() => removeFile(index)}
                              className="text-red-600 hover:text-red-700 p-1"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                <div 
                  className={`bg-white border border-slate-200 rounded-2xl shadow-sm p-4 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200 ${
                    isDragging ? 'border-blue-400 bg-blue-50' : ''
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {isDragging && (
                    <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 rounded-2xl z-10 pointer-events-none">
                      <div className="text-blue-600 text-sm font-medium">
                        Drop files here...
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      <textarea
                        ref={inputRef}
                        value={responseMessage}
                        onChange={(e) => handleMessageChange(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleRespond())}
                        placeholder="Type your message..."
                        className="w-full resize-none border-0 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-base leading-relaxed min-h-[44px] max-h-[120px]"
                        rows={1}
                        disabled={isSending}
                      />
                    </div>
                    
                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={ALLOWED_MIME_TYPES.join(',')}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    
                    {/* File upload button */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending}
                      className="flex items-center justify-center w-10 h-10 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Attach file"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={handleRespond}
                      disabled={(!responseMessage.trim() && selectedFiles.length === 0) || isSending}
                      className="flex items-center justify-center w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-200 text-white rounded-xl shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed"
                    >
                      {isSending ? (
                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Ticket List */}
              <div className="flex-1 overflow-y-auto bg-slate-50">
                {isLoadingTickets ? (
                  <div className="p-4 space-y-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="w-full p-4 bg-white border border-slate-200 rounded-xl animate-pulse">
                        <div className="flex items-start justify-between mb-2">
                          <div className="h-4 bg-slate-200 rounded w-2/3"></div>
                          <div className="h-5 bg-slate-200 rounded-full w-16"></div>
                        </div>
                        <div className="h-3 bg-slate-200 rounded w-full mb-1"></div>
                        <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="h-3 bg-slate-200 rounded w-24"></div>
                          <div className="h-3 bg-slate-200 rounded w-16"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : groupedTickets[activeTab].length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    <p>No {activeTab} tickets</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-2">
                    {groupedTickets[activeTab].map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={() => handleTicketSelect(ticket)}
                        className="w-full p-4 text-left bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01]"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-medium text-slate-900 text-sm">{ticket.subject}</h3>
                          {isWaitingForResponse(ticket) && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </p>
                      </button>
                    ))}
                    
                    {/* Load More Button */}
                    {hasMoreTickets[activeTab] && (
                      <button
                        onClick={loadMoreTickets}
                        disabled={loadingMore}
                        className="w-full p-3 mt-4 text-sm text-blue-600 bg-white border border-blue-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingMore ? 'Loading...' : 'Load More Tickets'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Bottom Tabs - Only show when no ticket selected */}
          {!selectedTicket && (
            <div className="flex justify-center px-2 py-2 bg-white border-t border-slate-200">
              <div className="relative bg-white/80 backdrop-blur-2xl p-1 rounded-2xl border border-gray-200/50 w-full">
                {/* Background slider */}
                <div 
                  className={`absolute top-1 h-[calc(100%-8px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-150 ease-out ${
                    activeTab === 'in progress' 
                      ? 'left-1 w-[calc(33.333%-4px)]' 
                      : activeTab === 'open'
                      ? 'left-[calc(33.333%+1px)] w-[calc(33.333%-4px)]'
                      : 'left-[calc(66.666%+1px)] w-[calc(33.333%-4px)]'
                  }`}
                />
                
                <div className="relative flex">
                  {statuses.map((status) => {
                    const isActive = activeTab === status;
                    
                    return (
                      <button
                        key={status}
                        onClick={() => setActiveTab(status)}
                        className={`relative px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center ${
                          isActive
                            ? 'text-gray-900'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <span className="capitalize">{status}</span>
                        <span className="ml-1 text-xs opacity-60">
                          ({groupedTickets[status].length})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}
