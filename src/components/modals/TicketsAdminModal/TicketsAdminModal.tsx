'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, PlusIcon, UserCircleIcon, Cog6ToothIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Listbox, Popover, Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';
import Tooltip from '@/components/Tooltip';
import { Menu, X, User, Users, Check, ChevronDown, Pin, AlertTriangle } from 'lucide-react';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import AvatarManagementModal from '@/components/modals/AvatarManagementModal/AvatarManagementModal';
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

interface TicketNote {
  id: string;
  ticket_id: string;
  admin_id: string;
  note_text: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  admin_email?: string;
  admin_full_name?: string;
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
  assigned_to?: string | null;
  priority?: string;
  ticket_responses: TicketResponse[];
}

interface Avatar {
  id: string;
  title: string;
  full_name?: string;
  image?: string;
}

interface PredefinedResponse {
  id: string;
  order: number;
  subject: string;
  text: string;
}

interface TicketsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WidgetSize = 'initial' | 'half' | 'fullscreen';

const statuses = ['all', 'in progress', 'open', 'closed'];

export default function TicketsAdminModal({ isOpen, onClose }: TicketsAdminModalProps) {
  const { t } = useAccountTranslations();
  const { settings } = useSettings();
  
  // Load saved modal size from localStorage on mount
  const [size, setSize] = useState<WidgetSize>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ticketsModalSize');
      if (saved && ['initial', 'half', 'fullscreen'].includes(saved)) {
        return saved as WidgetSize;
      }
    }
    return 'initial';
  });
  
  // Save modal size to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ticketsModalSize', size);
    }
  }, [size]);
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [activeTab, setActiveTab] = useState(statuses[0]);
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [selectedAvatar, setSelectedAvatar] = useState<Avatar | null>(null);
  const [predefinedResponses, setPredefinedResponses] = useState<PredefinedResponse[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [ticketsPerPage] = useState(20);
  const [hasMoreTickets, setHasMoreTickets] = useState<{[key: string]: boolean}>({});
  const [loadingMore, setLoadingMore] = useState(false);
  const [adminUsers, setAdminUsers] = useState<{id: string; email: string; full_name?: string}[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'my' | 'unassigned'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [internalNotes, setInternalNotes] = useState<TicketNote[]>([]);
  const [noteText, setNoteText] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  const [ticketsWithPinnedNotes, setTicketsWithPinnedNotes] = useState<Set<string>>(new Set());
  const [ticketNoteCounts, setTicketNoteCounts] = useState<Map<string, number>>(new Map());
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [ticketToClose, setTicketToClose] = useState<{id: string; subject: string} | null>(null);
  const [showAvatarManagement, setShowAvatarManagement] = useState(false);
  const [avatarManagementCreateMode, setAvatarManagementCreateMode] = useState(false);
  const [isLoadingTickets, setIsLoadingTickets] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [isChangingPriority, setIsChangingPriority] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [attachmentUrls, setAttachmentUrls] = useState<{[key: string]: string}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
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
      fetchAdminUsers();
      fetchCurrentUser();
      fetchTicketsWithPinnedNotes();
      fetchTicketNoteCounts();
      // Fetch predefined responses if available (optional feature)
      fetchPredefinedResponses().catch(() => {
        // Silently ignore if table doesn't exist
      });
      setupRealtimeSubscription();
    }

    return () => {
      console.log('🔌 Unsubscribing from realtime (admin modal)');
      supabase.channel('tickets-admin-channel').unsubscribe();
    };
  }, [isOpen]);

  // Track the previous number of responses to only scroll on new messages
  const prevResponseCountRef = useRef<number>(0);

  useEffect(() => {
    setTimeout(() => scrollToBottom(), 100); // Delay scroll to ensure new messages are rendered
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
    }
  }, [selectedTicket?.ticket_responses?.length, isOpen]); // Watch length, not the array itself

  // Save selected avatar to localStorage whenever it changes
  useEffect(() => {
    if (selectedAvatar?.id) {
      localStorage.setItem('admin_selected_avatar_id', selectedAvatar.id);
    }
  }, [selectedAvatar?.id]);

  // Mark messages as read when admin starts typing (indicates they're actively viewing)
  useEffect(() => {
    if (responseMessage && selectedTicket?.id && isOpen) {
      markMessagesAsRead(selectedTicket.id);
    }
  }, [responseMessage, isOpen]);

  // Mark messages as read when admin adds internal notes (active engagement)
  useEffect(() => {
    if (noteText && selectedTicket?.id && isOpen) {
      markMessagesAsRead(selectedTicket.id);
    }
  }, [noteText, isOpen]);

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

  // Auto-resize note textarea
  useEffect(() => {
    const textarea = noteInputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [noteText]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close modal
      if (e.key === 'Escape' && !showCloseConfirmation && !showAvatarManagement) {
        onClose();
        return;
      }

      // Ctrl+Enter to send message
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        if (responseMessage.trim() && selectedTicket && selectedAvatar && !isSending) {
          handleAdminRespond();
        }
      }

      // Arrow keys for ticket navigation (when not in input field)
      if (selectedTicket && !showInternalNotes) {
        const activeElement = document.activeElement;
        const isInInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
        
        if (!isInInput && tickets.length > 0) {
          // Filter tickets by active tab
          let currentTickets = activeTab === 'all' 
            ? tickets 
            : tickets.filter((ticket) => ticket.status === activeTab);
          
          // Apply assignment filter
          if (assignmentFilter === 'my' && currentUserId) {
            currentTickets = currentTickets.filter(ticket => ticket.assigned_to === currentUserId);
          } else if (assignmentFilter === 'unassigned') {
            currentTickets = currentTickets.filter(ticket => !ticket.assigned_to);
          }
          
          // Apply priority filter
          if (priorityFilter !== 'all') {
            currentTickets = currentTickets.filter(ticket => ticket.priority === priorityFilter);
          }
          
          // Apply search query
          if (searchQuery) {
            currentTickets = currentTickets.filter((ticket) =>
              ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ticket.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ticket.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              ticket.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
          }
          
          const currentIndex = currentTickets.findIndex(t => t.id === selectedTicket.id);
          
          if (e.key === 'ArrowUp' && currentIndex > 0) {
            e.preventDefault();
            handleTicketSelect(currentTickets[currentIndex - 1]);
          } else if (e.key === 'ArrowDown' && currentIndex < currentTickets.length - 1) {
            e.preventDefault();
            handleTicketSelect(currentTickets[currentIndex + 1]);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, responseMessage, selectedTicket, selectedAvatar, isSending, showCloseConfirmation, showAvatarManagement, showInternalNotes, activeTab, tickets, assignmentFilter, priorityFilter, searchQuery, currentUserId]);

  // Separate effect for typing channel subscription
  useEffect(() => {
    if (!isOpen || !selectedTicket?.id) return;

    console.log('🔔 Setting up typing channel for ticket (Admin):', selectedTicket.id);

    const typingChannel = supabase
      .channel(`typing-${selectedTicket.id}`, {
        config: {
          broadcast: { self: false },
        },
      })
      .on('broadcast', { event: 'typing' }, ({ payload }: { payload: any }) => {
        console.log('🎯 Typing event received (Admin):', payload);
        if (payload.ticketId === selectedTicket.id && !payload.isAdmin) {
          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          // Show typing indicator
          setIsCustomerTyping(true);
          // Auto-hide after 3 seconds
          typingTimeoutRef.current = setTimeout(() => {
            setIsCustomerTyping(false);
          }, 3000);
        }
      })
      .subscribe((status) => {
        console.log('📡 Typing channel status (Admin):', status);
      });

    return () => {
      console.log('🔌 Unsubscribing from typing channel (Admin):', selectedTicket.id);
      typingChannel.unsubscribe();
    };
  }, [isOpen, selectedTicket?.id]);

  // Hide search input when user starts typing in the message field
  useEffect(() => {
    if (responseMessage.trim() && showSearch) {
      setShowSearch(false);
      setSearchQuery('');
    }
  }, [responseMessage]);

  const refreshSelectedTicket = async () => {
    const currentTicket = selectedTicketRef.current;
    
    if (!currentTicket) {
      console.log('⚠️ No selected ticket to refresh');
      return;
    }
    
    console.log('🔍 Starting refresh for ticket:', currentTicket.id);
    
    try {
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('id, subject, status, customer_id, created_at, message, preferred_contact_method, email, full_name, assigned_to, priority')
        .eq('id', currentTicket.id)
        .single();
      
      if (ticketError) {
        console.error('❌ Error fetching ticket:', ticketError);
        throw ticketError;
      }
      
      console.log('✅ Ticket data fetched', {
        assigned_to: ticketData.assigned_to,
        priority: ticketData.priority,
        status: ticketData.status
      });
      
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
      
      console.log('✅ Responses fetched:', responsesData?.length);
      
      // Process responses to flatten attachments
      const processedResponses = (responsesData || []).map((response: any) => ({
        ...response,
        attachments: response.ticket_attachments || []
      }));
      
      const updatedTicket = {
        ...ticketData,
        ticket_responses: processedResponses
      };
      
      console.log('🔄 Selected ticket refreshed', {
        responses: updatedTicket.ticket_responses.length,
        assigned_to: updatedTicket.assigned_to,
        priority: updatedTicket.priority
      });
      setSelectedTicket(updatedTicket);
      // Load attachment URLs for image previews
      loadAttachmentUrls(processedResponses);
      // Force scroll after state update
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      console.error('❌ Error refreshing selected ticket:', err);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      const channel = supabase
        .channel('tickets-admin-channel', {
          config: {
            broadcast: { self: true },
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
            console.log('✅ Realtime: Ticket change', payload);
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
            console.log('✅ Realtime: Response change', payload);
            fetchTickets();
            refreshSelectedTicket();
          }
        )
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'ticket_notes'
          },
          (payload) => {
            console.log('✅ Realtime: Internal note change', payload);
            const currentTicket = selectedTicketRef.current;
            if (currentTicket) {
              fetchInternalNotes(currentTicket.id);
            }
            // Refresh the list of tickets with pinned notes and note counts
            fetchTicketsWithPinnedNotes();
            fetchTicketNoteCounts();
          }
        )
        .subscribe((status) => {
          console.log('📡 Realtime status:', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Realtime subscription active for admin modal');
          }
          if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime channel error - check RLS policies');
          }
          if (status === 'TIMED_OUT') {
            console.error('❌ Realtime subscription timed out');
          }
          if (status === 'CLOSED') {
            console.log('🔌 Realtime channel closed');
          }
        });
    } catch (err) {
      console.error('❌ Error setting up realtime subscription:', err);
    }
  };

  const loadAttachmentUrls = async (responses: any[]) => {
    const urlsMap: Record<string, string> = {};
    
    for (const response of responses) {
      if (response.attachments && Array.isArray(response.attachments)) {
        for (const attachment of response.attachments) {
          // Only load URLs for image files
          if (isImageFile(attachment.file_type)) {
            try {
              const result = await getAttachmentUrl(attachment.file_path);
              if (result.url) {
                urlsMap[attachment.id] = result.url;
              }
            } catch (error) {
              console.error('Error loading attachment URL:', error);
            }
          }
        }
      }
    }
    
    setAttachmentUrls(urlsMap);
  };

  const fetchTickets = async (loadMore: boolean = false) => {
    if (!loadMore) {
      setIsLoadingTickets(true);
    }
    try {
      const startIndex = loadMore ? tickets.length : 0;
      // Fetch more tickets to ensure we have enough for all status tabs after filtering
      const fetchCount = ticketsPerPage * 3; // Fetch 60 tickets to cover all statuses
      
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
          assigned_to, 
          priority, 
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
        .order('created_at', { ascending: false })
        .order('created_at', { foreignTable: 'ticket_responses', ascending: true })
        .range(startIndex, startIndex + fetchCount - 1);

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

      // Check if there are more tickets to load
      const hasMore: {[key: string]: boolean} = {};
      const moreTicketsAvailable = (ticketsData?.length || 0) === fetchCount;
      for (const status of statuses) {
        hasMore[status] = moreTicketsAvailable;
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

  const fetchAvatars = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_avatars')
        .select('id, title, full_name, image')
        .eq('organization_id', settings.organization_id)
        .order('title', { ascending: true });

      if (error) {
        // Table doesn't exist - use default avatar only (this is expected)
        const avatarList = [{ id: 'default', title: 'Support', full_name: undefined, image: undefined }];
        setAvatars(avatarList);
        // Only set default if no avatar is currently selected
        if (!selectedAvatar) {
          setSelectedAvatar(avatarList[0]);
        }
        return;
      }
      
      const avatarList = [{ id: 'default', title: 'Support', full_name: undefined, image: undefined }, ...(data || [])];
      setAvatars(avatarList);
      
      // Try to restore previously selected avatar from localStorage
      const savedAvatarId = localStorage.getItem('admin_selected_avatar_id');
      if (savedAvatarId) {
        const savedAvatar = avatarList.find(a => a.id === savedAvatarId);
        if (savedAvatar) {
          setSelectedAvatar(savedAvatar);
          return;
        }
      }
      
      // Only set default if no avatar is currently selected
      if (!selectedAvatar) {
        setSelectedAvatar(avatarList[0]);
      }
    } catch (err) {
      // Silently handle if table doesn't exist
      const avatarList = [{ id: 'default', title: 'Support', full_name: undefined, image: undefined }];
      setAvatars(avatarList);
      // Only set default if no avatar is currently selected
      if (!selectedAvatar) {
        setSelectedAvatar(avatarList[0]);
      }
    }
  };

  // Function to fetch admin users for ticket assignment
  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('organization_id', settings.organization_id)
        .eq('role', 'admin')
        .order('full_name', { ascending: true });

      if (error) {
        console.error('Error fetching admin users:', error);
        return;
      }

      setAdminUsers(data || []);
    } catch (err) {
      console.error('Error fetching admin users:', err);
    }
  };

  // Function to fetch current user ID
  const fetchCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const markMessagesAsRead = async (ticketId: string) => {
    try {
      // Mark all customer messages in this ticket as read by the admin
      const { error } = await supabase
        .from('ticket_responses')
        .update({ 
          is_read: true, 
          read_at: new Date().toISOString() 
        })
        .eq('ticket_id', ticketId)
        .eq('is_admin', false)
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
            !response.is_admin && !response.is_read
              ? { ...response, is_read: true, read_at: new Date().toISOString() }
              : response
          )
        };
      });
      
      // Also update in the tickets list to refresh unread badges
      setTickets(prev => prev.map(ticket => {
        if (ticket.id !== ticketId) return ticket;
        return {
          ...ticket,
          ticket_responses: ticket.ticket_responses.map(response =>
            !response.is_admin && !response.is_read
              ? { ...response, is_read: true, read_at: new Date().toISOString() }
              : response
          )
        };
      }));
    } catch (err) {
      console.error('Unexpected error marking messages as read:', err);
    }
  };

  // Function to fetch tickets that have pinned notes
  const fetchTicketsWithPinnedNotes = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_notes')
        .select('ticket_id')
        .eq('is_pinned', true);

      if (error) {
        console.error('Error fetching pinned notes:', error);
        return;
      }

      // Create a Set of ticket IDs that have pinned notes
      const ticketIds = new Set(data?.map(note => note.ticket_id) || []);
      setTicketsWithPinnedNotes(ticketIds);
    } catch (err) {
      console.error('Error fetching tickets with pinned notes:', err);
    }
  };

  // Function to fetch note counts for all tickets
  const fetchTicketNoteCounts = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_notes')
        .select('ticket_id');

      if (error) {
        console.error('Error fetching note counts:', error);
        return;
      }

      // Count notes per ticket
      const counts = new Map<string, number>();
      data?.forEach(note => {
        const currentCount = counts.get(note.ticket_id) || 0;
        counts.set(note.ticket_id, currentCount + 1);
      });
      
      setTicketNoteCounts(counts);
    } catch (err) {
      console.error('Error fetching ticket note counts:', err);
    }
  };

  // Function to assign ticket to an admin
  const handleAssignTicket = async (ticketId: string, adminId: string | null) => {
    // Optimistic update
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, assigned_to: adminId } 
          : ticket
      )
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, assigned_to: adminId } : null);
    }
    
    setIsAssigning(true);
    try {
      console.log('🎯 Assigning ticket:', { ticketId, adminId, assigningTo: adminId });
      
      const { data, error } = await supabase
        .from('tickets')
        .update({ assigned_to: adminId })
        .eq('id', ticketId)
        .select('id, assigned_to');

      if (error) {
        console.error('❌ Assignment error:', error);
        throw error;
      }

      console.log('✅ Assignment response from DB:', data);
      setToast({ message: adminId ? 'Ticket assigned successfully' : 'Ticket unassigned successfully', type: 'success' });
    } catch (err) {
      console.error('❌ Error assigning ticket:', err);
      // Revert optimistic update on error
      await fetchTickets();
      if (selectedTicket?.id === ticketId) {
        const { data } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();
        if (data) setSelectedTicket(data as Ticket);
      }
      setToast({ message: 'Failed to assign ticket', type: 'error' });
    } finally {
      setIsAssigning(false);
    }
  };

  // Function to change ticket priority
  const handlePriorityChange = async (ticketId: string, priority: string | null) => {
    const priorityValue: string | undefined = priority ?? undefined;
    
    // Optimistic update
    setTickets(prev => 
      prev.map(ticket => 
        ticket.id === ticketId 
          ? { ...ticket, priority: priorityValue } 
          : ticket
      )
    );
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(prev => prev ? { ...prev, priority: priorityValue } : null);
    }
    
    setIsChangingPriority(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ priority })
        .eq('id', ticketId);

      if (error) throw error;
      setToast({ message: priority ? `Priority set to ${priority}` : 'Priority removed', type: 'success' });
    } catch (err) {
      console.error('Error changing priority:', err);
      // Revert optimistic update on error
      await fetchTickets();
      if (selectedTicket?.id === ticketId) {
        const { data } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();
        if (data) setSelectedTicket(data as Ticket);
      }
      setToast({ message: 'Failed to change priority', type: 'error' });
    } finally {
      setIsChangingPriority(false);
    }
  };

  // Function to fetch internal notes for a ticket
  const fetchInternalNotes = async (ticketId: string) => {
    try {
      // First get the notes
      const { data: notesData, error: notesError } = await supabase
        .from('ticket_notes')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (notesError) {
        console.error('Error fetching internal notes:', notesError);
        return;
      }

      // Then fetch admin info for each note
      if (notesData && notesData.length > 0) {
        const adminIds = [...new Set(notesData.map(note => note.admin_id))];
        const { data: adminData, error: adminError } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', adminIds);

        if (adminError) {
          console.error('Error fetching admin info:', adminError);
        }

        // Map admin info to notes
        const adminMap = new Map(adminData?.map(admin => [admin.id, admin]) || []);
        const notesWithAdmin = notesData.map(note => ({
          ...note,
          admin_email: adminMap.get(note.admin_id)?.email,
          admin_full_name: adminMap.get(note.admin_id)?.full_name
        }));

        // Sort: pinned notes first, then by created_at
        const sortedNotes = notesWithAdmin.sort((a, b) => {
          if (a.is_pinned && !b.is_pinned) return -1;
          if (!a.is_pinned && b.is_pinned) return 1;
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        setInternalNotes(sortedNotes);
      } else {
        setInternalNotes([]);
      }
    } catch (err) {
      console.error('Error fetching internal notes:', err);
    }
  };

  // Function to add internal note
  const handleAddInternalNote = async () => {
    if (!noteText.trim() || !selectedTicket || !currentUserId) return;

    setIsAddingNote(true);
    try {
      const { data, error } = await supabase
        .from('ticket_notes')
        .insert({
          ticket_id: selectedTicket.id,
          admin_id: currentUserId,
          note_text: noteText.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      // Fetch admin info
      const { data: adminData } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', currentUserId)
        .single();

      // Add to local state with admin info
      const newNote: TicketNote = {
        ...data,
        admin_email: adminData?.email,
        admin_full_name: adminData?.full_name
      };
      
      setInternalNotes(prev => [...prev, newNote]);
      setNoteText('');
      setToast({ message: 'Internal note added', type: 'success' });
    } catch (err) {
      console.error('Error adding internal note:', err);
      setToast({ message: 'Failed to add internal note', type: 'error' });
    } finally {
      setIsAddingNote(false);
    }
  };

  // Function to toggle pin status of internal note
  const handleTogglePinNote = async (noteId: string, currentPinStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('ticket_notes')
        .update({ is_pinned: !currentPinStatus })
        .eq('id', noteId);

      if (error) throw error;

      setInternalNotes(prev => 
        prev.map(note => 
          note.id === noteId 
            ? { ...note, is_pinned: !currentPinStatus }
            : note
        )
      );
      
      // Refresh tickets with pinned notes list
      fetchTicketsWithPinnedNotes();
      
      setToast({ message: currentPinStatus ? 'Note unpinned' : 'Note pinned to top', type: 'success' });
    } catch (err) {
      console.error('Error toggling pin status:', err);
      setToast({ message: 'Failed to update note', type: 'error' });
    }
  };

  // Function to delete internal note
  const handleDeleteInternalNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('ticket_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setInternalNotes(prev => prev.filter(note => note.id !== noteId));
      setToast({ message: 'Internal note deleted', type: 'success' });
    } catch (err) {
      console.error('Error deleting internal note:', err);
      setToast({ message: 'Failed to delete internal note', type: 'error' });
    }
  };

  const fetchPredefinedResponses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user logged in, skipping predefined responses');
        return;
      }

      console.log('Fetching predefined responses for org:', settings.organization_id);
      const { data, error } = await supabase
        .from('tickets_predefined_responses')
        .select('id, order, subject, text')
        .eq('organization_id', settings.organization_id)
        .order('order', { ascending: true });

      if (error) {
        // Table doesn't exist yet - this is expected and optional
        console.log('Predefined responses table not available:', error.message);
        setPredefinedResponses([]);
        return;
      }
      
      console.log('✅ Predefined responses loaded:', data?.length || 0, data);
      setPredefinedResponses(data || []);
    } catch (err) {
      console.error('Error fetching predefined responses:', err);
      setPredefinedResponses([]);
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const broadcastTyping = () => {
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
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setResponseMessage(e.target.value);
    broadcastTyping();
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

  const handleAdminRespond = async () => {
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
      created_at: new Date().toISOString(),
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
      
      // Prepare response data - only include avatar_id if it's not the default
      const responseData: any = {
        ticket_id: selectedTicket.id,
        user_id: user?.id,
        message: tempMessage,
        is_admin: true,
        is_read: false,
        created_at: new Date().toISOString(),
      };
      
      // Only add avatar_id if it exists in the database (not 'default')
      if (selectedAvatar.id !== 'default') {
        responseData.avatar_id = selectedAvatar.id;
      }
      
      const { data, error } = await supabase
        .from('ticket_responses')
        .insert(responseData)
        .select()
        .single();

      if (error) {
        console.error('Error inserting ticket response:', error);
        throw new Error(error.message);
      }

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
  };

  const handleTicketSelect = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowInternalNotes(false); // Reset notes visibility when switching tickets
    setInternalNotes([]); // Clear previous notes
    fetchInternalNotes(ticket.id); // Fetch notes for the selected ticket
    // Mark customer messages as read when admin opens the ticket
    markMessagesAsRead(ticket.id);
    // Load attachment URLs for image previews
    if (ticket.ticket_responses) {
      loadAttachmentUrls(ticket.ticket_responses);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    // Show confirmation dialog only for closing tickets
    if (newStatus === 'closed') {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket) {
        setTicketToClose({ id: ticketId, subject: ticket.subject });
        setShowCloseConfirmation(true);
        return;
      }
    }

    // For other status changes, proceed directly
    await executeStatusChange(ticketId, newStatus);
  };

  const executeStatusChange = async (ticketId: string, newStatus: string) => {
    // Optimistic update
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus } : t)));
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus } : prev));
    }
    
    setIsChangingStatus(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setToast({ message: 'User not authenticated', type: 'error' });
        return;
      }

      // Call API route instead of direct Supabase update
      const response = await fetch('/api/tickets/status', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          status: newStatus,
          organization_id: settings.organization_id,
          user_id: user.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update status');
      }

      setToast({ message: 'Status updated successfully', type: 'success' });
    } catch (error: any) {
      console.error('Error updating ticket status:', error);
      // Revert optimistic update on error
      await fetchTickets();
      if (selectedTicket?.id === ticketId) {
        const { data } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', ticketId)
          .single();
        if (data) setSelectedTicket(data as Ticket);
      }
      setToast({ message: error.message || 'Failed to update status', type: 'error' });
    } finally {
      setIsChangingStatus(false);
    }
  };

  const confirmCloseTicket = async () => {
    if (ticketToClose) {
      await executeStatusChange(ticketToClose.id, 'closed');
      setShowCloseConfirmation(false);
      setTicketToClose(null);
    }
  };

  const cancelCloseTicket = () => {
    setShowCloseConfirmation(false);
    setTicketToClose(null);
  };

  const toggleSize = () => {
    setSize((prev) => {
      if (prev === 'initial') return 'half';
      if (prev === 'half') return 'fullscreen';
      return 'initial'; // fullscreen → initial
    });
  };

  const groupedTickets = statuses.reduce(
    (acc, status) => {
      // For 'all' status, include all tickets regardless of their status
      let filteredTickets = status === 'all' 
        ? tickets 
        : tickets.filter((ticket) => ticket.status === status);
      
      // Apply assignment filter
      if (assignmentFilter === 'my' && currentUserId) {
        filteredTickets = filteredTickets.filter(ticket => ticket.assigned_to === currentUserId);
      } else if (assignmentFilter === 'unassigned') {
        filteredTickets = filteredTickets.filter(ticket => !ticket.assigned_to);
      }
      
      // Apply priority filter
      if (priorityFilter === 'high') {
        filteredTickets = filteredTickets.filter(ticket => ticket.priority === 'high');
      } else if (priorityFilter === 'medium') {
        filteredTickets = filteredTickets.filter(ticket => ticket.priority === 'medium');
      } else if (priorityFilter === 'low') {
        filteredTickets = filteredTickets.filter(ticket => ticket.priority === 'low' || !ticket.priority);
      }
      // 'all' shows everything, no additional filter needed
      
      return {
        ...acc,
        [status]: filteredTickets,
      };
    },
    {} as Record<string, Ticket[]>
  );

  const isWaitingForResponse = (ticket: Ticket) => {
    if (ticket.status === 'closed') return false;
    if (ticket.ticket_responses.length === 0) return true;
    const latestResponse = ticket.ticket_responses[ticket.ticket_responses.length - 1];
    return !latestResponse.is_admin;
  };

  const getUnreadCount = (ticket: Ticket) => {
    return ticket.ticket_responses.filter(r => !r.is_admin && !r.is_read).length;
  };

  const getPriorityBadgeClass = (priority: string | undefined | null) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const getPriorityLabel = (priority: string | undefined | null) => {
    if (!priority) return 'Low';
    return priority.charAt(0).toUpperCase() + priority.slice(1);
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

  const usePredefinedResponse = (response: PredefinedResponse) => {
    setResponseMessage(response.text);
    inputRef.current?.focus();
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
          
          {/* Title - Show "Ticket" with tooltip and admin avatars */}
          <div className="flex-1 flex items-center justify-center mx-4 gap-3">
            {selectedTicket ? (
              <>
                <Popover className="relative">
                  <Popover.Button className="text-sm font-semibold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer">
                    Ticket
                  </Popover.Button>
                  <Transition
                    enter="transition ease-out duration-200"
                    enterFrom="opacity-0 translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-150"
                    leaveFrom="opacity-100 translate-y-0"
                    leaveTo="opacity-0 translate-y-1"
                  >
                    <Popover.Panel className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 p-3 z-[10002]">
                      <div className="space-y-2">
                        {/* Ticket ID */}
                        <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                          <span className="text-xs text-slate-500">Ticket ID:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-slate-700">{selectedTicket.id}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(selectedTicket.id);
                                setToast({ message: 'Ticket ID copied!', type: 'success' });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                              title="Copy ID"
                            >
                              <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Subject */}
                        <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                          <span className="text-xs text-slate-500">Subject:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-700 truncate max-w-[180px]">{selectedTicket.subject}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(selectedTicket.subject);
                                setToast({ message: 'Subject copied!', type: 'success' });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                              title="Copy subject"
                            >
                              <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Status */}
                        <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                          <span className="text-xs text-slate-500">Status:</span>
                          <span className={`text-xs font-medium ${getStatusBadgeClass(selectedTicket.status).replace('bg-', 'text-').replace('text-white', 'text-blue-700')}`}>
                            {selectedTicket.status}
                          </span>
                        </div>
                        
                        {/* Priority */}
                        <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                          <span className="text-xs text-slate-500">Priority:</span>
                          <span className={`text-xs font-medium ${getPriorityBadgeClass(selectedTicket.priority).replace('bg-', 'text-')}`}>
                            {getPriorityLabel(selectedTicket.priority)}
                          </span>
                        </div>
                        
                        {/* Created */}
                        <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                          <span className="text-xs text-slate-500">Created:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-700">{new Date(selectedTicket.created_at).toLocaleString()}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(new Date(selectedTicket.created_at).toLocaleString());
                                setToast({ message: 'Date copied!', type: 'success' });
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                              title="Copy date"
                            >
                              <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        {/* Customer */}
                        <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                          <span className="text-xs text-slate-500">Customer:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-700">{selectedTicket.full_name || 'Anonymous'}</span>
                            {selectedTicket.full_name && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedTicket.full_name || '');
                                  setToast({ message: 'Name copied!', type: 'success' });
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                                title="Copy name"
                              >
                                <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                        
                        {/* Email */}
                        {selectedTicket.email && (
                          <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-slate-50 group">
                            <span className="text-xs text-slate-500">Email:</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-700 truncate max-w-[180px]">{selectedTicket.email}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(selectedTicket.email);
                                  setToast({ message: 'Email copied!', type: 'success' });
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition-opacity"
                                title="Copy email"
                              >
                                <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </Popover.Panel>
                  </Transition>
                </Popover>
                
                {/* Show stacked admin avatars */}
                <div className="flex items-center -space-x-2">
                  {(() => {
                    // Get unique admin avatars from responses
                    const adminAvatars = selectedTicket.ticket_responses
                      .filter(r => r.is_admin && r.avatar_id)
                      .map(r => {
                        const avatar = avatars.find(a => a.id === r.avatar_id);
                        return avatar;
                      })
                      .filter((avatar): avatar is Avatar => 
                        avatar !== undefined
                      )
                      .filter((avatar, index, self) => 
                        self.findIndex(a => a.id === avatar.id) === index
                      )
                      .reverse(); // Most recent first
                    
                    return adminAvatars.length > 0 ? (
                      adminAvatars.map((avatar) => (
                        <Tooltip key={avatar.id} content={avatar.full_name || avatar.title || 'Admin'}>
                          <div className="relative ring-2 ring-white rounded-full">
                            {renderAvatar(avatar, avatar.full_name || avatar.title || 'Admin', true)}
                          </div>
                        </Tooltip>
                      ))
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center ring-2 ring-white">
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
              {/* Pinned Notes Banner - Right below header */}
              {internalNotes.filter(note => note.is_pinned).length > 0 && (
                <div className="bg-amber-50 border-b-2 border-amber-300 px-4 py-3">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-start gap-2">
                      <Pin className="h-4 w-4 text-amber-600 fill-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        {internalNotes.filter(note => note.is_pinned).map((note) => (
                          <div key={note.id} className="bg-white/80 border border-amber-300 rounded-lg px-3 py-2 text-sm">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-amber-900">
                                  📌 {note.admin_full_name || note.admin_email || 'Admin'}
                                </span>
                                <span className="text-xs text-amber-700">
                                  {new Date(note.created_at).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              {note.admin_id === currentUserId && (
                                <button
                                  onClick={() => handleTogglePinNote(note.id, note.is_pinned)}
                                  className="text-amber-600 hover:text-amber-700 transition-colors"
                                  title="Unpin note"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">{note.note_text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 bg-slate-50">
                <div className="max-w-3xl mx-auto space-y-4">
                
                {/* Initial message - show customer indicator */}
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 border-t border-slate-300"></div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {renderAvatar(null, selectedTicket.full_name || 'Anonymous', false)}
                    <span>{selectedTicket.full_name || 'Anonymous'} started the conversation</span>
                  </div>
                  <div className="flex-1 border-t border-slate-300"></div>
                </div>
                
                <div className="flex justify-start items-start">
                  <div className="max-w-[80%]">
                    <Tooltip 
                      content={`${selectedTicket.full_name || 'Anonymous'}${selectedTicket.email ? ' • ' + selectedTicket.email : ''} • ${new Date(selectedTicket.created_at).toLocaleString()}`}
                    >
                      <div className="bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200 text-slate-800 rounded-2xl rounded-tl-sm shadow-sm px-3 py-2 cursor-help">
                        <div>
                          <p className="text-sm leading-snug inline">{selectedTicket.message}</p>
                          <span className="text-[11px] text-slate-500 whitespace-nowrap ml-2">
                            {new Date(selectedTicket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </Tooltip>
                  </div>
                </div>

                {/* Responses */}
                {selectedTicket.ticket_responses.map((response, index) => {
                  const avatar = getAvatarForResponse(response);
                  const displayName = response.is_admin 
                    ? (avatar?.full_name || avatar?.title || 'Admin')
                    : (selectedTicket.full_name || 'Anonymous');
                  
                  // Check if this message was sent by the currently selected avatar
                  const isCurrentAvatar = response.is_admin && avatar && selectedAvatar && avatar.id === selectedAvatar.id;
                  
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
                                <p className="text-sm leading-snug whitespace-pre-wrap inline">{response.message}</p>
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
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm max-w-xs">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-slate-500">Customer is typing...</span>
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
                {/* Predefined Responses Badges - Horizontal Scroll (matching ChatWidget task badges) */}
                {predefinedResponses.length > 0 && (
                  <div className="mb-3 max-h-16 overflow-x-auto overflow-y-hidden" style={{
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(156, 163, 175, 0.5) rgba(241, 245, 249, 0.3)',
                  }}>
                    <style jsx>{`
                      div::-webkit-scrollbar {
                        height: 4px;
                      }
                      div::-webkit-scrollbar-track {
                        background: rgba(241, 245, 249, 0.3);
                        border-radius: 2px;
                        margin: 0 0.5rem;
                      }
                      div::-webkit-scrollbar-thumb {
                        background: rgba(156, 163, 175, 0.5);
                        border-radius: 2px;
                        transition: background-color 0.2s ease;
                      }
                      div::-webkit-scrollbar-thumb:hover {
                        background: rgba(107, 114, 128, 0.7);
                      }
                    `}</style>
                    <div className="flex items-center gap-2 px-1 py-1">
                      <button
                        onClick={() => {/* TODO: Open create predefined response modal */}}
                        className="inline-flex items-center p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition-colors flex-shrink-0"
                        title="Add predefined response"
                      >
                        <PlusIcon className="h-5 w-5" />
                      </button>
                      {predefinedResponses
                        .filter(r => !searchQuery || r.subject.toLowerCase().includes(searchQuery.toLowerCase()) || r.text.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((response) => (
                        <button
                          key={response.id}
                          onClick={() => usePredefinedResponse(response)}
                          className="flex-shrink-0 inline-flex items-center px-4 py-2 bg-slate-100 rounded-full text-sm font-medium text-slate-600 hover:bg-slate-200 transition-colors whitespace-nowrap"
                        >
                          {response.subject}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message Input */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100 transition-all duration-200">
                  {/* File Preview Area */}
                  {selectedFiles.length > 0 && (
                    <div className="mb-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-slate-700">
                          {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
                        </span>
                        <button
                          onClick={clearFiles}
                          className="text-xs text-red-600 hover:text-red-700 font-medium"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            {file.type.startsWith('image/') ? (
                              // Image preview
                              <div className="relative">
                                <img 
                                  src={createLocalPreviewUrl(file) || ''} 
                                  alt={file.name}
                                  className="w-full h-24 object-cover rounded-lg"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
                                <p className="absolute bottom-1 left-1 right-1 text-[10px] text-white truncate">
                                  {file.name}
                                </p>
                              </div>
                            ) : (
                              // File icon preview
                              <div className="h-24 bg-slate-50 border border-slate-200 rounded-lg flex flex-col items-center justify-center p-2">
                                <span className="text-2xl mb-1">{getFileIcon(file.type)}</span>
                                <p className="text-[10px] text-slate-600 text-center truncate w-full px-1">
                                  {file.name}
                                </p>
                                <p className="text-[9px] text-slate-500">{formatFileSize(file.size)}</p>
                              </div>
                            )}
                            
                            {/* Upload progress overlay */}
                            {uploadProgress[file.name as keyof typeof uploadProgress] && (
                              <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                <div className="text-white text-center">
                                  <div className="text-xs font-medium mb-1">
                                    {uploadProgress[file.name as keyof typeof uploadProgress]}%
                                  </div>
                                  <div className="w-20 h-1 bg-white/30 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-white transition-all duration-300"
                                      style={{ width: `${uploadProgress[file.name as keyof typeof uploadProgress]}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Remove button */}
                            <button
                              onClick={() => removeFile(index)}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Drag and Drop Zone */}
                  {isDragging && (
                    <div className="mb-3 border-2 border-dashed border-blue-400 bg-blue-50 rounded-lg p-6 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="text-sm font-medium text-blue-700">Drop files here</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative"
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <textarea
                        ref={inputRef}
                        value={responseMessage}
                        onChange={handleMessageChange}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAdminRespond())}
                        placeholder="Type your message..."
                        className="w-full resize-none border-0 bg-transparent text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 text-base leading-relaxed min-h-[44px] max-h-[120px]"
                        rows={1}
                        disabled={isSending}
                      />
                    </div>
                    
                    {/* File attachment button */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept={ALLOWED_MIME_TYPES.join(',')}
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isSending}
                      className="flex items-center justify-center w-10 h-10 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Attach files"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>
                    
                    <button
                      onClick={handleAdminRespond}
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
                  
                  {/* Bottom row with search and avatar selector */}
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => {
                          setShowSearch(!showSearch);
                          if (showSearch) {
                            setSearchQuery('');
                          }
                        }}
                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 ${
                          showSearch 
                            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                            : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'
                        }`}
                        title="Search predefined responses"
                      >
                        <MagnifyingGlassIcon className="h-4 w-4" />
                      </button>

                      {/* Search Input - inline */}
                      {showSearch && (
                        <div className="flex-1 animate-in slide-in-from-left-2 duration-200">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search predefined responses..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-sm"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    {/* Avatar Selector with Management */}
                    <div className="flex items-center gap-2">
                      {avatars.length > 1 && (
                        <Listbox value={selectedAvatar} onChange={setSelectedAvatar}>
                          <div className="relative">
                            <Listbox.Button className="flex items-center gap-2 px-2 py-1.5 text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                              {/* Avatar Image/Initials */}
                              {selectedAvatar && renderAvatar(selectedAvatar, selectedAvatar.full_name || selectedAvatar.title, true)}
                              {/* Avatar Name */}
                              <span className="text-sm font-medium">
                                {selectedAvatar?.full_name || selectedAvatar?.title || 'Select Avatar'}
                              </span>
                            </Listbox.Button>
                            <Transition
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                            >
                              <Listbox.Options className="absolute bottom-full right-0 mb-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 max-h-60 overflow-auto focus:outline-none text-sm z-50">
                                {avatars.map((avatar) => (
                                  <Listbox.Option
                                    key={avatar.id}
                                    value={avatar}
                                    className={({ active }) =>
                                      `relative cursor-pointer select-none py-2 pl-3 pr-9 ${
                                        active ? 'bg-blue-50 text-blue-900' : 'text-slate-900'
                                      }`
                                    }
                                  >
                                    {({ selected }) => (
                                      <div className="flex items-center gap-2">
                                        {/* Avatar Image/Initials */}
                                        {renderAvatar(avatar, avatar.full_name || avatar.title, true)}
                                        <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                                          {avatar.full_name || avatar.title}
                                        </span>
                                        {selected && (
                                          <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-blue-600">
                                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </Listbox.Option>
                                ))}
                                
                                {/* Divider */}
                                <div className="my-1 border-t border-slate-200" />
                                
                                {/* Add Avatar Button */}
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setAvatarManagementCreateMode(true);
                                    setShowAvatarManagement(true);
                                  }}
                                  className="w-full text-left px-3 py-2 text-sm text-purple-600 hover:bg-purple-50 transition-colors flex items-center gap-2"
                                >
                                  <PlusIcon className="h-4 w-4" />
                                  Add Avatar
                                </button>
                              </Listbox.Options>
                            </Transition>
                          </div>
                        </Listbox>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              </div>

              {/* Internal Notes Section */}
              <div className="bg-amber-50 border-t border-amber-200">
                <div className={`${size === 'fullscreen' || size === 'half' ? 'max-w-2xl mx-auto' : ''}`}>
                  {/* Toggle Header */}
                  <button
                    onClick={() => setShowInternalNotes(!showInternalNotes)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-100 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="text-sm font-medium text-amber-900">
                        Internal Notes 
                        {internalNotes.length > 0 && (
                          <span className="ml-2 text-xs text-amber-700">({internalNotes.length})</span>
                        )}
                      </span>
                    </div>
                    <svg 
                      className={`h-5 w-5 text-amber-700 transition-transform ${showInternalNotes ? 'rotate-180' : ''}`}
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Notes Content */}
                  {showInternalNotes && (
                    <div className="px-4 pb-4 space-y-3 max-h-64 overflow-y-auto">
                      {/* Help Text */}
                      <p className="text-xs text-amber-700 italic">
                        🔒 Internal notes are only visible to admins. Use them for coordination, handoff notes, and context.
                      </p>

                      {/* Notes List */}
                      {internalNotes.length > 0 ? (
                        <div className="space-y-2">
                          {internalNotes.map((note) => (
                            <div 
                              key={note.id} 
                              className={`bg-white rounded-lg p-3 shadow-sm ${
                                note.is_pinned 
                                  ? 'border-2 border-amber-400 bg-amber-50/50' 
                                  : 'border border-amber-200'
                              }`}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    {note.is_pinned && (
                                      <Pin className="h-3 w-3 text-amber-600 fill-amber-600" />
                                    )}
                                    <span className="text-xs font-medium text-slate-700">
                                      {note.admin_full_name || note.admin_email || 'Admin'}
                                    </span>
                                    <span className="text-xs text-slate-400">
                                      {new Date(note.created_at).toLocaleString([], {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm text-slate-800 whitespace-pre-wrap">{note.note_text}</p>
                                </div>
                                {note.admin_id === currentUserId && (
                                  <div className="flex items-center gap-1 ml-2">
                                    <button
                                      onClick={() => handleTogglePinNote(note.id, note.is_pinned)}
                                      className={`p-1 rounded transition-colors ${
                                        note.is_pinned
                                          ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-100'
                                          : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
                                      }`}
                                      title={note.is_pinned ? 'Unpin note' : 'Pin to top'}
                                    >
                                      <Pin className={`h-4 w-4 ${note.is_pinned ? 'fill-amber-600' : ''}`} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteInternalNote(note.id)}
                                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      title="Delete note"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-amber-700 italic text-center py-4">
                          No internal notes yet. Add one below to coordinate with your team.
                        </p>
                      )}

                      {/* Add Note Input */}
                      <div className="bg-white border border-amber-300 rounded-lg p-3 shadow-sm">
                        <textarea
                          ref={noteInputRef}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddInternalNote())}
                          placeholder="Add an internal note (only visible to admins)..."
                          className="w-full resize-none border-0 bg-transparent text-slate-800 placeholder-amber-600/50 focus:outline-none focus:ring-0 text-sm leading-relaxed min-h-[60px] max-h-[120px]"
                          rows={2}
                          disabled={isAddingNote}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleAddInternalNote}
                            disabled={!noteText.trim() || isAddingNote}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed"
                          >
                            {isAddingNote ? 'Adding...' : 'Add Note'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Ticket List */}
              <div className="flex-1 overflow-y-auto bg-slate-50">
                {isLoadingTickets ? (
                  <div className="p-4 space-y-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div key={n} className="w-full p-4 bg-white border border-slate-200 rounded-xl animate-pulse">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="h-4 bg-slate-200 rounded w-2/3 mb-2"></div>
                            <div className="h-3 bg-slate-200 rounded w-1/3 mb-2"></div>
                            <div className="flex gap-2">
                              <div className="h-5 bg-slate-200 rounded-full w-20"></div>
                              <div className="h-5 bg-slate-200 rounded-full w-16"></div>
                            </div>
                          </div>
                        </div>
                        <div className="h-3 bg-slate-200 rounded w-24"></div>
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
                        className={`w-full p-4 text-left bg-white border rounded-xl hover:border-blue-300 hover:shadow-md transition-all duration-200 transform hover:scale-[1.01] ${
                          getUnreadCount(ticket) > 0 ? 'border-blue-400 bg-blue-50' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-slate-900 text-sm">{ticket.subject}</h3>
                              {getUnreadCount(ticket) > 0 && (
                                <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-full">
                                  {getUnreadCount(ticket)}
                                </span>
                              )}
                              {ticketsWithPinnedNotes.has(ticket.id) && (
                                <span title="Has pinned notes">
                                  <Pin className="h-3 w-3 text-amber-600 fill-amber-600 flex-shrink-0" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{ticket.full_name || 'Anonymous'}</p>
                            
                            {/* Assignment, Priority, and Notes badges */}
                            <div className="flex items-center gap-2 mt-1 flex-wrap">{ticket.assigned_to && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-purple-600" />
                                  <span className="text-xs text-purple-700 font-medium">
                                    {adminUsers.find(u => u.id === ticket.assigned_to)?.full_name || 
                                     adminUsers.find(u => u.id === ticket.assigned_to)?.email || 
                                     'Assigned'}
                                  </span>
                                </div>
                              )}
                              {ticket.priority && (
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getPriorityBadgeClass(ticket.priority)}`}>
                                  {getPriorityLabel(ticket.priority)}
                                </span>
                              )}
                              {ticketNoteCounts.has(ticket.id) && ticketNoteCounts.get(ticket.id)! > 0 && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                                  <span className="text-[10px] font-medium text-slate-600">Notes</span>
                                  <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-slate-200 text-slate-700 text-[9px] font-semibold rounded-full">
                                    {ticketNoteCounts.get(ticket.id)}
                                  </span>
                                </div>
                              )}
                              {ticketsWithPinnedNotes.has(ticket.id) && (
                                <span title="Has pinned notes">
                                  <Pin className="h-3 w-3 text-slate-500 fill-slate-500 flex-shrink-0" />
                                </span>
                              )}
                            </div>
                          </div>
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
            <>
              {/* Assignment Filter */}
              <div className="flex justify-center px-2 py-2 bg-slate-50 border-t border-slate-200">
                <div className="relative bg-white/80 backdrop-blur-2xl p-1 rounded-2xl border border-gray-200/50 w-full">
                  {/* Background slider */}
                  <div 
                    className={`absolute top-1 h-[calc(100%-8px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-150 ease-out ${
                      assignmentFilter === 'all' 
                        ? 'left-1 w-[calc(33.333%-4px)]' 
                        : assignmentFilter === 'my'
                        ? 'left-[calc(33.333%+1px)] w-[calc(33.333%-4px)]'
                        : 'left-[calc(66.666%+1px)] w-[calc(33.333%-4px)]'
                    }`}
                  />
                  
                  <div className="relative flex">
                    {/* All Tickets */}
                    <button
                      onClick={() => setAssignmentFilter('all')}
                      className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                        assignmentFilter === 'all'
                          ? 'text-gray-900'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <span className="whitespace-nowrap">All</span>
                      <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                        assignmentFilter === 'all'
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tickets.length}
                      </span>
                    </button>
                    
                    {/* My Tickets */}
                    <button
                      onClick={() => setAssignmentFilter('my')}
                      className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                        assignmentFilter === 'my'
                          ? 'text-gray-900'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <span className="whitespace-nowrap">My</span>
                      <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                        assignmentFilter === 'my'
                          ? 'bg-purple-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {currentUserId ? tickets.filter(t => t.assigned_to === currentUserId).length : 0}
                      </span>
                    </button>
                    
                    {/* Unassigned */}
                    <button
                      onClick={() => setAssignmentFilter('unassigned')}
                      className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                        assignmentFilter === 'unassigned'
                          ? 'text-gray-900'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      <span className="whitespace-nowrap">Unassigned</span>
                      <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                        assignmentFilter === 'unassigned'
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {tickets.filter(t => !t.assigned_to).length}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            
            {/* Priority Filter */}
            <div className="flex justify-center px-2 py-2 bg-white border-t border-slate-200">
              <div className="relative bg-white/80 backdrop-blur-2xl p-1 rounded-2xl border border-gray-200/50 w-full">
                {/* Background slider */}
                <div 
                  className={`absolute top-1 h-[calc(100%-8px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-150 ease-out ${
                    priorityFilter === 'all' 
                      ? 'left-1 w-[calc(25%-4px)]' 
                      : priorityFilter === 'high'
                      ? 'left-[calc(25%+1px)] w-[calc(25%-4px)]'
                      : priorityFilter === 'medium'
                      ? 'left-[calc(50%+1px)] w-[calc(25%-4px)]'
                      : 'left-[calc(75%+1px)] w-[calc(25%-4px)]'
                  }`}
                />
                
                <div className="relative flex">
                  {/* All */}
                  <button
                    onClick={() => setPriorityFilter('all')}
                    className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                      priorityFilter === 'all'
                        ? 'text-gray-900'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <span className="whitespace-nowrap">All</span>
                    <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                      priorityFilter === 'all'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tickets.length}
                    </span>
                  </button>
                  
                  {/* High */}
                  <button
                    onClick={() => setPriorityFilter('high')}
                    className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                      priorityFilter === 'high'
                        ? 'text-gray-900'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <span className="whitespace-nowrap">High</span>
                    <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                      priorityFilter === 'high'
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tickets.filter(t => t.priority === 'high').length}
                    </span>
                  </button>
                  
                  {/* Medium */}
                  <button
                    onClick={() => setPriorityFilter('medium')}
                    className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                      priorityFilter === 'medium'
                        ? 'text-gray-900'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <span className="whitespace-nowrap">Medium</span>
                    <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                      priorityFilter === 'medium'
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tickets.filter(t => t.priority === 'medium').length}
                    </span>
                  </button>
                  
                  {/* Low */}
                  <button
                    onClick={() => setPriorityFilter('low')}
                    className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                      priorityFilter === 'low'
                        ? 'text-gray-900'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <span className="whitespace-nowrap">Low</span>
                    <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                      priorityFilter === 'low'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tickets.filter(t => t.priority === 'low' || !t.priority).length}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            
            {/* Status Tabs */}
            <div className="flex justify-center px-2 py-2 bg-white border-t border-slate-200">
              <div className="relative bg-white/80 backdrop-blur-2xl p-1 rounded-2xl border border-gray-200/50 w-full">
                {/* Background slider */}
                <div 
                  className={`absolute top-1 h-[calc(100%-8px)] bg-white rounded-xl shadow-sm border border-gray-100 transition-all duration-150 ease-out ${
                    activeTab === 'all' 
                      ? 'left-1 w-[calc(25%-4px)]' 
                      : activeTab === 'in progress' 
                      ? 'left-[calc(25%+1px)] w-[calc(25%-4px)]' 
                      : activeTab === 'open'
                      ? 'left-[calc(50%+1px)] w-[calc(25%-4px)]'
                      : 'left-[calc(75%+1px)] w-[calc(25%-4px)]'
                  }`}
                />
                
                <div className="relative flex">
                  {statuses.map((status) => {
                    const isActive = activeTab === status;
                    const count = groupedTickets[status].length;
                    
                    return (
                      <button
                        key={status}
                        onClick={() => setActiveTab(status)}
                        className={`relative px-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 ease-out antialiased tracking-[-0.01em] flex-1 flex items-center justify-center gap-1 ${
                          isActive
                            ? 'text-gray-900'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        <span className="capitalize whitespace-nowrap">{status}</span>
                        <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold transition-all duration-150 ${
                          isActive
                            ? status === 'all'
                              ? 'bg-gray-900 text-white'
                              : status === 'in progress'
                              ? 'bg-blue-600 text-white'
                              : status === 'open'
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            </>
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

      {/* Close Ticket Confirmation Dialog */}
      {showCloseConfirmation && ticketToClose && (
        <div className="fixed inset-0 z-[10003] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">Close Ticket?</h3>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <p className="text-gray-700 font-medium">
                  Are you sure you want to close this ticket?
                </p>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-sm text-gray-600 font-medium">Ticket Subject:</p>
                  <p className="text-sm text-gray-900 mt-1">{ticketToClose.subject}</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-amber-900">This action will:</p>
                    <ul className="text-sm text-amber-800 space-y-1 ml-4 list-disc">
                      <li>Mark the ticket as resolved</li>
                      <li>Send a notification to the customer</li>
                      <li>Move the ticket to the closed section</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-200">
              <button
                onClick={cancelCloseTicket}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmCloseTicket}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Management Modal */}
      {showAvatarManagement && (
        <AvatarManagementModal
          isOpen={showAvatarManagement}
          onClose={() => {
            setShowAvatarManagement(false);
            setAvatarManagementCreateMode(false);
          }}
          onAvatarUpdated={() => {
            fetchAvatars();
          }}
          startInCreateMode={avatarManagementCreateMode}
          organizationId={settings?.organization_id}
        />
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}
