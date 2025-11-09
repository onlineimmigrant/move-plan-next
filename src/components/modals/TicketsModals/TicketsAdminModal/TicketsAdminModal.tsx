'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Rnd } from 'react-rnd';
import { XMarkIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon, PlusIcon, UserCircleIcon, Cog6ToothIcon, CheckIcon } from '@heroicons/react/24/outline';
import { Listbox, Popover, Transition } from '@headlessui/react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/context/SettingsContext';
import Button from '@/ui/Button';
import Toast from '@/components/Toast';
import Tooltip from '@/components/Tooltip';
import { Menu, X, User, Users, Check, ChevronDown, Pin, AlertTriangle, BarChart3, Zap } from 'lucide-react';
import { useAccountTranslations } from '@/components/accountTranslationLogic/useAccountTranslations';
import AvatarManagementModal from '@/components/modals/AvatarManagementModal/AvatarManagementModal';
import { TicketAttachment, FileUploadProgress, ALLOWED_MIME_TYPES, validateFile, uploadFileOnly, downloadAttachment, getAttachmentUrl, deleteAttachment, isImageFile, isPdfFile, getFileIcon, formatFileSize, createLocalPreviewUrl } from '@/lib/fileUpload';
import { TicketAnalytics } from './TicketAnalytics';
import AssignmentRulesModal from '@/components/modals/AssignmentRulesModal/AssignmentRulesModal';

// Import extracted Phase 3 components
import { ConfirmationDialog, TicketList, MessageInputArea, BottomFilters, Messages, TicketModalHeader } from './components';

// Import Phase 1 types
import type {
  Ticket,
  TicketResponse,
  TicketNote,
  TicketTag,
  TicketTagAssignment,
  Avatar,
  PredefinedResponse,
} from './types';

// Import Phase 1 utility functions
import {
  filterTicketsByStatus,
  filterTicketsByPriority,
  filterTicketsByAssignment,
  filterTicketsByTag,
  filterTicketsBySearch,
  filterTicketsByDateRange,
  filterTicketsByMultipleStatuses,
  filterTicketsByMultiplePriorities,
  filterTicketsByMultipleTags,
  filterTicketsByMultipleAssignees,
  applyAdvancedFilters,
  applyAllFilters,
} from './utils/ticketFiltering';

import {
  sortByDateNewest,
  sortByDateOldest,
  sortByPriority,
  sortByResponseCount,
  sortByRecentlyUpdated,
  sortTickets,
} from './utils/ticketSorting';

import {
  groupTicketsByStatus,
} from './utils/ticketGrouping';

import {
  isWaitingForResponse,
  getUnreadCount,
  getPriorityBadgeClass,
  getPriorityLabel,
  getStatusBadgeClass,
  getInitials,
  getHighlightedParts,
  formatFullDate,
  formatTimeOnly,
  getCurrentISOString,
  formatNoteDate,
  getAvatarForResponse,
  getAvatarClasses,
  getContainerClasses,
  getStatusTextClass,
  getPriorityTextClass,
  getDisplayName,
  getAvatarDisplayName,
  highlightText,
  renderAvatar,
  processTicketResponses,
} from './utils/ticketHelpers';

// Import API functions
import * as TicketAPI from './utils/ticketApi';

// Import custom hooks
import {
  useDebounce,
  useAutoResizeTextarea,
  useSaveFiltersToLocalStorage,
  useRestoreFiltersFromLocalStorage,
  useTypingIndicator,
  useAutoScroll,
  useMarkMessagesAsRead,
  useLocalStorage,
  useModalSizePersistence,
  useSyncRefWithState,
  useModalDataFetching,
  useTicketKeyboardShortcuts,
  useSearchAutoHide,
  useTagManagement,
  useTicketData,
  useInternalNotes,
  useTicketOperations,
  useMessageHandling,
  useFileUpload,
  usePredefinedResponses,
} from './hooks';

interface TicketsAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WidgetSize = 'initial' | 'half' | 'fullscreen';

const statuses = ['all', 'in progress', 'open', 'closed'];

export default function TicketsAdminModal({ isOpen, onClose }: TicketsAdminModalProps) {
  const { t } = useAccountTranslations();
  const { settings } = useSettings();
  
  // Toast state (needed for tag management and other operations)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Helper function for toast notifications
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };
  
  // Tag Management Hook
  const tagManagement = useTagManagement({
    organizationId: settings.organization_id,
    onToast: showToast,
  });
  
  // Ticket Data Hook - manages tickets, avatars, admin users, current user
  const ticketData = useTicketData({
    organizationId: settings.organization_id,
    ticketsPerPage: 20,
    statuses,
    selectedAvatar: null,
    onToast: showToast,
  });
  
  // Destructure ticket data
  const {
    tickets,
    isLoadingTickets,
    loadingMore,
    hasMoreTickets,
    avatars,
    selectedAvatar,
    adminUsers,
    currentUserId,
    setTickets,
    setSelectedAvatar,
    fetchTickets,
    loadMoreTickets,
    fetchAvatars,
    fetchAdminUsers,
    fetchCurrentUser,
  } = ticketData;

  // Internal Notes Hook - manages internal notes, pinning, and note counts
  const notesManagement = useInternalNotes({
    organizationId: settings.organization_id,
    currentUserId: currentUserId || '',
    onToast: showToast,
  });

  // Destructure notes data
  const {
    internalNotes,
    isAddingNote,
    ticketsWithPinnedNotes,
    ticketNoteCounts,
    setInternalNotes,
    fetchInternalNotes,
    handleAddInternalNote,
    handleTogglePinNote,
    handleDeleteInternalNote,
    fetchTicketsWithPinnedNotes,
    fetchTicketNoteCounts,
  } = notesManagement;

  // Ticket Operations Hook - manages assignment, priority, status changes
  const ticketOperations = useTicketOperations({
    organizationId: settings.organization_id,
    onToast: showToast,
    onRefreshTickets: fetchTickets,
  });

  // Destructure operations data
  const {
    isChangingStatus,
    isChangingPriority,
    isAssigning,
    showCloseConfirmation,
    ticketToClose,
    setShowCloseConfirmation,
    setTicketToClose,
    handleAssignTicket,
    handlePriorityChange,
    handleStatusChange,
    confirmCloseTicket,
    cancelCloseTicket,
  } = ticketOperations;
  
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
  
  // Save modal size to localStorage
  useModalSizePersistence(size);
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  // responseMessage, setResponseMessage now come from useMessageHandling hook
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(statuses[0]);
  // predefinedResponses now comes from usePredefinedResponses hook
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'my' | 'unassigned'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  // internalNotes, isAddingNote, ticketsWithPinnedNotes, ticketNoteCounts now come from useInternalNotes hook
  const [noteText, setNoteText] = useState('');
  const [showInternalNotes, setShowInternalNotes] = useState(false);
  // showCloseConfirmation, ticketToClose now come from useTicketOperations hook
  const [showAvatarManagement, setShowAvatarManagement] = useState(false);
  const [avatarManagementCreateMode, setAvatarManagementCreateMode] = useState(false);
  // isLoadingTickets now comes from useTicketData hook
  // isSending now comes from useMessageHandling hook
  // isChangingStatus, isChangingPriority, isAssigning now come from useTicketOperations hook
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  // selectedFiles, setSelectedFiles now come from useMessageHandling hook
  // uploadProgress, isDragging now come from useFileUpload hook
  const [attachmentUrls, setAttachmentUrls] = useState<{[key: string]: string}>({});
  
  // Tag management state (from useTagManagement hook)
  // Destructure from hook for use throughout the component
  const { availableTags, isLoadingTags } = tagManagement;
  const [tagFilter, setTagFilter] = useState<string>('all'); // 'all' or tag_id
  const [showTagManagement, setShowTagManagement] = useState(false);
  
  // Sorting state
  const [sortBy, setSortBy] = useState<'date-newest' | 'date-oldest' | 'priority' | 'responses' | 'updated'>('date-newest');
  
  // Advanced filters state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRangeStart, setDateRangeStart] = useState<string>('');
  const [dateRangeEnd, setDateRangeEnd] = useState<string>('');
  const [multiSelectStatuses, setMultiSelectStatuses] = useState<string[]>([]);
  const [multiSelectPriorities, setMultiSelectPriorities] = useState<string[]>([]);
  const [multiSelectTags, setMultiSelectTags] = useState<string[]>([]);
  const [multiSelectAssignees, setMultiSelectAssignees] = useState<string[]>([]);
  const [filterLogic, setFilterLogic] = useState<'AND' | 'OR'>('AND');
  
  // Analytics state
  const [showAnalytics, setShowAnalytics] = useState(false);
  
  // Automation state
  const [showAssignmentRules, setShowAssignmentRules] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const noteInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedTicketRef = useRef<Ticket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevResponseCountRef = useRef<number>(0);
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Custom hooks
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Keep ref in sync with state
  useSyncRefWithState(selectedTicketRef, selectedTicket);

  // Realtime subscription effect - direct implementation like TicketsAccountModal
  useEffect(() => {
    if (isOpen) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Admin modal opened - setting up realtime');
      }
      setupRealtimeSubscription();
    }

    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔌 Unsubscribing from realtime (admin modal cleanup)');
      }
      if (realtimeChannelRef.current) {
        realtimeChannelRef.current.unsubscribe();
        realtimeChannelRef.current = null;
      }
    };
  }, [isOpen]);

  // Fetch data when modal opens and cleanup on close
  useModalDataFetching({
    isOpen,
    onFetchData: () => {
      fetchTickets();
      fetchAvatars();
      fetchAdminUsers();
      fetchCurrentUser();
      fetchTicketsWithPinnedNotes();
      fetchTicketNoteCounts();
      fetchTags(); // Fetch available tags
      // Fetch predefined responses if available (optional feature)
      fetchPredefinedResponses().catch(() => {
        // Silently ignore if table doesn't exist
      });
      // Note: setupRealtimeSubscription() now called in separate useEffect above
    },
    onCleanup: () => {
      // Cleanup is now handled in the useEffect above
    }
  });

  // Restore filters from localStorage on mount
  useRestoreFiltersFromLocalStorage<{
    searchQuery?: string;
    assignmentFilter?: 'all' | 'my' | 'unassigned';
    priorityFilter?: 'all' | 'high' | 'medium' | 'low';
    tagFilter?: string;
    sortBy?: 'date-newest' | 'date-oldest' | 'priority' | 'updated' | 'responses';
    advancedFilters?: {
      showAdvancedFilters?: boolean;
      dateRangeStart?: string;
      dateRangeEnd?: string;
      multiSelectStatuses?: string[];
      multiSelectPriorities?: string[];
      multiSelectTags?: string[];
      multiSelectAssignees?: string[];
      filterLogic?: 'AND' | 'OR';
    };
  }>(
    isOpen,
    settings?.organization_id,
    'ticket-filters',
    (filters) => {
      setSearchQuery(filters.searchQuery || '');
      setAssignmentFilter(filters.assignmentFilter || 'all');
      setPriorityFilter(filters.priorityFilter || 'all');
      setTagFilter(filters.tagFilter || 'all');
      setSortBy(filters.sortBy || 'date-newest');
      
      if (filters.advancedFilters) {
        setShowAdvancedFilters(filters.advancedFilters.showAdvancedFilters || false);
        setDateRangeStart(filters.advancedFilters.dateRangeStart || '');
        setDateRangeEnd(filters.advancedFilters.dateRangeEnd || '');
        setMultiSelectStatuses(filters.advancedFilters.multiSelectStatuses || []);
        setMultiSelectPriorities(filters.advancedFilters.multiSelectPriorities || []);
        setMultiSelectTags(filters.advancedFilters.multiSelectTags || []);
        setMultiSelectAssignees(filters.advancedFilters.multiSelectAssignees || []);
        setFilterLogic(filters.advancedFilters.filterLogic || 'AND');
      }
    }
  );

  // Save filters to localStorage whenever they change
  useSaveFiltersToLocalStorage({
    isOpen,
    organizationId: settings?.organization_id,
    storageKey: 'ticket-filters',
    filters: {
      searchQuery,
      assignmentFilter,
      priorityFilter,
      tagFilter,
      sortBy,
      advancedFilters: {
        showAdvancedFilters,
        dateRangeStart,
        dateRangeEnd,
        multiSelectStatuses,
        multiSelectPriorities,
        multiSelectTags,
        multiSelectAssignees,
        filterLogic
      }
    }
  });

  // Save selected avatar to localStorage
  useLocalStorage('admin_selected_avatar_id', selectedAvatar?.id);

  // Helper function to load attachment URLs for image previews
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
    
    // Merge new URLs with existing ones instead of replacing
    setAttachmentUrls(prev => ({ ...prev, ...urlsMap }));
  };

  // Wrapper for showToast to match hook signature
  const setToastForHook = (toast: { message: string; type: 'success' | 'error' }) => {
    showToast(toast.message, toast.type);
  };

  // Message Handling Hook - manages message sending, typing, and ticket selection
  const messageHandling = useMessageHandling({
    selectedTicket,
    selectedAvatar,
    setSelectedTicket,
    setTickets,
    setToast: setToastForHook,
    getCurrentISOString,
    loadAttachmentUrls,
    fetchInternalNotes,
    setShowInternalNotes,
    setInternalNotes,
    messagesContainerRef,
  });

  // Destructure message handling functions and state
  const {
    responseMessage,
    setResponseMessage,
    selectedFiles,
    setSelectedFiles,
    isSending,
    markMessagesAsRead: markMessagesAsReadFromHook,
    handleAdminRespond: handleAdminRespondFromHook,
    handleTicketSelect,
    broadcastTyping: broadcastTypingFromHook,
    handleMessageChange: handleMessageChangeFromHook,
    scrollToBottom: scrollToBottomFromHook,
  } = messageHandling;

  // File Upload Hook - manages file selection, drag-and-drop, validation
  const fileUpload = useFileUpload({
    selectedFiles,
    setSelectedFiles,
    fileInputRef,
    onToast: setToastForHook,
  });

  // Destructure file upload functions and state
  const {
    isDragging,
    uploadProgress,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    removeFile,
    clearFiles,
  } = fileUpload;

  // Predefined Responses Hook - manages template responses for quick replies
  const predefinedResponsesHook = usePredefinedResponses({
    organizationId: settings.organization_id,
  });

  // Destructure predefined responses state and functions
  const {
    predefinedResponses,
    fetchPredefinedResponses,
  } = predefinedResponsesHook;

  // Auto-resize response textarea
  useAutoResizeTextarea(inputRef, responseMessage, 120);

  // Auto-resize note textarea
  useAutoResizeTextarea(noteInputRef, noteText, 120);

  // Typing indicator channel subscription
  useTypingIndicator({
    isOpen,
    ticketId: selectedTicket?.id,
    onTypingStart: () => setIsCustomerTyping(true),
    onTypingStop: () => setIsCustomerTyping(false),
    typingTimeoutRef,
    showTypingFrom: 'customer' // Admin modal shows when customer is typing
  });

  // Auto-hide search when user starts typing a response
  useSearchAutoHide({
    responseMessage,
    showSearch,
    onHideSearch: () => {
      setShowSearch(false);
      setSearchQuery('');
    }
  });

  const refreshSelectedTicket = async () => {
    const currentTicket = selectedTicketRef.current;

    if (!currentTicket) {
      console.log('⚠️ No selected ticket to refresh');
      return;
    }

    console.log('🔍 Starting refresh for ticket:', currentTicket.id);

    try {
      // Fetch the specific ticket with updated data
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', currentTicket.id)
        .single();
      
      if (ticketError) {
        console.error('❌ Error fetching ticket:', ticketError);
        throw ticketError;
      }
      
      console.log('✅ Ticket data fetched (admin)');
      
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
      
      console.log('✅ Responses fetched (admin):', responsesData?.length);
      
      // Process responses to flatten attachments
      const processedResponses = processTicketResponses(responsesData || []);
      
      const updatedTicket = {
        ...ticketData,
        ticket_responses: processedResponses
      };
      
      console.log('🔄 Selected ticket refreshed (admin) - responses:', updatedTicket.ticket_responses.length, 'Previous:', currentTicket.ticket_responses?.length);
      setSelectedTicket(updatedTicket);
      
      // Also refresh the tickets list in background
      fetchTickets();
      
      // Load attachment URLs for any new images
      if (updatedTicket.ticket_responses && updatedTicket.ticket_responses.length > 0) {
        loadAttachmentUrls(updatedTicket.ticket_responses);
      }
      
      // Force scroll after state update
      setTimeout(() => scrollToBottom(), 100);
    } catch (err) {
      console.error('❌ Error refreshing selected ticket:', err);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      // Unsubscribe from any existing channel first
      if (realtimeChannelRef.current) {
        console.log('🔌 Cleaning up existing realtime channel (admin)');
        realtimeChannelRef.current.unsubscribe();
        realtimeChannelRef.current = null;
      }
      
      console.log('🔄 Setting up realtime subscription (admin)');
      
      // Create channel with direct inline subscription (like TicketsAccountModal)
      const channel = supabase
        .channel('tickets-admin-channel', {
          config: {
            broadcast: { self: true },
            presence: { key: selectedTicket?.id || 'admin' },
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
            console.log('✅ Realtime (Admin): Ticket change', payload);
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
            console.log('✅ Realtime (Admin): Response change', payload);
            console.log('📊 Payload details:', {
              eventType: payload.eventType,
              table: payload.table,
              schema: payload.schema,
              new: payload.new,
              old: payload.old
            });
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
            console.log('✅ Realtime (Admin): Note change', payload);
            const currentTicket = selectedTicketRef.current;
            if (currentTicket) {
              fetchInternalNotes(currentTicket.id);
            }
            // Refresh the list of tickets with pinned notes and note counts
            fetchTicketsWithPinnedNotes();
            fetchTicketNoteCounts();
          }
        )
        .subscribe((status, err) => {
          console.log('📡 Realtime subscription status (Admin):', status);
          if (status === 'SUBSCRIBED') {
            console.log('✅ Successfully subscribed to realtime updates (Admin)');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('❌ Realtime channel error (Admin):', err);
          } else if (status === 'TIMED_OUT') {
            console.error('⏱️ Realtime subscription timed out (Admin)');
          } else if (status === 'CLOSED') {
            console.log('🔌 Realtime channel closed (Admin)');
          }
        });
      
      // Store the channel reference for cleanup
      realtimeChannelRef.current = channel;
      console.log('✅ Realtime channel created and stored (admin)');
      
      return channel;
    } catch (err) {
      console.error('❌ Error setting up realtime subscription (Admin):', err);
    }
  };

  // ==== DATA FETCHING FUNCTIONS ====
  // Using useTicketData hook - functions available via hook destructuring
  // fetchTickets, loadMoreTickets, fetchAvatars, fetchAdminUsers, fetchCurrentUser

  // Auto-scroll to bottom when ticket changes or new messages arrive
  useAutoScroll({
    selectedTicketId: selectedTicket?.id,
    responseCount: selectedTicket?.ticket_responses?.length || 0,
    isOpen,
    messagesContainerRef,
    prevResponseCountRef,
    onMessagesRead: markMessagesAsReadFromHook // Use hook function directly to avoid recreating
  });

  // Mark messages as read on various triggers
  useMarkMessagesAsRead({
    selectedTicketId: selectedTicket?.id,
    isOpen,
    responseMessage,
    noteText,
    markAsRead: markMessagesAsReadFromHook // Use hook function directly to avoid recreating
  });

  // ==== INTERNAL NOTES FUNCTIONS ====
  // Using useInternalNotes hook - functions available via hook destructuring
  // fetchInternalNotes, handleAddInternalNote, handleTogglePinNote, handleDeleteInternalNote
  // fetchTicketsWithPinnedNotes, fetchTicketNoteCounts

  // Wrapper for handleAddInternalNote to work with existing UI
  const handleAddInternalNoteWrapper = async () => {
    if (!noteText.trim() || !selectedTicket) return;
    
    await handleAddInternalNote(selectedTicket.id, noteText, () => {
      setNoteText('');
    });
  };

  // Wrapper for handleTogglePinNote to work with existing UI
  const handleTogglePinNoteWrapper = async (noteId: string, currentPinStatus: boolean) => {
    await handleTogglePinNote(noteId, currentPinStatus, selectedTicket?.id);
  };

  // ==== TICKET OPERATIONS FUNCTIONS ====
  // Using useTicketOperations hook - functions available via hook destructuring
  // handleAssignTicket, handlePriorityChange (already work directly)
  
  // Wrappers for status change functions to pass state updaters
  const handleStatusChangeWrapper = async (ticketId: string, newStatus: string) => {
    await handleStatusChange(
      ticketId,
      newStatus,
      tickets,
      setTickets,
      setSelectedTicket,
      selectedTicket?.id
    );
  };

  const confirmCloseTicketWrapper = async () => {
    await confirmCloseTicket(setTickets, setSelectedTicket, selectedTicket?.id);
  };

  // Wrappers for ticket list badge interactions (no selectedTicket context needed)
  const handleTicketListStatusChange = async (ticketId: string, newStatus: string) => {
    await handleStatusChange(
      ticketId,
      newStatus,
      tickets,
      setTickets,
      setSelectedTicket
    );
  };

  // ==== TAG MANAGEMENT FUNCTIONS ====
  // Using useTagManagement hook - creating wrapper functions for compatibility
  
  const fetchTags = tagManagement.fetchTags;
  
  const handleCreateTag = tagManagement.handleCreateTag;
  
  const handleUpdateTag = tagManagement.handleUpdateTag;
  
  const handleDeleteTag = (tagId: string) => {
    return tagManagement.handleDeleteTag(tagId, setTickets, setSelectedTicket);
  };
  
  const handleAssignTag = (ticketId: string, tagId: string) => {
    return tagManagement.handleAssignTag(ticketId, tagId, setTickets, setSelectedTicket);
  };
  
  const handleRemoveTag = (ticketId: string, tagId: string) => {
    return tagManagement.handleRemoveTag(ticketId, tagId, setTickets, setSelectedTicket);
  };

  // fetchPredefinedResponses - Now using hook version from usePredefinedResponses

  // scrollToBottom - Now using hook version (scrollToBottomFromHook)
  const scrollToBottom = () => scrollToBottomFromHook();

  // broadcastTyping - Now using hook version (broadcastTypingFromHook)
  const broadcastTyping = () => broadcastTypingFromHook();

  // handleMessageChange - Now using hook version (handleMessageChangeFromHook)
  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => handleMessageChangeFromHook(e);

  // File handling functions - Now using hook versions (from useFileUpload)
  // handleFileSelect, handleDragOver, handleDragLeave, handleDrop, removeFile, clearFiles

  // handleAdminRespond - Now using hook version (handleAdminRespondFromHook)
  const handleAdminRespond = () => handleAdminRespondFromHook();

  // Keyboard shortcuts for navigation and actions
  useTicketKeyboardShortcuts({
    isOpen,
    showCloseConfirmation,
    showAvatarManagement,
    showInternalNotes,
    responseMessage,
    selectedTicket,
    selectedAvatar,
    isSending,
    tickets,
    activeTab,
    assignmentFilter,
    priorityFilter,
    tagFilter,
    searchQuery: debouncedSearchQuery,
    currentUserId,
    onClose,
    onSendMessage: handleAdminRespond,
    onSelectTicket: handleTicketSelect
  });

  // Status change functions now use wrappers from useTicketOperations hook
  // Old implementations removed - using handleStatusChangeWrapper, confirmCloseTicketWrapper, cancelCloseTicket

  const toggleSize = () => {
    setSize((prev) => {
      if (prev === 'initial') return 'half';
      if (prev === 'half') return 'fullscreen';
      return 'initial'; // fullscreen → initial
    });
  };

  // Use Phase 1 utilities for filtering, sorting, and grouping
  const groupedTickets = statuses.reduce(
    (acc, status) => {
      // Start with all tickets or filter by status
      let filteredTickets = status === 'all' ? tickets : filterTicketsByStatus(tickets, status);
      
      // Apply all filters using Phase 1 utilities
      const filters = {
        searchQuery: debouncedSearchQuery,
        activeTab: status as any, // status comes from statuses array which matches TicketStatus
        priorityFilter,
        assignmentFilter,
        tagFilter,
        sortBy,
      };

      const advancedFilters = {
        showAdvancedFilters,
        dateRangeStart,
        dateRangeEnd,
        multiSelectStatuses,
        multiSelectPriorities,
        multiSelectTags,
        multiSelectAssignees,
        filterLogic,
      };

      filteredTickets = applyAllFilters(filteredTickets, filters, advancedFilters, currentUserId);
      
      // Apply sorting using Phase 1 utility
      filteredTickets = sortTickets(filteredTickets, sortBy);
      
      return {
        ...acc,
        [status]: filteredTickets,
      };
    },
    {} as Record<string, Ticket[]>
  );

  // ========================================
  // HELPER FUNCTIONS
  // ========================================
  // Note: highlightText and renderAvatar are imported from utils/ticketHelpers

  // Get Rnd configuration based on modal size
  const getRndConfig = () => {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 900;

    switch (size) {
      case 'initial':
        return {
          x: windowWidth - 420,
          y: windowHeight - 780,
          width: 400,
          height: 750,
        };
      case 'half':
        return {
          x: windowWidth / 2,
          y: windowHeight * 0.1,
          width: Math.min(windowWidth * 0.5, 800),
          height: windowHeight * 0.85,
        };
      case 'fullscreen':
        return {
          x: 20,
          y: 20,
          width: windowWidth - 40,
          height: windowHeight - 40,
        };
      default:
        return {
          x: windowWidth - 420,
          y: windowHeight - 780,
          width: 400,
          height: 750,
        };
    }
  };

  const usePredefinedResponse = (response: PredefinedResponse) => {
    setResponseMessage(response.text);
    inputRef.current?.focus();
  };

  const handleCopyToClipboard = (text: string, successMessage: string) => {
    navigator.clipboard.writeText(text);
    setToast({ message: successMessage, type: 'success' });
  };

  if (!isOpen) return null;

  const modalContent = (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10000]"
        onClick={onClose}
      />
      
      {/* Draggable & Resizable Modal Container */}
      <Rnd
        default={getRndConfig()}
        minWidth={400}
        minHeight={600}
        bounds="window"
        dragHandleClassName="modal-drag-handle"
        enableResizing={size !== 'fullscreen'}
        className="pointer-events-auto z-[10001]"
      >
        <div className="relative h-full flex flex-col bg-white/50 dark:bg-gray-900/50 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/20">
          {/* Header */}
          <TicketModalHeader
          selectedTicket={selectedTicket}
          size={size}
          searchQuery={searchQuery}
          avatars={avatars}
          availableTags={availableTags}
          onClose={onClose}
          onBack={() => setSelectedTicket(null)}
          onToggleSize={toggleSize}
          onShowAnalytics={() => setShowAnalytics(true)}
          onShowAssignmentRules={() => setShowAssignmentRules(true)}
          onRemoveTag={handleRemoveTag}
          onAssignTag={handleAssignTag}
          onCopyToClipboard={handleCopyToClipboard}
          highlightText={highlightText}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Pinned Notes Banner - Right below header */}
              {internalNotes.filter(note => note.is_pinned).length > 0 && (
                <div className="bg-amber-50/90 dark:bg-amber-900/20 backdrop-blur-sm border-b-2 border-amber-300 dark:border-amber-700 px-4 py-3">
                  <div className="max-w-3xl mx-auto">
                    <div className="flex items-start gap-2">
                      <Pin className="h-4 w-4 text-amber-600 dark:text-amber-400 fill-amber-600 dark:fill-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 space-y-2">
                        {internalNotes.filter(note => note.is_pinned).map((note) => (
                          <div key={note.id} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-amber-300 dark:border-amber-700 rounded-lg px-3 py-2 text-sm">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-amber-900 dark:text-amber-100">
                                  📌 {note.admin_full_name || note.admin_email || 'Admin'}
                                </span>
                                <span className="text-xs text-amber-700 dark:text-amber-300">
                                  {formatNoteDate(note.created_at)}
                                </span>
                              </div>
                              {note.admin_id === currentUserId && (
                                <button
                                  onClick={() => handleTogglePinNoteWrapper(note.id, note.is_pinned)}
                                  className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition-colors"
                                  title="Unpin note"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <p className="text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed">{note.note_text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Messages */}
              <Messages
                selectedTicket={selectedTicket}
                searchQuery={searchQuery}
                avatars={avatars}
                selectedAvatar={selectedAvatar}
                attachmentUrls={attachmentUrls}
                isCustomerTyping={isCustomerTyping}
                messagesContainerRef={messagesContainerRef}
                messagesEndRef={messagesEndRef}
              />

              <MessageInputArea
                size={size}
                predefinedResponses={predefinedResponses}
                searchQuery={searchQuery}
                selectedFiles={selectedFiles}
                uploadProgress={uploadProgress}
                isDragging={isDragging}
                responseMessage={responseMessage}
                isSending={isSending}
                showSearch={showSearch}
                avatars={avatars}
                selectedAvatar={selectedAvatar}
                inputRef={inputRef}
                fileInputRef={fileInputRef}
                onUsePredefinedResponse={usePredefinedResponse}
                onClearFiles={clearFiles}
                onRemoveFile={removeFile}
                onHandleDragOver={handleDragOver}
                onHandleDragLeave={handleDragLeave}
                onHandleDrop={handleDrop}
                onHandleMessageChange={handleMessageChange}
                onHandleFileSelect={handleFileSelect}
                onHandleAdminRespond={handleAdminRespond}
                onSetShowSearch={setShowSearch}
                onSetSearchQuery={setSearchQuery}
                onSetSelectedAvatar={setSelectedAvatar}
              />


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
                              className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg p-3 shadow-sm ${
                                note.is_pinned 
                                  ? 'border-2 border-amber-400 dark:border-amber-500 bg-amber-50/50 dark:bg-amber-900/20' 
                                  : 'border border-amber-200 dark:border-amber-700'
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
                                      onClick={() => handleTogglePinNoteWrapper(note.id, note.is_pinned)}
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
                      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-amber-300 dark:border-amber-700 rounded-lg p-3 shadow-sm">
                        <textarea
                          ref={noteInputRef}
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAddInternalNoteWrapper())}
                          placeholder="Add an internal note (only visible to admins)..."
                          className="w-full resize-none border-0 bg-transparent text-slate-800 dark:text-slate-100 placeholder-amber-600/50 dark:placeholder-amber-400/50 focus:outline-none focus:ring-0 text-sm leading-relaxed min-h-[60px] max-h-[120px]"
                          rows={2}
                          disabled={isAddingNote}
                        />
                        <div className="flex justify-end mt-2">
                          <button
                            onClick={handleAddInternalNoteWrapper}
                            disabled={!noteText.trim() || isAddingNote}
                            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 disabled:from-slate-200 disabled:to-slate-300 dark:disabled:from-gray-700 dark:disabled:to-gray-800 text-white disabled:text-slate-400 dark:disabled:text-gray-500 text-sm font-medium rounded-lg shadow-sm hover:shadow-md disabled:shadow-none transition-all duration-200 disabled:cursor-not-allowed"
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
              <div className="flex-1 overflow-y-auto bg-white/20 dark:bg-gray-900/20">
                {/* Active Filters & Search Statistics */}
                {(searchQuery || assignmentFilter !== 'all' || priorityFilter !== 'all' || tagFilter !== 'all' || showAdvancedFilters) && (
                  <div className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-gray-700 p-3 space-y-2">
                    {/* Search Statistics */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 dark:text-slate-300">
                          Showing <span className="font-semibold text-slate-900 dark:text-white">{groupedTickets[activeTab].length}</span> of <span className="font-semibold text-slate-900 dark:text-white">{tickets.length}</span> tickets
                        </span>
                        {searchQuery && (
                          <span className="text-slate-500 dark:text-slate-400">
                            • Searching in messages, responses, and tags
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setAssignmentFilter('all');
                          setPriorityFilter('all');
                          setTagFilter('all');
                          setDateRangeStart('');
                          setDateRangeEnd('');
                          setMultiSelectStatuses([]);
                          setMultiSelectPriorities([]);
                          setMultiSelectTags([]);
                          setMultiSelectAssignees([]);
                        }}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors"
                      >
                        Clear all filters
                      </button>
                    </div>
                    
                    {/* Active Filter Pills */}
                    <div className="flex flex-wrap gap-2">
                      {searchQuery && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Search: "{searchQuery}"
                          <button
                            onClick={() => setSearchQuery('')}
                            className="hover:bg-blue-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      
                      {assignmentFilter !== 'all' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          <User className="h-3 w-3" />
                          {assignmentFilter === 'my' ? 'Assigned to me' : 'Unassigned'}
                          <button
                            onClick={() => setAssignmentFilter('all')}
                            className="hover:bg-purple-200 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      
                      {priorityFilter !== 'all' && (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          priorityFilter === 'high' ? 'bg-red-100 text-red-700' :
                          priorityFilter === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          Priority: {getPriorityLabel(priorityFilter)}
                          <button
                            onClick={() => setPriorityFilter('all')}
                            className={`rounded-full p-0.5 ${
                              priorityFilter === 'high' ? 'hover:bg-red-200' :
                              priorityFilter === 'medium' ? 'hover:bg-yellow-200' :
                              'hover:bg-green-200'
                            }`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      
                      {tagFilter !== 'all' && (
                        <span 
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                          style={{
                            backgroundColor: `${availableTags.find(t => t.id === tagFilter)?.color}15`,
                            borderColor: `${availableTags.find(t => t.id === tagFilter)?.color}40`,
                            color: availableTags.find(t => t.id === tagFilter)?.color
                          }}
                        >
                          Tag: {availableTags.find(t => t.id === tagFilter)?.name}
                          <button
                            onClick={() => setTagFilter('all')}
                            className="rounded-full p-0.5"
                            style={{ backgroundColor: `${availableTags.find(t => t.id === tagFilter)?.color}20` }}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      )}
                      
                      {/* Advanced filter pills */}
                      {showAdvancedFilters && (
                        <>
                          {dateRangeStart && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                              From: {new Date(dateRangeStart).toLocaleDateString()}
                              <button onClick={() => setDateRangeStart('')} className="hover:bg-indigo-200 rounded-full p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                          
                          {dateRangeEnd && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                              To: {new Date(dateRangeEnd).toLocaleDateString()}
                              <button onClick={() => setDateRangeEnd('')} className="hover:bg-indigo-200 rounded-full p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          )}
                          
                          {multiSelectStatuses.map(status => (
                            <span key={status} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-medium">
                              Status: {status}
                              <button onClick={() => setMultiSelectStatuses(prev => prev.filter(s => s !== status))} className="hover:bg-cyan-200 rounded-full p-0.5">
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          
                          {multiSelectPriorities.map(priority => (
                            <span key={priority} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                              priority === 'high' ? 'bg-red-100 text-red-700' :
                              priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              Priority: {getPriorityLabel(priority)}
                              <button onClick={() => setMultiSelectPriorities(prev => prev.filter(p => p !== priority))} className={`rounded-full p-0.5 ${
                                priority === 'high' ? 'hover:bg-red-200' :
                                priority === 'medium' ? 'hover:bg-yellow-200' :
                                'hover:bg-green-200'
                              }`}>
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))}
                          
                          {multiSelectTags.map(tagId => {
                            const tag = availableTags.find(t => t.id === tagId);
                            return tag ? (
                              <span 
                                key={tagId}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                                style={{
                                  backgroundColor: `${tag.color}15`,
                                  borderColor: `${tag.color}40`,
                                  color: tag.color
                                }}
                              >
                                Tag: {tag.name}
                                <button onClick={() => setMultiSelectTags(prev => prev.filter(t => t !== tagId))} className="rounded-full p-0.5" style={{ backgroundColor: `${tag.color}20` }}>
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ) : null;
                          })}
                          
                          {multiSelectAssignees.map(assigneeId => {
                            const user = assigneeId === 'unassigned' ? { id: 'unassigned', full_name: 'Unassigned', email: '' } : adminUsers.find(u => u.id === assigneeId);
                            return user ? (
                              <span key={assigneeId} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                {assigneeId === 'unassigned' ? 'Unassigned' : (user.full_name || user.email)}
                                <button onClick={() => setMultiSelectAssignees(prev => prev.filter(a => a !== assigneeId))} className="hover:bg-purple-200 rounded-full p-0.5">
                                  <X className="h-3 w-3" />
                                </button>
                              </span>
                            ) : null;
                          })}
                          
                          {filterLogic === 'OR' && (multiSelectStatuses.length > 0 || multiSelectPriorities.length > 0 || multiSelectTags.length > 0 || multiSelectAssignees.length > 0) && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              OR Logic (Any match)
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                <TicketList
                  tickets={groupedTickets[activeTab]}
                  selectedTicketId={null}
                  onTicketSelect={handleTicketSelect}
                  searchQuery={searchQuery}
                  isLoading={isLoadingTickets}
                  hasMore={hasMoreTickets[activeTab]}
                  onLoadMore={loadMoreTickets}
                  loadingMore={loadingMore}
                  ticketsWithPinnedNotes={ticketsWithPinnedNotes}
                  ticketNoteCounts={ticketNoteCounts}
                  adminUsers={adminUsers}
                  getUnreadCount={getUnreadCount}
                  isWaitingForResponse={isWaitingForResponse}
                  assignmentFilter={assignmentFilter}
                  priorityFilter={priorityFilter}
                  tagFilter={tagFilter}
                  onAssignTicket={handleAssignTicket}
                  onPriorityChange={handlePriorityChange}
                  onStatusChange={handleTicketListStatusChange}
                  isAssigning={isAssigning}
                  isChangingPriority={isChangingPriority}
                  isChangingStatus={isChangingStatus}
                />
              </div>
            </>
          )}

          {/* Bottom Tabs - Only show when no ticket selected */}
          {!selectedTicket && (
            <BottomFilters
              assignmentFilter={assignmentFilter}
              priorityFilter={priorityFilter}
              tagFilter={tagFilter}
              sortBy={sortBy}
              showAdvancedFilters={showAdvancedFilters}
              filterLogic={filterLogic}
              dateRangeStart={dateRangeStart}
              dateRangeEnd={dateRangeEnd}
              multiSelectStatuses={multiSelectStatuses}
              multiSelectPriorities={multiSelectPriorities}
              multiSelectTags={multiSelectTags}
              multiSelectAssignees={multiSelectAssignees}
              tickets={tickets}
              availableTags={availableTags}
              adminUsers={adminUsers}
              currentUserId={currentUserId}
              activeTab={activeTab}
              groupedTickets={groupedTickets}
              statuses={statuses}
              setAssignmentFilter={setAssignmentFilter}
              setPriorityFilter={setPriorityFilter}
              setTagFilter={setTagFilter}
              setSortBy={setSortBy}
              setShowAdvancedFilters={setShowAdvancedFilters}
              setFilterLogic={setFilterLogic}
              setDateRangeStart={setDateRangeStart}
              setDateRangeEnd={setDateRangeEnd}
              setMultiSelectStatuses={setMultiSelectStatuses}
              setMultiSelectPriorities={setMultiSelectPriorities}
              setMultiSelectTags={setMultiSelectTags}
              setMultiSelectAssignees={setMultiSelectAssignees}
              setActiveTab={setActiveTab}
            />
          )}
        </div>
        </div>
      </Rnd>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Close Ticket Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showCloseConfirmation && !!ticketToClose}
        title="Close Ticket?"
        message="Are you sure you want to close this ticket?"
        details={ticketToClose ? {
          label: 'Ticket Subject',
          value: ticketToClose.subject
        } : undefined}
        consequences={[
          'Mark the ticket as resolved',
          'Send a notification to the customer',
          'Move the ticket to the closed section'
        ]}
        confirmText="Close Ticket"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmCloseTicketWrapper}
        onCancel={cancelCloseTicket}
      />

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

      {/* Analytics Dashboard */}
      {showAnalytics && (
        <TicketAnalytics
          tickets={tickets}
          adminUsers={adminUsers}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {/* Assignment Rules & Automation */}
      {showAssignmentRules && (
        <AssignmentRulesModal
          isOpen={showAssignmentRules}
          onClose={() => setShowAssignmentRules(false)}
        />
      )}
    </>
  );

  return createPortal(modalContent, document.body);
}
